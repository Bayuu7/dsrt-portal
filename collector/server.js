/* server.js
   Minimal analytics collector with basic security:
   - helmet headers
   - CORS
   - request size limit
   - rate-limiting (in-memory, for demo)
   - token verification via header X-DSRT-TOKEN (set DSRT_COLLECTOR_TOKEN env var)
   Persist or integrate DB in production.
*/
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const PORT = process.env.PORT || 4000;
const TOKEN = process.env.DSRT_COLLECTOR_TOKEN || null;
const LOGFILE = path.join(__dirname, 'events.log');

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(morgan('combined'));

// rate limiter: 100 requests per minute per IP
const limiter = new RateLimiterMemory({ points: 100, duration: 60 });

app.use(async (req,res,next) => {
  try {
    await limiter.consume(req.ip);
    next();
  } catch(e){
    res.status(429).json({ ok:false, error: 'rate_limited' });
  }
});

// health
app.get('/health', (req,res) => res.json({ ok:true, ts: Date.now() }));

// helper
function appendLog(obj){
  const line = JSON.stringify(Object.assign({ receivedAt: new Date().toISOString() }, obj));
  fs.appendFile(LOGFILE, line + '\n', err => { if(err) console.error('log write error', err); });
}

// verify token middleware
function verifyToken(req,res,next){
  if(!TOKEN) return next(); // if not set, allow (dev)
  const t = req.header('x-dsrt-token') || req.header('authorization');
  if(!t || t !== TOKEN) return res.status(403).json({ ok:false, error: 'invalid_token' });
  next();
}

// collect endpoint
app.post('/collect', verifyToken, (req,res) => {
  const payload = req.body || {};
  // Validate payload minimal schema
  if(!payload.events || !Array.isArray(payload.events)) {
    // allow single event objects for backward compatibility
    const evt = payload.event || payload;
    appendLog({ event: evt });
    return res.json({ ok:true, stored: 1 });
  }
  appendLog({ events: payload.events.slice(0,100) });
  res.json({ ok:true, stored: payload.events.length });
});

// simple admin view (last N lines)
app.get('/events', (req,res) => {
  const n = parseInt(req.query.n||20,10);
  fs.readFile(LOGFILE, 'utf8', (err,data) => {
    if(err) return res.json({ ok:false, events: [] });
    const lines = data.trim().split('\n').filter(Boolean);
    const last = lines.slice(-n).map(l=>{ try { return JSON.parse(l); } catch(e){ return { raw: l }; } });
    res.json({ ok:true, count: last.length, events: last });
  });
});

app.listen(PORT, ()=> console.log(`DSRT collector listening on :${PORT}`));

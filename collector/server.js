// --- HYBRID DB (optional) ---
// Activates only when DSRT_DB_ENABLED=true in .env
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let db = null;
async function initOptionalDB() {
  try {
    if (process.env.DSRT_DB_ENABLED !== 'true') {
      console.log('[DSRT] SQLite disabled (set DSRT_DB_ENABLED=true to enable).');
      return;
    }
    const dbPath = process.env.DSRT_DB_PATH || path.join(__dirname, 'collector.db');
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    await db.exec(`CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT,
      user_id TEXT,
      game_id TEXT,
      token_payload TEXT,
      receivedAt TEXT,
      raw TEXT
    );`);
    console.log('[DSRT] SQLite enabled at', dbPath);
  } catch (err) {
    console.error('[DSRT] Failed init SQLite:', err);
    db = null;
  }
}
initOptionalDB();
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const jwt = require('jsonwebtoken');
const Sentry = require('@sentry/node');

const PORT = process.env.PORT || 4000;
const TOKEN_SECRET = process.env.DSRT_JWT_SECRET || null;
const TOKEN_TTL = parseInt(process.env.DSRT_JWT_TTL || '300', 10);
const LOGFILE = path.join(__dirname, 'events.log');

if (process.env.DSRT_SENTRY_DSN) {
  Sentry.init({ dsn: process.env.DSRT_SENTRY_DSN });
  console.log('[DSRT] Sentry initialized for server');
}

const app = express();
if (process.env.DSRT_SENTRY_DSN) app.use(Sentry.Handlers.requestHandler());
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(morgan('combined'));

const limiter = new RateLimiterMemory({ points: 100, duration: 60 });
app.use(async (req, res, next) => {
  try {
    await limiter.consume(req.ip);
    next();
  } catch (e) {
    res.status(429).json({ ok: false, error: 'rate_limited' });
  }
});

function appendLog(obj) {
  const line = JSON.stringify(Object.assign({ receivedAt: new Date().toISOString() }, obj));
  fs.appendFile(LOGFILE, line + '\n', err => { if (err) console.error('log write error', err); });
}

app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.post('/token', (req, res) => {
  try {
    if (!TOKEN_SECRET) {
      // dev mode: return empty token so collector accepts (not secure)
      return res.json({ ok: true, token: '' });
    }
    const body = req.body || {};
    const payload = { sid: body.sessionId || null, origin: req.get('origin') || req.ip };
    const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: TOKEN_TTL + 's' });
    res.json({ ok: true, token, expiresIn: TOKEN_TTL });
  } catch (e) {
    if (process.env.DSRT_SENTRY_DSN) Sentry.captureException(e);
    console.error('token error', e);
    res.status(500).json({ ok: false, error: 'token_error' });
  }
});

function verifyToken(req, res, next) {
  if (!TOKEN_SECRET) return next(); // dev mode
  const header = req.header('x-dsrt-token') || req.header('authorization') || '';
  if (!header) return res.status(403).json({ ok: false, error: 'missing_token' });
  let token = header;
  if (token.toLowerCase().startsWith('bearer ')) token = token.slice(7).trim();
  try {
    const decoded = jwt.verify(token, TOKEN_SECRET);
    req.dsrt_token = decoded;
    next();
  } catch (e) {
    return res.status(403).json({ ok: false, error: 'invalid_token' });
  }
}

app.post('/collect', verifyToken, (req, res) => {
  try {
    const payload = req.body || {};
    if (payload.events && Array.isArray(payload.events)) {
      appendLog({ token: req.dsrt_token || null, events: payload.events.slice(0, 100) });
      return res.json({ ok: true, stored: payload.events.length });
    } else {
      appendLog({ token: req.dsrt_token || null, event: payload });
      return res.json({ ok: true, stored: 1 });
    }
  } catch (e) {
    if (process.env.DSRT_SENTRY_DSN) Sentry.captureException(e);
    console.error('collect error', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

app.get('/events', (req, res) => {
  const n = parseInt(req.query.n || 20, 10);
  fs.readFile(LOGFILE, 'utf8', (err, data) => {
    if (err) return res.json({ ok: false, events: [] });
    const lines = data.trim().split('\n').filter(Boolean);
    const last = lines.slice(-n).map(l => { try { return JSON.parse(l); } catch (e) { return { raw: l }; } });
    res.json({ ok: true, count: last.length, events: last });
  });
});

if (process.env.DSRT_SENTRY_DSN) app.use(Sentry.Handlers.errorHandler());

app.listen(PORT, () => {
  console.log(`DSRT collector listening on :${PORT}`);
  if (!TOKEN_SECRET) console.warn('[DSRT] DSRT_JWT_SECRET not set - token verification disabled (dev mode).');
});

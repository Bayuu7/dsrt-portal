(function (global) {
  const CFG = global.DSRT_CONFIG || {};
  const ENDPOINT = CFG.ANALYTICS_ENDPOINT || "/collect";
  const TOKEN_ENDPOINT = CFG.TOKEN_ENDPOINT || "/token";
  const MAX_BATCH = CFG.BATCH_MAX || 12;
  const FLUSH_INTERVAL = CFG.BATCH_INTERVAL_MS || 5000;
  const RETRY_LIMIT = CFG.BATCH_RETRY_LIMIT || 5;
  const RETRY_BASE = CFG.BATCH_RETRY_BASE_MS || 1000;

  let endpoint = ENDPOINT;
  let buffer = [];
  let sending = false;
  let timer = null;
  let tokenCache = { token: null, exp: 0 };

  function setEndpoint(url) { endpoint = url || ENDPOINT; }
  function scheduleFlush() { if (timer) return; timer = setTimeout(()=>{ timer=null; flush(); }, FLUSH_INTERVAL); }

  async function fetchToken(sessionId){
    try {
      const now = Date.now()/1000;
      if(tokenCache.token && tokenCache.exp - 5 > now) return tokenCache.token;
      const resp = await fetch(TOKEN_ENDPOINT, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ sessionId: sessionId || null }) });
      if(!resp.ok) return null;
      const j = await resp.json();
      if(j && j.token){
        tokenCache.token = j.token;
        try {
          const parts = j.token.split('.');
          if(parts.length === 3){
            const payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
            tokenCache.exp = payload.exp || (Date.now()/1000 + 300);
          } else { tokenCache.exp = Date.now()/1000 + 300; }
        } catch(e){ tokenCache.exp = Date.now()/1000 + 300; }
        return j.token;
      }
    } catch(e){ console.warn('[DSRT.Analytics] token fetch failed', e); }
    return null;
  }

  function enqueue(evt){ if(!evt) return; buffer.push(Object.assign({ ts: Date.now() }, evt)); if(buffer.length >= MAX_BATCH) flush(); scheduleFlush(); }

  async function flush(){
    if(sending) return;
    if(!endpoint) return;
    if(buffer.length === 0) return;
    sending = true;
    const batch = buffer.splice(0, Math.min(MAX_BATCH, buffer.length));
    const session = (global.DSRT_Session && global.DSRT_Session.get && global.DSRT_Session.get()) || {};
    const payload = { events: batch, meta: { sessionId: session.id || null, ts: Date.now() } };

    let token = null;
    try { token = await fetchToken(session.id); } catch(e){ token = null; }

    let attempt = 0; let ok = false; let wait = RETRY_BASE;
    while(attempt < RETRY_LIMIT && !ok){
      try {
        const headers = { 'Content-Type':'application/json' };
        if(token) headers['x-dsrt-token'] = token;
        const resp = await fetch(endpoint, { method:'POST', headers: headers, body: JSON.stringify(payload), keepalive:true });
        ok = resp && resp.status >= 200 && resp.status < 300;
      } catch(e){ ok = false; }
      if(!ok){ attempt++; await new Promise(r=>setTimeout(r, wait)); wait = Math.round(wait * 1.8); if(attempt === 1) { tokenCache.token = null; token = await fetchToken(session.id); } }
    }

    sending = false;
    if(!ok) buffer.unshift(...batch);
  }

  function flushNow(){ return flush(); }

  // periodic flush safety
  setInterval(()=>{ if(buffer.length>0) flush(); }, FLUSH_INTERVAL*2);

  global.DSRT_Analytics = { setEndpoint, enqueue, flushNow, getBufferLength: ()=>buffer.length };
})(window);

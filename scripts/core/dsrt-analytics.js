/* dsrt-analytics.js
   Batching analytics with backoff retry + sendBeacon fallback.
   Export: window.DSRT_Analytics
*/
(function(global){
  const CFG = global.DSRT_CONFIG || {};
  const ENDPOINT = CFG.ANALYTICS_ENDPOINT || '/collect';
  const MAX_BATCH = CFG.BATCH_MAX || 12;
  const FLUSH_INTERVAL = CFG.BATCH_INTERVAL_MS || 5000;
  const RETRY_LIMIT = CFG.BATCH_RETRY_LIMIT || 5;
  const RETRY_BASE = CFG.BATCH_RETRY_BASE_MS || 1000;

  let endpoint = ENDPOINT;
  let enabled = true;
  const buffer = [];
  let timer = null;
  let sending = false;

  function setEndpoint(url){ endpoint = url || ENDPOINT; }
  function enable(){ enabled = true; scheduleFlush(); }
  function disable(){ enabled = false; }
  function enqueue(evt){
    if(!evt) return;
    buffer.push(Object.assign({ ts: Date.now() }, evt));
    if(buffer.length >= MAX_BATCH) flush();
    scheduleFlush();
  }
  function scheduleFlush(){
    if(timer) return;
    timer = setTimeout(()=>{ timer = null; flush(); }, FLUSH_INTERVAL);
  }
  async function flush(){
    if(sending) return;
    if(!enabled) return;
    if(!endpoint) return;
    if(buffer.length === 0) return;
    sending = true;
    const batch = buffer.splice(0, Math.min(MAX_BATCH, buffer.length));
    const payload = { events: batch, meta: { site: CFG.PORTAL_NAME || 'DSRT', ts: Date.now() } };

    let attempt = 0;
    let ok = false;
    let wait = RETRY_BASE;
    while(attempt < RETRY_LIMIT && !ok){
      try {
        if(navigator.sendBeacon){
          try {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            ok = navigator.sendBeacon(endpoint, blob);
            if(ok) break;
          } catch(e){}
        }
        const resp = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), keepalive:true });
        ok = resp && (resp.status >= 200 && resp.status < 300);
      } catch(e){ ok = false; }
      if(!ok){ attempt++; await new Promise(r=>setTimeout(r, wait)); wait = Math.round(wait * 1.8); }
    }

    sending = false;
    if(!ok){
      buffer.unshift(...batch);
    }
  }
  async function flushNow(){ await flush(); }

  global.DSRT_Analytics = { setEndpoint, enable, disable, enqueue, flushNow, getBufferLength: ()=>buffer.length };
})(window);

(function(global){
  const CFG = global.DSRT_CONFIG || {};
  const PREFIX = CFG.PREFIX || 'DSRT';
  const COOKIE_TTL = CFG.COOKIE_TTL_DAYS || 180;

  const Cookie = {
    _esc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); },
    get(name){ const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + this._esc(name) + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : null; },
    set(name, value, days = COOKIE_TTL){ const maxAge = Math.floor(days * 24 * 3600); document.cookie = `${name}=${encodeURIComponent(String(value))}; path=/; SameSite=Lax; max-age=${maxAge}`; },
    del(name){ document.cookie = `${name}=; path=/; max-age=0`; }
  };

  function genUID(prefix='dsrt-'){ try { const a = new Uint8Array(12); crypto.getRandomValues(a); return prefix + Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join('') + '-' + Date.now().toString(36); } catch(e){ return prefix + Math.random().toString(36).slice(2,10) + '-' + Date.now().toString(36); } }

  const KEYS = { uid: () => `${PREFIX}_uid`, session: () => `${PREFIX}_session` };

  const Session = {
    now(){ return Date.now(); },
    ensureUID(){ let id = Cookie.get(KEYS.uid()); if(!id){ id = genUID(); Cookie.set(KEYS.uid(), id); } return id; },
    read(){ try { const raw = sessionStorage.getItem(KEYS.session()); if(raw) return JSON.parse(raw); } catch(e){} return null; },
    write(sess){ if(!sess) return; sess.expire = this.now() + COOKIE_TTL * 24*3600*1000; try { sessionStorage.setItem(KEYS.session(), JSON.stringify(sess)); } catch(e){} Cookie.set(KEYS.uid(), sess.id || this.ensureUID()); },
    prevCount(){ try { const v = Cookie.get(KEYS.session() + '_visits'); return v ? (parseInt(v,10)||0) : 0; } catch(e){ return 0; } },
    detectSource(){ const p = new URLSearchParams(location.search); if(p.has('utm_source')) return p.get('utm_source'); if(document.referrer){ try { return new URL(document.referrer).hostname; } catch(e){ return 'referrer'; } } return 'direct'; },
    init(){ const uid = this.ensureUID(); let s = this.read(); if(!s || s.id !== uid){ s = { id: uid, tab_id: genUID('tab-'), created: this.now(), page: { path: location.pathname, start: this.now() }, previous_page: {}, landing_page: { path: location.pathname, start: this.now() }, count: (parseInt(Cookie.get(KEYS.session() + '_visits')||'0',10) || 0) + 1, depth: 1, source: this.detectSource() }; } else { s.previous_page = s.page || {}; s.page = { path: location.pathname, start: this.now() }; s.depth = (s.depth || 1) + 1; } this.write(s); try { Cookie.set(KEYS.session() + '_visits', String(s.count)); } catch(e){} return s; },
    get(){ return this.read(); },
    clear(){ try{ sessionStorage.removeItem(KEYS.session()); } catch(e){} Cookie.del(KEYS.uid()); }
  };

  global.DSRT_Session = Session;
})(window);

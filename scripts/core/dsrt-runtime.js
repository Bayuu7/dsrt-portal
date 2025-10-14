(function(global){
  const CFG = global.DSRT_CONFIG || {};

  // Initialize Sentry frontend if configured
  if (CFG.SENTRY_DSN) {
    (function(){
      const s = document.createElement('script');
      s.src = 'https://browser.sentry-cdn.com/7.11.0/bundle.min.js';
      s.crossOrigin = 'anonymous';
      s.onload = function(){
        try { Sentry.init({ dsn: CFG.SENTRY_DSN, environment: CFG.ENV || 'production' }); console.log('[DSRT] Sentry frontend initialized'); } catch(e){ console.warn('[DSRT] Sentry init failed', e); }
      };
      document.head.appendChild(s);
    })();
  }

  if(!global.DSRT_Session) console.warn('[DSRT] DSRT_Session missing - ensure dsrt-session.js loaded');
  if(!global.DSRT_Analytics) console.warn('[DSRT] DSRT_Analytics missing - ensure dsrt-analytics.js loaded');

  const DSRT = {
    config: CFG,
    setConfig(cfg){ Object.assign(CFG, cfg||{}); if(cfg.ANALYTICS_ENDPOINT && global.DSRT_Analytics) global.DSRT_Analytics.setEndpoint(cfg.ANALYTICS_ENDPOINT); },
    Session: global.DSRT_Session,
    Analytics: global.DSRT_Analytics,
    Consent: global.DSRT_Consent,
    Catalog: global.DSRT_Catalog,
    detectBot: global.DSRT_DetectBot,
    adsAllowed: false,
    launchGame(gameId){
      if(!gameId) return;
      const gameBase = `/games/${encodeURIComponent(gameId)}`;
      const loaderUrl = `${gameBase}/${encodeURIComponent(gameId)}.loader.js`;
      const playerSection = document.getElementById('player');
      if(playerSection) playerSection.style.display='block';
      let unityContainer = document.getElementById('unity-container');
      if(!unityContainer){ unityContainer = document.createElement('div'); unityContainer.id='unity-container'; document.body.appendChild(unityContainer); }
      if(!document.querySelector(`script[src="${loaderUrl}"]`)){
        const s = document.createElement('script'); s.src = loaderUrl; s.onload = ()=> console.debug('[DSRT] loader loaded', loaderUrl); s.onerror = ()=> console.error('[DSRT] loader failed', loaderUrl); document.body.appendChild(s);
      } else { tryStartUnity(gameId); }
    },
    tryStartUnity(){
      if(typeof window.createUnityInstance === 'function'){
        const el = document.getElementById('unity-container');
        try { window.createUnityInstance(el, {}).then(inst=>{ window.unityInstance = inst; console.debug('[DSRT] unityInstance created'); }).catch(err=>console.warn('[DSRT] createUnityInstance error', err)); } catch(e){}
      }
    },
    unityHelper: {
      InitSession: function(){ try { return JSON.stringify(DSRT.Session.init()); } catch(e){ return '{}'; } },
      RequestBotDetection: function(){ DSRT.detectBot().then(f=>{ window.__dsrt_bot = JSON.stringify(f||[]); try { if(window.unityInstance && window.unityInstance.SendMessage) window.unityInstance.SendMessage('DSRTBridge','OnBotDetection', window.__dsrt_bot); } catch(e){} }); },
      GetLastBotResult: function(){ return window.__dsrt_bot || '[]'; },
      SetAnalyticsEndpoint: function(url){ if(DSRT.Analytics && DSRT.Analytics.setEndpoint) DSRT.Analytics.setEndpoint(url); },
      SendEvent: function(jsonStr){ try { const obj = JSON.parse(jsonStr); if(DSRT.Analytics) DSRT.Analytics.enqueue(obj); } catch(e){} }
    },
    getConsent(){ try { return JSON.parse(localStorage.getItem(CFG.CONSENT_KEY)); } catch(e){ return null; } }
  };

  global.DSRT_unityHelper = {
    InitSession: DSRT.unityHelper.InitSession,
    RequestBotDetection: DSRT.unityHelper.RequestBotDetection,
    GetLastBotResult: DSRT.unityHelper.GetLastBotResult,
    SetAnalyticsEndpoint: DSRT.unityHelper.SetAnalyticsEndpoint,
    SendEvent: DSRT.unityHelper.SendEvent
  };

  global.DSRT = DSRT;

  async function boot(){
    try { DSRT.Session.init(); DSRT.Analytics && DSRT.Analytics.enqueue && DSRT.Analytics.enqueue({ type:'session.init', sessionId: DSRT.Session.get().id }); } catch(e){}
    DSRT.detectBot().then(flags => { window.__dsrt_bot = JSON.stringify(flags||[]); if(flags && flags.length) DSRT.Analytics && DSRT.Analytics.setEndpoint && DSRT.Analytics.setEndpoint(CFG.ANALYTICS_ENDPOINT); });
    if(DSRT.Catalog && typeof DSRT.Catalog.load === 'function') DSRT.Catalog.load();
    if(DSRT.Consent) { const c = DSRT.getConsent(); if(c) { if(c.analytics) DSRT.Analytics && DSRT.Analytics.enqueue && DSRT.Analytics.enqueue({ type:'consent.restored' }); DSRT.adsAllowed = !!c.ads; } }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  DSRT.debug = function(msg, obj){ try { console.debug('[DSRT]', msg, obj||''); } catch(e){} };

})(window);

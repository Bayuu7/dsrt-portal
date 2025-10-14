/* dsrt-runtime.js
   Loads modules and exposes window.DSRT object (integrator).
   This file should be included after dsrt-config.js and module files.
*/
(function(global){
  const CFG = global.DSRT_CONFIG || {};
  // Ensure submodules loaded
  if(!global.DSRT_Session || !global.DSRT_Analytics || !global.DSRT_DetectBot) {
    console.warn('[DSRT] Some modules missing. Ensure core modules are loaded first.');
  }

  // Compose main API
  const DSRT = {
    config: CFG,
    setConfig(cfg){ Object.assign(CFG, cfg||{}); if(cfg && cfg.ANALYTICS_ENDPOINT && global.DSRT_Analytics) global.DSRT_Analytics.setEndpoint(cfg.ANALYTICS_ENDPOINT); return CFG; },
    // modules
    Session: global.DSRT_Session,
    Analytics: global.DSRT_Analytics,
    Consent: global.DSRT_Consent,
    Ads: global.DSRT_Ads || null,
    Catalog: global.DSRT_Catalog,
    detectBot: global.DSRT_DetectBot,
    launchGame: function(gameId){ if(window.DSRT_LaunchGame) return window.DSRT_LaunchGame(gameId); return null; },
    // Unity helpers (bridge)
    unityHelper: {
      InitSession: function(){ try { return JSON.stringify(DSRT.Session.init()); } catch(e){ return '{}'; } },
      RequestBotDetection: function(){ DSRT.detectBot().then(f=>{ window.__dsrt_bot = JSON.stringify(f||[]); try { if(window.unityInstance && window.unityInstance.SendMessage) window.unityInstance.SendMessage('DSRTBridge','OnBotDetection', window.__dsrt_bot); } catch(e){} }); },
      GetLastBotResult: function(){ return window.__dsrt_bot || '[]'; },
      SetAnalyticsEndpoint: function(url){ if(DSRT.Analytics) DSRT.Analytics.setEndpoint(url); },
      SendEvent: function(jsonStr){ try { const obj = JSON.parse(jsonStr); if(DSRT.Analytics) DSRT.Analytics.enqueue(obj); } catch(e){} }
    },
    // convenience
    getConsent: function(){ try { return JSON.parse(localStorage.getItem(CFG.CONSENT_KEY)); } catch(e){ return null; } }
  };

  // expose helper for DSRT.jslib (name used in jslib)
  global.DSRT_unityHelper = {
    InitSession: DSRT.unityHelper.InitSession,
    RequestBotDetection: DSRT.unityHelper.RequestBotDetection,
    GetLastBotResult: DSRT.unityHelper.GetLastBotResult,
    SetAnalyticsEndpoint: DSRT.unityHelper.SetAnalyticsEndpoint,
    SendEvent: DSRT.unityHelper.SendEvent
  };

  global.DSRT = DSRT;

  // Auto-initialize: create session, run detection, load catalog
  function boot(){
    try { DSRT.Session.init(); DSRT.Analytics.enqueue({ type:'session.init', sessionId: DSRT.Session.get().id }); } catch(e){}
    DSRT.detectBot().then(flags => { window.__dsrt_bot = JSON.stringify(flags||[]); if(flags && flags.length) DSRT.Analytics.disable(); });
    if(DSRT.Catalog && typeof DSRT.Catalog.load === 'function') DSRT.Catalog.load();
    // wire consent if present
    if(DSRT.Consent) { const c = DSRT.getConsent(); if(c) { if(c.analytics) DSRT.Analytics.enable(); else DSRT.Analytics.disable(); DSRT.adsAllowed = !!c.ads; } }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

})(window);

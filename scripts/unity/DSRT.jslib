/* DSRT.jslib
   Put into Unity project's Assets/Plugins/WebGL/DSRT.jslib.
   It will call window.DSRT_unityHelper.* defined by runtime integrator.
*/
mergeInto(LibraryManager.library, {
  DSRT_InitSession: function() {
    try {
      var s = (window.DSRT_unityHelper && window.DSRT_unityHelper.InitSession) ? window.DSRT_unityHelper.InitSession() : '{}';
      return allocate(intArrayFromString(typeof s === 'string' ? s : JSON.stringify(s)), 'i8', ALLOC_NORMAL);
    } catch(e){
      return allocate(intArrayFromString(''), 'i8', ALLOC_NORMAL);
    }
  },

  DSRT_RequestBotDetection: function() {
    try {
      if (window.DSRT_unityHelper && window.DSRT_unityHelper.RequestBotDetection) window.DSRT_unityHelper.RequestBotDetection();
    } catch(e){}
  },

  DSRT_GetLastBotResult: function() {
    try { var s = (window.__dsrt_bot || '[]'); return allocate(intArrayFromString(String(s)), 'i8', ALLOC_NORMAL); }
    catch(e){ return allocate(intArrayFromString('[]'), 'i8', ALLOC_NORMAL); }
  },

  DSRT_SetAnalyticsEndpoint: function(ptr) {
    try {
      var url = UTF8ToString(ptr);
      if (window.DSRT_unityHelper && window.DSRT_unityHelper.SetAnalyticsEndpoint) window.DSRT_unityHelper.SetAnalyticsEndpoint(url);
    } catch(e){}
  },

  DSRT_SendEvent: function(ptr) {
    try {
      var json = UTF8ToString(ptr);
      if (window.DSRT_unityHelper && window.DSRT_unityHelper.SendEvent) window.DSRT_unityHelper.SendEvent(json);
    } catch(e){}
  }
});

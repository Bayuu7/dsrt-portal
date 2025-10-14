/* dsrt-loader.js
   Optional helper to show/hide loading UI while Unity builds load.
   Expectations: element #unity-loader exists in DOM.
*/
(function(){
  function show(){ const el = document.getElementById('unity-loader'); if(el) el.style.display = 'block'; }
  function hide(){ const el = document.getElementById('unity-loader'); if(el) el.style.display = 'none'; }

  window.DSRT_Loader = { show, hide };
})();

(function(){
  function show(){ const el = document.getElementById('unity-loader'); if(el) el.style.display='flex'; }
  function hide(){ const el = document.getElementById('unity-loader'); if(el) el.style.display='none'; }
  window.DSRT_Loader = { show, hide };
})();

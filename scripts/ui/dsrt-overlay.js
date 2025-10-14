(function(){
  function setup(){
    const fs = document.getElementById('btn-fullscreen');
    const ex = document.getElementById('btn-exit');
    if(fs) fs.addEventListener('click', ()=>{ const el = document.getElementById('unity-container'); if(el && el.requestFullscreen) el.requestFullscreen(); });
    if(ex) ex.addEventListener('click', ()=>{ const player = document.getElementById('player'); if(player) player.style.display='none'; try { if(window.unityInstance && typeof window.unityInstance.Quit === 'function') window.unityInstance.Quit(); } catch(e){} });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();

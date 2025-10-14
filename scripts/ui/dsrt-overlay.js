/* dsrt-overlay.js
   Simple overlay controls: fullscreen, exit, pause hook.
   Requires elements: #unity-container, #btn-fullscreen, #btn-exit in page.
*/
(function(global){
  function setup(){
    const fs = document.getElementById('btn-fullscreen');
    const ex = document.getElementById('btn-exit');
    if(fs) fs.addEventListener('click', ()=> {
      const el = document.getElementById('unity-container');
      if(el && el.requestFullscreen) el.requestFullscreen();
    });
    if(ex) ex.addEventListener('click', ()=> {
      // hide player container
      const player = document.getElementById('player');
      if(player) player.style.display = 'none';
      // try to unload unityInstance
      try { if(window.unityInstance && typeof window.unityInstance.Quit === 'function') window.unityInstance.Quit(); } catch(e){}
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})(window);

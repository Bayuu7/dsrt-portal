/* dsrt-catalog.js
   Fetches /config/games.json and renders into #catalog
*/
(function(global){
  const CFG = global.DSRT_CONFIG || {};
  async function load(url = CFG.CATALOG_URL || '/config/games.json'){
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if(!r.ok) return [];
      const list = await r.json();
      render(list);
      return list;
    } catch(e){
      console.error('[DSRT] catalog load failed', e);
      return [];
    }
  }
  function render(list){
    const cont = document.getElementById('catalog');
    if(!cont) return;
    cont.innerHTML = '';
    list.forEach(g=>{
      const a = document.createElement('article');
      a.className = 'game-tile';
      a.innerHTML = `<img src="${g.thumbnail||'/assets/icons/dsrt-icon-192.png'}" alt="${escape(g.title)}"/><h3>${escape(g.title)}</h3><p>${escape(g.description||'')}</p><button class="dsrt-launch-btn" data-game="${escape(g.id)}">Play</button>`;
      cont.appendChild(a);
    });
    cont.querySelectorAll('.dsrt-launch-btn').forEach(b=> b.addEventListener('click', ()=> {
      const id = b.dataset.game;
      if(typeof global.DSRT_LaunchGame === 'function') global.DSRT_LaunchGame(id);
      else if(global.DSRT && typeof global.DSRT.launchGame === 'function') global.DSRT.launchGame(id);
    }));
  }
  function escape(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  global.DSRT_Catalog = { load, render };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>load()); else load();
})(window);

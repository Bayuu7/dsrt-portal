(function(global){
  const CFG = global.DSRT_CONFIG || {};
  async function load(url = CFG.CATALOG_URL || '/config/games.json'){
    try {
      const resp = await fetch(url, { cache:'no-store' });
      if(!resp.ok) return [];
      const list = await resp.json();
      render(list);
      return list;
    } catch(e){ console.error('[DSRT] catalog load failed', e); return []; }
  }
  function render(list){
    const container = document.getElementById('catalog');
    if(!container) return;
    container.innerHTML = '';
    list.forEach(g=>{
      const art = document.createElement('article');
      art.className = 'game-tile';
      art.innerHTML = `
        <img src="${g.thumbnail||'/assets/icons/dsrt-icon-192.png'}" alt="${escapeHtml(g.title||'')}">
        <h3>${escapeHtml(g.title||'')}</h3>
        <p>${escapeHtml(g.description||'')}</p>
        <button class="dsrt-launch-btn" data-game="${escapeHtml(g.id)}">Play</button>
      `;
      container.appendChild(art);
    });
    container.querySelectorAll('.dsrt-launch-btn').forEach(btn=>{
      btn.addEventListener('click', ()=> {
        const id = btn.dataset.game;
        if(typeof global.DSRT_LaunchGame === 'function') return global.DSRT_LaunchGame(id);
        if(global.DSRT && typeof global.DSRT.launchGame === 'function') global.DSRT.launchGame(id);
      });
    });
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  global.DSRT_Catalog = { load, render };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>load()); else load();
})(window);

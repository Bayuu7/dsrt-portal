/* dsrt-consent.js
   Consent modal + localStorage. Integrates with DSRT_Analytics and DSRT_Ads.
   Export: window.DSRT_Consent
*/
(function(global){
  const CFG = global.DSRT_CONFIG || {};
  const KEY = CFG.CONSENT_KEY || 'DSRT_consent_v2';

  function read(){
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch(e){ return null; }
  }
  function save(obj){ try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch(e){} }

  function apply(consent){
    global.DSRT_Consent = consent;
    if(global.DSRT_Analytics) {
      if(consent.analytics) global.DSRT_Analytics.enable();
      else global.DSRT_Analytics.disable();
    }
    if(global.DSRT_Ads) global.DSRT_Ads[ consent.ads ? 'enable' : 'disable' ]();
  }

  function showModal(){
    const modal = document.getElementById('dsrt-consent-modal');
    if(!modal) return;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden','false');
  }
  function hideModal(){
    const modal = document.getElementById('dsrt-consent-modal');
    if(!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden','true');
  }

  function initUI(){
    if(!document.body) return;
    // inject minimal modal if not present
    if(!document.getElementById('dsrt-consent-modal')){
      const div = document.createElement('div');
      div.id = 'dsrt-consent-modal';
      div.style.display = 'none';
      div.innerHTML = `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9997"></div>
        <div style="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;padding:18px;border-radius:8px;z-index:9999;max-width:360px;font-family:inherit">
          <h3>Privacy & Cookies</h3>
          <p>Allow analytics and personalized ads?</p>
          <div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0;">
            <span>Analytics</span><input id="dsrt-consent-analytics" type="checkbox" />
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0;">
            <span>Personalized Ads</span><input id="dsrt-consent-ads" type="checkbox" />
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="dsrt-consent-save">Save</button>
            <button id="dsrt-consent-reject">Reject</button>
          </div>
        </div>
      `;
      document.body.appendChild(div);
    }

    const chkA = document.getElementById('dsrt-consent-analytics');
    const chkAds = document.getElementById('dsrt-consent-ads');
    const btnSave = document.getElementById('dsrt-consent-save');
    const btnReject = document.getElementById('dsrt-consent-reject');

    const existing = read();
    if(existing){
      chkA.checked = !!existing.analytics;
      chkAds.checked = !!existing.ads;
      apply(existing);
    } else {
      chkA.checked = false;
      chkAds.checked = false;
      showModal();
    }

    btnSave.addEventListener('click', ()=> {
      const val = { analytics: !!chkA.checked, ads: !!chkAds.checked, ts: Date.now() };
      save(val);
      apply(val);
      hideModal();
    });
    btnReject.addEventListener('click', ()=> {
      const val = { analytics: false, ads: false, ts: Date.now() };
      save(val);
      apply(val);
      hideModal();
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI); else initUI();

  global.DSRT_Consent = { read, save, showModal };
})(window);

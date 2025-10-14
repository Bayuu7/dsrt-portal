/* dsrt-bot.js
   Bot detection heuristics. Non-blocking, returns array of flags.
   Export: window.DSRT_DetectBot()
*/
(function(global){
  async function detectBot(){
    const flags = [];
    try {
      const ua = navigator.userAgent || '';
      if(/bot|crawl|spider|headless|phantomjs|slurp|bingbot/i.test(ua)) flags.push('ua-suspect');
      if(navigator.webdriver) flags.push('webdriver');
      if(!(navigator.languages && navigator.languages.length)) flags.push('no-langs');
      if(typeof window.RTCPeerConnection === 'undefined') flags.push('no-rtcpeer');
      if(window.callPhantom || window._phantom) flags.push('phantom');
      if(screen && screen.width === 400 && screen.height === 400) flags.push('screen-400x400');
      if(typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency > 64) flags.push('many-cores');

      // iframe probe
      try {
        const ifr = document.createElement('iframe');
        ifr.srcdoc = '<script>window.__dsrt_probe=1<\/script>';
        ifr.style.display = 'none';
        document.body.appendChild(ifr);
        if(!(ifr.contentWindow && ifr.contentWindow.__dsrt_probe === 1)) flags.push('iframe-proxy-odd');
        document.body.removeChild(ifr);
      } catch(e){ flags.push('iframe-ex'); }

      // permissions
      try {
        if(navigator.permissions){
          const p = await navigator.permissions.query({name:'notifications'}).catch(()=>({state:'unknown'}));
          if(p && p.state === 'prompt' && 'Notification' in window && Notification.permission === 'denied') flags.push('perm-notify-denied');
        }
      } catch(e){}

      // canvas tamper
      try {
        const orig = HTMLCanvasElement.prototype.toDataURL;
        let tampered = false;
        try {
          Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', { get(){ tampered = true; return orig; }, configurable:true });
        } catch(e){}
        try { Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', { value: orig }); } catch(e){}
        if(tampered) flags.push('canvas-tampered');
      } catch(e){}
    } catch(e){
      flags.push('detect-ex');
    }
    return flags;
  }

  global.DSRT_DetectBot = detectBot;
})(window);

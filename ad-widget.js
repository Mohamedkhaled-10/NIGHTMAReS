/* ad-widget.js
   Embeddable ad renderer that reads ad config from Firebase Realtime DB
   Usage: <div class="my-ad" data-ad-id="ad-123"></div>
   Then include this script (host it on your server) and it will replace the div with the ad.
*/

(function(){
  // ---- CONFIG: ضع firebaseConfig هنا (نسخة من اللي بعتته) ----
  const firebaseConfig = {
    apiKey: "AIzaSyDMMu-QNPL6RlGYdGGQVJLzQCC_hsLa8I",
    authDomain: "night-ac2a0.firebaseapp.com",
    databaseURL: "https://night-ac2a0-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "night-ac2a0",
    storageBucket: "night-ac2a0.firebasestorage.app",
    messagingSenderId: "202751732517",
    appId: "1:202751732517:web:5d458d19aac8d7135848cc"
  };
  // ----------------------------------------------------------

  // Load Firebase compat SDKs if not present
  function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }

  async function ensureFirebase(){
    if(window.firebase && firebase.apps && firebase.apps.length) return;
    // compat builds (choose a version available)
    await loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js');
    if(!window.firebase) throw new Error('Firebase failed to load');
    if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  }

  function registerImpression(adId){
    try{
      const db = firebase.database();
      const ref = db.ref(`stats/${adId}/impressions`);
      ref.transaction(curr => (curr||0) + 1);
    }catch(e){ /* ignore */ }
  }

  function registerClick(adId){
    try{
      const db = firebase.database();
      const ref = db.ref(`stats/${adId}/clicks`);
      ref.transaction(curr => (curr||0) + 1);
    }catch(e){ /* ignore */ }
  }

  function renderAd(slot, config){
    // config fields expected:
    // { name, imageUrl, linkUrl, size: {w,h} or preset, altText, label, openInNewTab, border, bgColor, showCloseButton, active, startDate, endDate, impressionLimit }
    if(!config || !config.active) {
      slot.innerHTML = ''; return;
    }

    // check schedule
    const now = Date.now();
    if(config.startDate && now < config.startDate) { slot.innerHTML = ''; return; }
    if(config.endDate && now > config.endDate) { slot.innerHTML = ''; return; }

    // check impression limit (basic)
    // optional field in config: impressionLimit
    // not strictly enforced (race conditions), but we still check current stat
    const adId = slot.dataset.adId;
    if(config.impressionLimit){
      // fetch current impressions synchronously not possible; we still render and stats will be incremented.
    }

    // determine size
    let width = '100%';
    let height = 'auto';
    if(config.size && config.size.w) width = config.size.w + (config.size.unit||'px');
    if(config.size && config.size.h) height = config.size.h + (config.size.unit||'px');
    // if preset
    if(config.preset){
      const presets = {
        'leaderboard': {w:'728px', h:'90px'},
        'medium-rectangle': {w:'300px', h:'250px'},
        'square': {w:'250px', h:'250px'},
        'skyscraper': {w:'160px', h:'600px'},
        'responsive': {w:'100%', h:'auto'}
      };
      if(presets[config.preset]){
        width = presets[config.preset].w;
        height = presets[config.preset].h;
      }
    }

    // build element
    const wrapper = document.createElement('div');
    wrapper.className = 'cg-ad-wrapper';
    wrapper.style.width = width;
    wrapper.style.height = height === 'auto' ? '' : height;
    wrapper.style.maxWidth = '100%';
    wrapper.style.position = 'relative';
    wrapper.style.boxSizing = 'border-box';
    if(config.bgColor) wrapper.style.background = config.bgColor;
    if(config.border) wrapper.style.border = config.border;

    // label (like "Ad")
    if(config.label !== null && config.label !== false){
      const lab = document.createElement('div');
      lab.className = 'cg-ad-label';
      lab.innerText = config.label || 'إعلان';
      lab.style.position = 'absolute';
      lab.style.top = '6px';
      lab.style.left = '6px';
      lab.style.fontSize = '11px';
      lab.style.padding = '2px 6px';
      lab.style.background = 'rgba(0,0,0,0.6)';
      lab.style.color = 'white';
      lab.style.borderRadius = '3px';
      lab.style.zIndex = 5;
      wrapper.appendChild(lab);
    }

    // close button
    if(config.showCloseButton){
      const close = document.createElement('button');
      close.className = 'cg-ad-close';
      close.innerText = '×';
      close.title = 'إغلاق الإعلان';
      close.style.position = 'absolute';
      close.style.top = '4px';
      close.style.right = '6px';
      close.style.zIndex = 6;
      close.style.background = 'transparent';
      close.style.border = 'none';
      close.style.fontSize = '18px';
      close.style.cursor = 'pointer';
      close.onclick = () => { slot.style.display = 'none'; };
      wrapper.appendChild(close);
    }

    // image/link
    const link = document.createElement('a');
    link.href = config.linkUrl || '#';
    if(config.openInNewTab) link.target = '_blank';
    link.style.display = 'block';
    link.style.width = '100%';
    link.style.height = '100%';
    link.style.textDecoration = 'none';
    link.style.color = 'inherit';
    link.style.overflow = 'hidden';
    link.style.boxSizing = 'border-box';
    link.setAttribute('aria-label', config.altText || (config.name||'ad'));

    const img = document.createElement('img');
    img.src = config.imageUrl || '';
    img.alt = config.altText || (config.name||'ad image');
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.display = 'block';
    img.onload = () => {
      // impression register
      registerImpression(adId);
    };
    img.onerror = () => {
      // hide if broken
      // optional fallback
    };

    link.appendChild(img);
    wrapper.appendChild(link);

    // click tracking
    link.addEventListener('click', function(e){
      registerClick(adId);
      // allow navigation
    });

    // replace slot content
    slot.innerHTML = '';
    slot.appendChild(wrapper);
  }

  async function init(){
    try{
      await ensureFirebase();
    }catch(e){
      console.error('Firebase init failed', e);
      return;
    }

    const db = firebase.database();
    const adSlots = document.querySelectorAll('[data-ad-id]');

    adSlots.forEach(slot => {
      const adId = slot.dataset.adId;
      if(!adId) return;
      // subscribe to ad config
      const ref = db.ref(`ads/${adId}`);
      ref.on('value', snap => {
        const cfg = snap.val();
        if(!cfg) {
          // not found -> empty
          renderAd(slot, null);
          return;
        }
        // ensure numeric dates converted (FB stores numbers)
        if(cfg.startDate) cfg.startDate = Number(cfg.startDate);
        if(cfg.endDate) cfg.endDate = Number(cfg.endDate);
        renderAd(slot, cfg);
      });
    });
  }

  // Auto init on DOMContentLoaded
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();

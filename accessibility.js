/* Accessibility Widget Logic */
(function(){
  const state = {
    font: 100, // percent
    contrast: 100, // percent
    saturation: 100, // percent
    highlightLinks: false,
    bigCursor: false,
    justify: false,
    lineHeight: 160, // percent
    letterSpacing: 0, // px
    stopAnim: false,
    mute: false,
    hideImages: false,
  };

  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  const PANEL_ID = 'a11yPanel';
  const TOGGLE_ID = 'a11yToggle';
  const STORAGE_KEY = 'a11y-state-v1';

  function loadState(){
    try { Object.assign(state, JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}); } catch(_e){}
  }
  function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function applyState(){
    const html = document.documentElement;
    // Font size
    if(state.font !== 100){ html.classList.add('a11y-font-size'); html.style.setProperty('--a11y-font', state.font+'%'); }
    else { html.classList.remove('a11y-font-size'); html.style.removeProperty('--a11y-font'); }

    // Contrast
    if(state.contrast !== 100){ html.classList.add('a11y-contrast'); html.style.setProperty('--a11y-contrast', (state.contrast/100).toString()); }
    else { html.classList.remove('a11y-contrast'); html.style.removeProperty('--a11y-contrast'); }

    // Saturation
    if(state.saturation !== 100){ html.classList.add('a11y-saturation'); html.style.setProperty('--a11y-saturation', (state.saturation/100).toString()); }
    else { html.classList.remove('a11y-saturation'); html.style.removeProperty('--a11y-saturation'); }

    // Line height
    if(state.lineHeight !== 160){ html.classList.add('a11y-line-height'); html.style.setProperty('--a11y-line-height', (state.lineHeight/100).toString()); }
    else { html.classList.remove('a11y-line-height'); html.style.removeProperty('--a11y-line-height'); }

    // Letter spacing
    if(state.letterSpacing !== 0){ html.classList.add('a11y-letter-spacing'); html.style.setProperty('--a11y-letter-spacing', state.letterSpacing+'px'); }
    else { html.classList.remove('a11y-letter-spacing'); html.style.removeProperty('--a11y-letter-spacing'); }

    document.body.classList.toggle('a11y-highlight-links', !!state.highlightLinks);
    document.body.classList.toggle('a11y-big-cursor', !!state.bigCursor);
    document.body.classList.toggle('a11y-justify', !!state.justify);
    document.body.classList.toggle('a11y-stop-anim', !!state.stopAnim);
    document.body.classList.toggle('a11y-hide-images', !!state.hideImages);

    if(state.mute){ $$('audio,video').forEach(m=>{ m.muted = true; m.volume = 0; }); }
  }

  function resetAll(){
    Object.assign(state, {font:100, contrast:100, saturation:100, highlightLinks:false, bigCursor:false, justify:false, lineHeight:160, letterSpacing:0, stopAnim:false, mute:false, hideImages:false});
    saveState(); applyState();
    // Reset controls in UI if open
    const p = $('#'+PANEL_ID); if(!p) return;
    $('#a11y-font', p).value = state.font;
    $('#a11y-contrast', p).value = state.contrast;
    $('#a11y-saturation', p).value = state.saturation;
    $('#a11y-line', p).value = state.lineHeight;
    $('#a11y-letter', p).value = state.letterSpacing;
    $$('[data-toggle]', p).forEach(b=> b.classList.toggle('a11y-active', !!state[b.dataset.toggle]));
  }

  function ensureUI(){
    if($('#'+TOGGLE_ID)) return; // once

    // Floating toggle
    const fab = document.createElement('button');
    fab.id = TOGGLE_ID; fab.className='a11y-fab'; fab.type='button'; fab.setAttribute('aria-label','נגישות');
    fab.innerHTML = '♿';
    document.body.appendChild(fab);

    // Panel
    const panel = document.createElement('div');
    panel.id = PANEL_ID; panel.className='a11y-panel'; panel.hidden = true;
    panel.innerHTML = `
      <div class="a11y-header">
        <div class="a11y-title">Accessibility</div>
        <button class="a11y-close" type="button" aria-label="סגור">✕</button>
      </div>
      <div class="a11y-topbar">
        <button id="a11y-reset" class="a11y-btn" type="button">Reset All</button>
        <button id="a11y-statement" class="a11y-btn" type="button">Statement</button>
      </div>
      <div class="a11y-grid">
        <div class="a11y-tile">
          <input id="a11y-font" class="a11y-range" type="range" min="80" max="180" step="5" />
          <label>Font Size</label>
        </div>
        <div class="a11y-tile">
          <input id="a11y-contrast" class="a11y-range" type="range" min="50" max="200" step="5" />
          <label>Low Contrast</label>
        </div>
        <button class="a11y-tile" data-toggle="highlightLinks" type="button"><span>Highlight Links</span></button>
        <button class="a11y-tile" data-toggle="bigCursor" type="button"><span>Cursor</span></button>
        <button class="a11y-tile" data-toggle="justify" type="button"><span>Text Align</span></button>
        <div class="a11y-tile">
          <input id="a11y-saturation" class="a11y-range" type="range" min="0" max="200" step="5" />
          <label>Saturation</label>
        </div>
        <div class="a11y-tile">
          <input id="a11y-line" class="a11y-range" type="range" min="120" max="220" step="5" />
          <label>Line Height</label>
        </div>
        <div class="a11y-tile">
          <input id="a11y-letter" class="a11y-range" type="range" min="0" max="4" step="0.2" />
          <label>Letter Spacing</label>
        </div>
        <button class="a11y-tile" data-toggle="stopAnim" type="button"><span>Stop Animation</span></button>
        <button class="a11y-tile" id="a11y-mute" type="button"><span>Mute Sounds</span></button>
        <button class="a11y-tile" data-toggle="hideImages" type="button"><span>Hide Images</span></button>
      </div>`;
    document.body.appendChild(panel);

    // Wire events
    fab.addEventListener('click', ()=>{ panel.hidden = !panel.hidden; if(!panel.hidden) syncControls(panel); });
    $('.a11y-close', panel).addEventListener('click', ()=> panel.hidden = true);

    $('#a11y-reset', panel).addEventListener('click', resetAll);
    $('#a11y-statement', panel).addEventListener('click', ()=>{
      panel.hidden = true;
      const el = document.getElementById('accessibility-statement');
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    });

    // Ranges
    const bindRange = (id, key) => {
      const el = $('#'+id, panel);
      el.addEventListener('input', ()=>{ state[key] = Number(el.value); saveState(); applyState(); });
    };
    bindRange('a11y-font','font');
    bindRange('a11y-contrast','contrast');
    bindRange('a11y-saturation','saturation');
    bindRange('a11y-line','lineHeight');
    bindRange('a11y-letter','letterSpacing');

    // Toggle tiles
    $$('[data-toggle]', panel).forEach(btn=>{
      const key = btn.dataset.toggle;
      btn.addEventListener('click', ()=>{ state[key] = !state[key]; btn.classList.toggle('a11y-active', state[key]); saveState(); applyState(); });
    });

    // Mute button special handling
    $('#a11y-mute', panel).addEventListener('click', ()=>{
      state.mute = !state.mute; saveState(); applyState();
      $('#a11y-mute', panel).classList.toggle('a11y-active', state.mute);
    });

    // Auto-mute any future media if mute is on
    const obs = new MutationObserver(()=>{ if(state.mute){ $$('audio,video').forEach(m=>{ m.muted = true; m.volume = 0; }); }});
    obs.observe(document.documentElement, {subtree:true, childList:true});
  }

  function syncControls(panel){
    $('#a11y-font', panel).value = state.font;
    $('#a11y-contrast', panel).value = state.contrast;
    $('#a11y-saturation', panel).value = state.saturation;
    $('#a11y-line', panel).value = state.lineHeight;
    $('#a11y-letter', panel).value = state.letterSpacing;
    $$('[data-toggle]', panel).forEach(b=> b.classList.toggle('a11y-active', !!state[b.dataset.toggle]));
    $('#a11y-mute', panel).classList.toggle('a11y-active', state.mute);
  }

  // Init
  document.addEventListener('DOMContentLoaded', ()=>{
    loadState();
    ensureUI();
    applyState();
  });
})();


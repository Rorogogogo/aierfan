(() => {
  'use strict';
  let enabled = true;
  let state = { scheduler: 'waiting', blocked: 0 };
  let total = 0;
  let lastBlocked = 0;
  let view;
  let pendingBlocks = 0;
  let loaded = false;
  const notify = () => window.dispatchEvent(new CustomEvent('kubb-helper:settings', {
    detail: JSON.stringify({ blockAds: enabled })
  }));
  const render = () => view?.render({ enabled, total, ...state });
  function saveBlocks(delta) {
    if (!loaded) { pendingBlocks += delta; return; }
    total += delta;
    chrome.storage.local.set({ totalBlocked: total }).catch(() => {});
  }
  window.addEventListener('kubb-helper:status', event => {
    try {
      const data = JSON.parse(event.detail);
      state = {
        scheduler: ['ready', 'waiting', 'unsupported'].includes(data.scheduler) ? data.scheduler : 'waiting',
        blocked: Math.max(0, Math.floor(Number(data.blocked) || 0))
      };
      const delta = state.blocked - lastBlocked;
      lastBlocked = state.blocked;
      if (delta > 0) { saveBlocks(delta); view?.toast(); }
      render();
    } catch { /* Ignore malformed messages from the page. */ }
  });
  chrome.runtime.onMessage.addListener((message, _sender, respond) => {
    if (message?.type === 'aierfan:get-status') respond(state);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.blockAds) {
      enabled = changes.blockAds.newValue !== false;
      notify();
    }
    if (changes.totalBlocked) total = Math.max(0, Number(changes.totalBlocked.newValue) || 0);
    render();
  });
  chrome.storage.local.get({ blockAds: true, totalBlocked: 0 }).then(saved => {
    enabled = saved.blockAds !== false;
    total = Math.max(0, Number(saved.totalBlocked) || 0);
    loaded = true;
    if (pendingBlocks) { saveBlocks(pendingBlocks); pendingBlocks = 0; }
    notify(); render();
  }).catch(() => { loaded = true; notify(); });
  function mount() {
    if (document.getElementById('kubb-helper-panel')) return;
    const host = document.createElement('div');
    host.id = 'kubb-helper-panel';
    host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647';
    view = globalThis.__aierfanUI.mount(host.attachShadow({ mode: 'closed' }), {
      floating: true,
      async onToggle(value) {
        await chrome.storage.local.set({ blockAds: value });
        enabled = value;
        notify(); render();
      }
    });
    document.body.append(host);
    render(); notify();
    window.dispatchEvent(new CustomEvent('kubb-helper:request'));
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });
})();

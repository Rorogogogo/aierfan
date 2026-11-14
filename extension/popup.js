(() => {
  'use strict';
  const state = { enabled: true, total: 0, blocked: null, scheduler: 'unavailable', error: '' };
  let activeTabId;
  const root = document.querySelector('#app').attachShadow({ mode: 'closed' });
  const view = globalThis.__aierfanUI.mount(root, {
    async onToggle(enabled) {
      await chrome.storage.local.set({ blockAds: enabled });
      state.enabled = enabled;
      view.render(state);
    }
  });
  view.render(state);
  async function readStatus() {
    if (activeTabId === undefined) return;
    try {
      const status = await chrome.tabs.sendMessage(activeTabId, { type: 'aierfan:get-status' });
      if (!status || !['ready', 'waiting', 'unsupported'].includes(status.scheduler)) return;
      state.scheduler = status.scheduler;
      state.blocked = Math.max(0, Math.floor(Number(status.blocked) || 0));
      view.render(state);
    } catch { /* Other sites and old tabs have no receiver. */ }
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.blockAds) state.enabled = changes.blockAds.newValue !== false;
    if (changes.totalBlocked) state.total = Math.max(0, Number(changes.totalBlocked.newValue) || 0);
    view.render(state);
    readStatus();
  });
  Promise.all([
    chrome.storage.local.get({ blockAds: true, totalBlocked: 0 }),
    chrome.tabs.query({ active: true, currentWindow: true })
  ]).then(([saved, tabs]) => {
    state.enabled = saved.blockAds !== false;
    state.total = Math.max(0, Number(saved.totalBlocked) || 0);
    activeTabId = tabs[0]?.id;
    view.render(state);
    return readStatus();
  }).catch(() => {
    state.error = '无法读取本地设置，请重新打开扩展。';
    view.render(state);
  });
})();

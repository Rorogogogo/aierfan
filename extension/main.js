(() => {
  'use strict';
  const core = window.__kubbHelperCore;
  if (!core || window.__kubbHelperInstalled) return;
  Object.defineProperty(window, '__kubbHelperInstalled', { value: true });
  delete window.__kubbHelperCore;
  // Wait for saved settings from the isolated script before changing playback.
  const settings = { blockAds: false, bestQuality: false };
  const state = { scheduler: 'waiting', blocked: 0, quality: '等待视频', error: '' };
  const players = new Set();
  const wrappedFactories = new WeakSet();
  function publish() {
    window.dispatchEvent(new CustomEvent('kubb-helper:status', { detail: JSON.stringify(state) }));
  }
  function report(event) {
    if (event.kind === 'ad-blocked') state.blocked++;
    publish();
  }
  window.addEventListener('kubb-helper:request', publish);
  window.addEventListener('kubb-helper:settings', event => {
    try {
      const input = JSON.parse(event.detail);
      if (typeof input.blockAds === 'boolean') settings.blockAds = input.blockAds;
      if (typeof input.bestQuality === 'boolean') settings.bestQuality = input.bestQuality;
      for (const record of players) applyQuality(record);
      publish();
    } catch { /* Ignore malformed page events. */ }
  });
  function patchChunk(chunk) {
    const factory = chunk?.[1]?.bgqT;
    if (typeof factory !== 'function' || wrappedFactories.has(factory)) return;
    function wrapped(module, exports, require) {
      const result = factory.apply(this, arguments);
      const ok = core.patchScheduler(module.exports, () => settings.blockAds, report);
      state.scheduler = ok ? 'ready' : 'unsupported';
      publish();
      return result;
    }
    wrappedFactories.add(wrapped);
    chunk[1].bgqT = wrapped;
  }
  // Webpack replaces .push during bootstrap; keep interception across that assignment.
  const chunks = window.webpackJsonp = window.webpackJsonp || [];
  for (const chunk of chunks) patchChunk(chunk);
  function wrapPush(target) {
    return function (...items) {
      for (const chunk of items) patchChunk(chunk);
      return Reflect.apply(target, this, items);
    };
  }
  let interceptedPush = wrapPush(chunks.push);
  Object.defineProperty(chunks, 'push', {
    configurable: true,
    get() { return interceptedPush; },
    set(value) { if (value !== interceptedPush) interceptedPush = wrapPush(value); }
  });
  function isAdPlayer(hls) {
    const media = hls.media;
    return !!media?.closest?.('vg-player')?.querySelector('.publicbox');
  }
  function applyQuality(record) {
    const { hls } = record;
    try {
      if (!settings.bestQuality || record.failed) {
        if (record.applied) hls.nextLevel = -1;
        record.applied = false;
        state.quality = record.failed ? '自动（播放出错）' : '自动';
        return;
      }
      if (isAdPlayer(hls)) return;
      const index = core.highestLevel(hls.levels);
      if (index < 0) return;
      const level = hls.levels[index];
      hls.nextLevel = index;
      record.applied = true;
      const label = level.height || level.name;
      state.quality = hls.levels.length === 1 ? '当前播放列表只有一种画质' :
        (label ? `已请求 ${label}p（已提供的最高画质）` : '已请求最高画质流');
    } catch {
      state.error = '画质控制不可用，请使用播放器菜单。';
    }
  }
  function observeHls(Hls) {
    if (!Hls?.prototype || typeof Hls.prototype.loadSource !== 'function' ||
      !Hls.Events?.MANIFEST_PARSED || Hls.prototype.loadSource.__kubbHelper) return;
    const original = Hls.prototype.loadSource;
    const records = new WeakMap();
    function loadSource() {
      let record = records.get(this);
      if (!record) {
        record = { hls: this, failed: false, applied: false };
        records.set(this, record);
        players.add(record);
        this.on(Hls.Events.MANIFEST_PARSED, () => queueMicrotask(() => {
          applyQuality(record); publish();
        }));
        if (Hls.Events.LEVEL_SWITCHED) this.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          if (isAdPlayer(this)) return;
          const level = this.levels?.[data.level];
          if (level) {
            const label = level.height || level.name;
            state.quality = label ? `播放器已选择 ${label}p` :
              (this.levels.length === 1 ? '当前播放列表只有一种画质' : '已选择流；分辨率未知');
          }
          publish();
        });
        if (Hls.Events.ERROR) this.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal && record.applied) {
            record.failed = true;
            applyQuality(record); publish();
          }
        });
        if (Hls.Events.DESTROYING) this.on(Hls.Events.DESTROYING, () => players.delete(record));
      }
      record.failed = false;
      return original.apply(this, arguments);
    }
    Object.defineProperty(loadSource, '__kubbHelper', { value: true });
    Hls.prototype.loadSource = loadSource;
  }
  // Kubb loads Hls as a global. Catch its assignment before the first player is created.
  const descriptor = Object.getOwnPropertyDescriptor(window, 'Hls');
  if (!descriptor || (descriptor.configurable && !descriptor.get && !descriptor.set)) {
    let value = window.Hls;
    observeHls(value);
    Object.defineProperty(window, 'Hls', {
      configurable: true, enumerable: true,
      get() { return value; },
      set(next) { value = next; observeHls(next); }
    });
  } else observeHls(window.Hls);
  // Also catch libraries that replace the global with defineProperty.
  const timer = setInterval(() => {
    observeHls(window.Hls);
    if (document.readyState === 'complete' && !location.pathname.startsWith('/play')) {
      state.quality = '请打开一个 Kubb 视频';
    }
  }, 1500);
  window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
  publish();
})();

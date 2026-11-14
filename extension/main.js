(() => {
  'use strict';
  const core = window.__kubbHelperCore;
  if (!core || window.__kubbHelperInstalled) return;
  Object.defineProperty(window, '__kubbHelperInstalled', { value: true });
  delete window.__kubbHelperCore;
  // Wait for saved settings from the isolated script before changing playback.
  const settings = { blockAds: false };
  const state = { scheduler: 'waiting', blocked: 0 };
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
  publish();
})();

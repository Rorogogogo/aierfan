(function (root) {
  'use strict';
  const patched = new WeakSet();
  function patchScheduler(exports, enabled, report) {
    const proto = exports?.b?.prototype;
    // Fail closed if Kubb changes this private interface.
    if (!proto || patched.has(proto) || !['startPlay', 'stopPlay', 'needToShow', 'invokeList', 'getTimeDefine']
      .every(key => typeof proto[key] === 'function')) return false;
    const original = proto.startPlay;
    proto.startPlay = function (ad) {
      if (!enabled() || !ad) return original.apply(this, arguments);
      // Called before the countdown or source swap. No fake ended events or seeking.
      this.attenpToPlay = false;
      report({ kind: 'ad-blocked' });
      return undefined;
    };
    patched.add(proto);
    return true;
  }
  const api = { patchScheduler };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.defineProperty(root, '__kubbHelperCore', { value: api, configurable: true });
})(globalThis);

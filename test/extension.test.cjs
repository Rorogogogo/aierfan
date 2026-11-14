const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const { patchScheduler } = require('../extension/core.js');
function harness() {
  const listeners = new Map();
  const context = {
    console, queueMicrotask, location: { pathname: '/play/test' },
    document: { readyState: 'loading' }, setInterval: () => 1, clearInterval() {},
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
    dispatchEvent(event) { for (const fn of listeners.get(event.type) || []) fn(event); }
  };
  context.window = context;
  vm.createContext(context);
  for (const name of ['core.js', 'main.js']) vm.runInContext(fs.readFileSync(path.join(root, 'extension', name), 'utf8'), context);
  context.dispatchEvent(new context.CustomEvent('kubb-helper:settings', {detail:'{"blockAds":true}'}));
  return context;
}
class FakeScheduler {
  startPlay(ad) { this.called = ad; return 'original'; }
  stopPlay() {}
  needToShow() {}
  invokeList() {}
  getTimeDefine() {}
}
test('ad interception is reversible and does not fake playback completion', () => {
  class Scheduler extends FakeScheduler {}
  let enabled = true, reports = 0;
  assert.equal(patchScheduler({b: Scheduler}, () => enabled, () => reports++), true);
  const scheduler = new Scheduler();
  scheduler.attenpToPlay = true;
  scheduler.startPlay({src:'ad'});
  assert.equal(scheduler.called, undefined);
  assert.equal(scheduler.attenpToPlay, false);
  assert.equal(reports, 1);
  scheduler.startPlay(null);
  assert.equal(reports, 1);
  enabled = false;
  assert.equal(scheduler.startPlay('ad'), 'original');
  assert.equal(scheduler.called, 'ad');
});
test('unknown scheduler interfaces are left alone', () => {
  class Changed { startPlay() {} }
  const original = Changed.prototype.startPlay;
  assert.equal(patchScheduler({b: Changed}, () => true, () => {}), false);
  assert.equal(Changed.prototype.startPlay, original);
});
test('Webpack replacement push is intercepted before module registration', () => {
  const context = harness();
  let received;
  context.webpackJsonp.push = chunk => { received = chunk; return 17; };
  const factory = (module) => { module.exports = {b: class extends FakeScheduler {}}; };
  const chunk = [[1], { bgqT: factory }];
  assert.equal(context.webpackJsonp.push(chunk), 17);
  assert.notEqual(received[1].bgqT, factory);
  const module = {exports:{}};
  received[1].bgqT(module, module.exports, () => {});
  const scheduler = new module.exports.b();
  scheduler.startPlay({src:'ad'});
  assert.equal(scheduler.called, undefined);
  context.dispatchEvent(new context.CustomEvent('kubb-helper:settings', {detail:JSON.stringify({blockAds:false})}));
  assert.equal(scheduler.startPlay('ad'), 'original');
});
test('the extension leaves HLS and player quality untouched', () => {
  const context = harness();
  class Hls { loadSource(url) { this.url = url; } }
  const original = Hls.prototype.loadSource;
  context.Hls = Hls;
  assert.equal(Hls.prototype.loadSource, original);
  assert.equal(Object.getOwnPropertyDescriptor(context, 'Hls').set, undefined);
});
test('manifest limits access to Kubb and loads at document start', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extension/manifest.json')));
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.ok(fs.existsSync(path.join(root, 'extension', manifest.action.default_popup)));
  for (const script of manifest.content_scripts) {
    assert.deepEqual(script.matches, ['https://www.kubb.tv/*', 'https://kubb.tv/*']);
    assert.equal(script.run_at, 'document_start');
    for (const file of script.js) assert.ok(fs.existsSync(path.join(root, 'extension', file)));
  }
});

test('Webpack bootstrap can call the captured old push without recursion', () => {
  const context = harness();
  const queue = context.webpackJsonp;
  const oldPush = queue.push.bind(queue);
  let registered = 0;
  queue.push = function (chunk) { registered++; return oldPush(chunk); };
  queue.push([[123], {unrelated(){}}]);
  assert.equal(registered, 1);
  assert.equal(queue.length, 1);
});

test('video service factory is not intercepted', () => {
  const context = harness();
  const factory = () => {};
  const chunk = [[1], {jBNF:factory}];
  context.webpackJsonp.push(chunk);
  assert.equal(chunk[1].jBNF, factory);
});

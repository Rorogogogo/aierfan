const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '../extension', file), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function harness(file, { saved = { blockAds: true, totalBlocked: 12 }, status = { scheduler: 'ready', blocked: 2 }, rejectMessage = false } = {}) {
  const listeners = new Map();
  let storageChanged, runtimeMessage, toggle;
  const renders = [], writes = [], settings = [];
  const context = {
    console,
    document: {
      body: { append() {} },
      getElementById() { return null; },
      createElement() { return { style: {}, attachShadow() { return {}; } }; },
      querySelector() { return { attachShadow() { return {}; } }; }
    },
    __aierfanUI: { mount(_root, options) { toggle = options.onToggle; return { render(value) { renders.push({ ...value }); }, toast() {} }; } },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    addEventListener(type, fn) { listeners.set(type, fn); },
    dispatchEvent(event) { if (event.type === 'kubb-helper:settings') settings.push(JSON.parse(event.detail)); listeners.get(event.type)?.(event); },
    chrome: {
      storage: {
        local: {
          async get() { return saved; },
          async set(values) { writes.push(values); storageChanged(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { newValue: value }])), 'local'); }
        },
        onChanged: { addListener(fn) { storageChanged = fn; } }
      },
      runtime: { onMessage: { addListener(fn) { runtimeMessage = fn; } } },
      tabs: { async query() { return [{ id: 7 }]; }, async sendMessage() { if (rejectMessage) throw Error('No receiver'); return status; } }
    }
  };
  context.window = context;
  vm.runInNewContext(read(file), context);
  return {
    renders, writes, settings,
    toggle: value => toggle(value),
    change: values => storageChanged(values, 'local'),
    status: value => context.dispatchEvent(new context.CustomEvent('kubb-helper:status', { detail: JSON.stringify(value) })),
    readStatus: () => { let answer; runtimeMessage({ type: 'aierfan:get-status' }, {}, value => { answer = value; }); return answer; }
  };
}
test('popup loads saved settings, page status and persists its switch', async () => {
  const h = harness('popup.js', { saved: { blockAds: false, totalBlocked: 42 } });
  await tick();
  assert.deepEqual(h.renders.at(-1), { enabled: false, total: 42, blocked: 2, scheduler: 'ready', error: '' });
  await h.toggle(true);
  assert.equal(h.writes.at(-1).blockAds, true);
  assert.equal(h.renders.at(-1).enabled, true);
  h.change({ totalBlocked: { newValue: 43 } });
  await tick();
  assert.equal(h.renders.at(-1).total, 43);
});
test('popup handles unrelated sites without claiming active protection', async () => {
  const h = harness('popup.js', { rejectMessage: true });
  await tick();
  assert.equal(h.renders.at(-1).scheduler, 'unavailable');
  assert.equal(h.renders.at(-1).blocked, null);
});
test('content receives popup setting changes and reports session counts', async () => {
  const h = harness('content.js');
  await tick();
  h.change({ blockAds: { newValue: false } });
  assert.equal(h.settings.at(-1).blockAds, false);
  h.status({ scheduler: 'ready', blocked: 1 });
  h.status({ scheduler: 'ready', blocked: 1 });
  h.status({ scheduler: 'ready', blocked: 2 });
  assert.equal(h.renders.at(-1).total, 14);
  assert.equal(h.readStatus().blocked, 2);
  assert.equal(h.writes.filter(value => value.totalBlocked !== undefined).length, 2);
});
test('stored cumulative count survives a new page session', async () => {
  const h = harness('content.js', { saved: { blockAds: true, totalBlocked: 50 } });
  h.status({ scheduler: 'ready', blocked: 1 });
  await tick();
  assert.equal(h.renders.at(-1).total, 51);
  assert.equal(h.renders.at(-1).blocked, 1);
});

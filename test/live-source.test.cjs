// Optional contract check against the actual public Kubb bundle downloaded for this investigation.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {patchScheduler} = require('../extension/core.js');
const bundle = process.env.KUBB_PUBLIC_BUNDLE;
test('actual Kubb scheduler suppresses mid-roll at its real trigger point', {skip: !bundle}, () => {
  const context = {window: {webpackJsonp: []}, console: {log(){}}};
  vm.runInNewContext(fs.readFileSync(bundle, 'utf8'), context, {timeout: 3000});
  const chunk = context.window.webpackJsonp.find(chunk => chunk[1].bgqT);
  assert.ok(chunk, 'expected scheduler module exists');
  let timers = 0;
  class Emitter { subscribe() {} emit() {} }
  const require = name => {
    if (name === 'fXoL') return {n:Emitter};
    if (name === 'PqYM') return {a:() => { timers++; return {subscribe:() => ({unsubscribe(){}})}; }};
    if (name === 'AytR') return {a:{production:true}};
    throw Error('Unexpected import '+name);
  };
  require.d = (exports, key, getter) => Object.defineProperty(exports,key,{get:getter});
  const exports = {};
  chunk[1].bgqT({exports}, exports, require);
  const original = new exports.b();
  original.invokeList([{src:'ad.mp4'}],20,50);
  original.getTimeDefine('episode', 3600);
  original.needToShow(1801);
  assert.equal(timers, 1, 'unmodified player schedules an ad timer');
  let enabled = true, blocked = 0;
  assert.equal(patchScheduler(exports, () => enabled, () => blocked++), true);
  const patched = new exports.b();
  patched.invokeList([{src:'ad.mp4'}],20,50);
  patched.getTimeDefine('episode',3600);
  patched.needToShow(1801);
  patched.needToShow(1802);
  assert.equal(timers,1, 'no countdown, ad load or source swap starts');
  assert.equal(blocked,1, 'one block at trigger, no repeated blocks every time update');
  assert.equal(patched.isPlayingAds,false);
  assert.equal(patched.attenpToPlay,false);
  patched.reset();
  enabled = false;
  patched.needToShow(1801);
  assert.equal(timers,2, 'original scheduler restored by toggle');
});

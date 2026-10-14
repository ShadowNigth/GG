const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness(mobile = true) {
  const nodes = [], pending = new Set(), intervals = [], events = {}, native = {}, warnings = [];
  let clock = 0, context;
  class Param {
    constructor() { this.value = 0; }
    setValueAtTime(v) { this.value = v; }
    linearRampToValueAtTime(v) { this.value = v; }
    exponentialRampToValueAtTime(v) { this.value = v; }
    setTargetAtTime(v) { this.value = v; }
    cancelScheduledValues() {}
  }
  class Node {
    constructor(type) {
      this.type = type; this.connections = new Set();
      for (const p of ['gain', 'frequency', 'Q', 'threshold', 'ratio', 'knee', 'attack', 'release']) this[p] = new Param();
      nodes.push(this);
    }
    connect(n) { this.connections.add(n); return n; }
    disconnect(n) { if (n) this.connections.delete(n); else this.connections.clear(); }
    start(t) { this.startAt = t; pending.add(this); }
    stop(t = clock) { this.stopAt = t; }
  }
  class AC {
    constructor(options) { this.options = options; this.state = 'running'; this.sampleRate = 8000; this.destination = new Node('destination'); context = this; }
    get currentTime() { return clock; }
    addEventListener() {}
    async resume() { this.state = 'running'; }
    async suspend() { this.state = 'suspended'; }
    createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; }
  }
  for (const type of ['Gain', 'Oscillator', 'BufferSource', 'BiquadFilter', 'DynamicsCompressor', 'Convolver']) {
    AC.prototype['create' + type] = () => new Node(type);
  }
  const sandbox = {
    G: { U: { clamp: (v, min, max) => Math.min(max, Math.max(min, v)) } },
    AudioContext: AC, navigator: { userAgent: mobile ? 'Android' : 'Desktop' },
    document: { hidden: false, addEventListener: (name, fn) => { events[name] = fn; } },
    localStorage: { getItem: () => null, setItem() {} },
    performance: { now: () => clock * 1000 },
    setInterval: fn => { intervals.push(fn); return intervals.length; },
    clearInterval() {},
    setTimeout: fn => { throw Error('No per-voice wall-clock timers allowed'); },
    addEventListener: (name, fn) => { events[name] = fn; },
    console: { warn: (...args) => warnings.push(args.join(' ')) },
    Capacitor: { isNativePlatform: () => mobile, Plugins: { App: {
      async addListener(name, fn) { native[name] = fn; }
    } } }
  };
  sandbox.window = sandbox; vm.createContext(sandbox);
  for (const file of ['data/music.js', 'core/audio.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../www/js', file), 'utf8'), sandbox);
  }
  const audio = sandbox.G.Audio;
  function advance(to, deliverEnded = true) {
    clock = to;
    if (deliverEnded) {
      for (const n of pending) if (n.stopAt <= clock) { pending.delete(n); if (n.onended) n.onended(); }
    }
    for (const tick of intervals) tick();
  }
  return { audio, nodes, advance, sandbox, events, native, warnings, get context() { return context; } };
}

test('mobile uses playback buffering, no convolver and a bounded lookahead', () => {
  const h = harness(); h.audio.music('forest'); h.audio.unlock(); h.advance(0);
  assert.equal(h.context.options.latencyHint, 'playback');
  assert.equal(h.nodes.filter(n => n.type === 'Convolver').length, 0);
  assert.ok(h.audio.debugState().sources.music > 0);
  assert.ok(h.audio.debugState().sources.music <= 48);
});

test('a 30-second main-thread stall skips missed notes instead of replaying a burst', () => {
  const h = harness(); h.audio.music('volcano'); h.audio.unlock();
  const previous = h.nodes.length;
  h.advance(30);
  const starts = h.nodes.slice(previous).filter(n => n.startAt !== undefined);
  assert.ok(starts.length > 0 && starts.length <= 48);
  assert.ok(starts.every(n => n.startAt >= 30), 'no sources scheduled in the past');
  assert.ok(h.audio.debugState().skippedSteps > 200);
  assert.deepEqual(h.warnings, []);
});

test('SFX budget counts long sounds until they end, not only their first 150ms', () => {
  const h = harness(); h.audio.unlock();
  for (let i = 0; i < 100; i++) h.audio.sfx('descend');
  assert.ok(h.audio.debugState().sources.sfx <= 24);
  assert.ok(h.audio.debugState().droppedVoices > 0);
  h.advance(0.2);
  assert.ok(h.audio.debugState().sources.sfx > 0, 'long sounds remain counted');
  h.advance(7);
  assert.equal(h.audio.debugState().sources.sfx, 0);
  assert.equal(h.audio.debugState().nodes, 0);
});

test('end events disconnect all source, envelope, filter, vibrato and reverb-send nodes', () => {
  for (const mobile of [true, false]) {
    const h = harness(mobile); h.audio.music('village'); h.audio.unlock();
    h.audio.sfx('rift'); h.audio.sfx('toll');
    h.audio.music(null); h.advance(8);
    assert.equal(h.audio.debugState().voices, 0);
    assert.equal(h.audio.debugState().nodes, 0);
    assert.equal(h.audio.debugState().retiredBuses, 0);
    // Only permanent buses/reverb/output may remain connected.
    assert.ok(h.nodes.filter(n => n.connections.size).length <= (mobile ? 4 : 6));
  }
});

test('cleanup works when the main thread delays source ended callbacks', () => {
  const h = harness(); h.audio.unlock(); h.audio.sfx('toll');
  h.advance(8, false);
  assert.equal(h.audio.debugState().voices, 0);
  assert.equal(h.audio.debugState().sources.sfx, 0);
});

test('rapid song changes retire at most two buses and preserve the requested track', () => {
  const h = harness(); h.audio.unlock();
  for (let i = 0; i < 100; i++) {
    h.audio.music(i % 2 ? 'forest' : 'boss');
    h.advance(i * 0.01);
    assert.ok(h.audio.debugState().retiredBuses <= 2);
  }
  assert.equal(h.audio.track, 'forest');
  h.audio.music(null); h.advance(8);
  assert.equal(h.audio.debugState().nodes, 0);
  assert.equal(h.audio.track, null);
});

test('muting or zero music volume stops synthesis; unmute skips backlog', () => {
  const h = harness(); h.audio.music('forest'); h.audio.unlock();
  h.audio.toggleMute();
  const previous = h.nodes.length;
  h.advance(60); h.audio.sfx('toll');
  assert.equal(h.nodes.length, previous);
  assert.equal(h.audio.debugState().voices, 0);
  h.audio.toggleMute(); h.advance(60.025);
  assert.ok(h.audio.debugState().sources.music > 0);
  h.audio.setVolume('music', 0);
  const after = h.nodes.length; h.advance(120);
  assert.equal(h.nodes.length, after);
  h.audio.sfx('coin'); assert.ok(h.audio.debugState().sources.sfx > 0);
});

test('background/foreground and interrupted audio recover without stacking contexts or notes', async () => {
  const h = harness(); h.audio.music('forest'); h.audio.unlock();
  const ctx = h.context;
  h.native.appStateChange({ isActive: false });
  assert.equal(ctx.state, 'suspended');
  assert.equal(h.audio.debugState().voices, 0);
  const previous = h.nodes.length; h.advance(25); h.audio.sfx('coin');
  assert.equal(h.nodes.length, previous);
  h.native.appStateChange({ isActive: true });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.audio.running, true);
  assert.equal(h.audio.track, 'forest');
  ctx.state = 'interrupted'; h.events.pointerup();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.context, ctx);
  assert.equal(h.audio.running, true);
  h.sandbox.document.hidden = true; h.events.visibilitychange();
  assert.equal(ctx.state, 'suspended');
  h.sandbox.document.hidden = false; h.events.visibilitychange();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(ctx.state, 'running');
});

test('ten simulated minutes of combat keep sources bounded and leave no temporary nodes', () => {
  const h = harness(); h.audio.music('forest'); h.audio.unlock();
  const songs = Object.keys(h.sandbox.G.MUSIC);
  const shots = ['beam', 'nova', 'melee', 'buff', 'aura', 'orbit', 'projectile'];
  let maxNodes = 0;
  for (let frame = 1; frame <= 6000; frame++) {
    const time = frame / 10;
    h.advance(time, frame % 30 !== 0);
    for (const kind of shots) h.audio.sfx('shot', { kind, type: 'fire' });
    for (const effect of ['hit', 'xp', 'coin', 'faint']) h.audio.sfx(effect);
    if (frame % 300 === 0) h.audio.music(songs[(frame / 300) % songs.length]);
    if (frame % 100 === 0) h.audio.sfx('toll');
    const state = h.audio.debugState(); maxNodes = Math.max(maxNodes, state.nodes);
    assert.ok(state.sources.music <= 48 && state.sources.sfx <= 24);
    assert.ok(state.sources.music >= 0 && state.sources.sfx >= 0);
    assert.ok(state.nodes < 450);
  }
  h.audio.music(null); h.advance(610);
  assert.equal(h.audio.debugState().nodes, 0);
  assert.deepEqual(h.warnings, []);
  console.log('Audio stress: peak live transient nodes =', maxNodes);
});

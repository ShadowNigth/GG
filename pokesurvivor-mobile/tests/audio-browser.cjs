// Web Audio real (no mocks): batalla intensa, bloqueos del hilo principal y reanudación.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  const options = { headless: true, args: ['--autoplay-policy=no-user-gesture-required'] };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
    options.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
    options.args.push('--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader');
  }
  const browser = await chromium.launch(options);
  try {
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Audio]')) errors.push(message.text()); });
    await page.setContent('<button id="play">Play</button>');
    await page.evaluate(() => {
      window.G = { U: { clamp: (v, lo, hi) => Math.min(hi, Math.max(lo, v)) } };
      const AC = window.AudioContext;
      window.AudioContext = class extends AC { constructor(opts) { super(opts); window.testAudioContext = this; } };
      window.Capacitor = { isNativePlatform: () => true, Plugins: { App: {
        async addListener(name, callback) { window.testAppState = callback; }
      } } };
    });
    for (const file of ['data/music.js', 'core/audio.js']) {
      await page.addScriptTag({ path: path.resolve(__dirname, '../www/js', file) });
    }
    await page.click('#play');
    const result = await page.evaluate(async () => {
      const audio = G.Audio;
      audio.setVolume('music', 1); audio.setVolume('sfx', 1);
      audio.music('forest'); audio.unlock();
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
      const shots = ['beam', 'nova', 'melee', 'buff', 'aura', 'orbit'];
      let i = 0, maxMusic = 0, maxSfx = 0, maxNodes = 0;
      const fire = setInterval(() => {
        for (const kind of shots) audio.sfx('shot', { kind, type: 'electric' });
        for (const effect of ['hit', 'xp', 'coin', 'faint']) audio.sfx(effect);
        if (++i % 20 === 0) for (const effect of ['toll', 'land', 'rift']) audio.sfx(effect);
        const state = audio.debugState();
        maxMusic = Math.max(maxMusic, state.sources.music);
        maxSfx = Math.max(maxSfx, state.sources.sfx);
        maxNodes = Math.max(maxNodes, state.nodes);
      }, 60);
      const levels = [];
      for (const song of ['forest', 'boss', 'volcano', 'village']) {
        audio.music(song);
        await wait(6000);
        // El reloj de audio continúa durante un frame extremadamente lento.
        const end = performance.now() + 850;
        while (performance.now() < end) { /* simular carga/renderizado */ }
        levels.push(await audio.debugMeter(1500));
      }
      clearInterval(fire);
      testAppState({ isActive: false }); await wait(150);
      const hidden = audio.debugState();
      testAppState({ isActive: true }); await wait(300);
      const resumed = audio.debugState();
      const after = await audio.debugMeter(1800);
      audio.music(null); await wait(6500);
      return { maxMusic, maxSfx, maxNodes, levels, hidden, resumed, after, final: audio.debugState() };
    });
    assert.deepEqual(errors, []);
    assert.ok(result.maxMusic > 0 && result.maxMusic <= 48);
    assert.ok(result.maxSfx > 0 && result.maxSfx <= 24);
    assert.ok(result.maxNodes < 450);
    assert.ok(result.final.skippedSteps > 0);
    for (const level of [...result.levels, result.after]) {
      assert.ok(level.rms > 0.001, 'audio must still be audible after stress and resume');
      assert.ok(level.peak < 1, 'compressed output must not clip');
    }
    assert.equal(result.hidden.state, 'suspended');
    assert.equal(result.hidden.voices, 0);
    assert.equal(result.resumed.state, 'running');
    assert.equal(result.final.nodes, 0);
    assert.equal(result.final.retiredBuses, 0);
    console.log('Real Web Audio stress OK:', JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

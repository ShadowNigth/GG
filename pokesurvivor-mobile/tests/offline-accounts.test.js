const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto, createHash } = require('node:crypto');
const www = path.resolve(__dirname, '../www');

function storage() {
  const values = new Map();
  return {
    values, fail: () => false,
    getItem(k) { if (this.fail(k, 'read')) throw Error('blocked'); return values.get(k) ?? null; },
    setItem(k, v) { if (this.fail(k, 'write')) throw Error('full'); values.set(k, v); },
    removeItem(k) { if (this.fail(k, 'remove')) throw Error('blocked'); values.delete(k); },
    key(i) { return [...values.keys()][i]; },
    get length() { return values.size; }
  };
}
function boot(localStorage = storage()) {
  const events = {}, nativeEvents = {};
  const noNetwork = () => { throw Error('Unexpected network/SDK access'); };
  const context = {
    console, crypto: webcrypto, TextEncoder, Uint8Array, Date,
    setTimeout, clearTimeout, G: {}, localStorage,
    location: { protocol: 'https:' }, fetch: noNetwork,
    addEventListener: (name, fn) => { events[name] = fn; },
    document: { hidden: false, createElement: noNetwork,
      addEventListener: (name, fn) => { events[name] = fn; } },
    Capacitor: { Plugins: { App: { async addListener(name, fn) { nativeEvents[name] = fn; } } } }
  };
  context.window = context;
  vm.createContext(context);
  for (const file of ['core/firebase-config.js', 'core/db.js']) {
    vm.runInContext(fs.readFileSync(path.join(www, 'js', file), 'utf8'), context, { filename: file });
  }
  return { db: context.G.DB, context, localStorage, events, nativeEvents };
}

test('cold start is immediately local; never loads Firebase, even with a cloud config', async () => {
  const { db, context } = boot();
  context.G.FIREBASE_CONFIG = { apiKey: 'test', projectId: 'test' };
  assert.equal(await db.ready(), false);
  assert.equal(db.mode, 'local');
  assert.equal(db.localReason, 'offline-app');
  assert.equal(db.fb, null);
  assert.equal(db.online, false);
  assert.equal((await db.loginWithGoogle()).ok, false);
});

test('create, save collection/currency/progress, restart and restore without network', async () => {
  const a = boot(); await a.db.ready();
  assert.equal((await a.db.register('Entrenador', 'clave123')).ok, true);
  a.db.grant(25, 'starter'); a.db.grantShiny(4, 'gacha');
  Object.assign(a.db.save, { coins: 321, partner: 25, starter: 25 });
  a.db.save.stats.runs = 5;
  a.db.save.pupg[25] = { hp: 2 };
  assert.equal(a.db.commit(), true);
  const record = JSON.parse(a.localStorage.getItem('ps.accounts')).entrenador;
  assert.equal(record.algorithm, 'pbkdf2-sha256');
  assert.notEqual(record.hash, 'clave123');
  assert.ok(record.salt);
  assert.equal(JSON.stringify([...a.localStorage.values.values()]).includes('clave123'), false);
  const b = boot(a.localStorage);
  assert.equal(await b.db.ready(), true);
  assert.equal(b.db.user, 'Entrenador');
  assert.equal(b.db.save.coins, 321);
  assert.equal(b.db.save.stats.runs, 5);
  assert.equal(b.db.save.pupg[25].hp, 2);
  assert.equal(b.db.owns(25), true);
  assert.equal(b.db.ownsShiny(4), true);
  assert.equal(b.db.online, false);
  await b.db.logout();
  assert.equal(b.localStorage.getItem('ps.session'), null);
  const c = boot(a.localStorage); assert.equal(await c.db.ready(), false);
  assert.equal((await c.db.login('ENTRENADOR', 'incorrecta')).ok, false);
  assert.equal(c.db.loggedIn, false);
  assert.equal((await c.db.login('ENTRENADOR', 'clave123')).ok, true);
  assert.equal(c.db.save.coins, 321);
});

test('independent accounts, duplicate names, validation and prototype-like names', async () => {
  const { db } = boot(); await db.ready();
  assert.equal((await db.register('ab', '1234')).ok, false);
  assert.equal((await db.register('Trainer', '123')).ok, false);
  assert.equal((await db.register('Trainer', '1234')).ok, true);
  db.save.coins = 900; db.commit(); await db.logout();
  assert.equal((await db.register('TRAINER', '5678')).ok, false);
  assert.equal((await db.register('__proto__', '5678')).ok, true);
  assert.equal(db.save.coins, 500);
  await db.logout();
  assert.equal((await db.login('__proto__', '5678')).ok, true);
  await db.logout();
  assert.equal((await db.login('Trainer', '1234')).ok, true);
  assert.equal(db.save.coins, 900);
});

test('guest never persists a save and leaves existing accounts intact', async () => {
  const { db, localStorage } = boot(); await db.ready();
  await db.register('Local', '1234'); db.save.coins = 777; db.commit(); await db.logout();
  db.playAsGuest(); db.save.coins = 99999;
  assert.equal(db.commit(), false);
  assert.equal(db.guest, true);
  const b = boot(localStorage); assert.equal(await b.db.ready(), false);
  await b.db.login('Local', '1234'); assert.equal(b.db.save.coins, 777);
});

test('delete requires password and only deletes the current account', async () => {
  const { db, localStorage } = boot(); await db.ready();
  await db.register('Keep', '1234'); await db.logout();
  await db.register('Delete', '5678');
  assert.equal(db.nameAccount, true);
  assert.equal((await db.deleteAccount('wrong')).ok, false);
  assert.equal(db.loggedIn, true);
  assert.equal((await db.deleteAccount('5678')).ok, true);
  assert.equal(db.loggedIn, false);
  assert.equal(localStorage.getItem('ps.save.delete'), null);
  const b = boot(localStorage); assert.equal(await b.db.ready(), false);
  assert.equal((await b.db.login('Delete', '5678')).ok, false);
  assert.equal((await b.db.login('Keep', '1234')).ok, true);
});

test('backgrounding and pagehide commit the local save', async () => {
  const a = boot(); await a.db.ready(); await a.db.register('Trainer', '1234');
  a.db.save.coins = 650; a.context.document.hidden = true; a.events.visibilitychange();
  assert.equal(JSON.parse(a.localStorage.getItem('ps.save.trainer')).coins, 650);
  a.db.save.coins = 750; a.nativeEvents.appStateChange({ isActive: false });
  assert.equal(JSON.parse(a.localStorage.getItem('ps.save.trainer')).coins, 750);
  a.db.save.coins = 850; a.events.pagehide();
  assert.equal(JSON.parse(a.localStorage.getItem('ps.save.trainer')).coins, 850);
});

for (const failedKey of ['ps.accounts', 'ps.save.trainer', 'ps.session']) {
  test(`failed creation (${failedKey}) does not pretend the account was saved`, async () => {
    const a = boot(); await a.db.ready();
    a.localStorage.fail = (key, op) => key === failedKey && op === 'write';
    assert.equal((await a.db.register('Trainer', '1234')).ok, false);
    assert.equal(a.db.loggedIn, false);
    a.localStorage.fail = () => false;
    assert.equal((await a.db.register('Trainer', '1234')).ok, true);
  });
}

test('failed progress save is visible and can be retried', async () => {
  const a = boot(); await a.db.ready(); await a.db.register('Trainer', '1234');
  a.localStorage.fail = (_, op) => op === 'write';
  a.db.save.coins = 999;
  assert.equal(a.db.commit(), false);
  assert.equal(a.db.syncState, 'error');
  a.localStorage.fail = () => false;
  assert.equal(a.db.commit(), true);
  assert.equal(a.db.syncState, 'local');
});

test('corrupt save is not silently replaced on login', async () => {
  const a = boot(); await a.db.ready(); await a.db.register('Trainer', '1234'); await a.db.logout();
  a.localStorage.setItem('ps.save.trainer', '{bad json');
  assert.equal((await a.db.login('Trainer', '1234')).ok, false);
  assert.equal(a.localStorage.getItem('ps.save.trainer'), '{bad json');
});

test('existing local SHA-256 accounts still work; cloud data is not erased', async () => {
  const a = boot(), salt = 'old-salt';
  a.localStorage.setItem('ps.accounts', JSON.stringify({ legacy: {
    name: 'Legacy', salt, hash: createHash('sha256').update(salt + ':1234').digest('hex'), created: 1
  } }));
  a.localStorage.setItem('ps.cloud.old-uid', '{"coins":800}');
  await a.db.ready();
  assert.equal((await a.db.login('Legacy', '1234')).ok, true);
  assert.equal(a.localStorage.getItem('ps.cloud.old-uid'), '{"coins":800}');
});

test('packaged page retains native bridge and offline privacy text', () => {
  const html = fs.readFileSync(path.join(www, 'index.html'), 'utf8');
  assert.match(html, /js\/capacitor-bridge.js/);
  assert.match(html, /Crear cuenta offline/);
  assert.match(html, /Privacidad — edición offline/);
  assert.doesNotMatch(html, /rel="preconnect"/);
  const manifest = fs.readFileSync(path.resolve(www, '../android/app/src/main/AndroidManifest.xml'), 'utf8');
  assert.match(manifest, /android.permission.INTERNET" tools:node="remove"/);
  assert.match(manifest, /android:allowBackup="false"/);
});

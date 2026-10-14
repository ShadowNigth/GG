// Smoke test de la página de producción con todas las peticiones externas bloqueadas.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const www = path.resolve(__dirname, '../www');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(www, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(www + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, content) => {
    if (err) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(content);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ps-offline-'));
  const options = { headless: true, viewport: { width: 1100, height: 740 }, locale: 'es-AR' };
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
    options.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
    options.args = ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader'];
  }
  let context;
  const remote = [], errors = [];
  async function open() {
    context = await chromium.launchPersistentContext(profile, options);
    await context.route('**/*', route => {
      if (new URL(route.request().url()).origin !== origin) {
        remote.push(route.request().url()); return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(origin);
    await page.locator('#tap-start:not(.hidden)').click();
    await page.waitForFunction(() => document.querySelector('#boot').classList.contains('hidden'));
    return page;
  }
  try {
    let page = await open();
    await page.locator('#scr-login:not(.hidden)').waitFor();
    await page.locator('[data-tab="register"]').click();
    await page.locator('#f-user').fill('OfflineUser');
    await page.locator('#f-pass').fill('offline1234');
    await page.locator('#btn-auth').click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('ps.session')) === 'offlineuser');
    assert.equal(await page.locator('#btn-google').isVisible(), false);
    assert.match(await page.locator('#login-mode').textContent(), /sin internet ni servidor/);
    // Completa el flujo real de creación para llegar al menú, no sólo al login.
    await page.locator('#scr-test:not(.hidden)').waitFor();
    for (let question = 0; question < 30 && await page.locator('#scr-test').isVisible(); question++) {
      await page.locator('#test-a .answer').first().click();
    }
    await page.locator('#res-ok').click();
    await page.locator('#scr-menu:not(.hidden)').waitFor();
    const removed = '#btn-news, #btn-support, #btn-full, #scr-menu [data-go="friends"], #scr-menu [data-go="rank"]';
    for (const viewport of [{ width: 1100, height: 740 }, { width: 915, height: 412 }]) {
      await page.setViewportSize(viewport);
      assert.equal(await page.locator(removed).count(), 0, 'removed actions must not leave hidden buttons');
      assert.deepEqual(await page.locator('#scr-menu [data-go]').evaluateAll(buttons => buttons.map(b => b.dataset.go)),
        ['play', 'dex', 'upgrades', 'gacha', 'goals', 'settings']);
      for (const id of ['btn-sound', 'btn-settings', 'btn-logout']) assert.equal(await page.locator('#' + id).isVisible(), true);
      await page.locator('#scr-menu [data-go="settings"]').click();
      await page.locator('#set-tabs [data-t="gfx"]').click();
      assert.equal(await page.locator('#set-full').count(), 0);
      assert.equal(await page.locator('#set-body').getByText('Pantalla completa', { exact: true }).count(), 0);
      assert.ok(await page.locator('#set-body [data-k="quality"]').count() > 0);
      await page.locator('#set-close').click();
      await page.locator('#scr-menu [data-go="dex"]').click();
      await page.locator('#scr-dex:not(.hidden)').waitFor();
      await page.locator('#scr-dex [data-back]').click();
      await page.locator('#scr-menu:not(.hidden)').waitFor();
    }
    await page.locator('#btn-sound').click();
    assert.equal(await page.locator('#sound-panel').isVisible(), true);
    await page.locator('#btn-sound').click();
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('ps.save.offlineuser')));
    assert.ok(before.partner, 'starter selected and saved');
    // Cierra todo el navegador, no sólo recarga la página: el perfil persiste en disco.
    await context.close(); context = null;
    page = await open();
    assert.equal(await page.locator('#scr-login').isVisible(), false);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('ps.session'))), 'offlineuser');
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('ps.save.offlineuser')));
    delete before.updated; delete after.updated;
    assert.deepEqual(after, before);
    await page.locator('#scr-menu:not(.hidden)').waitFor();
    assert.equal(await page.locator(removed).count(), 0);
    assert.deepEqual(remote, []);
    assert.deepEqual(errors, []);
    console.log('OK: cuenta creada y restaurada tras cerrar el navegador; menú offline comprobado en escritorio/móvil, cero conexiones externas y errores JS.');
  } finally {
    if (context) await context.close();
    server.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });

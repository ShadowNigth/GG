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
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('ps.save.offlineuser')));
    assert.equal(before.coins, 500);
    // Cierra todo el navegador, no sólo recarga la página: el perfil persiste en disco.
    await context.close(); context = null;
    page = await open();
    assert.equal(await page.locator('#scr-login').isVisible(), false);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('ps.session'))), 'offlineuser');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('ps.save.offlineuser'))), before);
    assert.deepEqual(remote, []);
    assert.deepEqual(errors, []);
    console.log('OK: cuenta creada y restaurada tras cerrar el navegador; cero conexiones externas y errores JS.');
  } finally {
    if (context) await context.close();
    server.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });

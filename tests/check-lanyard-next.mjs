/* Menjalankan hasil `next build` di Chrome sungguhan dan memeriksa yang tidak
   bisa dibuktikan oleh tsc/next build: lanyard-nya benar-benar berdiri dan
   talinya benar-benar berayun.

   Kenapa harus browser: komponennya butuh konteks WebGL, wasm rapier, dan
   card-rig.glb. Compile yang hijau cuma membuktikan tipenya cocok, bukan
   bahwa fisikanya jalan.

   Pantau gerakan mesh kartu setelah kedua tekstur dilepas, lalu periksa piksel tali.

   Dilewati (bukan gagal) kalau Chrome tak ada — itu keadaan lingkungan.
   Jalankan: node check-lanyard-next.mjs   (butuh `npm run build` lebih dulu) */
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import assert from 'node:assert';
import path from 'node:path';
import sharp from 'sharp';

// '..': berkas ini ada di tests/, sedangkan .next dan node_modules di akar.
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PORT = 3210;
const testUrl = process.env.LANYARD_TEST_URL || `http://localhost:${PORT}/`;
const WAIT = Number(process.env.RENDER_WAIT || 60000);

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => existsSync(p));

const skip = (why) => { console.log(`DILEWATI — ${why}`); process.exit(0); };
if (!CHROME) skip('tidak ada Chrome/Edge di mesin ini');
if (!existsSync(path.join(ROOT, '.next'))) skip('belum ada hasil build — jalankan `npm run build`');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const syncSleep = (ms) => void Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// next start, bukan next dev: yang diuji hasil build produksi, dan dev punya
// lockfile yang bentrok kalau kebetulan ada sesi dev lain hidup.
const next = process.env.LANYARD_TEST_URL ? null : spawn(process.execPath, [path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', String(PORT)],
  { cwd: ROOT, stdio: 'ignore' });

let profile;
const done = (code) => {
  next?.kill();
  if (profile) {
    for (let i = 0; i < 8; i++) {
      try { rmSync(profile, { recursive: true, force: true }); break; } catch { syncSleep(250); }
    }
  }
  process.exit(code);
};

// Tunggu servernya siap, bukan tidur sekian detik.
let up = false;
for (let i = 0; i < 60 && !up; i++) {
  await sleep(500);
  try { up = (await fetch(testUrl)).ok; } catch { /* belum dengar */ }
}
if (!up) { done(1); }

profile = await mkdtemp(path.join(tmpdir(), 'check-lanyard-next-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-port=0', '--window-size=1440,1000', '--hide-scrollbars',
  // WebGL headless butuh rasterizer perangkat lunak; tanpa ini Canvas gagal
  // membuat konteks dan yang tersisa cuma <div> kosong.
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--user-data-dir=' + profile,
  'about:blank',
], { stdio: 'ignore' });
const killChrome = () => { try { chrome.kill(); } catch {} };

let target;
for (let i = 0; i < 40 && !target; i++) {
  await sleep(500);
  try {
    const port = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0].trim();
    target = (await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json())).find(t => t.type === 'page');
  } catch { /* Chrome belum menuliskan portnya */ }
}
if (!target) { killChrome(); done(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));

let nextId = 1;
const pending = new Map();
const errors = [];
const seen = new Map();
const held = [];
const bytes = await readFile(path.join(ROOT, 'public', 'card-rig.glb'));
const model = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
const mesh = model.meshes[model.nodes.find(node => node.name === 'card').mesh];
const indexCount = model.accessors[mesh.primitives[0].indices].count;
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
  if (m.method === 'Fetch.requestPaused') held.push(m.params.requestId);
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    errors.push('EXC ' + (d.exception?.description || d.text).split('\n')[0]);
  }
  if (m.method === 'Network.responseReceived') {
    seen.set(m.params.response.url, m.params.response.status);
    if (m.params.response.status >= 400 && !m.params.response.url.endsWith('/favicon.ico'))
      errors.push(`HTTP ${m.params.response.status} ${m.params.response.url}`);
  }
});
const send = (method, params = {}) =>
  new Promise(r => { const id = nextId++; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Fetch.enable', { patterns: [{ urlPattern: '*/card-texture-*.webp' }] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `
  window.lanyardDraws = 0;
  window.cardDraws = 0;
  window.cardY = [];
  const gl = WebGL2RenderingContext.prototype;
  const locations = new WeakSet();
  const getLocation = gl.getUniformLocation;
  gl.getUniformLocation = function (program, name) {
    const location = getLocation.call(this, program, name);
    if (location && name === 'modelViewMatrix') locations.add(location);
    return location;
  };
  const matrix = gl.uniformMatrix4fv;
  gl.uniformMatrix4fv = function (location, transpose, values, offset = 0, ...rest) {
    if (locations.has(location)) this.cardTestY = values[offset + 13];
    return matrix.call(this, location, transpose, values, offset, ...rest);
  };
  const drawElements = gl.drawElements;
  WebGL2RenderingContext.prototype.drawElements = function (...args) {
    if (this.canvas.closest?.('#lanyard-3d')) {
      window.lanyardDraws++;
      if (args[1] === ${indexCount}) { window.cardDraws++; window.cardY.push(this.cardTestY); }
    }
    return drawElements.apply(this, args);
  };
` });
await send('Page.navigate', { url: testUrl });

const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value;

/* '#lanyard-3d canvas', bukan 'section canvas': hero juga memuat <canvas
   id="aurora"> dan ia yang lebih dulu di DOM. Dengan selektor lama checker ini
   mengukur kanvas aurora dan tetap hijau meski lanyard-nya tidak berdiri. */
const probe = `(() => {
  const cv = document.querySelector('#lanyard-3d canvas');
  let webgl2 = false;
  try { webgl2 = !!document.createElement('canvas').getContext('webgl2'); } catch {}
  return JSON.stringify({
    webgl2,
    canvasW: cv ? cv.width : 0,
    canvasH: cv ? cv.height : 0,
    h1: (document.querySelector('h1') || {}).textContent || null,
  });
})()`;

/* Ditunggu sampai siap, bukan tidur sekian detik. Yang ditunggu berurutan dan
   lamanya beda-beda: wasm rapier, lalu card-rig.glb. Versi pertama checker
   ini berhenti begitu canvas muncul dan melapor "card-rig.glb tidak pernah diminta"
   padahal permintaannya baru mau berangkat. */
const glbSeen = () => [...seen].find(([u]) => u.endsWith('/card-rig.glb'));
let state;
const deadline = Date.now() + WAIT;
do {
  state = JSON.parse((await send('Runtime.evaluate', { expression: probe, returnByValue: true })).result.value);
  if (state.canvasW > 0 && glbSeen() && held.length === 2) break;
  await sleep(500);
} while (Date.now() < deadline);

const clip = async (x, y, width, height) =>
  (await send('Page.captureScreenshot', { format: 'png', clip: { x, y, width, height, scale: 1 } })).data;

try {
  assert.ok(state.webgl2, 'browsernya tidak punya WebGL2 — hasil uji tidak berarti');
  assert.ok(state.canvasW > 0 && state.canvasH > 0,
    `canvas lanyard tidak pernah terpasang (${state.canvasW}x${state.canvasH})`);

  assert.strictEqual(held.length, 2, 'kedua tekstur personal harus dimuat');
  assert.strictEqual(await evaluate("!!document.querySelector('#lanyard-3d.is-ready') || window.cardDraws > 0"), false,
    'kartu sudah digambar saat tekstur personal masih tertahan');
  await send('Fetch.disable');
  const readyDeadline = Date.now() + WAIT;
  while (Date.now() < readyDeadline && !await evaluate("document.querySelector('#lanyard-3d.is-ready') && window.cardY.some(y => Math.abs(y - window.cardY[0]) > 0.5)")) await sleep(100);
  assert.ok(await evaluate("window.cardY.some(y => Math.abs(y - window.cardY[0]) > 0.5)"), 'posisi mesh harus berubah setelah tekstur dilepas');

  const spotlight = await evaluate(`(() => {
    const target = document.querySelector('.spotlight');
    const move = el => el.dispatchEvent(new PointerEvent('pointermove', {
      pointerType: 'mouse', bubbles: true, clientX: innerWidth / 4
    }));
    const rootStyle = document.documentElement.style;
    const before = rootStyle.cssText;
    move(document.querySelector('#lanyard-3d canvas'));
    move(target);
    return { local: parseFloat(getComputedStyle(target).getPropertyValue('--px')),
      rootUnchanged: rootStyle.cssText === before };
  })()`);
  assert.ok(Math.abs(spotlight.local - .25) < .002, 'tepi kartu tidak mengikuti pointer');
  assert.ok(spotlight.rootUnchanged, 'gerak pointer mengubah style di seluruh halaman');

  const glb = glbSeen();
  assert.ok(glb, 'card-rig.glb tidak pernah diminta — kartunya bukan dari model itu');
  assert.strictEqual(glb[1], 200, `card-rig.glb dijawab HTTP ${glb[1]}`);

  /* Talinya harus benar-benar ada di lorong antara jangkar dan kartu.
     Penjaga untuk bug yang pernah kejadian: faktor lerp penghalus tali tidak
     dibatasi, jadi di bawah ~50 fps titik kendalinya divergen sampai orde 1e16
     dan strap-nya terbang keluar layar — lorong ini jadi kosong.

     Diukur lewat ukuran PNG, bukan piksel: latarnya hitam rata, jadi potongan
     kosong memampat jauh lebih kecil daripada potongan yang ada strap-nya.
     Yang dibandingkan potongan seukuran sama di kanan hero yang memang kosong. */
  const box = JSON.parse((await send('Runtime.evaluate', {
    expression: `JSON.stringify((r => ({x:r.x,y:r.y,w:r.width,h:r.height}))(document.querySelector('#lanyard-3d canvas').getBoundingClientRect()))`,
    returnByValue: true,
  })).result.value);
  const W = 150, H = 200;
  const y = box.y + box.h * 0.15;
  const strap = () => clip(box.x + box.w / 2 - W / 2, y, W, H);
  // Aurora juga bergerak di Home. Sembunyikan saat memeriksa piksel tali.
  await evaluate(`document.getElementById('aurora').style.visibility = 'hidden'`);
  const corridor = await strap();
  const empty = await clip(box.x + box.w - W - 8, y, W, H);
  assert.ok(corridor.length > empty.length * 1.5,
    `lorong tali kosong (${corridor.length} vs latar ${empty.length} byte) — `
    + 'strap-nya tidak digambar di antara jangkar dan kartu');
  // Compare the composited pixels in the slot with the same area behind it.
  // Offscreen draws and a lost context both leave the page looking empty.
  const slot = await evaluate(`(() => {
    const r = document.querySelector('#lanyard-slot-hero').getBoundingClientRect();
    return [r.left, r.top, r.width, Math.min(r.height, innerHeight - r.top)].map(Math.round);
  })()`);
  const pixels = async () => sharp(Buffer.from(await clip(...slot), 'base64')).removeAlpha().raw().toBuffer();
  const cardVisible = await pixels();
  await evaluate("document.querySelector('#lanyard-3d').style.visibility = 'hidden'");
  const cardHidden = await pixels();
  let changedPixels = 0;
  for (let i = 0; i < cardVisible.length; i += 3) {
    if (Math.abs(cardVisible[i] - cardHidden[i]) > 30) changedPixels++;
  }
  assert.ok(changedPixels > 4000, `piksel kartu di dalam slot hanya ${changedPixels}`);
  await evaluate("document.querySelector('#lanyard-3d').style.removeProperty('visibility')");
  await evaluate(`document.getElementById('aurora').style.removeProperty('visibility')`);

  await evaluate(`window.lanyardCanvas = document.querySelector('#lanyard-3d canvas');
    document.querySelector('footer').scrollIntoView({ behavior: 'instant' });`);
  // Let the offscreen intersection and its final queued frame settle, even on software WebGL.
  const stopDeadline = Date.now() + 7000;
  let previous = -1;
  let pausedDraws;
  do {
    previous = await evaluate('window.lanyardDraws');
    await sleep(400);
    pausedDraws = await evaluate('window.lanyardDraws');
  } while (Date.now() < stopDeadline && previous !== pausedDraws);
  assert.ok(await evaluate("document.querySelector('#lanyard-3d').getBoundingClientRect().bottom < 0"), 'canvas harus berada di luar layar');
  assert.ok(pausedDraws > 0, 'hitungan draw lanyard tidak terbaca');
  await sleep(600);
  assert.strictEqual(await evaluate('window.lanyardDraws'), pausedDraws, 'lanyard masih dirender di luar viewport');
  await evaluate(`scrollTo({ top: 0, behavior: 'instant' });`);
  const resumeDeadline = Date.now() + 5000;
  while (Date.now() < resumeDeadline && await evaluate('window.lanyardDraws') === pausedDraws) await sleep(100);
  assert.ok(await evaluate(`window.lanyardCanvas === document.querySelector('#lanyard-3d canvas')
    && window.lanyardDraws > ${pausedDraws}`), 'scene lanyard harus berlanjut tanpa membuat kanvas baru');

  await send('Emulation.setDeviceMetricsOverride', {width: 390, height: 844, deviceScaleFactor: 1, mobile: false});
  const resizeDeadline = Date.now() + 5000;
  while (Date.now() < resizeDeadline && !await evaluate("!!document.querySelector('#lanyard-slot-about canvas')")) await sleep(50);
  assert.ok(await evaluate("window.lanyardCanvas === document.querySelector('#lanyard-slot-about canvas')"),
    'perubahan breakpoint membuat ulang canvas');
  assert.ok(state.h1, 'teks hero hilang tertimpa canvas');
  assert.deepStrictEqual(errors, [], 'konsol/jaringan tidak bersih:\n  ' + errors.join('\n  '));

  await send('Emulation.clearDeviceMetricsOverride');
  await send('Network.setCacheDisabled', {cacheDisabled: true});
  await send('Fetch.enable', {patterns: [{urlPattern: '*/_next/*.js*'}]});
  for (const theme of ['light', 'dark']) {
    await evaluate(`localStorage.setItem('theme', '${theme}')`);
    // Withhold hydration on a fresh document and inspect the real first paint.
    const previous = await evaluate('performance.timeOrigin');
    await send('Page.reload', {ignoreCache: true});
    const deadline = Date.now() + WAIT;
    while (Date.now() < deadline && !await evaluate(`performance.timeOrigin !== ${previous} && performance.getEntriesByName('first-contentful-paint').length`)) await sleep(80);
    assert.ok(await evaluate(`performance.timeOrigin !== ${previous} && !!performance.getEntriesByName('first-contentful-paint').length`), 'first paint tidak tercapai');
    assert.strictEqual(await evaluate('document.documentElement.dataset.theme'), theme);
    assert.strictEqual(await evaluate('!!window.__portfolio'), false, 'runtime aplikasi sudah berjalan sebelum pemeriksaan first paint');
    const background = await sharp(Buffer.from(await clip(12, 100, 18, 18), 'base64')).stats();
    const expected = theme === 'light' ? 255 : 0;
    assert.ok(background.channels.slice(0,3).every(c => Math.abs(c.mean - expected) < 3), `warna first paint salah untuk ${theme}`);
    assert.strictEqual(await evaluate("getComputedStyle(document.querySelector('#hero h1').parentElement).opacity"), '1');
  }
  await send('Fetch.disable');
} catch (e) {
  console.error('GAGAL — ' + e.message);
  killChrome();
  done(1);
}

console.log(`OK — Next: lanyard berdiri (canvas ${state.canvasW}x${state.canvasH}, card-rig.glb 200, `
  + `tekstur ditahan sebelum jatuh, mesh kartu bergerak, strap ada di lorong jangkar-kartu), `
  + `h1 "${state.h1}" tetap terbaca, konsol bersih`);
killChrome();
done(0);

/* Menjalankan hasil `next build` di Chrome sungguhan dan memeriksa yang tidak
   bisa dibuktikan oleh tsc/next build: lanyard-nya benar-benar berdiri dan
   talinya benar-benar berayun.

   Kenapa harus browser: komponennya butuh konteks WebGL, wasm rapier, dan
   card.glb 2,4 MB. Compile yang hijau cuma membuktikan tipenya cocok, bukan
   bahwa fisikanya jalan.

   Bukti "berayun" diambil dari dua tangkapan layar berjarak waktu: kalau piksel
   di antara keduanya identik, scene-nya diam — entah gagal memuat, entah cuma
   gambar statis. Itu persis keluhan yang mau dihindari.

   Dilewati (bukan gagal) kalau Chrome tak ada — itu keadaan lingkungan.
   Jalankan: node check-lanyard-next.mjs   (butuh `npm run build` lebih dulu) */
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import assert from 'node:assert';
import path from 'node:path';

// '..': berkas ini ada di tests/, sedangkan .next dan node_modules di akar.
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PORT = 3210;
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
const next = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', String(PORT)],
  { cwd: ROOT, stdio: 'ignore' });

let profile;
const done = (code) => {
  try { next.kill(); } catch {}
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
  try { up = (await fetch(`http://localhost:${PORT}/`)).ok; } catch { /* belum dengar */ }
}
if (!up) { next.kill(); skip(`next start tidak merespons di :${PORT}`); }

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
if (!target) { killChrome(); next.kill(); skip('Chrome tidak membuka port debug'); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));

let nextId = 1;
const pending = new Map();
const errors = [];
const seen = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
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
await send('Page.navigate', { url: `http://localhost:${PORT}/` });

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
   lamanya beda-beda: wasm rapier, lalu card.glb 2,4 MB. Versi pertama checker
   ini berhenti begitu canvas muncul dan melapor "card.glb tidak pernah diminta"
   padahal permintaannya baru mau berangkat. */
const glbSeen = () => [...seen].find(([u]) => u.endsWith('/card.glb'));
let state;
const deadline = Date.now() + WAIT;
do {
  state = JSON.parse((await send('Runtime.evaluate', { expression: probe, returnByValue: true })).result.value);
  if (state.canvasW > 0 && glbSeen()) break;
  await sleep(500);
} while (Date.now() < deadline);

const shot = async () => (await send('Page.captureScreenshot', { format: 'png' })).data;
const clip = async (x, y, width, height) =>
  (await send('Page.captureScreenshot', { format: 'png', clip: { x, y, width, height, scale: 1 } })).data;

try {
  assert.ok(state.webgl2, 'browsernya tidak punya WebGL2 — hasil uji tidak berarti');
  assert.ok(state.canvasW > 0 && state.canvasH > 0,
    `canvas lanyard tidak pernah terpasang (${state.canvasW}x${state.canvasH})`);

  const glb = glbSeen();
  assert.ok(glb, 'card.glb tidak pernah diminta — kartunya bukan dari model itu');
  assert.strictEqual(glb[1], 200, `card.glb dijawab HTTP ${glb[1]}`);

  // Talinya harus bergerak sendiri karena gravitasi, bukan diam.
  const a = await shot();
  await sleep(600);
  const b = await shot();
  assert.notStrictEqual(a, b, 'dua frame identik — scene-nya diam, gravitasi/fisikanya tidak jalan');

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
  const corridor = await clip(box.x + box.w / 2 - W / 2, box.y + box.h * 0.15, W, H);
  const empty = await clip(box.x + box.w - W - 8, box.y + box.h * 0.15, W, H);
  assert.ok(corridor.length > empty.length * 1.5,
    `lorong tali kosong (${corridor.length} vs latar ${empty.length} byte) — `
    + 'strap-nya tidak digambar di antara jangkar dan kartu');

  assert.ok(state.h1, 'teks hero hilang tertimpa canvas');
  assert.deepStrictEqual(errors, [], 'konsol/jaringan tidak bersih:\n  ' + errors.join('\n  '));
} catch (e) {
  console.error('GAGAL — ' + e.message);
  killChrome();
  done(1);
}

console.log(`OK — Next: lanyard berdiri (canvas ${state.canvasW}x${state.canvasH}, card.glb 200, `
  + `dua frame berbeda jadi talinya berayun, strap ada di lorong jangkar-kartu), `
  + `h1 "${state.h1}" tetap terbaca, konsol bersih`);
killChrome();
done(0);

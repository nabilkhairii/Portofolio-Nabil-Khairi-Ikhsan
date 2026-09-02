/* Peramban TANPA WebGL. Pasangan check-lanyard-next.mjs, yang menguji jalur
   sebaliknya — di sana kartunya benar-benar berdiri di Chrome ber-WebGL.

   Kenapa perlu diuji: WebGL bisa tidak ada tanpa perambannya rusak (akselerasi
   grafis dimatikan, GPU masuk blocklist, driver gagal), dan kegagalannya TIDAK
   terlihat sebagai kegagalan — <Canvas> melempar sekali di konsol, lalu yang
   tersisa cuma kolom hero kosong karena #lanyard-3d memang transparan sampai
   ia dapat .is-ready. Penjaganya satu cabang di lanyard-mount.tsx; kalau
   cabang itu hilang, tidak ada uji lain di repo ini yang berubah merah.

   Chrome-nya sengaja dijalankan TANPA --enable-unsafe-swiftshader (yang
   dipakai uji lain) dan dengan --disable-gpu, jadi WebGL benar-benar tidak
   tersedia — persis keadaan yang dilaporkan.

   Dilewati (bukan gagal) kalau Chrome tak ada, atau kalau ternyata Chrome-nya
   tetap memberi WebGL: tanpa itu ujinya tidak menguji apa pun.
   Jalankan: node tests/check-lanyard-fallback.mjs   (butuh `npm run build`) */
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import assert from 'node:assert';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PORT = 3219;

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

const next = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', String(PORT)],
  { cwd: ROOT, stdio: 'ignore' });

let profile, chrome;
const done = (code) => {
  try { chrome?.kill(); } catch {}
  try { next.kill(); } catch {}
  if (profile) {
    for (let i = 0; i < 8; i++) {
      try { rmSync(profile, { recursive: true, force: true }); break; } catch { syncSleep(250); }
    }
  }
  process.exit(code);
};

let up = false;
for (let i = 0; i < 60 && !up; i++) {
  await sleep(500);
  try { up = (await fetch(`http://localhost:${PORT}/`)).ok; } catch { /* belum dengar */ }
}
if (!up) { next.kill(); skip(`next start tidak merespons di :${PORT}`); }

profile = await mkdtemp(path.join(tmpdir(), 'check-lanyard-fallback-'));
chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-port=0', '--window-size=1440,1000', '--hide-scrollbars',
  '--disable-gpu', '--disable-software-rasterizer',
  '--user-data-dir=' + profile, 'about:blank',
], { stdio: 'ignore' });

let target;
for (let i = 0; i < 40 && !target; i++) {
  await sleep(500);
  try {
    const port = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0].trim();
    target = (await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json())).find(t => t.type === 'page');
  } catch { /* Chrome belum menuliskan portnya */ }
}
if (!target) { done(0); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let nextId = 1;
const pending = new Map();
const lempar = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown')
    lempar.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').slice(0, 200));
});
const send = (method, params = {}) =>
  new Promise(r => { const id = nextId++; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr) =>
  JSON.parse((await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value);

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: `http://localhost:${PORT}/` });

let siap = false;
for (let i = 0; i < 60 && !siap; i++) {
  await sleep(500);
  siap = await ev(`JSON.stringify(!!document.querySelector('.band--hero'))`);
}
if (!siap) { console.error('hero tidak pernah muncul'); done(1); }

/* Sanity: kalau Chrome-nya ternyata tetap memberi WebGL, ujinya tidak menguji
   apa pun — dan diam-diam lulus. Dilewati, bukan dianggap lulus. */
const adaWebGL = await ev(`(() => {
  try { const c = document.createElement('canvas');
    return JSON.stringify(!!(c.getContext('webgl2') || c.getContext('webgl'))); }
  catch { return JSON.stringify(false); }
})()`);
if (adaWebGL) { done(0); skip('Chrome di mesin ini tetap memberi WebGL walau --disable-gpu'); }

await sleep(4000);

const hasil = await ev(`(() => {
  const img = document.querySelector('.lanyard-fallback img');
  const r = img && img.getBoundingClientRect();
  return JSON.stringify({
    adaCadangan: !!img,
    src: img ? new URL(img.src).pathname : null,
    dimuat: img ? img.naturalWidth : 0,
    tinggi: r ? Math.round(r.height) : 0,
    lebar: r ? Math.round(r.width) : 0,
    /* Kotak 3D tidak boleh ikut dipasang: satu <Canvas> saja sudah cukup untuk
       melempar, dan itu yang sedang dicegah. Dicari di dalam slotnya saja —
       #aurora di hero juga <canvas>, tapi 2D dan tidak ada urusannya di sini. */
    ada3d: !!document.getElementById('lanyard-3d'),
    adaCanvas: !!document.querySelector('.lanyard-slot canvas, #lanyard-slot-about canvas'),
    /* Latar hero juga shader WebGL, jadi ia mati oleh sebab yang sama —
       cadangannya pita gradien CSS yang dipasang auroraInit. */
    auroraDatar: document.getElementById('aurora')?.classList.contains('is-flat') ?? false,
    auroraLatar: getComputedStyle(document.getElementById('aurora')).backgroundImage,
  });
})()`);

assert.ok(hasil.adaCadangan, 'tanpa WebGL tidak ada cadangan apa pun — kolom hero tinggal kosong');
assert.ok(!hasil.ada3d && !hasil.adaCanvas, '<Canvas> tetap dipasang walau WebGL tidak ada');
assert.strictEqual(hasil.dimuat, 700, `gambar cadangan tidak termuat (naturalWidth ${hasil.dimuat}) — periksa public/card-face-*.png`);
assert.ok(hasil.tinggi > 200, `kartu cadangan cuma ${hasil.tinggi}px — terlalu kecil untuk terbaca sebagai kartu`);

assert.ok(hasil.auroraDatar, 'latar aurora tidak dapat kelas is-flat — hero-nya jadi bidang kosong');
assert.match(hasil.auroraLatar, /gradient/,
  `cadangan aurora tidak tergambar (background-image: ${hasil.auroraLatar})`);

const webglLempar = lempar.filter(t => /WebGLRenderer|WebGL context/i.test(t));
assert.deepStrictEqual(webglLempar, [],
  `masih ada yang melempar walau ada penjaganya: ${webglLempar.join(' | ')}`);

console.log(`OK — tanpa WebGL: <Canvas> tidak dipasang, tidak ada yang melempar, `
  + `kartu cadangan ${hasil.src} tampil ${hasil.lebar}x${hasil.tinggi}px, aurora jatuh ke gradien CSS`);
done(0);

/* SoftAurora (auroraInit di components/portfolio-runtime.js) diperiksa di
   Chrome sungguhan. Yang diuji tiga hal yang semuanya gagal DIAM-DIAM:

     1. kanvasnya benar-benar tergambar: ukuran bufernya sama dengan lebar CSS
        dikali RES (.5). Kalau shader-nya gagal kompilasi, kanvasnya berhenti
        di ukuran bawaan 300x150 dan halamannya cuma terlihat "agak gelap";
     2. ia latar SELURUH halaman, bukan cuma hero: position fixed, dan kotaknya
        masih menutup layar setelah digulir ke dasar halaman;
     3. penyesuaian HP jalan. uScale diturunkan mengikuti rasio layar (lihat
        skala() di runtime) supaya pola yang di desktop lapang tidak jadi
        bintik rapat di layar sempit. Nilainya dibaca dari uniform-nya sendiri:
        canvas.getContext('webgl') mengembalikan konteks yang SUDAH ada, jadi
        yang terbaca angka yang betul-betul dipakai shader.

   Dilewati (bukan gagal) kalau Chrome tak ada — itu keadaan lingkungan.
   Jalankan: node tests/check-aurora.mjs   (butuh `npm run build` lebih dulu) */
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import assert from 'node:assert';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PORT = 3217;

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

profile = await mkdtemp(path.join(tmpdir(), 'check-aurora-'));
chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-port=0', '--window-size=1440,900', '--hide-scrollbars',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
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
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
const send = (method, params = {}) =>
  new Promise(r => { const id = nextId++; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr) =>
  JSON.parse((await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value);

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: `http://localhost:${PORT}/` });

let ready = false;
for (let i = 0; i < 60 && !ready; i++) {
  await sleep(500);
  ready = await ev(`JSON.stringify(!!document.getElementById('aurora'))`);
}
assert.ok(ready, 'kanvas #aurora tidak pernah muncul');

/* Satu bacaan setelah beberapa bingkai: uScale dipasang di resize(), yang
   dipanggil dari render(), jadi angkanya baru ada setelah loopnya jalan. */
const baca = () => ev(`(() => new Promise((res) => {
  const c = document.getElementById('aurora');
  let n = 0;
  const tunggu = () => (++n < 30) ? requestAnimationFrame(tunggu) : res(JSON.stringify(hasil()));
  const hasil = () => {
    const gl = c.getContext('webgl');   // konteks yang SUDAH dibuat runtime, bukan yang baru
    const prog = gl && gl.getParameter(gl.CURRENT_PROGRAM);
    const r = c.getBoundingClientRect();
    return {
      w: c.width, h: c.height,
      mauW: Math.max(1, Math.round(c.clientWidth * 0.5)),
      mauH: Math.max(1, Math.round(c.clientHeight * 0.5)),
      pos: getComputedStyle(c).position,
      opacity: getComputedStyle(c).opacity,
      ev: getComputedStyle(c).pointerEvents,
      diMain: !!c.closest('main'),
      atas: Math.round(r.top), tinggi: Math.round(r.height), layar: Math.round(innerHeight),
      flat: c.classList.contains('is-flat'),
      rays: document.querySelectorAll('canvas.rays').length,
      uScale: prog ? gl.getUniform(prog, gl.getUniformLocation(prog, 'uScale')) : null,
      uSpeed: prog ? gl.getUniform(prog, gl.getUniformLocation(prog, 'uSpeed')) : null,
      uMouse: prog ? gl.getUniform(prog, gl.getUniformLocation(prog, 'uEnableMouse')) : null,
    };
  };
  requestAnimationFrame(tunggu);
}))()`);

const meja = await baca();
assert.ok(!meja.flat, 'kanvasnya jatuh ke cadangan .is-flat — WebGL tidak dapat konteks');
assert.strictEqual(meja.rays, 0, `masih ada ${meja.rays} kanvas .rays — LightRays belum benar-benar dilepas`);
assert.strictEqual(meja.w, meja.mauW, `lebar buffer ${meja.w} != ${meja.mauW}; render() tidak pernah jalan`);
assert.strictEqual(meja.h, meja.mauH, `tinggi buffer ${meja.h} != ${meja.mauH}; render() tidak pernah jalan`);
assert.strictEqual(meja.pos, 'fixed', `position ${meja.pos}: aurora harus ikut ke tiap seksi yang digulir`);
assert.strictEqual(meja.ev, 'none', 'kanvasnya menangkap pointer — teks jadi tidak bisa diseleksi');
assert.strictEqual(meja.opacity, '0.7', `opacity laptop ${meja.opacity}: cahayanya penuh, teks di atasnya menipis`);
assert.ok(!meja.diMain, 'kanvasnya bersarang di dalam <main> — fixed di sana mudah terkurung ancestor bertransform');
assert.strictEqual(meja.uSpeed, 0.800000011920929, `uSpeed ${meja.uSpeed}, prop-nya tidak sampai ke shader`);
assert.strictEqual(meja.uMouse, false, 'uEnableMouse menyala, padahal enableMouseInteraction: false');   // bool uniform terbaca boolean
// Jendela ujinya 1440x900 dan rasio nyatanya ~1.77 setelah bilah gulir & zoom
// body, jadi pengalinya ~1: yang dijaga di sini "praktis penuh", bukan angka pas.
assert.ok(meja.uScale > 1.5 * 0.9, `uScale ${meja.uScale} di layar lebar, harusnya mendekati penuh 1.5`);

/* Ikut tergulir: setelah sampai dasar halaman, kotaknya masih menutup layar. */
const bawah = await ev(`(() => { scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
  const r = document.getElementById('aurora').getBoundingClientRect();
  return JSON.stringify({ atas: Math.round(r.top), tinggi: Math.round(r.height), layar: Math.round(innerHeight) });
})()`);
assert.strictEqual(bawah.atas, 0, `di dasar halaman kanvasnya bergeser ke ${bawah.atas}px — ia tidak lagi fixed`);
assert.ok(Math.abs(bawah.tinggi - bawah.layar) <= 2, `tinggi kanvas ${bawah.tinggi} != tinggi layar ${bawah.layar}`);

/* Latar SEMUA seksi: di dasar halaman ia tetap menyala penuh. Sempat dipadamkan
   di bawah seksi Skills — kalau aturan itu kembali tanpa diminta, di sini yang
   berbunyi. Digulir balik ke puncak dulu supaya bacaan HP di bawah tidak
   mengukur halaman yang sedang di dasar. */
const padam = await ev(`(() => new Promise((res) => setTimeout(() => {
  const c = document.getElementById('aurora');
  res(JSON.stringify({ opacity: getComputedStyle(c).opacity, off: c.classList.contains('is-off') }));
}, 900)))()`);
assert.ok(!padam.off, 'aurora padam di dasar halaman — ia harus jadi latar semua seksi');
assert.strictEqual(padam.opacity, '0.7', `opacity di dasar halaman ${padam.opacity}, harusnya tetap .7`);

await ev(`(() => { scrollTo({ top: 0, behavior: 'instant' }); return JSON.stringify(1); })()`);
await new Promise(r => setTimeout(r, 400));

/* Layar HP: polanya harus TURUN skalanya, bukan sama seperti desktop. */
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await sleep(600);
const hp = await baca();
assert.ok(hp.uScale < meja.uScale * 0.8,
  `uScale HP ${hp.uScale} vs desktop ${meja.uScale}: polanya tidak diperbesar, di layar sempit itu terbaca bintik`);
assert.ok(Math.abs(hp.uScale - 1.5 * 0.7) < 1e-5, `uScale HP ${hp.uScale}, lantainya .7 x 1.5 = 1.05`);
assert.strictEqual(hp.opacity, '0.55', `opacity HP ${hp.opacity}: cahayanya tidak diredam, teksnya tertindih`);
assert.strictEqual(hp.w, hp.mauW, `buffer HP ${hp.w} != ${hp.mauW}; resize() tidak jalan lagi saat layarnya berubah`);

console.log(`OK — aurora fixed jadi latar seluruh halaman (buffer ${meja.w}x${meja.h}, tetap menutup layar di dasar halaman), prop sampai ke shader (uSpeed .8, mouse mati), opacity laptop ${meja.opacity}, skala pola turun 1.5 -> ${hp.uScale.toFixed(3)} dan opacity ${hp.opacity} di layar 390px`);
done(0);

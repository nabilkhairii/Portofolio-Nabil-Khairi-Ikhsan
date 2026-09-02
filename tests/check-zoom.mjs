/* Sorot foto bab Internship Journey (.jr-zoom) diperiksa di Chrome sungguhan.

   Tiga hal yang diperiksa untuk tiap bentuk kotak: hover TIDAK membukanya,
   ketukan membukanya selayar penuh, dan ketukan di luar menutupnya lagi.

   Kenapa yang tengah perlu diuji: yang membuat fotonya melompat jadi popup
   selayar penuh cuma position: fixed — dan fixed BATAL menempel ke viewport
   begitu ada satu leluhur yang punya animasi transform aktif; leluhur itu jadi
   containing block dan popupnya terkurung di dalam kotaknya sendiri. Di bab
   ini leluhur itu ada di mana-mana: .jr-fx memasang animasi transform lewat
   animation-timeline: view() pada ubin Dokumentasi Kerja DAN pada .jr-card
   Tanggung Jawab Utama. Yang membatalkannya dua baris berbeda di
   app/portfolio.css (.jr-zoom.is-open sendiri, dan .jr-card:has(...) untuk
   kartunya). Kalau salah satunya hilang, popupnya tetap muncul — cuma kecil,
   di dalam kotaknya, tanpa satu pun error.

   Dilewati (bukan gagal) kalau Chrome tak ada — itu keadaan lingkungan.
   Jalankan: node tests/check-zoom.mjs   (butuh `npm run build` lebih dulu) */
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import assert from 'node:assert';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PORT = 3215;

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

profile = await mkdtemp(path.join(tmpdir(), 'check-zoom-'));
chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-port=0', '--window-size=1440,1000', '--hide-scrollbars',
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
  ready = await ev(`JSON.stringify(!!document.querySelector('#jr-antam .jr-zoom'))`);
}
if (!ready) { console.error('bab ANTAM tidak pernah muncul'); done(1); }

/* Dua bentuk pemakai .jr-zoom, dan keduanya memikul .jr-fx di tempat yang
   berbeda: di ubin Dokumentasi Kerja animasinya di kotak itu sendiri, di
   Tanggung Jawab Utama di .jr-card induknya. Justru bedanya itu yang diuji. */
const KOTAK = [
  ['ubin Dokumentasi Kerja', '#jr-antam .jr-acts .jr-zoom'],
  ['foto Tanggung Jawab Utama', '#jr-antam .jr-card__media.jr-zoom'],
];

const hasil = [];
for (const [nama, sel] of KOTAK) {
  /* Digulir sampai kotaknya di tengah layar dulu: hover dikirim lewat
     koordinat viewport, dan gambar dengan loading="lazy" belum tentu terdekode
     kalau kotaknya masih jauh di bawah. */
  const titik = await ev(`(() => {
    document.querySelectorAll('img[loading]').forEach(i => i.loading = 'eager');
    const el = document.querySelector(${JSON.stringify(sel)});
    const r = el.getBoundingClientRect();
    scrollTo({ top: r.top + scrollY - innerHeight / 2 + r.height / 2, behavior: 'instant' });
    const b = el.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2), lebar: Math.round(b.width) });
  })()`);
  await sleep(1200);

  /* Diketuk, bukan disorot: sejak popupnya cuma terbuka lewat click, hover
     saja TIDAK boleh memunculkan apa pun — dicek dulu di bawah. */
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: titik.x, y: titik.y, buttons: 0 });
  await sleep(500);
  const saatDisorot = await ev(`JSON.stringify(getComputedStyle(
    document.querySelector(${JSON.stringify(sel)} + ' img')).position)`);
  assert.notStrictEqual(saatDisorot, 'fixed',
    `${nama}: popupnya terbuka cuma karena kursor lewat — harusnya perlu diketuk`);

  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', {
      type, x: titik.x, y: titik.y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1,
    });
  }
  await sleep(1400);

  const ukur = await ev(`(() => {
    const img = document.querySelector(${JSON.stringify(sel)} + ' img');
    const r = img.getBoundingClientRect();
    return JSON.stringify({
      posisi: getComputedStyle(img).position,
      fit: getComputedStyle(img).objectFit,
      lebar: Math.round(r.width), tinggi: Math.round(r.height),
      layarLebar: Math.round(innerWidth), layarTinggi: Math.round(innerHeight),
    });
  })()`);

  /* Ditutup dengan ketukan di luar kotaknya — sekalian menguji bahwa ketukan
     di atas popup tembus ke halaman (popup & tirainya pointer-events: none).
     Kalau tidak tembus, kotak berikutnya tidak akan pernah bisa dibuka. */
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', {
      type, x: 5, y: 5, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1,
    });
  }
  await sleep(500);
  const setelahDitutup = await ev(`JSON.stringify(getComputedStyle(
    document.querySelector(${JSON.stringify(sel)} + ' img')).position)`);
  assert.notStrictEqual(setelahDitutup, 'fixed',
    `${nama}: popupnya tidak tertutup oleh ketukan di luar kotaknya`);

  assert.strictEqual(ukur.posisi, 'fixed', `${nama}: popupnya tidak position: fixed`);
  assert.strictEqual(ukur.fit, 'contain', `${nama}: popupnya masih dipotong (object-fit ${ukur.fit})`);
  /* Inti ujinya: 84vw x 88vh, bukan seukuran kotaknya. Ambangnya 0,7 —
     cukup longgar untuk perubahan inset, cukup ketat untuk menangkap popup
     yang terkurung (kotaknya sendiri < 0,35 lebar layar). */
  const rasio = ukur.lebar / ukur.layarLebar;
  assert.ok(rasio > 0.7,
    `${nama}: popup cuma ${ukur.lebar}px dari layar ${ukur.layarLebar}px `
    + `(kotaknya ${titik.lebar}px) — kemungkinan terkurung di containing block leluhurnya`);
  assert.ok(ukur.tinggi / ukur.layarTinggi > 0.7,
    `${nama}: popup cuma setinggi ${ukur.tinggi}px dari layar ${ukur.layarTinggi}px`);
  hasil.push(`${nama} ${ukur.lebar}x${ukur.tinggi}`);
}

/* Jalur keyboard, sekali saja: kotaknya role="button" tapi bukan <button>
   sungguhan, jadi Enter TIDAK berubah jadi click dengan sendirinya —
   runtime yang menjalankannya, dan itu gampang hilang tanpa terlihat. */
const UBIN = '#jr-antam .jr-acts .jr-zoom';
const posisi = () => ev(`JSON.stringify(getComputedStyle(document.querySelector('${UBIN} img')).position)`);
const tekan = async (key, code) => {
  for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key, code });
  await sleep(600);
};

await ev(`(() => { document.querySelector('${UBIN}').focus(); return JSON.stringify('ok'); })()`);
await tekan('Enter', 'Enter');
assert.strictEqual(await posisi(), 'fixed', 'Enter di kotak yang difokus tidak membuka sorotnya');
await tekan('Escape', 'Escape');
assert.notStrictEqual(await posisi(), 'fixed', 'Escape tidak menutup sorotnya');

console.log(`OK — sorot foto: hover diam, ketukan membuka ke viewport (${hasil.join(', ')}), `
  + 'ketukan di luar & Escape menutup, Enter membuka dari keyboard');
done(0);

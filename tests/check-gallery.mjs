/* Galeri proyek dibuka di Chrome sungguhan, lalu diperiksa: dialognya
   benar-benar di tengah layar, isinya terisi, dan Escape menutupnya.

   Kenapa perlu diuji: <dialog> modal ditengahkan oleh `margin: auto` milik UA
   stylesheet, bukan oleh CSS halaman ini. Preflight Tailwind v4 mereset margin
   SEMUA elemen — begitu itu terjadi, galerinya menempel di pojok kiri atas dan
   tidak ada satu pun error, warning, atau uji lain yang berubah. Persis begitu
   kejadiannya sekali (lihat blok "preflight v3" di app/globals.css).

   Dilewati (bukan gagal) kalau Chrome tak ada — itu keadaan lingkungan.
   Jalankan: node tests/check-gallery.mjs   (butuh `npm run build` lebih dulu) */
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import assert from 'node:assert';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PORT = 3213;

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

profile = await mkdtemp(path.join(tmpdir(), 'check-gallery-'));
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
const errors = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    errors.push('EXC ' + (d.exception?.description || d.text).split('\n')[0]);
  }
});
const send = (method, params = {}) =>
  new Promise(r => { const id = nextId++; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr) =>
  JSON.parse((await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value);

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: `http://localhost:${PORT}/` });

// Grid dibangun runtime dari PROJECTS; tunggu kartunya ada.
let ready = false;
for (let i = 0; i < 60 && !ready; i++) {
  await sleep(500);
  ready = await ev(`JSON.stringify(!!document.querySelector('#project-grid .pcard'))`);
}

try {
  assert.ok(ready, 'kartu proyek tidak pernah muncul — grid gagal dibangun');

  /* Seluruh kategori tampil sekaligus — tidak ada lagi pemecahan empat-empat.
     Pembandingnya angka di tab yang sedang aktif, jadi uji ini tidak perlu
     ikut membaca PROJECTS: kalau grid memotong daftarnya, keduanya berbeda. */
  const g0 = await ev(`JSON.stringify({
    cards: document.querySelectorAll('#project-grid .pcard').length,
    tab: +document.querySelector('#filters .tab[aria-selected="true"] .tab__n').textContent,
    /* '' kalau peramannya belum mengenal corner-shape; kalau kenal, nilainya
       harus sampai — pernah ada minifier CSS yang membuang properti asing. */
    squircle: CSS.supports('corner-shape', 'squircle')
      ? getComputedStyle(document.querySelector('.pcard')).cornerShape : 'n/a',
  })`);
  assert.strictEqual(g0.cards, g0.tab, `grid menampilkan ${g0.cards} kartu, tabnya menghitung ${g0.tab}`);
  assert.notStrictEqual(g0.squircle, '', 'corner-shape hilang dari CSS hasil build');

  /* Satu klik membuka galeri. Dulu akordeon: kartu harus lebih dulu aktif
     (.ag-panel.is-active) dan klik ke panel lain cuma memindahkan aktifnya. */
  await ev(`(document.querySelector('#project-grid .pcard').click(), JSON.stringify(1))`);

  /* Galeri terbang masuk dari kartu yang diklik (FLIP, 320 md). Mengukur di
     tengah animasi memberi posisi & ukuran yang sama sekali lain — sekali
     terbaca 551,3820 dan 557x435 padahal tata letaknya benar. Jadi yang
     ditunggu penyelesaian animasinya, bukan sekian milidetik. */
  await ev(`Promise.all(document.getElementById('gallery').getAnimations().map(a => a.finished))
              .then(() => JSON.stringify('done'))`);
  await sleep(200);

  const g = await ev(`JSON.stringify((() => {
    const d = document.getElementById('gallery');
    const r = d.getBoundingClientRect();
    return {
      open: d.open,
      x: r.x, y: r.y, w: r.width, h: r.height,
      // clientWidth/Height, bukan innerWidth/Height: yang terakhir ikut
      // menghitung scrollbar, jadi dialog yang benar-benar di tengah terbaca
      // meleset ~15px dan tolerasinya harus dilonggarkan tanpa alasan.
      vw: document.documentElement.clientWidth, vh: document.documentElement.clientHeight,
      title: (document.getElementById('g-title').textContent || '').trim(),
      img: document.querySelector('.g-img.is-front')?.getAttribute('src') || null,
      // Lapisan gelapnya harus menutupi seluruh layar. Di bawah body{zoom:.8}
      // ukuran ::backdrop dihitung di ruang ber-zoom, jadi angkanya dikalikan
      // dulu sebelum dibandingkan dengan viewport.
      backdrop: (() => {
        const b = getComputedStyle(d, '::backdrop');
        const z = parseFloat(getComputedStyle(document.body).zoom) || 1;
        return { w: parseFloat(b.width) * z, h: parseFloat(b.height) * z };
      })(),
    };
  })())`);

  assert.ok(g.open, 'galeri tidak terbuka saat kartu diklik');
  assert.ok(g.title, 'judul galeri kosong — isinya tidak terisi dari PROJECTS');
  assert.ok(g.img, 'tidak ada foto yang dipasang di panggung galeri');

  // Di tengah: sisa ruang kiri = kanan, atas = bawah. Toleransi 2px untuk
  // pembulatan sub-piksel (dialog ini hidup di bawah zoom .8).
  const dx = Math.abs(g.x - (g.vw - g.x - g.w));
  const dy = Math.abs(g.y - (g.vh - g.y - g.h));
  assert.ok(dx <= 2,
    `galeri tidak di tengah mendatar: kiri ${Math.round(g.x)}px vs kanan ${Math.round(g.vw - g.x - g.w)}px `
    + '— `margin: auto` untuk <dialog> hilang (lihat blok preflight v3 di app/globals.css)');
  assert.ok(dy <= 2,
    `galeri tidak di tengah tegak: atas ${Math.round(g.y)}px vs bawah ${Math.round(g.vh - g.y - g.h)}px`);
  assert.ok(g.w > 200 && g.h > 200, `ukuran galeri tidak wajar: ${Math.round(g.w)}x${Math.round(g.h)}`);

  // Lapisan gelap harus menutupi layar penuh, bukan cuma sudut kiri atas.
  assert.ok(g.backdrop.w >= g.vw - 2 && g.backdrop.h >= g.vh - 2,
    `::backdrop cuma ${Math.round(g.backdrop.w)}x${Math.round(g.backdrop.h)} pada layar ${g.vw}x${g.vh} `
    + '— halaman di belakangnya tidak tergelapkan sampai tepi');

  // Escape harus menutupnya — jalur tutup bawaan <dialog>, mudah putus kalau
  // ada yang memanggil preventDefault di jalan.
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(700);
  assert.strictEqual(await ev(`JSON.stringify(document.getElementById('gallery').open)`), false,
    'galeri tidak tertutup saat Escape ditekan');

  assert.deepStrictEqual(errors, [], 'konsol tidak bersih:\n  ' + errors.join('\n  '));

  console.log(`OK — ${g0.cards} kartu (sesuai hitungan tab), sudut corner-shape ${g0.squircle}; `
    + `galeri: terbuka di tengah (${Math.round(g.x)}px kiri = ${Math.round(g.vw - g.x - g.w)}px kanan, `
    + `${Math.round(g.y)}px atas = ${Math.round(g.vh - g.y - g.h)}px bawah), judul "${g.title}", foto terpasang, Escape menutup`);
} catch (e) {
  console.error('GAGAL — ' + e.message);
  done(1);
}

done(0);

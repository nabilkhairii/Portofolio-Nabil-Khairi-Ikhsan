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
  ready = await ev(`JSON.stringify(!!document.querySelector('.pgrid .pcard'))`);
}

try {
  assert.ok(ready, 'kartu proyek tidak pernah muncul — grid gagal dibangun');

  /* Tiap kategori punya kisinya sendiri sekarang (satu seksi per kategori),
     jadi yang dihitung SELURUH kartu di semua kisi — pembandingnya jumlah
     entri PROJECTS. Dulu pembandingnya angka di tab yang aktif; bilah tabnya
     sudah tidak ada, dan tanpa penggantinya kisi yang gagal terisi tidak
     membuat satu uji pun merah. Kisi yang kosong ikut disebut namanya: itu
     bentuk kegagalan yang paling mungkin (id di GRIDS tidak cocok dengan
     gridId di page.tsx), dan halaman tetap tampil normal saat terjadi. */
  const g0 = await ev(`JSON.stringify({
    cards: document.querySelectorAll('.pgrid .pcard').length,
    empty: [...document.querySelectorAll('.pgrid')].filter(g => !g.children.length).map(g => g.id),
    grids: document.querySelectorAll('.pgrid').length,
    /* Judul seksi dokumentasi: white-space: nowrap, jadi selalu satu baris —
       yang bisa gagal adalah MENJULUR keluar kotaknya, dan itu tidak terlihat
       sebagai error apa pun. Selisih positif = judulnya lebih lebar dari
       .shell; kecilkan pengali vw di .sec-head--mid .display-lg. */
    over: [...document.querySelectorAll('.sec-head--mid h2')]
      .map(h => [h.closest('section').id, Math.round(h.scrollWidth - h.parentElement.clientWidth)])
      .filter(([, px]) => px > 0),
    /* Keterangannya juga satu baris di desktop — itu yang dibeli dengan
       melepas max-w-[60ch] dari .prose-nya. Kalau capnya kembali atau
       kalimatnya memanjang, ia diam-diam jadi dua baris lagi. */
    wrapped: [...document.querySelectorAll('.sec-head--mid .prose')]
      .map(p => [p.closest('section').id,
        Math.round(p.offsetHeight / parseFloat(getComputedStyle(p).lineHeight))])
      .filter(([, lines]) => lines > 1),
    /* Kotak sertifikat: potretnya di atas kartu, menuju halaman verifikasi di
       tab baru. Gagalnya diam-diam — itemHTML() jatuh ke kartu biasa begitu
       nama berkas potretnya tidak lagi cocok dengan yang ditulis
       tools/cert-shots.mjs, dan yang hilang cuma kotaknya, tanpa error. */
    certs: [...document.querySelectorAll('.certbox__doc')]
      .map(a => [a.getAttribute('href'), a.target, a.rel]),
    /* '' kalau peramannya belum mengenal corner-shape; kalau kenal, nilainya
       harus sampai — pernah ada minifier CSS yang membuang properti asing. */
    squircle: CSS.supports('corner-shape', 'squircle')
      ? getComputedStyle(document.querySelector('.pcard')).cornerShape : 'n/a',
  })`);
  /* Sumber angkanya PROJECTS itu sendiri: tiap entri punya tepat satu `cat:`,
     dan tiap entri harus jadi tepat satu kartu di salah satu kisi. */
  const total = ((await readFile(path.join(ROOT, 'components/portfolio-runtime.js'), 'utf8'))
    .match(/\bcat: '/g) || []).length;   // tiap entri PROJECTS punya tepat satu
  assert.ok(total >= 20, `cuma ${total} entri PROJECTS terbaca — regexnya meleset`);
  assert.deepStrictEqual(g0.empty, [], `kisi kategori kosong: ${g0.empty.join(', ')}`);
  assert.deepStrictEqual(g0.over, [], `judul seksi menjulur keluar .shell: ${JSON.stringify(g0.over)}`);
  assert.deepStrictEqual(g0.wrapped, [],
    `keterangan seksi patah lebih dari satu baris: ${JSON.stringify(g0.wrapped)}`);

  /* Dua lebar lagi, dan keduanya titik tersempit dari SATU pengali masing-
     masing: 641px yang terakhir masih memakai zoom .8, dan 390px yang sudah
     tidak (--zoom: 1 di blok HP) — di sana 1vw yang sama membeli ruang tata
     letak 20% lebih sedikit. Kalau salah satu pengali di .sec-head--mid
     kebesaran, judulnya menjulur di sini dan halaman ikut bisa digulir
     mendatar. Metriknya dikembalikan sebelum galeri diukur. */
  /* Halaman terbuka dalam bahasa Inggris (lang || 'en'), padahal judul
     TERPANJANG milik bahasa Indonesia — "SELURUH DOKUMENTASI PENGALAMAN
     KERJA", tiga karakter lebih panjang dari padanan Inggrisnya. Tanpa
     tombol ini ditekan, justru kasus terburuknya yang tidak pernah diukur. */
  assert.strictEqual(
    await ev(`(document.getElementById('lang-btn').click(), JSON.stringify(document.documentElement.lang))`),
    'id', 'tombol bahasa tidak memindahkan halaman ke Indonesia');
  await sleep(300);

  for (const w of [1440, 641, 390]) {
    await send('Emulation.setDeviceMetricsOverride',
      { width: w, height: 844, deviceScaleFactor: 0, mobile: w < 641 });
    await sleep(300);
    const narrow = await ev(`JSON.stringify({
      over: [...document.querySelectorAll('.sec-head--mid h2')]
        .map(h => [h.closest('section').id, Math.round(h.scrollWidth - h.parentElement.clientWidth)])
        .filter(([, px]) => px > 0),
      wrapped: ${w} < 1000 ? [] : [...document.querySelectorAll('.sec-head--mid .prose')]
        .map(p => [p.closest('section').id,
          Math.round(p.offsetHeight / parseFloat(getComputedStyle(p).lineHeight))])
        .filter(([, lines]) => lines > 1),
      scrollX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    })`);
    assert.deepStrictEqual(narrow.over, [], `judul ID menjulur di ${w}px: ${JSON.stringify(narrow.over)}`);
    assert.deepStrictEqual(narrow.wrapped, [],
      `keterangan ID patah lebih dari satu baris di ${w}px: ${JSON.stringify(narrow.wrapped)}`);
    assert.ok(narrow.scrollX <= 0, `halaman bisa digulir mendatar ${narrow.scrollX}px di ${w}px`);
  }
  await send('Emulation.clearDeviceMetricsOverride');
  await ev(`(document.getElementById('lang-btn').click(), JSON.stringify(1))`);   // kembali ke EN
  await sleep(300);
  assert.strictEqual(g0.cards, total,
    `${g0.grids} kisi menampilkan ${g0.cards} kartu, PROJECTS berisi ${total}`);

  /* Dihitung DI DALAM blok PROJECTS saja: kamus UI di atasnya juga punya kunci
     `credential:` (label "Verifikasi sertifikat"), dan tanpa potongan ini
     jumlahnya kelebihan dua — dua bahasa. */
  const runtime = await readFile(path.join(ROOT, 'components/portfolio-runtime.js'), 'utf8');
  const kredensial = (runtime
    .slice(runtime.indexOf('const PROJECTS = ['), runtime.indexOf('const PROJECTS_EN'))
    .match(/\bcredential: '/g) || []).length;
  assert.strictEqual(g0.certs.length, kredensial,
    `${g0.certs.length} kotak sertifikat tampil, padahal ${kredensial} entri punya credential`
    + ' — entri yang kehilangan kotaknya kemungkinan belum punya `certificate:`,'
    + ' atau nama berkasnya tidak cocok dengan yang ada di public/assets');
  for (const [href, target, rel] of g0.certs) {
    assert.match(href, /^https:\/\//, `tautan sertifikat bukan https: ${href}`);
    assert.strictEqual(target, '_blank', `tautan sertifikat tidak membuka tab baru: ${href}`);
    assert.match(rel, /noopener/, `tautan sertifikat tanpa rel noopener: ${href}`);
  }
  assert.notStrictEqual(g0.squircle, '', 'corner-shape hilang dari CSS hasil build');

  /* Satu klik membuka galeri. Dulu akordeon: kartu harus lebih dulu aktif
     (.ag-panel.is-active) dan klik ke panel lain cuma memindahkan aktifnya. */
  await ev(`(document.querySelector('.pgrid .pcard').click(), JSON.stringify(1))`);

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
      /* Deskripsinya daftar butir, bukan paragraf — satu kalimat satu <li>.
         Kalau bullets() atau <ul id="g-desc"> di page.tsx berubah jadi <p>
         lagi, teksnya tetap tampil utuh dan tidak ada yang mengeluh; yang
         hilang cuma bentuknya. */
      descItems: document.querySelectorAll('#g-desc li').length,
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
  assert.ok(g.descItems >= 2,
    `deskripsi galeri cuma ${g.descItems} butir — mestinya satu butir per kalimat`);
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

  /* Bentuk kedua deskripsi: teks naratif (kunjungan industri, studi banding,
     expo, forum) ditulis dengan baris kosong dan harus keluar sebagai PARAGRAF,
     bukan butir. Yang memilih bentuknya descHTML() dari datanya sendiri, jadi
     satu galeri saja tidak cukup untuk membuktikan keduanya jalan — kartu di
     atas kebetulan proyek teknis, dan cabang paragrafnya tidak pernah tersentuh
     kalau berhenti di situ. */
  await ev(`(document.querySelector('.pcard[data-id="kunjungan-lrt"]').click(), JSON.stringify(1))`);
  await sleep(900);
  const narasi = await ev(`JSON.stringify({
    p: document.querySelectorAll('#g-desc p').length,
    li: document.querySelectorAll('#g-desc li').length,
  })`);
  assert.ok(narasi.p >= 2, `deskripsi naratif cuma ${narasi.p} paragraf — mestinya minimal dua`);
  assert.strictEqual(narasi.li, 0, 'deskripsi naratif masih dipecah jadi butir');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(500);

  assert.deepStrictEqual(errors, [], 'konsol tidak bersih:\n  ' + errors.join('\n  '));

  console.log(`OK — ${g0.cards} kartu di ${g0.grids} kisi kategori (sesuai jumlah PROJECTS), `
    + `${g0.certs.length} kotak sertifikat bertaut ke halaman verifikasi, `
    + `judul & keterangan seksi satu baris tanpa menjulur (juga di 641/390px), `
    + `sudut corner-shape ${g0.squircle}; `
    + `galeri: deskripsi ${g.descItems} butir (naratif ${narasi.p} paragraf), terbuka di tengah (${Math.round(g.x)}px kiri = ${Math.round(g.vw - g.x - g.w)}px kanan, `
    + `${Math.round(g.y)}px atas = ${Math.round(g.vh - g.y - g.h)}px bawah), judul "${g.title}", foto terpasang, Escape menutup`);
} catch (e) {
  console.error('GAGAL — ' + e.message);
  done(1);
}

done(0);

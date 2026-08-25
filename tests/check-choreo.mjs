/* Pita foto (components/ui/scroll-choreography.tsx) diperiksa di Chrome
   sungguhan, mengikuti tiga fase yang ditulis komponennya sendiri:

     0.00 - 0.30  dua foto bergeser diagonal -> tinggal dua tumpuk, kiri & kanan
     0.35 - 0.65  kedua tumpuk merapat ke tengah -> keempatnya menumpuk
     0.70 - 0.90  yang teratas mengembang jadi satu layar penuh

   Kenapa perlu diuji: yang menggerakkannya useScroll + useSpring dari
   motion/react, terikat pada `target: containerRef` dan `offset: ["start
   start", "end end"]`. Kalau pembungkusnya tidak lagi punya tinggi (h-[300vh]
   hilang, atau ada ancestor yang jadi kontainer gulir), scrollYProgress tidak
   pernah bergerak dan keempat foto berdiri diam di posisi awal — tanpa error,
   tanpa uji lain yang berubah. Springnya juga berarti animasinya MENYUSUL
   gulir, jadi tiap bacaan menunggu nilainya tenang dulu.

   Dilewati (bukan gagal) kalau Chrome tak ada — itu keadaan lingkungan.
   Jalankan: node tests/check-choreo.mjs   (butuh `npm run build` lebih dulu) */
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import assert from 'node:assert';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PORT = 3214;

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

profile = await mkdtemp(path.join(tmpdir(), 'check-choreo-'));
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
  ready = await ev(`JSON.stringify(!!document.querySelector('.choreo-band'))`);
}

/* Keempat foto tidak punya kelas sendiri — komponennya disalin apa adanya dan
   memberi mereka kelas utilitas saja. Jadi dipilih lewat strukturnya: panggung
   sticky -> pembungkus flex -> keempat anaknya. Kalau strukturnya berubah, uji
   ini memang harus ikut gagal. */
const PICK = `(() => {
  const band = document.querySelector('.choreo-band');
  const stage = band.querySelector('.sticky');
  return { band, stage, items: [...stage.firstElementChild.children] };
})()`;

/* Satu bacaan pada progres p (0..1 sepanjang pembungkus 300vh, sama dengan
   scrollYProgress milik komponennya). Springnya membuat nilai menyusul gulir,
   jadi yang ditunggu bukan sekian frame melainkan sampai posisi keempat foto
   berhenti berubah — kalau diukur di tengah pegas, angkanya bukan angka fase
   mana pun. */
const readAt = (p) => ev(`(() => {
  const { band, stage, items } = ${PICK};
  /* rect + scrollY, bukan offsetTop/offsetHeight: body di-zoom .8 (dan pita ini
     membatalkannya dengan zoom 1.25), jadi angka tata letak dan angka gulir
     hidup di skala yang berbeda. rect sudah sekala dengan scrollY & innerHeight. */
  const r = band.getBoundingClientRect();
  const top = r.top + scrollY, run = r.height - innerHeight;
  scrollTo({ top: top + run * ${p}, behavior: 'instant' });

  const boxes = () => items.map(el => el.getBoundingClientRect());
  const key = (bs) => bs.map(b => [b.x, b.y, b.width, b.height].map(Math.round).join()).join('|');

  return new Promise(res => {
    let last = '', still = 0;
    const settle = () => {
      const now = key(boxes());
      still = now === last ? still + 1 : 0;
      last = now;
      if (still < 8) return void requestAnimationFrame(settle);

      const c = boxes();
      const sr = stage.getBoundingClientRect();
      const cap = document.querySelector('.choreo__caption');
      const mid = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
      /* Berapa banyak titik-tengah yang BERBEDA, dengan toleransi 4px. 4 = masih
         tersebar, 2 = sudah jadi dua tumpuk kiri-kanan, 1 = keempatnya menumpuk.
         Ini yang langsung menamai ketiga fase komponennya. */
      const clusters = [];
      for (const b of c.map(mid)) {
        if (!clusters.some(k => Math.hypot(k.x - b.x, k.y - b.y) < 4)) clusters.push(b);
      }
      const hero = c[3];   // z-40, yang terakhir di DOM: ini yang mengembang
      res(JSON.stringify({
        n: c.length,
        clusters: clusters.length,
        // Panggung terpaku di puncak layar, setinggi layar penuh (bukan 80%-nya).
        pinned: Math.abs(sr.y) < 2 && Math.abs(sr.height - innerHeight) < 2,
        // Seberapa besar hero-nya terhadap layar; di akhir harus ~1 di dua sumbu.
        heroW: hero.width / innerWidth, heroH: hero.height / innerHeight,
        // Yang di bawah hero memudar saat ia mengembang.
        underOpacity: +getComputedStyle(items[0]).opacity,
        caption: +getComputedStyle(cap).opacity,
        capBg: getComputedStyle(cap).backgroundColor,
        /* Elemen mana yang membawa difference, dan apakah blending-nya benar-
           benar sampai ke fotonya. Yang kedua itu yang pernah rusak: pembungkus
           sticky membentuk konteks penumpukan, dan blending DI DALAM konteks
           itu cuma melihat isi pembungkusnya sendiri — teksnya lalu putih polos
           di atas foto seterang apa pun, sementara mixBlendMode tetap terbaca
           "difference". Jadi yang dihitung: dari elemen berblending naik sampai
           pita, adakah leluhur yang mengurungnya. */
        blend: (() => {
          let el = cap, carrier = null;
          for (let n = cap; n && n !== band; n = n.parentElement) {
            if (getComputedStyle(n).mixBlendMode !== 'normal') carrier = n;
          }
          if (!carrier) return { mode: 'normal', trapped: null };
          const traps = [];
          for (let n = carrier.parentElement; n && n !== band; n = n.parentElement) {
            const s = getComputedStyle(n);
            if (s.isolation === 'isolate' || +s.opacity < 1 || s.filter !== 'none'
                || s.transform !== 'none' || s.mixBlendMode !== 'normal'
                || (s.position === 'sticky' || s.position === 'fixed')
                || (s.position !== 'static' && s.zIndex !== 'auto')) {
              traps.push(n.className || n.tagName);
            }
          }
          void el;
          return { mode: getComputedStyle(carrier).mixBlendMode, trapped: traps };
        })(),
        decoded: items.filter(el => el.querySelector('img').naturalWidth > 0).length,
      }));
    };
    requestAnimationFrame(settle);
  });
})()`);

try {
  assert.ok(ready, 'seksi .choreo-band tidak ada di halaman');

  /* Satu titik per fase, dibaca pada progres yang ditulis komponennya sendiri.
     0.32 dan 0.5 diambil sedikit DI DALAM fase, bukan di batasnya: springnya
     membuat nilai menyusul, jadi bacaan tepat di 0.30 masih separuh jalan. */
  const a = await readAt(0);      // fase 0  — kisi 2x2, empat titik tengah
  const b = await readAt(0.32);   // fase 1  — dua tumpuk, kiri & kanan
  const m = await readAt(0.66);   // fase 2  — keempatnya menumpuk di tengah
  const z = await readAt(1);      // fase 3  — yang teratas jadi satu layar penuh

  assert.strictEqual(a.n, 4, `pita foto berisi ${a.n} foto, seharusnya 4`);

  /* Inti uji ini: tiga fase itu benar-benar terjadi, dan urutannya benar.
     Kalau scrollYProgress tidak pernah bergerak — pembungkus 300vh-nya hilang,
     atau ada ancestor yang jadi kontainer gulir — keempat angka ini jadi 4
     semua dan tidak satu pun uji lain di repo ini yang berubah. */
  assert.strictEqual(a.clusters, 4, `di awal cuma ada ${a.clusters} posisi berbeda, seharusnya kisi 2x2`);
  assert.strictEqual(b.clusters, 2,
    `sesudah fase diagonal ada ${b.clusters} posisi berbeda, seharusnya 2 (tumpuk kiri & kanan) — `
    + 'gerak diagonalnya tidak jalan');
  assert.strictEqual(m.clusters, 1,
    `sesudah fase merapat ada ${m.clusters} posisi berbeda, seharusnya keempatnya menumpuk jadi 1`);

  // Panggungnya terpaku di puncak layar sepanjang ketiga fase.
  for (const [nama, v] of [['awal', a], ['diagonal', b], ['menumpuk', m], ['akhir', z]]) {
    assert.ok(v.pinned, `di fase ${nama} panggung sticky tidak terpaku setinggi layar penuh`);
  }

  /* Puncaknya benar-benar satu layar penuh. Ini yang paling mudah rusak diam-
     diam di proyek ini: komponennya menulis 100vw/100vh apa adanya, dan di
     bawah body zoom .8 itu cuma 80% layar. .choreo-band__fx yang membatalkan
     zoom-nya — kalau rule itu hilang, angka di bawah jadi ~0.8. */
  assert.ok(z.heroW > 0.99 && z.heroH > 0.99,
    `di akhir foto teratas cuma ${(z.heroW * 100).toFixed(0)}% x ${(z.heroH * 100).toFixed(0)}% layar, `
    + 'seharusnya penuh — pembatal zoom .choreo-band__fx hilang?');
  assert.ok(z.underOpacity < 0.05,
    `foto di bawah hero masih tampak (opacity ${z.underOpacity}) saat hero sudah memenuhi layar`);

  /* Keempatnya harus sudah terdekode begitu pitanya terpaku. Ini pernah rusak
     diam-diam: dengan loading="lazy" fotonya baru diminta saat seksinya masuk
     layar, dan yang tampak di detik pertama kotak kosong seukuran benar —
     lolos setiap uji geometri di atas. */
  assert.strictEqual(a.decoded, 4,
    `cuma ${a.decoded} dari 4 foto yang sudah terdekode saat pitanya terpaku — sisanya kotak kosong`);

  // Kalimatnya tampak dari awal sampai akhir, tanpa alas, warnanya dihitung
  // dari apa yang ada di belakangnya.
  assert.ok(a.caption > 0.95 && z.caption > 0.95,
    `kalimatnya tidak tampak penuh sepanjang seksi (awal ${a.caption}, akhir ${z.caption})`);
  assert.match(a.capBg, /rgba\(0, 0, 0, 0\)|transparent/,
    `kalimatnya masih beralas ${a.capBg} — seharusnya tanpa latar`);
  assert.strictEqual(a.blend.mode, 'difference',
    `mix-blend-mode kalimatnya "${a.blend.mode}" — tanpa difference, teks putih hilang di atas foto terang`);
  assert.deepStrictEqual(a.blend.trapped, [],
    `blending kalimatnya terkurung konteks penumpukan milik ${a.blend.trapped?.join(', ')} — `
    + 'ia cuma melihat isi pembungkus itu sebagai alas, jadi hurufnya tergambar putih polos '
    + 'di atas foto seterang apa pun. difference harus duduk di elemen terluar lapisan ini.');

  console.log('OK — tiga fase komponennya berjalan berurutan: kisi 2x2 (4 posisi) → diagonal (2 tumpuk) → '
    + `menumpuk (1) → hero ${(z.heroW * 100).toFixed(0)}% x ${(z.heroH * 100).toFixed(0)}% layar penuh `
    + `dengan yang di bawahnya memudar (opacity ${z.underOpacity}); panggung terpaku di keempat titik, `
    + '4 foto terdekode, kalimat tanpa alas dengan difference yang benar-benar sampai ke fotonya');
} catch (e) {
  console.error('GAGAL — ' + e.message);
  done(1);
}

done(0);

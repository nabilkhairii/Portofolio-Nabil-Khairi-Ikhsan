/* Memotret sertifikat dari halaman verifikasi Kemnaker SkillHub ke
   public/assets/<folder>/, supaya sertifikatnya terlihat langsung di halaman —
   bukan cuma jadi tautan yang harus dibuka di tab baru. Tempatnya kotak
   sertifikat di atas kartu dokumentasi (itemHTML di portfolio-runtime.js),
   dan namanya ditulis di `certificate:` entri yang bersangkutan — BUKAN di
   `images:`, yang isinya dokumentasi kegiatan saja.

   Kenapa dipotret, bukan di-<iframe>:
   - Halamannya SPA Angular utuh, lengkap dengan bilah kepala dan menu situs
     mereka. Yang mau ditampilkan sertifikatnya, bukan situsnya.
   - Tanpa X-Frame-Options hari ini bukan janji untuk besok: satu header baru
     di sisi mereka dan bingkainya berubah jadi kotak kosong, tanpa satu pun
     pesan di halaman ini.
   - Gambar ikut jalur yang sudah ada — make-thumbs, galeri, sorot foto,
     check-assets — jadi tidak ada satu baris UI baru yang perlu ditulis.
   Sertifikat tidak berubah isinya, jadi potret sekali memang cukup.

   Sumber alamatnya `credential:` di components/portfolio-runtime.js, dibaca
   dari berkasnya langsung: satu tempat yang menyimpan alamat, bukan dua yang
   harus disamakan.

   Jalankan dari akar proyek (butuh Chrome/Edge terpasang):
     node tools/cert-shots.mjs           # lewati yang berkasnya sudah ada
     node tools/cert-shots.mjs --force   # potret ulang semuanya
   Lalu selalu: node tools/make-thumbs.mjs */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const force = process.argv.includes('--force');

/* Yang dipotret HANYA halaman verifikasi SkillHub. Sertifikat lain di PROJECTS
   memakai `credential` juga, tapi alamatnya berkas asli di Drive — bukan
   halaman yang menggambar sertifikatnya, dan memotretnya cuma menghasilkan
   bingkai pratinjau Drive. Yang seperti itu potretnya dibuat dari berkasnya
   sendiri (mis. `pdftoppm -png -r 150 -singlefile <pdf> <keluaran>`) lalu
   ditaruh di public/assets/<folder>/ dengan nama yang sama seperti yang
   ditulis `certificate:` di entri itu. */
const SUMBER = 'skillhub.kemnaker.go.id';

/* Lebar jendela potret. 1200 cukup untuk membaca nomor sertifikat dan kode
   verifikasinya; tingginya dilebihkan supaya seluruh sertifikat masuk satu
   bingkai — sisanya putih dan dipangkas trim() di bawah. */
const W = 1200;
const H = 1600;
/* Bilah kepala SkillHub (logo + menu) setinggi ~90px di lebar itu. Dipotong
   sebelum trim(): warnanya putih seperti sertifikatnya, jadi trim() sendiri
   tidak bisa membedakan keduanya. Kalau kelak potretnya kepotong kelewat
   banyak atau bilah itu ikut terbawa, angka inilah yang bergeser. */
const KEPALA = 96;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => existsSync(p));
if (!CHROME) {
  console.error('GAGAL — tidak ada Chrome/Edge di mesin ini');
  process.exit(1);
}

/* Tiap entri PROJECTS yang punya `credential:` — folder + alamatnya.
   Dipecah per ENTRI dulu (`\n  {` di awal tiap objek), bukan dicari dengan
   satu regex "credential lalu folder dalam N karakter": jarak antar-keduanya
   berubah setiap ada komentar baru di tengahnya, dan yang kelewat batas hilang
   dari daftar TANPA satu pun pesan — persis sekali terjadi saat `cover:`
   ditambahkan ke keempat entri ini dan satu di antaranya berhenti terbaca. */
const runtime = readFileSync(path.join(ROOT, 'components/portfolio-runtime.js'), 'utf8');
const blok = runtime.slice(runtime.indexOf('const PROJECTS = ['), runtime.indexOf('const PROJECTS_EN'));
const semua = blok.split(/\n {2}\{/)
  .map(entri => ({
    url: entri.match(/credential: '([^']+)'/)?.[1],
    folder: entri.match(/folder: '([^']+)'/)?.[1],
    nama: entri.match(/certificate: '([^']+)'/)?.[1],
  }))
  .filter(c => c.url && c.folder && c.nama);
/* Yang terbaca harus sebanyak yang tertulis. Tanpa baris ini, entri yang lolos
   dari pemecahan di atas cuma tampak sebagai satu sertifikat yang "tidak
   pernah dipotret" — dan itu tidak terlihat sampai ada yang membuka galerinya. */
const tertulis = (blok.match(/certificate: '/g) || []).length;
if (!semua.length || semua.length !== tertulis) {
  console.error(`GAGAL — ${semua.length} dari ${tertulis} \`certificate:\` terbaca di portfolio-runtime.js`);
  process.exit(1);
}
const certs = semua.filter(c => c.url.includes(SUMBER));
const luar = semua.length - certs.length;

const profile = await mkdtemp(path.join(tmpdir(), 'cert-shot-'));
const shot = (url, out) => new Promise((res, rej) => {
  const p = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--window-size=${W},${H}`,
    /* Angular menggambar isinya setelah memanggil API-nya; tanpa anggaran
       waktu virtual ini yang terpotret halaman kosong. */
    '--virtual-time-budget=25000',
    '--user-data-dir=' + profile,
    '--screenshot=' + out, url,
  ], { stdio: 'ignore' });
  p.on('exit', (code) => (code === 0 ? res() : rej(new Error('chrome keluar dengan kode ' + code))));
});

let dibuat = 0, dilewati = 0;
for (const { url, folder, nama } of certs) {
  const dir = path.join(ROOT, 'public/assets', folder);
  const out = path.join(dir, nama);
  if (existsSync(out) && !force) { dilewati++; continue; }

  mkdirSync(dir, { recursive: true });
  const mentah = path.join(profile, 'shot.png');
  await shot(url, mentah);

  /* Kepala situsnya dibuang, lalu trim() memangkas putih di sekelilingnya dan
     extend() mengembalikan marginnya sebagai margin yang RATA — sertifikatnya
     duduk di tengah bingkainya sendiri, bukan di tengah tangkapan layar 1600px
     yang dua pertiganya kosong. */
  /* Ukuran tangkapannya DIBACA, bukan diasumsikan = W x H: headless memotret
     seluruh halaman, jadi tingginya ikut isi halaman dan tidak selalu H. */
  /* DUA lintasan, bukan satu rantai: extract() dan trim() sama-sama memotong,
     dan digabung dalam satu pipeline libvips menghitung areanya dari gambar
     yang salah — "extract_area: bad extract area", tanpa menyebut yang mana. */
  const { width: aw, height: ah } = await sharp(mentah).metadata();
  const dipotong = await sharp(mentah)
    .extract({ left: 0, top: KEPALA, width: aw, height: ah - KEPALA })
    .png()
    .toBuffer();
  const info = await sharp(dipotong)
    .trim({ background: '#ffffff', threshold: 12 })
    .extend({ top: 48, bottom: 48, left: 48, right: 48, background: '#ffffff' })
    .png()
    .toFile(out);

  console.log(`  ${folder} — ${info.width}x${info.height}`);
  dibuat++;
}
rmSync(profile, { recursive: true, force: true });

console.log(`OK — ${dibuat} sertifikat dipotret, ${dilewati} dilewati (sudah ada)`
  + (luar ? `, ${luar} bukan halaman ${SUMBER} (potretnya dibuat manual).` : '.')
  + (dibuat ? ' Jalankan: node tools/make-thumbs.mjs' : ''));

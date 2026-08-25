/* Melepas latar studio dari foto profil, supaya sosoknya mengambang di atas
   warna kartu lanyard dan ikut tema gelap/terang — seperti profile-half.png yang
   lama. tools/source/profile.png latarnya abu-abu solid.

   Bukan ambang kecerahan global: kemeja biru muda dan sorot di wajah juga
   terang, jadi ambang polos akan melubangi orangnya. Yang dipakai flood fill
   dari tepi gambar — piksel hanya jadi latar kalau tersambung ke pinggir DAN
   netral-terang. Kemeja terang tapi terkurung di dalam siluet, jadi tak pernah
   tersentuh; celah antara lengan dan badan terbuka ke tepi bawah, jadi ikut
   terbuang. Itu yang tidak bisa dilakukan ambang per-piksel.

   Jalankan ulang kalau tools/source/profile.png diganti:  node cutout.mjs
   lalu:  node make-thumbs.mjs */
import assert from 'node:assert';
import sharp from 'sharp';

const SRC = 'tools/source/profile.png';
const OUT = 'tools/source/profile-cut.png';

const LUM_MIN = 140;   // latar selalu lebih terang dari jas hitam & rambut
const SAT_MAX = 30;    // latar netral; kulit hangat dan kemeja biru tidak
const STEP = 16;       // beda RGB maksimum antar piksel bertetangga di latar

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const N = W * H;

const border = [];
for (let x = 0; x < W; x++) border.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) border.push(y * W, y * W + W - 1);

// Dibandingkan dengan piksel tetangga yang mengundangnya, bukan dengan satu
// warna latar acuan. Latar studio bergradasi — pada foto ini 189 di bawah
// sampai 236 di kiri atas — jadi ambang jarak ke warna tengah harus longgar
// sekali untuk memuat kedua ujungnya, dan selonggar itu ia mulai memakan
// orangnya. Gradasi mulus per piksel bedanya nyaris nol; batas ke rambut,
// jas, dan kulit lompat puluhan sekaligus. Yang lokal memisahkan keduanya
// tanpa perlu tahu warna latarnya sama sekali.
const isBg = new Uint8Array(N);
function bgLike(i, from) {
  const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
  if (Math.max(r, g, b) - Math.min(r, g, b) > SAT_MAX) return false;
  if (0.299 * r + 0.587 * g + 0.114 * b < LUM_MIN) return false;
  const dr = r - data[from * 3], dg = g - data[from * 3 + 1], db = b - data[from * 3 + 2];
  return dr * dr + dg * dg + db * db < STEP * STEP;
}

const stack = [];
const visit = (i, from) => { if (!isBg[i] && bgLike(i, from)) { isBg[i] = 1; stack.push(i); } };
for (const i of border) visit(i, i);   // benih dibandingkan dengan dirinya sendiri
while (stack.length) {
  const i = stack.pop(), x = i % W, y = (i - x) / W;
  if (x > 0) visit(i - 1, i);
  if (x < W - 1) visit(i + 1, i);
  if (y > 0) visit(i - W, i);
  if (y < H - 1) visit(i + W, i);
}

// Pada foto lama celah antara lengan dan badan terbuka ke tepi bawah, jadi ikut
// terbuang sendirinya. Di foto dengan tangan masuk saku celah itu tertutup
// rapat: warnanya warna latar, tapi tidak tersambung ke tepi mana pun, dan
// tertinggal sebagai blok abu-abu terang di tengah jas hitam. Ronde kedua
// menyemainya dari rentang warna latar yang SUDAH ditemukan — rentang terukur,
// bukan ambang tebakan — lalu menumbuhkannya lokal seperti ronde pertama.
const sat = (i) => Math.max(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]) - Math.min(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
const lo = [255, 255, 255], hi = [0, 0, 0];
const satHist = new Uint32Array(256);
let nBg = 0;
for (let i = 0; i < N; i++) {
  if (!isBg[i]) continue;
  satHist[sat(i)]++; nBg++;
  for (let c = 0; c < 3; c++) {
    const v = data[i * 3 + c];
    if (v < lo[c]) lo[c] = v;
    if (v > hi[c]) hi[c] = v;
  }
}
// Persentil ke-99, bukan maksimum: pass 1 sendiri mengizinkan sampai SAT_MAX,
// jadi maksimumnya selalu SAT_MAX dan gerbangnya tidak menyaring apa pun.
// Terukur pada foto ini — latar dan celah lengan sat <= 6, kemeja biru muda 29.
// Tanpa gerbang ini satu piksel kemeja jadi benih dan pertumbuhan lokal
// menjalari seluruh kemeja: lubang hitam menganga di kiri-kanan dasi.
let bgSat = 0, acc = 0;
while (bgSat < 255 && (acc += satHist[bgSat]) < nBg * 0.99) bgSat++;
for (let i = 0; i < N; i++) {
  if (isBg[i] || sat(i) > bgSat) continue;
  if ([0, 1, 2].every(c => data[i * 3 + c] >= lo[c] && data[i * 3 + c] <= hi[c])) visit(i, i);
}
while (stack.length) {
  const i = stack.pop(), x = i % W, y = (i - x) / W;
  if (x > 0) visit(i - 1, i);
  if (x < W - 1) visit(i + 1, i);
  if (y > 0) visit(i - W, i);
  if (y < H - 1) visit(i + W, i);
}

// Piksel tepi siluet setengah tercampur warna latar. Kalau dibiarkan, di kartu
// gelap sisanya jadi garis terang mengelilingi orangnya. Mask latar dilebarkan
// satu piksel supaya baris campuran itu ikut terpotong.
const mask = Uint8Array.from(isBg);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (isBg[i]) continue;
    if ((x > 0 && isBg[i - 1]) || (x < W - 1 && isBg[i + 1]) ||
        (y > 0 && isBg[i - W]) || (y < H - 1 && isBg[i + W])) mask[i] = 1;
  }
}

const removed = mask.reduce((n, v) => n + v, 0) / N;
assert.ok(removed > 0.2 && removed < 0.8,
  `${(removed * 100).toFixed(1)}% terbuang — flood fill meleset (bocor ke orangnya, atau latarnya tidak ketemu)`);

// Alpha dikaburkan tipis: tepi biner bikin tangga terlihat di lengkung bahu.
// toColourspace('b-w') wajib — tanpa itu sharp mengembalikan sRGB 3 kanal, dan
// soft[i] jadi membaca piksel ke-i/3: mask-nya tergeser tanpa error apa pun.
const alpha = Buffer.alloc(N);
for (let i = 0; i < N; i++) alpha[i] = mask[i] ? 0 : 255;
const { data: soft, info: si } = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } })
  .blur(0.7)
  .toColourspace('b-w')
  .raw()
  .toBuffer({ resolveWithObject: true });
assert.strictEqual(si.channels, 1, `alpha kembali ${si.channels} kanal, indeksnya akan meleset`);

const rgba = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  rgba[i * 4] = data[i * 3];
  rgba[i * 4 + 1] = data[i * 3 + 1];
  rgba[i * 4 + 2] = data[i * 3 + 2];
  rgba[i * 4 + 3] = soft[i];
}

// Setelah latarnya hilang tersisa pita transparan lebar di atas kepala. Tanpa
// dipangkas, di kartu selebar 248px orangnya menyusut jadi kecil. Kotaknya
// dihitung dari mask, bukan sharp .trim(): RGB di bawah piksel transparan
// sengaja dipertahankan (mencegah fringe gelap saat diperkecil), dan .trim()
// membandingkan RGB — jadi ia tidak melihat apa pun untuk dipangkas.
let x0 = W, y0 = H, x1 = -1, y1 = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (mask[y * W + x]) continue;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
}
const PAD = 4;                                   // ruang untuk feather di tepi
x0 = Math.max(0, x0 - PAD); y0 = Math.max(0, y0 - PAD);
x1 = Math.min(W - 1, x1 + PAD); y1 = Math.min(H - 1, y1 + PAD);

const out = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`OK — ${(removed * 100).toFixed(1)}% latar dibuang, ${W}x${H} -> ${out.width}x${out.height}, ${(out.size / 1024).toFixed(0)} KB`);

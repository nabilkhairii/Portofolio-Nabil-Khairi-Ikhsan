/* Membuat tekstur tali lanyard: pita abu-abu bertabur bintang empat sudut.

   Satu berkas untuk kedua tema: pita #BABABA bergambar hitam. Abu-abu terang
   itu punya kontras ke dua-duanya — tidak lebur di halaman gelap, tidak
   menyilaukan di halaman terang — jadi talinya tidak perlu ikut berganti
   seperti muka kartunya.

   Bintangnya tidak digambar ulang di sini: satu bintang DIPOTONG dari desain
   aslinya (tools/source/desain-tali.png), jadi bentuknya persis punya desain
   itu. Yang diatur di sini cuma berapa banyak dan sebesar apa — susunannya
   dibuat ulang, bukan disalin utuh, supaya jarak antarbintang tetap rata saat
   petanya diulang di sepanjang tali (kalau seluruh kolom 4 bintang dipakai apa
   adanya, sambungan antarsalinan menganga jauh lebih lebar dari jarak di
   dalamnya).

   Rasio pita harus sama dengan rasio bidang satu salinan di layar (panjang tali
   dibagi jumlah salinan, dibanding lebar tali) — meleset dari itu gambarnya
   tergencet atau melar. REPEAT di bawah mengikat keduanya; angkanya harus sama
   dengan `repeat` U meshline di components/lanyard.tsx.
   Resolusinya sendiri dikalikan SCALE — talinya bisa ditarik sampai dekat
   kamera, dan pada 1x gambarnya mulai kabur di situ.

   Jalankan dari akar proyek:  node tools/lanyard-texture.mjs */
import assert from 'node:assert';
import sharp from 'sharp';

const SCALE = 2;
/* Jumlah salinan peta di sepanjang tali — HARUS sama dengan |repeat U| di
   components/lanyard.tsx. Rasio pita ikut dibagi REPEAT supaya satu salinan
   tetap sebangun dengan bidangnya di layar. */
const REPEAT = 2;
/* 2918x321 = rasio SELURUH tali di layar (terukur: ~367x40 px). Dibagi REPEAT
   jadi rasio satu salinan. Pada REPEAT = 2 hasilnya 1459x321, persis rasio aset
   React Bits aslinya — angka itu memang lahir dari 2 salinan. */
const W = Math.round(2918 / REPEAT) * SCALE, H = 321 * SCALE;

const SRC = 'tools/source/desain-tali.png';
const OUT = 'public/lanyard.png';

const BG = '#bababa';
const FG = '#000000';

/* Besar bintang, diukur melintang pita (sumbu pendeknya), sebagai pecahan lebar
   pita. Sumbu panjangnya ikut proporsi aslinya. 0,56 menyisakan ~22% pita di
   atas dan bawah bintang. */
const STAR = 0.56;
/* Bintang per salinan peta. Dengan REPEAT = 2 berarti 2x lipat di sepanjang
   tali. Pasangan 0,56 + 5 kebetulan mengembalikan irama desain aslinya: jarak
   antarpusat ~1,29x panjang bintang, sama seperti di desain-tali.png. Menaikkan
   COUNT tanpa menurunkan STAR akan membuat bintangnya bersenggolan (dijaga
   assert di bawah). */
const COUNT = 5;

/* Ambang tinta saat memindai desain: piksel lebih gelap dari ini dianggap
   garis. Desainnya hitam di atas putih, jadi 128 aman jauh dari keduanya. */
const INK = 128;

/* Cari bintang PERTAMA di desain, lalu potong kotak persis di sekeliling
   tintanya. Dipindai, bukan ditulis sebagai angka mati: kalau desainnya
   diganti dengan bentuk lain, tool ini ikut menyesuaikan sendiri. */
const { data, info } = await sharp(SRC).greyscale().raw().toBuffer({ resolveWithObject: true });
const inkAt = (x, y) => data[y * info.width + x] < INK;

const rows = [];
for (let y = 0; y < info.height; y++) {
  let any = false;
  for (let x = 0; x < info.width && !any; x++) any = inkAt(x, y);
  rows.push(any);
}
const bands = [];
for (let y = 0, start = null; y <= rows.length; y++) {
  if (rows[y] && start === null) start = y;
  if (!rows[y] && start !== null) { bands.push([start, y - 1]); start = null; }
}
assert.ok(bands.length > 0, `tidak ada tinta di ${SRC} — desainnya kosong atau terlalu terang`);

const [top, bottom] = bands[0];
let left = info.width, right = -1;
for (let y = top; y <= bottom; y++)
  for (let x = 0; x < info.width; x++)
    if (inkAt(x, y)) { if (x < left) left = x; if (x > right) right = x; }

const cut = { left, top, width: right - left + 1, height: bottom - top + 1 };
assert.ok(cut.width > 20 && cut.height > 20, `potongan bintang kelewat kecil (${cut.width}x${cut.height})`);

/* Desainnya garis hitam di atas putih tanpa alfa. Kanal abu-abunya dibalik jadi
   alfa (hitam -> pekat, putih -> tembus pandang) lalu ditempel ke bidang warna
   FG. Cara ini ikut membawa serta piksel antialias di tepi garis, jadi lengkung
   bintangnya tetap halus setelah diperkecil. */
const alpha = await sharp(SRC).extract(cut).greyscale().negate().raw().toBuffer();
const star0 = await sharp({ create: { width: cut.width, height: cut.height, channels: 3, background: FG } })
  .joinChannel(alpha, { raw: { width: cut.width, height: cut.height, channels: 1 } })
  .png().toBuffer();

/* Diputar 90°: di desain bintangnya berderet ke bawah dengan sumbu panjang
   searah deretnya, dan di tali deret itu memanjang ke samping. */
const rotated = await sharp(star0).rotate(90).png().toBuffer();
const { width: rw, height: rh } = await sharp(rotated).metadata();

const starH = Math.round(STAR * H);
const starW = Math.round((starH / rh) * rw);
const period = W / COUNT;

/* Penebalan garis, dalam piksel radius (dilate cakram). Garis desainnya tipis:
   pada ukuran pita ini tebalnya cuma ~7px, dan di layar pita cuma ~40px lebar —
   goresnya jatuh di bawah satu piksel dan bintangnya luntur jadi abu-abu. 4px
   membuatnya kembali sekitar satu piksel penuh di layar. 0 = apa adanya. */
const BOLD = 4;

/* Dilate cakram: tinta ditumpuk pada semua pergeseran di dalam radius BOLD. */
const thicken = async (buf, r, w, h) => {
  if (!r) return buf;
  const layers = [];
  for (let dx = -r; dx <= r; dx++)
    for (let dy = -r; dy <= r; dy++)
      if (dx * dx + dy * dy <= r * r) layers.push({ input: buf, left: dx + r, top: dy + r });
  return sharp({
    create: { width: w + 2 * r, height: h + 2 * r, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite(layers).png().toBuffer();
};

const star = await thicken(await sharp(rotated).resize(starW, starH).png().toBuffer(), BOLD, starW, starH);

/* Tiap bintang ditaruh di tengah jatahnya sendiri, jadi jarak ke tetangga sama
   di dalam satu salinan maupun menyeberangi sambungan antarsalinan. */
const { width: sw, height: sh } = await sharp(star).metadata();
assert.ok(sw <= period, `bintang (${sw}px) lebih lebar dari jatahnya (${Math.round(period)}px) — `
  + 'turunkan STAR atau COUNT');
const stars = Array.from({ length: COUNT }, (_, i) => ({
  input: star,
  left: Math.round((i + 0.5) * period - sw / 2),
  top: Math.round((H - sh) / 2),
}));

await sharp({ create: { width: W, height: H, channels: 4, background: BG } })
  .composite(stars)
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`OK — ${OUT}: pita ${W}x${H} ${BG}, ${COUNT} bintang ${sw}x${sh} ${FG} (dilate ${BOLD}px) `
  + `(potongan ${cut.width}x${cut.height} dari ${bands.length} bintang di ${SRC}, jarak antarpusat ${Math.round(period)}px)`);

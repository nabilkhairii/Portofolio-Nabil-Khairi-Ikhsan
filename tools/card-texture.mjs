/* Menyusun muka kartu lanyard: tekstur bawaan card.glb, branding acaranya
   dihapus, foto profil ditempel di area pola.

   Basisnya dibaca langsung dari public/card.glb, bukan dari public/card-texture.png
   yang lama — kalau dari yang lama, foto sebelumnya ikut terbawa dan pola chevron
   di belakangnya sudah tertimpa, jadi tidak ada yang bisa dikembalikan.

   Tata letak kartu milik asetnya, bukan buatan sendiri: muka kartu = separuh
   kiri tekstur, pola chevron y 358..847. Yang diubah cuma tiga blok branding
   dihapus dan orangnya diganti.

   Fotonya dipakai apa adanya BESERTA latarnya (profile.png), dipotong jadi
   potret lalu sudutnya dibulatkan ala Apple — superellipse, bukan busur
   lingkaran; lihat SQUIRCLE_N di bawah. Versi tanpa latar (tools/cutout.mjs)
   tidak lagi dipakai di sini.

   Jalankan dari akar proyek setelah tools/source/profile.png diganti:
     node tools/card-texture.mjs */
import { readFile } from 'node:fs/promises';
import assert from 'node:assert';
import sharp from 'sharp';

const GLB = 'public/card.glb';
const SRC = 'tools/source/profile.png';

/* Dua varian, dinamai menurut tema yang memakainya — bukan menurut warnanya.
   Kartunya sengaja berlawanan dengan latar halaman supaya selalu terlihat:
   di tema gelap kartunya terang, di tema terang kartunya gelap. Fotonya sendiri
   tidak ikut dibalik; hanya badan kartu, pola chevron, dan panel QR-nya. */
const VARIANTS = [
  { file: 'public/card-texture-dark.png', invert: true, tema: 'dark' },
  { file: 'public/card-texture-light.png', invert: false, tema: 'light' },
];

// Blok branding acara di muka kartu. Batasnya dari pemindaian baris: setiap
// blok adalah pita piksel terang yang terpisah oleh baris hitam murni, jadi
// menghitamkannya tidak menyentuh pola chevron di y 358..847.
const WIPE = [
  { name: 'logo v0',             top: 100, height: 130 },   // pita y 109..220
  { name: '"Prompt to Production"', top: 255, height: 76 }, // pita y 266..321
  { name: '"ATTENDEE"',          top: 880, height: 54 },    // pita y 891..924
];
/* Muka kartu yang benar-benar terlihat: x 0..700, y ~19..1030 — diukur dari
   render 3D-nya, bukan ditebak (kartu 260x376 px di layar, skala 0,372 px per
   piksel tekstur, dan 700/1011 = 0,69 persis seperti proporsi kartunya).
   QR di kanan mulai x 740. */
const FACE_W = 700;
const FACE_TOP = 19, FACE_BOTTOM = 1030;

/* Batas muka kartu di atas hasil pengukuran layar, jadi ada ketidakpastian
   beberapa piksel — dan yang tersisa itu terlihat sebagai garis tipis warna
   badan kartu di tepi atas dan bawah foto. Fotonya dilebihkan melewati batas
   supaya tepinya jatuh di luar bidang yang terlihat. Ke samping tidak perlu:
   x 0..700 sudah pas dengan pemisah panel QR. */
const BLEED = 28;
const PHOTO = {
  width: FACE_W,
  height: (FACE_BOTTOM + BLEED) - Math.max(0, FACE_TOP - BLEED),
  cx: FACE_W / 2,
  top: Math.max(0, FACE_TOP - BLEED),
};

/* Sumbernya 1022x1538 (potret 0,66) dan bingkai kartu 0,8 — jadi ada tinggi
   yang harus dibuang. Dibuang dari BAWAH, bukan dari tengah: kepalanya ada di
   ~8% teratas, dan potongan tengah akan memakannya. TOP_BIAS menyisakan sedikit
   ruang di atas kepala; naikkan kalau kepalanya terasa mepet, turunkan kalau
   badannya kurang. */
const TOP_BIAS = 0.10;

/* Sudut ala Apple: superellipse |x/r|^n + |y/r|^n = 1, bukan busur lingkaran.
   n = 2 tepat lingkaran (sudut terlihat "menempel"), n = 5 mendekati lengkung
   berkelanjutan yang dipakai ikon iOS — peralihan ke sisi lurus tidak terlihat
   patah. RADIUS_RATIO relatif terhadap sisi terpendek; 0,18 kira-kira
   sebulat foto kartu, ikon iOS sendiri ~0,22 dan terasa terlalu bulat untuk
   potret setinggi ini. */
const SQUIRCLE_N = 5;
/* Tinggal sisa kecil sejak fotonya dilebihkan melewati batas muka kartu:
   sudut membulatnya sekarang jatuh di luar bidang yang terlihat, dan yang
   membulat di layar adalah geometri kartunya sendiri. Angka kecil ini cuma
   penjaga kalau bleed-nya kelak dikurangi. */
const RADIUS_RATIO = 0.03;
const CORNER_STEPS = 40;     // sampel per sudut; 40 sudah mulus di lebar 700px

// -- basis: satu-satunya gambar yang tertanam di GLB (material "base") --------
const glb = await readFile(GLB);
const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString('utf8'));
const bin = 20 + glb.readUInt32LE(12) + 8;
assert.strictEqual(json.images?.length, 1, 'card.glb tidak lagi berisi tepat satu tekstur');
const bv = json.bufferViews[json.images[0].bufferView];
const base = glb.subarray(bin + (bv.byteOffset || 0), bin + (bv.byteOffset || 0) + bv.byteLength);

const { width: W, height: H } = await sharp(base).metadata();

// Latar kartu hitam murni, jadi "menghapus" = menimpa dengan hitam. Diperiksa,
// bukan diasumsikan: kalau asetnya diganti dengan yang latarnya tidak hitam,
// blok-blok itu akan jadi kotak hitam yang kelihatan.
const { data: probe } = await sharp(base).removeAlpha().extract({ left: 20, top: 20, width: 8, height: 8 }).raw().toBuffer({ resolveWithObject: true });
assert.ok(Math.max(...probe) < 8, `latar kartu tidak hitam (maks ${Math.max(...probe)}) — WIPE akan meninggalkan kotak`);

// -- foto: dipotong ke bingkai kartu, lalu sudutnya dibulatkan --------------
assert.ok(PHOTO.width <= FACE_W, `foto ${PHOTO.width}px lebih lebar dari muka kartu ${FACE_W}px`);

const src = await sharp(SRC).metadata();
/* Potong sendiri, bukan fit:'cover'+position:'top': cover menempelkan subjek
   ke tepi atas, sedangkan yang dibutuhkan sedikit ruang di atas kepala. */
const cropH = Math.min(src.height, Math.round(src.width * (PHOTO.height / PHOTO.width)));
const cropW = Math.min(src.width, Math.round(cropH * (PHOTO.width / PHOTO.height)));
const cropTop = Math.round((src.height - cropH) * TOP_BIAS);
const cropLeft = Math.round((src.width - cropW) / 2);

/* Topeng superellipse. Sisinya tetap lurus; hanya sudutnya yang melengkung,
   dan lengkungnya menyatu ke sisi tanpa titik patah — itu yang membedakannya
   dari border-radius biasa. Digambar sebagai poligon rapat: pada 512px, 40
   sampel per sudut jaraknya < 1px, jadi tak ada gunanya menghitung Bézier. */
const R = Math.round(Math.min(PHOTO.width, PHOTO.height) * RADIUS_RATIO);
/* Satu kuadran superellipse di sekitar titik pusat sudut. (sx, sy) menunjuk ke
   arah sudutnya; `swap` menentukan ujung mana yang jadi awal, karena poligonnya
   harus tersusun searah jarum jam tanpa putus — kalau terbalik, jalurnya
   melipat dan topengnya bolong. */
const corner = (cx, cy, sx, sy, swap) => {
  const pts = [];
  for (let i = 0; i <= CORNER_STEPS; i++) {
    const t = (i / CORNER_STEPS) * (Math.PI / 2);
    const a = R * Math.cos(t) ** (2 / SQUIRCLE_N);   // t=0 -> R (ujung mendatar)
    const b = R * Math.sin(t) ** (2 / SQUIRCLE_N);   // t=0 -> 0 (ujung tegak)
    const [dx, dy] = swap ? [b, a] : [a, b];
    pts.push(`${(cx + sx * dx).toFixed(2)},${(cy + sy * dy).toFixed(2)}`);
  }
  return pts;
};
const { width: pw, height: ph } = PHOTO;
const outline = [
  ...corner(pw - R, R, 1, -1, true),        // kanan atas: (pw-R,0) -> (pw,R)
  ...corner(pw - R, ph - R, 1, 1, false),   // kanan bawah: (pw,ph-R) -> (pw-R,ph)
  ...corner(R, ph - R, -1, 1, true),        // kiri bawah: (R,ph) -> (0,ph-R)
  ...corner(R, R, -1, -1, false),           // kiri atas: (0,R) -> (R,0)
];
const mask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}">`
  + `<path d="M ${outline.join(' L ')} Z" fill="#fff"/></svg>`
);

const photo = await sharp(SRC)
  .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
  .resize(pw, ph)
  .ensureAlpha()
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toBuffer();
const photoW = pw;

/* Topeng benar-benar menempel. Tanpa uji ini, salah arah pada satu sudut saja
   sudah membuat poligonnya melipat, dan hasilnya cuma "agak aneh" di tekstur
   1376px — tidak akan ketahuan sampai kartunya dilihat dari dekat. Diperiksa
   di keempat sudut: sudut transparan, tengah utuh. */
const alphaAt = async (buf, x, y) =>
  (await sharp(buf).extract({ left: x, top: y, width: 1, height: 1 }).ensureAlpha().raw().toBuffer())[3];
/* Piksel sudut persis, bukan 2px ke dalam: batas squircle di 45 derajat lewat
   pada jarak 0,13 x radius dari sudut, jadi sampel yang menjorok ke dalam ikut
   terjaring pinggiran anti-alias begitu radiusnya mengecil — pernah gagal palsu
   dengan alpha 39 di RADIUS_RATIO 0,03. Sudut terluar selalu di luar bentuknya
   berapa pun radiusnya, selama bukan nol. */
for (const [x, y, nama] of [[0, 0, 'kiri atas'], [pw - 1, 0, 'kanan atas'],
                            [pw - 1, ph - 1, 'kanan bawah'], [0, ph - 1, 'kiri bawah']])
  assert.strictEqual(await alphaAt(photo, x, y), 0, `sudut ${nama} foto tidak terpotong — topeng squircle gagal`);
assert.strictEqual(await alphaAt(photo, pw >> 1, ph >> 1), 255, 'tengah foto ikut terpotong topeng');
// Titik tepat di tengah sisi harus tetap utuh: sisinya lurus, bukan melengkung.
assert.strictEqual(await alphaAt(photo, pw >> 1, 1), 255, 'sisi atas ikut terpotong — lengkungnya bukan cuma di sudut');
assert.strictEqual(await alphaAt(photo, 1, ph >> 1), 255, 'sisi kiri ikut terpotong — lengkungnya bukan cuma di sudut');

/* Rentang nilai pada satu pita muka kartu. Bukan .stats(): itu membaca gambar
   masukan dan mengabaikan extract di pipeline-nya, jadi ia melaporkan seluruh
   tekstur (255, dari QR) dan pemeriksaannya selalu gagal. Bukan Math.max(...data)
   juga — sejuta argumen melewati batas stack. */
const rangeIn = async (buf, top, height) => {
  const { data } = await sharp(buf).removeAlpha().extract({ left: 0, top, width: FACE_W, height }).raw().toBuffer({ resolveWithObject: true });
  let min = 255, max = 0;
  for (const v of data) { if (v > max) max = v; if (v < min) min = v; }
  return { min, max };
};

for (const v of VARIANTS) {
  /* Dibalik lebih dulu, baru dihapus brandingnya: pada varian terang latarnya
     jadi putih, dan menghapus dengan hitam justru meninggalkan tiga kotak
     hitam — persis kebalikan dari yang dituju. */
  const body = v.invert ? await sharp(base).negate({ alpha: false }).png().toBuffer() : base;
  const wipeColor = v.invert ? '#fff' : '#000';
  const flat = v.invert ? 255 : 0;

  // Dua tahap, bukan satu composite: fotonya menutupi sebagian pita branding,
  // jadi hilangnya branding hanya bisa dibuktikan sebelum foto ditempel.
  const wiped = await sharp(body)
    .composite(WIPE.map(w => ({
      input: { create: { width: FACE_W, height: w.height, channels: 3, background: wipeColor } },
      left: 0, top: w.top,
    })))
    .png()
    .toBuffer();

  for (const w of WIPE) {
    const { min, max } = await rangeIn(wiped, w.top, w.height);
    assert.ok(min === flat && max === flat,
      `${w.name} masih menyisakan piksel di varian ${v.tema} (rentang ${min}..${max}, harusnya ${flat})`);
  }

  await sharp(wiped)
    .composite([{ input: photo, left: Math.round(PHOTO.cx - photoW / 2), top: PHOTO.top }])
    .png({ compressionLevel: 9 })
    .toFile(v.file);

  /* Fotonya benar-benar tertempel, dan latar terangnya tidak ikut terbalik.
     Diintip di pertengahan tinggi foto — di situ ada jas gelap DAN latar
     terang sekaligus. Pita atas tidak bisa dipakai: sejak fotonya menutupi
     seluruh muka kartu, bagian itu isinya latar polos. */
  const { min, max } = await rangeIn(v.file, PHOTO.top + Math.round(PHOTO.height / 2), 80);
  assert.ok(max > 200, `varian ${v.tema}: area foto tidak terang (maks ${max}) — fotonya tidak ikut tertempel`);
  assert.ok(min < 120, `varian ${v.tema}: area foto tidak punya bagian gelap (min ${min}) — rambut/jasnya hilang`);

  console.log(`${v.file.padEnd(32)} tema ${v.tema.padEnd(5)} badan kartu ${v.invert ? 'terang' : 'gelap'}`);
}

console.log(`OK — ${W}x${H}, ${WIPE.length} blok branding dihapus, foto berlatar ${photoW}x${PHOTO.height} `
  + `di x${Math.round(PHOTO.cx - photoW / 2)} y${PHOTO.top} (selebar muka kartu ${FACE_W}), `
  + `sudut squircle r${R} (n=${SQUIRCLE_N}), dipotong dari ${src.width}x${src.height} pada y${cropTop}`);

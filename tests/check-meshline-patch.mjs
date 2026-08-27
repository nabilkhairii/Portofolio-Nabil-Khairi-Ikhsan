/* Menjaga tambalan shader patchBandShader di components/lanyard.tsx: dua baris
   di vertex shader meshline, satu supaya lebar pita tidak ikut rasio canvas dan
   satu lagi supaya ujung pita tetap terpotong rata (catatan lengkapnya ada di
   berkas itu).

   Tiga hal yang dijaga, dan semuanya bisa rusak tanpa satu pun error:

   1. Kedua sasarannya masih ada. String.replace yang tidak menemukan sasaran
      TIDAK melempar apa-apa — ia mengembalikan teks yang sama. Kalau meshline
      menulis ulang baris itu di versi berikutnya, tambalannya berhenti bekerja
      diam-diam, dan yang muncul cuma pita yang bentuknya aneh di dekat pengait.

   2. currentP tetap dihitung dari posisi mentah. Ini yang membuat perbandingan
      ujung di shader tepat sampai ke bit-nya; tanpa itu tutup ujungnya jatuh ke
      cabang miter dan berganti-ganti bentuk tiap frame.

   3. Pengalinya benar. Matematika shader-nya ditulis ulang di sini dengan JS
      (langkah demi langkah, lihat di bawah) lalu lebar pita diukur untuk
      pita tegak sampai mendatar. Ini SALINAN rumusnya, bukan shader-nya
      sendiri — yang dijaga arah penalarannya: tanpa pengali, pita mendatar
      tergambar tinggi/lebar canvas kali lebih tebal daripada pita tegak.

   Jalankan: node check-meshline-patch.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert';

const lanyard = readFileSync(new URL('../components/lanyard.tsx', import.meta.url), 'utf8');
const shader = readFileSync(new URL('../node_modules/meshline/dist/index.js', import.meta.url), 'utf8');

for (const nama of ['BAND_SIDE', 'BAND_CURRENT']) {
  const target = lanyard.match(new RegExp(`const ${nama} = '([^']+)'`))?.[1];
  assert.ok(target, `${nama} tidak ada di lanyard.tsx — tambalannya hilang atau ganti bentuk`);

  assert.ok(shader.includes(target),
    `meshline tidak lagi memuat "${target}" — tambalan ${nama} jadi tanpa efek.\n`
    + '  Cari baris penggantinya di node_modules/meshline/dist/index.js (vertexShader)\n'
    + `  lalu perbarui ${nama} di components/lanyard.tsx.`);

  /* Sasaran yang muncul dua kali berarti replace cuma menambal yang pertama. */
  assert.strictEqual(shader.split(target).length - 1, 1,
    `"${target}" muncul lebih dari sekali di shader meshline — replace hanya menambal yang pertama`);
}

assert.ok(lanyard.includes('normal.y * aspect'),
  'pengali aspect di patchBandShader hilang — tambalannya tidak menegakkan apa-apa lagi');

/* Inti tambalan ujung: currentP TIDAK boleh lagi diturunkan dari finalPosition,
   karena posisi itu sudah dikalikan aspect sementara prevP/nextP belum — dan
   perbandingan `==` di shader hanya tepat kalau ketiganya lahir dari bentuk
   ungkapan yang sama. */
assert.ok(lanyard.includes('fix(m * vec4(position, 1.0), aspect)'),
  'currentP tidak lagi dihitung dari posisi mentah — ujung pita akan berganti-ganti bentuk lagi');

/* ── Lebar pita, diukur ── ukuran canvas HP: paling timpang dari yang dipakai
   halaman ini (176x1150), jadi kalau ada yang meleset, di sinilah terlihat. */
const W = 176, H = 1150, aspect = W / H;

/* Setengah lebar pita di layar, dalam piksel, untuk garis yang menyerong
   sebesar `theta`. Mengikuti vertex shader meshline apa adanya:
     - arah garis diambil di ruang `fix()` — NDC dengan x dikalikan aspect.
       Ruang itu sendiri sudah sebangun dengan piksel (aspect/lebar = 1/tinggi),
       jadi arahnya sama saja dengan arah di layar: DI SINI tidak ada yang
       perlu dikoreksi, dan itu bagian yang mudah salah,
     - normal = tegak lurus arah tadi, panjangnya 1/2 lebar,
     - normal ditambahkan ke posisi clip, LALU dibagi w. Di sinilah
       ketimpangannya lahir: yang x berakhir dikalikan lebar canvas sementara
       yang y dikalikan tingginya.
   `patched` mengalikan normal.y dengan aspect persis seperti isotropicBandWidth
   — dan aspect x tinggi = lebar, jadi kedua sumbunya bertemu di angka yang
   sama. */
const halfWidth = (theta, patched) => {
  const n = { x: -Math.sin(theta) / 2, y: Math.cos(theta) / 2 };    // lebar 1, jadi 1/2
  const px = { x: n.x * W, y: (patched ? n.y * aspect : n.y) * H }; // pergeseran, dalam piksel
  const perp = { x: -Math.sin(theta), y: Math.cos(theta) };         // tegak lurus sungguhan
  return Math.abs(px.x * perp.x + px.y * perp.y);
};

const sweep = (patched) => {
  const w = [];
  for (let d = 0; d <= 90; d += 5) w.push(halfWidth(d * Math.PI / 180, patched));
  return Math.max(...w) / Math.min(...w);
};

/* Tanpa tambalan: pita mendatar tergambar H/W kali lebih tebal dari yang tegak
   — 6,5x di kotak HP. Uji ini ikut menjaga angka itu tetap berarti: kalau
   suatu saat canvas-nya jadi persegi, ketimpangannya memang hilang sendiri. */
const timpang = sweep(false);
assert.ok(timpang > 6, `ketimpangan tanpa tambalan cuma ${timpang.toFixed(2)}x — `
  + 'uji ini kehilangan gigi; periksa lagi ukuran canvas di atas');

const rata = sweep(true);
assert.ok(rata < 1.001, `dengan tambalan lebar pita masih berubah ${rata.toFixed(3)}x `
  + 'antara tegak dan mendatar — pengalinya salah');

console.log(`OK — sasaran tambalan meshline utuh, dan pengali aspect meratakan lebar pita `
  + `dari ${timpang.toFixed(1)}x jadi ${rata.toFixed(3)}x antara tegak dan mendatar`);

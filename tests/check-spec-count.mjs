/* Uji hitungan angka spec. Sumbernya diambil langsung dari
   portfolio-runtime.js (antara penanda #region spec-count) dan dieval — bukan
   disalin, jadi tak bisa melenceng diam-diam.

   Yang dijaga: hitungannya berhenti PERSIS di nilai yang tertulis di page.tsx,
   dan bentuk aslinya utuh sepanjang animasi — "04" tidak boleh berkedip jadi
   "4", "3.69" tidak boleh jadi "3.7". Lebar yang berubah tiap frame membuat
   seluruh pita bergeser-geser.  Jalankan: node check-spec-count.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert';

const src = readFileSync(new URL('../components/portfolio-runtime.js', import.meta.url), 'utf8')
  .split('/* #region spec-count */')[1]?.split('/* #endregion spec-count */')[0];
assert.ok(src, 'blok #region spec-count tidak ditemukan di portfolio-runtime.js');

const { fmtCount, countSpecs } = new Function(`${src}; return { fmtCount, countSpecs };`)();

/* Angkanya dibaca dari markup, bukan ditulis ulang di sini: kalau IPK berubah
   di page.tsx, uji ini ikut dan tidak perlu disunting. */
const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const vals = [...page.matchAll(/spec__v"[^>]*>\s*([^<\s]+)\s*</g)].map(m => m[1]);
assert.ok(vals.length >= 4, `spec__v di page.tsx cuma ketemu ${vals.length}, harusnya 4`);

for (const raw of vals) {
  assert.ok(isFinite(parseFloat(raw)), `"${raw}" bukan angka — hitungannya akan jadi NaN`);
  assert.equal(fmtCount(raw, parseFloat(raw)), raw, `${raw}: ujung hitungan harus persis nilai markup`);
  assert.equal(fmtCount(raw, 0).length, raw.length, `${raw}: lebar berubah saat menghitung, pita akan bergeser`);
}

/* Jalankan animasinya sampai habis dengan raf & jam palsu. */
const els = vals.map(v => ({ textContent: v }));
let queue = [];
countSpecs({ querySelectorAll: () => els }, fn => queue.push(fn), () => 0);

let t = 0, frames = 0;
while (queue.length) {
  const batch = queue;
  queue = [];
  t += 100;
  assert.ok(++frames < 200, 'hitungan tidak pernah berhenti');
  batch.forEach(fn => fn(t));
}

els.forEach((el, i) => assert.equal(el.textContent, vals[i], `angka ke-${i + 1} tidak mendarat di nilai markup`));

console.log(`OK — ${vals.length} angka spec menghitung ke nilai markup, bentuknya utuh sepanjang animasi`);

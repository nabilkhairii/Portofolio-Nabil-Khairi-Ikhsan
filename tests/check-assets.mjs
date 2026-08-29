/* Aset tidak pernah gagal dengan berisik: kalau satu foto dirujuk tapi
   berkasnya tidak ada, halaman tetap tampil — cuma bolong. Dan kalau
   public/assets diperbarui tanpa menjalankan tools/make-thumbs.mjs, grid proyek
   memuat thumbnail lama tanpa satu pun pesan error. Dua hal itu yang diuji.

   Jalankan: node tests/check-assets.mjs */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import assert from 'node:assert';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const pub = (rel) => path.join(root, 'public', decodeURIComponent(rel).replace(/^\//, ''));

const page = readFileSync(path.join(root, 'app/page.tsx'), 'utf8');
const runtime = readFileSync(path.join(root, 'components/portfolio-runtime.js'), 'utf8');

/* ── 1. rujukan literal di page.tsx yang menunjuk ke dalam situs ──
   Dua bentuk, dan yang kedua bukan kelengkapan yang mengada-ada: aset yang
   dioper sebagai prop (objek/array literal, bukan atribut src="...") lolos
   dari regex atribut tanpa satu pun uji berubah merah — persis jenis
   kebocoran yang berkas ini ada untuk mencegahnya. */
const refs = [
  ...[...page.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map(m => m[1]),
  ...[...page.matchAll(/['"](\/(?:assets|thumbs)\/[^'"]+)['"]/g)].map(m => m[1]),
];
/* Ambangnya 1, bukan jumlah persisnya: angka itu berubah tiap kali satu seksi
   datang atau pergi. Ini cuma kenari untuk regex di atas — kalau nanti
   berkurang jadi nol, yang rusak regexnya. Yang menjaga tiap rujukannya ada
   adalah baris di bawah. */
assert.ok(refs.length > 1, 'tidak ada rujukan lokal yang terbaca — regexnya yang rusak');

const missing = refs.filter(u => !existsSync(pub(u)));
assert.deepStrictEqual(missing, [], `dirujuk page.tsx tapi tidak ada di public/: ${missing.join(', ')}`);

// ── 2. tiap foto/video PROJECTS ada, dan thumbnail-nya tidak lebih tua ──
const block = runtime.slice(runtime.indexOf('const PROJECTS = ['), runtime.indexOf('const PROJECTS_EN'));

/* Literal string dengan kutip mana pun. Satu nama berkas memang memakai
   apostrof ("...each user's Presence...") dan ditulis dengan kutip ganda; regex
   yang cuma mengenal kutip tunggal memotongnya di tengah dan melaporkan berkas
   hantu — persis sekali gagal palsu waktu checker ini ditulis. */
const STR = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g;
const strings = (s) => [...s.matchAll(STR)].map(m => (m[1] ?? m[2]).replace(/\\(.)/g, '$1'));

const projects = [...block.matchAll(/folder:\s*(['"])(.*?)\1[\s\S]*?images:\s*\[([\s\S]*?)\]/g)]
  .map(([, , folder, list]) => ({ folder, files: strings(list) }));
assert.ok(projects.length >= 20, `cuma ${projects.length} proyek terbaca — regexnya meleset`);

const gone = [];
const stale = [];
const noThumb = [];
let counted = 0;
for (const { folder, files } of projects) {
  for (const file of files) {
    counted++;
    const src = path.join(root, 'public/assets', folder, file);
    if (!existsSync(src)) { gone.push(`${folder}/${file}`); continue; }
    // Video tidak punya thumbnail — grid memakai foto pertama sebagai sampul.
    if (/\.(mp4|webm|mov|m4v)$/i.test(file)) continue;
    const thumb = path.join(root, 'public/thumbs', folder, `${file}.webp`);
    if (!existsSync(thumb)) noThumb.push(`${folder}/${file}`);
    else if (statSync(src).mtimeMs > statSync(thumb).mtimeMs) stale.push(`${folder}/${file}`);
  }
}
assert.deepStrictEqual(gone, [], `dirujuk PROJECTS tapi tidak ada di public/assets: ${gone.join(', ')}`);
assert.deepStrictEqual(noThumb, [], `belum punya thumbnail, jalankan "node tools/make-thumbs.mjs": ${noThumb.join(', ')}`);
assert.deepStrictEqual(stale, [], `thumbnail basi, jalankan "node tools/make-thumbs.mjs": ${stale.join(', ')}`);

// ── 3. berkas di public/assets yang tidak dirujuk siapa pun ikut terdeploy ──
const walk = (dir, base = '') => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(dir, e.name), base ? `${base}/${e.name}` : e.name)
                  : [{ rel: base ? `${base}/${e.name}` : e.name, size: statSync(path.join(dir, e.name)).size }]);
const used = new Set(projects.flatMap(({ folder, files }) => files.map(f => `${folder}/${f}`)));
const orphans = walk(path.join(root, 'public/assets')).filter(f => !used.has(f.rel));
assert.deepStrictEqual(orphans.map(f => f.rel), [],
  `ikut terdeploy tapi tidak dirujuk PROJECTS:\n  ${orphans.map(f => `${(f.size / 1024 / 1024).toFixed(2)} MB  ${f.rel}`).join('\n  ')}`);

/* Turunan yang sumbernya sudah tidak ada ikut terdeploy tanpa pernah diminta
   siapa pun — dan tidak tertangkap pemeriksaan di atas karena letaknya di
   thumbs/, bukan assets/. */
const thumbOrphans = walk(path.join(root, 'public/thumbs'))
  .filter(f => !existsSync(path.join(root, 'public/assets', f.rel.replace(/\.webp$/, ''))));
assert.deepStrictEqual(thumbOrphans.map(f => f.rel), [],
  `thumbnail tanpa sumber di public/assets:\n  ${thumbOrphans.map(f => f.rel).join('\n  ')}`);

/* ── 4. tekstur lanyard: satu berkas per tema, dan tidak boleh lebih tua dari
   sumbernya. Keduanya dipakai komponen R3F, bukan dirujuk dari markup, jadi
   yang hilang tidak akan tertangkap pemeriksaan (1) di atas — kartunya cuma
   berubah jadi tekstur bawaan card.glb tanpa satu pun pesan. */
for (const [hasil, sumber, tool] of [
  ['public/card-texture-dark.png', 'tools/source/profile.png', 'card-texture.mjs'],
  ['public/card-texture-light.png', 'tools/source/profile.png', 'card-texture.mjs'],
  ['public/lanyard.png', 'tools/lanyard-texture.mjs', 'lanyard-texture.mjs'],
]) {
  const out = path.join(root, hasil);
  assert.ok(existsSync(out), `${hasil} hilang — jalankan "node tools/${tool}"`);
  const src = path.join(root, sumber);
  if (existsSync(src)) {
    assert.ok(statSync(out).mtimeMs >= statSync(src).mtimeMs,
      `${hasil} lebih tua dari ${sumber} — lanyard masih memakai aset lama, jalankan "node tools/${tool}"`);
  }
}

console.log(`OK — ${refs.length} rujukan markup ada, ${counted} berkas PROJECTS lengkap dengan thumbnail segar, `
  + 'tidak ada aset yatim, tekstur kartu segar');

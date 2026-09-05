/* Cek kelengkapan dua bahasa. Yang paling mungkin busuk: proyek ke-21
   ditambahkan ke PROJECTS tapi lupa diterjemahkan, dan kunci UI yang cuma ada
   di salah satu bahasa.  Jalankan: node check-i18n.mjs */
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert';
import path from 'node:path';

const js = readFileSync(new URL('../components/portfolio-runtime.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');

/** Potong satu blok literal `nama = {` … `\n};` atau `nama = [` … `\n];`. */
const block = (decl, close) => {
  const at = js.indexOf(decl);
  assert.ok(at !== -1, `${decl} tidak ada di portfolio-runtime.js`);
  const end = js.indexOf(`\n${close};`, at);
  assert.ok(end !== -1, `${decl} tidak tertutup`);
  return js.slice(at, end);
};

// ── 1. tiap proyek punya terjemahan, dan deskripsinya ikut diterjemahkan ──
const ids = [...block('const PROJECTS = [', ']').matchAll(/^\s*id: '([^']+)'/gm)].map(m => m[1]);
assert.ok(ids.length >= 20, `cuma ${ids.length} proyek terbaca — regexnya meleset`);

const enBlock = block('const PROJECTS_EN = {', '}');
for (const id of ids) {
  const key = new RegExp(`^  '?${id}'?: \\{([\\s\\S]*?)^  \\},`, 'm').exec(enBlock);
  assert.ok(key, `proyek "${id}" belum ada di PROJECTS_EN`);
  /* Kutip mana pun: satu deskripsi memakai kutip ganda karena isinya
     mengandung apostrof ("today's industrial challenges"), dan regex yang cuma
     mengenal kutip tunggal melaporkannya sebagai terjemahan yang hilang. */
  assert.ok(/\bdesc: ['"]/.test(key[1]), `proyek "${id}" belum punya terjemahan desc`);
  /* `title` juga, dan itu bukan kelengkapan yang mengada-ada: t() jatuh ke
     nilai bahasa Indonesia kalau kunci Inggrisnya tidak ada, jadi judul yang
     lupa diterjemahkan tampil apa adanya di mode Inggris — tanpa error, tanpa
     kolom kosong. Persis itu yang terjadi pada "expo". */
  assert.ok(/\btitle: ['"]/.test(key[1]), `proyek "${id}" belum punya terjemahan title`);
}

// ── 2. kamus UI: kunci id dan en harus persis sama ──
const keysOf = (l) => {
  const at = js.indexOf(`  ${l}: {`) + `  ${l}: {`.length;   // lewati kunci bahasanya sendiri
  // Kosongkan dulu isi string — nilai seperti 'Email disalin: ' ikut terjaring kalau tidak.
  const body = js.slice(at, js.indexOf('\n  },', at)).replace(/'(?:[^'\\]|\\.)*'/g, "''");
  return [...body.matchAll(/(\w+):/g)].map(m => m[1]).sort();
};
assert.deepStrictEqual(keysOf('id'), keysOf('en'), 'kunci UI.id dan UI.en tidak sama');

// ── 3. tiap kategori punya label Inggris, dan sisi Indonesianya bukan salinannya ──
const catId = Object.fromEntries([...block('const CATEGORIES = {', '}')
  .matchAll(/^\s{2}(\w+):\s*\{ label: '([^']*)' \}/gm)].map(m => [m[1], m[2]]));
const catEn = Object.fromEntries([...block('const CATEGORIES_EN = {', '}')
  .matchAll(/^\s{2}(\w+): '([^']*)'/gm)].map(m => [m[1], m[2]]));
assert.ok(Object.keys(catId).length >= 4, `cuma ${Object.keys(catId).length} kategori terbaca — regexnya meleset`);
for (const [cat, label] of Object.entries(catId)) {
  assert.ok(catEn[cat], `kategori "${cat}" belum diterjemahkan`);
  /* Identik = sisi Indonesia masih berisi teks Inggris, dan lencana kartu
     tetap berbahasa Inggris saat halaman dipindah ke Indonesia. Pernah kena
     tiga dari empat kategori sekaligus, tanpa satu pun uji ikut merah. */
  assert.notStrictEqual(label, catEn[cat], `label kategori "${cat}" sama di kedua bahasa: "${label}"`);
}

/* ── 4. tiap foto punya keterangan Indonesia ──
   Keterangan versi Inggris = nama berkasnya sendiri (captionOf), jadi menambah
   foto TIDAK pernah merah di sisi Inggris — dan sisi Indonesianya diam-diam
   ikut berbahasa Inggris kalau barisnya lupa ditulis. Itu yang dijaga di sini.

   Sumbernya isi public/assets, bukan daftar di kode: check-assets.mjs sudah
   memastikan tak ada berkas yatim di sana, jadi apa yang ada di cakram persis
   apa yang dipakai — dan itu satu-satunya daftar yang ikut berubah sendiri
   saat foto ditambah, dihapus, atau namanya diubah. */
const fotoDipakai = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return fotoDipakai(p);
  return /\.(jpe?g|png|webp|mp4|webm|mov|m4v)$/i.test(e.name) ? [e.name.replace(/\.[^.]+$/, '')] : [];
});
const aset = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')),
  '..', 'public', 'assets');
/* Bernomor ("7") dan tangkapan layar sengaja dilewati — keduanya dapat
   keterangan umum bernomor dari kamus UI, yang sudah dwibahasa. */
const fotoNyata = [...new Set(fotoDipakai(aset))]
  .filter((n) => !(/^\d+$/.test(n) || /^Screenshot/i.test(n)));
const kamusFoto = readFileSync(new URL('../components/photo-captions.ts', import.meta.url), 'utf8');
const fotoKunci = new Set([...kamusFoto.matchAll(/^ {2}(['"])((?:\\.|(?!\1).)*)\1:/gm)].map(m => m[2]));

assert.ok(fotoNyata.length >= 100, `cuma ${fotoNyata.length} foto terbaca di public/assets — jalurnya meleset`);
for (const nama of fotoNyata)
  assert.ok(fotoKunci.has(nama), `foto "${nama}" belum punya keterangan Indonesia di PHOTOS_ID`);
/* Kunci yatim = foto yang namanya diubah atau dihapus, dan barisnya tertinggal
   di kamus. Tidak merusak apa pun, tapi kamus yang menumpuk sampah akan
   membuat yang benar-benar hilang sulit terlihat. */
for (const kunci of fotoKunci)
  assert.ok(fotoNyata.includes(kunci), `PHOTOS_ID punya "${kunci}", tapi fotonya tidak ada di public/assets`);

// ── 5. tidak ada data-en kosong di markup ──
for (const [, attr] of html.matchAll(/(data-en(?:-[\w-]+)?)=(?:""|''|\{''\}|\{""\})/g))
  assert.fail(`${attr} kosong di app/page.tsx`);

const count = (html.match(/\sdata-en[=-]/g) || []).length;
console.log(`OK — ${ids.length} proyek diterjemahkan, ${fotoNyata.length} keterangan foto punya padanan Indonesia, `
  + `${count} slot data-en di page.tsx terisi`);

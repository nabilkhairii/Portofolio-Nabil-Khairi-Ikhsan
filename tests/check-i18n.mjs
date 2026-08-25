/* Cek kelengkapan dua bahasa. Yang paling mungkin busuk: proyek ke-21
   ditambahkan ke PROJECTS tapi lupa diterjemahkan, dan kunci UI yang cuma ada
   di salah satu bahasa.  Jalankan: node check-i18n.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert';

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
  assert.ok(/\bdesc: '/.test(key[1]), `proyek "${id}" belum punya terjemahan desc`);
}

// ── 2. kamus UI: kunci id dan en harus persis sama ──
const keysOf = (l) => {
  const at = js.indexOf(`  ${l}: {`) + `  ${l}: {`.length;   // lewati kunci bahasanya sendiri
  // Kosongkan dulu isi string — nilai seperti 'Email disalin: ' ikut terjaring kalau tidak.
  const body = js.slice(at, js.indexOf('\n  },', at)).replace(/'(?:[^'\\]|\\.)*'/g, "''");
  return [...body.matchAll(/(\w+):/g)].map(m => m[1]).sort();
};
assert.deepStrictEqual(keysOf('id'), keysOf('en'), 'kunci UI.id dan UI.en tidak sama');

// ── 3. tiap kategori punya label Inggris ──
for (const cat of [...block('const CATEGORIES = {', '}').matchAll(/^\s{2}(\w+):/gm)].map(m => m[1]))
  assert.ok(block('const CATEGORIES_EN = {', '}').includes(`${cat}:`), `kategori "${cat}" belum diterjemahkan`);

// ── 4. tidak ada data-en kosong di markup ──
for (const [, attr] of html.matchAll(/(data-en(?:-[\w-]+)?)=(?:""|''|\{''\}|\{""\})/g))
  assert.fail(`${attr} kosong di app/page.tsx`);

const count = (html.match(/\sdata-en[=-]/g) || []).length;
console.log(`OK — ${ids.length} proyek diterjemahkan, ${count} slot data-en di page.tsx terisi`);

/* Uji encoding sumber. Yang dijaga: tidak ada berkas sumber yang berisi jejak
   UTF-8 yang pernah dibaca sebagai cp1252 lalu disimpan ulang sebagai UTF-8
   (mojibake). Sekali terjadi, em dash jadi tiga karakter aneh dan `═` menyeret
   control C1 ke dalam berkas — dan semuanya lolos build, lint, dan tsc tanpa
   sepatah pun peringatan. Pemicunya: menulis berkas lewat Windows PowerShell
   5.1 (Set-Content/Out-File default ke codepage ANSI).
   Jalankan: node check-encoding.mjs */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import assert from 'node:assert';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SKIP = new Set(['node_modules', '.next', '.git', 'graphify-out', 'public', 'app/font']);
const EXT = /\.(css|tsx?|jsx?|mjs|md|json)$/;

/* Control C1 tidak pernah sah di sumber; C2/C3/E2 adalah lead byte UTF-8 yang
   terbaca sebagai cp1252 — huruf yang sah di bahasa lain, tapi tidak di repo
   ini (Indonesia + Inggris). */
const suspect = (cp) => (cp >= 0x0080 && cp <= 0x009f) || cp === 0x00c2 || cp === 0x00c3 || cp === 0x00e2;

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const path = join(dir, e.name);
  if (SKIP.has(e.name) || SKIP.has(relative(ROOT, path).replace(/\\/g, '/'))) return [];
  return e.isDirectory() ? walk(path) : EXT.test(e.name) ? [path] : [];
});

const files = walk(ROOT);
assert.ok(files.length > 20, `hanya ${files.length} berkas terpindai — jalurnya salah?`);

const bad = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    const hits = [...line].filter((c) => suspect(c.codePointAt(0)));
    if (hits.length) {
      const codes = [...new Set(hits)].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
      bad.push(`${relative(ROOT, file)}:${i + 1} — ${hits.length}x ${codes.join(' ')}`);
    }
  });
}

assert.deepStrictEqual(bad.slice(0, 10), [], `mojibake di ${bad.length} baris:\n  ${bad.slice(0, 10).join('\n  ')}`);
console.log(`OK — ${files.length} berkas sumber UTF-8 bersih, tanpa jejak cp1252`);

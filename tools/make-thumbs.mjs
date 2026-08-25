/* Membuat pratinjau kecil untuk kartu proyek dan strip thumbnail galeri.
   Aslinya foto penuh yang dipakai: satu di antaranya 6936x9248 — 64 megapiksel
   yang harus didekode di main thread tepat saat panelnya dibuat, dan itu yang
   membuat perpindahan slide tersendat. Foto penuh tetap dipakai di tampilan
   utama lightbox; hanya yang tampil kecil yang diganti.

   Jalankan dari akar proyek setelah menambah gambar di public/assets/:
     node tools/make-thumbs.mjs
   sharp menumpang dari dependency Next di node_modules — tak ada paket baru. */
import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'public/assets';
const OUT = 'public/thumbs';
const WIDTH = 1100;    // panel terlebar ~720px; cukup untuk layar 1.5x
const QUALITY = 72;

const files = [];
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else if (/\.(jpe?g|png|webp)$/i.test(e.name)) files.push(p);
  }
}
await walk(SRC);

let made = 0, skipped = 0, bytesIn = 0, bytesOut = 0;
for (const f of files) {
  // Ekstensi asli dipertahankan, jadi "2.png" dan "2.jpeg" di satu folder tidak
  // saling menimpa — dan di sisi browser namanya cukup nama file + ".webp".
  const rel = path.relative(SRC, f);
  const out = path.join(OUT, rel + '.webp');
  const srcStat = await stat(f);
  bytesIn += srcStat.size;

  const fresh = await stat(out).then(s => s.mtimeMs >= srcStat.mtimeMs, () => false);
  if (fresh) {
    bytesOut += (await stat(out)).size;
    skipped++;
    continue;
  }

  await mkdir(path.dirname(out), { recursive: true });
  await sharp(f, { limitInputPixels: false })
    .rotate()                                            // hormati EXIF orientation
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(out);
  bytesOut += (await stat(out)).size;
  made++;
}

const mb = (b) => (b / 1048576).toFixed(1) + ' MB';
console.log(`${made} dibuat, ${skipped} dilewati — ${mb(bytesIn)} -> ${mb(bytesOut)}`);

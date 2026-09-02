/* Rasio lebar:tinggi tiap thumbnail -> components/photo-ratios.json.

   Dipakai hamparan foto proyek akademik & sertifikasi (.sc-shots di
   app/portfolio.css): lebar tiap ubin dibuat sebanding dengan rasio fotonya
   (flex-grow: var(--ar)), jadi seluruh ubin dalam satu baris berakhir setinggi
   yang sama TANPA satu foto pun dipotong. Itu cuma bisa kalau rasionya
   diketahui sebelum halaman dirender — dan CSS tidak bisa menanyakannya.

   Dibaca dari THUMBNAIL, bukan berkas aslinya: keduanya serasio (make-thumbs
   hanya menurunkan lebarnya ke 1100px), dan berkas asli ada yang puluhan
   megapiksel. Jalankan ulang setiap kali ada foto baru:

     node tools/photo-ratios.mjs

   tests/check-assets.mjs menahan berkas ini tetap lengkap: tiap foto yang
   dirujuk kedua komponen itu harus punya rasionya di sini. */

import { readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const thumbs = path.join(root, 'public/thumbs');
const out = path.join(root, 'components/photo-ratios.json');

/* Kuncinya "folder/nama-berkas-asli", bentuk yang sama dengan yang ditulis
   datanya di komponen — ekstensi .webp milik thumbnail-nya dilepas. */
const ratios = {};
for (const folder of readdirSync(thumbs, { withFileTypes: true })) {
  if (!folder.isDirectory()) continue;
  for (const file of readdirSync(path.join(thumbs, folder.name))) {
    if (!file.endsWith('.webp')) continue;
    const { width, height } = await sharp(path.join(thumbs, folder.name, file)).metadata();
    if (!width || !height) continue;
    ratios[`${folder.name}/${file.slice(0, -'.webp'.length)}`] = +(width / height).toFixed(3);
  }
}

const sorted = Object.fromEntries(Object.entries(ratios).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(out, JSON.stringify(sorted, null, 2) + '\n');
console.log(`OK — ${Object.keys(sorted).length} rasio ditulis ke components/photo-ratios.json`);

# Portofolio — M. Nabil Khairi Ikhsan

Satu halaman Next.js (App Router, Turbopack) berisi profil, keahlian, galeri
dokumentasi 20 proyek, dan kartu identitas 3D yang bisa ditarik.

## Struktur

```
app/
  layout.tsx          <html>, font, metadata, skrip tema sebelum paint
  page.tsx            seluruh markup halaman (kelas & id di sini dipakai runtime)
  globals.css         Tailwind v4 + @theme; mengimpor portfolio.css
  portfolio.css       seluruh gaya: token warna, band, tipografi, komponen
components/
  portfolio-runtime.js  seluruh perilaku: bahasa ID/EN, reveal, split & stroke
                        text, aurora, marquee, dock, specular, scroll-scrub,
                        grid proyek + filter, galeri, nav, tema, form
  site-behavior.tsx     memuat runtime itu setelah React memasang DOM
  lanyard.tsx           komponen Lanyard (three + rapier + meshline)
  lanyard-mount.tsx     memasangnya di hero dengan parameter kartu ini
public/
  assets/…            foto & video dokumentasi (sumber galeri)
  thumbs/…            turunan .webp untuk panel & strip galeri
  card.glb            model kartu lanyard
  card-texture-*.png  muka kartu, satu per tema
  lanyard.png         pita tali bertulisan (satu warna, kedua tema)
  cv.pdf
tools/                generator aset (bukan bagian build)
tests/                checker, satu berkas per hal yang diuji
docs/                 dokumen desain
```

Tiga berkas saling terikat: `page.tsx` menyediakan kelas/id, `portfolio.css`
memberinya bentuk, `portfolio-runtime.js` menghidupkannya. Menghapus `.reveal`,
`#filters`, atau `data-en` di markup akan mematikan satu fungsi tanpa pesan
error — karena itu ada `tests/`.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3001
npm run build && npm start
```

Port 3001, bukan 3000 bawaan Next: di mesin ini 3000 dipegang Grafana.

## Uji

```bash
npm run check           # 7 checker statis, cepat, tanpa browser
npm run check:browser   # butuh `npm run build` lebih dulu
```

| berkas | yang dibuktikan |
|---|---|
| `check-assets.mjs` | tiap rujukan aset ada, thumbnail segar, tidak ada aset yatim yang ikut terdeploy |
| `check-contrast.mjs` | kontras kedua tema ≥ 4.5:1 |
| `check-encoding.mjs` | tidak ada sumber yang ter-mojibake (UTF-8 dibaca sebagai cp1252) |
| `check-i18n.mjs` | tiap proyek & kunci UI punya terjemahan, tidak ada slot `data-en` kosong |
| `check-marquee.mjs` | penyalinan marquee benar dan tidak berlipat saat dibangun ulang |
| `check-spec-count.mjs` | tiap angka spec menghitung ke nilai markup, bentuknya utuh sepanjang animasi |
| `check-split.mjs` | pemecahan teks per kata/huruf: penekanan bertahan, tautan dilewati, tidak menumpuk |
| `check-lanyard-next.mjs` | di Chrome sungguhan: lanyard berdiri, talinya berayun, konsol bersih |
| `check-gallery.mjs` | galeri proyek terbuka **di tengah layar**, isinya terisi, Escape menutup |

Dua checker browser dilewati (bukan gagal) kalau Chrome/Edge tidak ada.

## Aset

Foto galeri dibaca runtime dari `public/assets/<folder>/<berkas>`, panelnya dari
`public/thumbs/<folder>/<berkas>.webp`. Setelah menambah atau mengganti foto:

```bash
node tools/make-thumbs.mjs        # bikin/segarkan turunan .webp
npm run check                     # pastikan tidak ada yang tertinggal
```

Sertifikat tidak difoto sendiri: `tools/cert-shots.mjs` memotretnya dari halaman
verifikasi Kemnaker (`credential:` di `components/portfolio-runtime.js`) ke
`public/assets/<folder>/`, lalu ditampilkan di kotak sertifikatnya sendiri —
di atas kartu dokumentasi, bertaut ke halaman verifikasinya. Berkas itu TIDAK
masuk `images:`: galerinya khusus dokumentasi kegiatan.
Berkas yang sudah ada dilewati — tambahkan `--force` untuk memotret ulang.

Sertifikat dari penerbit lain tidak dipotret: alamatnya berkas asli, bukan
halaman yang menggambar sertifikatnya. Yang seperti itu dirasterkan sekali dari
berkasnya sendiri (`pdftoppm -png -r 150 -singlefile <pdf> <keluaran>`; PDF-nya
disimpan di `tools/source/`, tidak ikut ke `public/`), lalu namanya ditulis di
`certificate:` entri yang bersangkutan.

### Lanyard 3D

Muka kartu punya **satu tekstur per tema** — terang di tema gelap, gelap di tema
terang, supaya selalu terlihat di atas latarnya; fotonya sendiri tidak ikut
dibalik. Komponennya memuat kedua varian sekaligus lalu tinggal memilih, jadi
menekan tombol tema tidak mengunduh apa pun dan tidak me-reset fisika talinya.
Talinya satu warna (#424242) untuk kedua tema.

```bash
node tools/card-texture.mjs      # -> public/card-texture-{dark,light}.png
node tools/lanyard-texture.mjs   # -> public/lanyard.png
```

Muka kartu dibuat dari `tools/source/profile.png`: foto dipakai berikut
latarnya, selebar muka kartu penuh, dipotong 4:5 dan sudutnya dibulatkan ala
Apple (superellipse, bukan busur lingkaran). Knob di kepala berkasnya —
`TOP_BIAS` (ruang di atas kepala), `RADIUS_RATIO` + `SQUIRCLE_N` (kebulatan
sudut), `PHOTO_RATIO`. `tools/cutout.mjs` membuat versi tanpa latar dan sudah
tidak dipakai pipeline ini.

Tali bertuliskan "Electronics / Engineering" dalam **Suissnord**
(`app/font/suissnord-font/`). Fontnya tidak perlu terpasang di sistem — Pango
memuat berkasnya langsung saat generator jalan, lalu bentuknya dipanggang ke
PNG, jadi mesin lain tetap dapat hasil yang sama dan berkas fontnya sendiri
tidak ikut terdeploy (lihat `.vercelignore`).

`TEXT` berisi satu elemen per baris — dua baris karena huruf Suissnord lebar;
satu baris 23 karakter berakhir setinggi ~5px di layar. Knob lain: `BG`, `FG`,
`BOLD` (penebalan, karena fontnya cuma satu berat), `SPACING`, `FILL`, `MAX_H`
(ini yang mengikat pada teks dua baris), `SCALE`. Ukuran tulisan di layar juga
bergantung pada `repeat` meshline di `components/lanyard.tsx` — alasannya ada di
komentar keduanya.

## Deploy (Vercel)

Proyek Next standar — tanpa env var, tanpa konfigurasi khusus; `next build`
sudah cukup. `.vercelignore` menahan `tools/`, `tests/`, `docs/`, dan
`graphify-out/` supaya tidak ikut terunggah.

Satu hal yang perlu diketahui: `public/` berukuran **84 MB**, 29 MB di antaranya
satu video (`public/assets/Robotika Lanjut/7.mp4`). Deploy lewat Git aman;
deploy lewat `vercel` CLI di paket Hobby dibatasi 100 MB berkas sumber, jadi
ruangnya tinggal ~15 MB. Kalau nanti mepet, kompres video itu lebih dulu
(mis. `ffmpeg -i 7.mp4 -vcodec libx264 -crf 28 -vf scale=-2:720 7.mp4`).

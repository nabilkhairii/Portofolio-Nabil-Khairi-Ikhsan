'use client';

/* portfolio-runtime.js menjalankan seluruh perilaku halaman: tombol bahasa,
   reveal, split text, stroke text, aurora, marquee, dock, grid proyek +
   filter, galeri, nav, dan form. Semuanya bekerja langsung di DOM lewat
   id/kelas yang dipasang page.tsx.

   Penukaran teks statis ID/EN sendiri ada di lang-swap.ts dan dipanggil di
   sini lebih dulu — berkas itu menjelaskan kenapa ia tidak boleh ikut
   menunggu chunk runtime.

   Vanilla, bukan React: 1.600 baris itu sudah teruji apa adanya (lihat
   tests/), dan menuliskannya ulang jadi komponen cuma menambah versi kedua
   yang bisa berbeda diam-diam tanpa satu pun perilaku baru.

   Di dalam useEffect, bukan saat render: berkas itu mengambil elemen di ruang
   modul (document.querySelectorAll('[data-en]') dan seterusnya), jadi ia harus
   berjalan setelah React memasang DOM-nya. Modul di-cache, jadi Strict Mode
   yang memanggil efek dua kali tetap menjalankannya sekali. */

import { useEffect } from 'react';

import { langAwal, tukarTeksStatis } from './lang-swap';

export function SiteBehavior() {
  useEffect(() => {
    /* Bahasa dulu, runtime belakangan — dan impornya sengaja statis: berkas
       ini ikut bundel utama yang sudah terunduh saat efek ini jalan, jadi
       teksnya berpindah ke bahasa yang benar tanpa menunggu chunk runtime.
       Kalau ditunggu, di HP lambat halaman terbaca Indonesia ~1,5 detik
       lebih dulu. Catatan lengkapnya di lang-swap.ts. */
    tukarTeksStatis(langAwal());

    void import('./portfolio-runtime.js');
  }, []);

  return null;
}

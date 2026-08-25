'use client';

/* portfolio-runtime.js menjalankan seluruh perilaku halaman: bahasa ID/EN,
   reveal, split text, stroke text, aurora, marquee, dock, grid proyek +
   filter, galeri, nav, tema, dan form. Semuanya bekerja langsung di DOM lewat
   id/kelas yang dipasang page.tsx.

   Vanilla, bukan React: 1.600 baris itu sudah teruji apa adanya (lihat
   tests/), dan menuliskannya ulang jadi komponen cuma menambah versi kedua
   yang bisa berbeda diam-diam tanpa satu pun perilaku baru.

   Di dalam useEffect, bukan saat render: berkas itu mengambil elemen di ruang
   modul (document.querySelectorAll('[data-en]') dan seterusnya), jadi ia harus
   berjalan setelah React memasang DOM-nya. Modul di-cache, jadi Strict Mode
   yang memanggil efek dua kali tetap menjalankannya sekali. */

import { useEffect } from 'react';

export function SiteBehavior() {
  useEffect(() => {
    // @ts-expect-error — portfolio-runtime.js tidak punya import/export sama
    // sekali, jadi TS menganggapnya skrip global alih-alih modul. Menambahkan
    // `export {}` cuma untuk menyenangkan TS akan mengubah berkas yang
    // seluruh isinya berjalan di ruang global; bundler-nya sendiri tidak
    // keberatan memuatnya seperti ini.
    void import('./portfolio-runtime.js');
  }, []);

  return null;
}

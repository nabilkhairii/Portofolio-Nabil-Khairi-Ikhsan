'use client';

import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils';

/* ThemeToggle (21st.dev) — pil 64x32: bulatan aktif meluncur ke sisi lain,
   ikonnya bertukar. Menggantikan #theme-btn lama (44px, satu ikon).

   Yang berbeda dari komponen aslinya, semuanya karena halaman ini:

   1. <button>, bukan <div role="button" tabIndex={0}>. Aslinya hanya punya
      onClick — dengan role="button" pembaca layar mengumumkannya sebagai
      tombol, tapi Enter/Spasi tidak melakukan apa-apa. Yang digantikannya
      adalah <button> sungguhan, jadi menyalinnya apa adanya justru MENGHAPUS
      operasi keyboard yang sudah ada. Rupanya identik; kelasnya tak berubah.
   2. Sumber kebenarannya data-theme di <html>, bukan useState lokal. Aslinya
      menandai titik ini dengan blok next-themes yang dikomentari; proyek ini
      tidak memakai next-themes — temanya sudah hidup sebagai atribut yang
      ditulis sebelum paint pertama di layout.tsx, lalu disimpan ke
      localStorage. Tiga hal yang dulu diurus portfolio-runtime.js pindah ke
      sini seluruhnya: atribut, localStorage, dan <meta name="theme-color">.
   3. Tidak menyimpan state sama sekali: atributnya DIBACA lewat
      useSyncExternalStore, dengan MutationObserver sebagai langganannya.
      Menyalin tema ke useState berarti dua salinan satu keadaan, dan salinan
      React akan meleset begitu ada yang menulis data-theme dari luar. Server
      tidak bisa tahu tema simpanan, jadi getServerSnapshot memakai gelap
      (bawaan halaman) dan React menyelaraskannya sendiri setelah hidrasi —
      tanpa hydration mismatch dan tanpa setState di dalam effect.
   4. aria-label + data-en-aria-label dipertahankan dari tombol lama supaya
      ganti bahasa tetap menamainya ulang. Keduanya tetap di JSX, jadi React
      tidak menimpanya kembali saat bulatannya bergeser. */

const THEME_COLOR = { light: '#ffffff', dark: '#000000' };

/* Di luar komponen: acuannya harus tetap sama antar render, kalau tidak
   useSyncExternalStore berlangganan ulang tiap render. */
const subscribe = (onChange: () => void) => {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributeFilter: ['data-theme'] });
  return () => mo.disconnect();
};
const isDarkNow = () => document.documentElement.dataset.theme !== 'light';
const isDarkOnServer = () => true;

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useSyncExternalStore(subscribe, isDarkNow, isDarkOnServer);

  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;   // MutationObserver di atas yang memicu render
    try { localStorage.setItem('theme', next); } catch { /* The current tab still uses the selection. */ }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[next]);
  };

  return (
    <button
      type="button"
      className={cn(
        'theme-toggle relative flex w-[88px] h-11 p-1 rounded-full cursor-pointer transition-[background-color,border-color] duration-300 motion-reduce:transition-none',
        'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--m-blue-dark)]',
        'border',
        className
      )}
      onClick={toggle}
      aria-label="Ganti mode terang / gelap"
      data-en-aria-label="Toggle light / dark mode"
      aria-pressed={!isDark}
    >
      <span aria-hidden="true" className="theme-thumb absolute w-9 h-9 rounded-full transition-transform duration-300 motion-reduce:transition-none" />
      <span className="relative flex justify-between items-center w-full" aria-hidden="true">
        <span className="flex justify-center items-center w-9 h-9"><Moon className="w-5 h-5" strokeWidth={1.5} /></span>
        <span className="flex justify-center items-center w-9 h-9"><Sun className="w-5 h-5" strokeWidth={1.5} /></span>
      </span>
    </button>
  );
}

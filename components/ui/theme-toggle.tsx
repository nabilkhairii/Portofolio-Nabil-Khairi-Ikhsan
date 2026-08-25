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
    localStorage.setItem('theme', next);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[next]);
  };

  return (
    <button
      type="button"
      className={cn(
        'flex w-[88px] h-11 p-1 rounded-full cursor-pointer transition-all duration-300',
        'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--m-blue-dark)]',
        isDark
          ? 'bg-zinc-950 border border-zinc-800'
          : 'bg-white border border-zinc-200',
        className
      )}
      onClick={toggle}
      aria-label="Ganti mode terang / gelap"
      data-en-aria-label="Toggle light / dark mode"
      aria-pressed={!isDark}
    >
      <div className="flex justify-between items-center w-full">
        <div
          className={cn(
            'flex justify-center items-center w-9 h-9 rounded-full transition-transform duration-300',
            isDark
              ? 'transform translate-x-0 bg-zinc-800'
              : 'transform translate-x-11 bg-gray-200'
          )}
        >
          {isDark ? (
            <Moon className="w-5 h-5 text-white" strokeWidth={1.5} />
          ) : (
            <Sun className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
          )}
        </div>
        <div
          className={cn(
            'flex justify-center items-center w-9 h-9 rounded-full transition-transform duration-300',
            isDark ? 'bg-transparent' : 'transform -translate-x-11'
          )}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
          ) : (
            <Moon className="w-5 h-5 text-black" strokeWidth={1.5} />
          )}
        </div>
      </div>
    </button>
  );
}

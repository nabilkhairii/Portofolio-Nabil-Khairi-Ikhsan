'use client';

import { ArrowRight } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

/* FlowButton (21st.dev) — dipakai untuk "Hubungi Saya" dan "Unduh CV". Saat disorot:
   pil berubah jadi kotak membulat, lingkaran tumbuh dari tengah, label
   bergeser ke kanan, dan panah bertukar tempat (yang kanan keluar, yang kiri
   masuk).

   Yang berbeda dari komponen aslinya, semuanya karena halaman ini:

   1. Bisa jadi <a>. "Hubungi Saya" menuju #contact, "Unduh CV" ke berkas PDF.
   2. Prop `en`, sama seperti OriginButton: penanda bahasa harus di span label,
      karena portfolio-runtime.js menulis ulang innerHTML tiap [data-en].
   3. #111111/white mati diganti --ink/--canvas: keduanya bertukar saat mode
      terang menyala, jadi hitam-mati akan hilang di latar gelap.
   4. Tidak memakai .btn. Efek ini memiliki radius, border, dan padding-nya
      sendiri (pil → kotak membulat), dan .btn mengunci border-radius 999px.
      Ukuran & huruf disamakan manual dengan .btn supaya tetap sebaris dengan
      tombol tetangganya.
   5. Lingkarannya 320px, bukan 220px: label versi kapital-berspasi lebih lebar
      dari contoh aslinya, dan 220px menyisakan sudut yang tidak tertutup. */

type FlowButtonProps = {
  text: string;
  /** Teks Inggrisnya. Dipasang sebagai data-en di span label. */
  en?: string;
} & (
  | ({ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
);

export function FlowButton({ text, en, className, ...props }: FlowButtonProps) {
  const classes = cn(
    'group relative inline-flex items-center justify-center gap-1 overflow-hidden',
    'min-h-12 rounded-[100px] border-[1.5px] border-[var(--ink)]/40 bg-transparent px-8 py-3',
    'text-[14px] font-bold uppercase tracking-[1.5px] text-[var(--ink)] cursor-pointer',
    'transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
    'hover:rounded-[12px] hover:border-transparent hover:text-[var(--canvas)] active:scale-[0.95]',
    'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--m-blue-dark)]',
    className
  );

  const layers = (
    <>
      {/* panah kiri — masuk dari luar bidang */}
      <ArrowRight
        className="absolute left-[-25%] z-[9] h-4 w-4 fill-none stroke-[var(--ink)] transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:left-4 group-hover:stroke-[var(--canvas)]"
        aria-hidden="true"
      />

      <span
        className="relative z-[1] -translate-x-3 transition-all duration-[800ms] ease-out group-hover:translate-x-3"
        data-en={en}
      >
        {text}
      </span>

      <span
        className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ink)] opacity-0 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:h-[320px] group-hover:w-[320px] group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* panah kanan — keluar ke luar bidang */}
      <ArrowRight
        className="absolute right-4 z-[9] h-4 w-4 fill-none stroke-[var(--ink)] transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:right-[-25%] group-hover:stroke-[var(--canvas)]"
        aria-hidden="true"
      />
    </>
  );

  return props.href !== undefined ? (
    <a className={classes} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {layers}
    </a>
  ) : (
    <button className={classes} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {layers}
    </button>
  );
}

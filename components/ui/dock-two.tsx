'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import { Cpu, LayoutGrid, Mail, User, type LucideIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

/* Dock (21st.dev) — pil mengambang berisi tombol ikon: seluruh piringnya
   naik-turun pelan tanpa henti, tiap ikon membesar dan terangkat saat disorot,
   dan labelnya muncul di atasnya. Menggantikan dock lama yang membesar
   mengikuti kedekatan kursor (.dock__item + magnifyDock di runtime).

   Yang berbeda dari komponen aslinya, semuanya karena halaman ini:

   1. Impor dari `motion/react`, bukan `framer-motion`. Paket yang sama, nama
      barunya, dan `motion` sudah terpasang di proyek ini untuk OriginButton —
      menambah framer-motion berarti dua salinan pustaka yang sama di bundle.
   2. Panggung demonya dibuang. Aslinya membungkus pilnya dalam dua div
      `h-64` + `max-w-4xl` yang memusatkannya di tengah layar; di sini dock
      duduk di baris header setinggi 64px, dan panggung 256px itu akan
      merobeknya. Yang disalin cuma pilnya. <nav> pembungkus tetap di page.tsx
      supaya aria-label + data-en-aria-label-nya ikut ganti bahasa.
   2b. Tingginya dipaku h-11 (44px) — sama dengan .lang-btn dan .menu-btn, jadi
      seluruh barisan kanan header sejajar. p-2/p-3 aslinya menghasilkan 60px:
      nyaris setinggi barnya sendiri, dan gerak mengambang ±2px menyentuh
      tepinya. Dipaku, bukan dijumlah dari padding: bordernya ikut menambah
      tinggi di sini, jadi 4+8+20+8+4 meleset 2px dari yang dihitung.
   3. Itemnya <a href>, bukan <button onClick>. Keempatnya tautan jangkar
      (#about … #contact); memaksanya jadi tombol mematikan klik-tengah,
      klik-kanan, dan buka-tab.
   3b. Daftar itemnya tinggal DI SINI, bukan dioper sebagai prop `items` seperti
      aslinya. page.tsx adalah Server Component dan LucideIcon adalah fungsi —
      React menolak fungsi yang menyeberangi batas server/klien ("Functions
      cannot be passed directly to Client Components"). Prop items juga tidak
      ada gunanya di sini: navnya cuma satu dan tidak pernah berbeda.
   4. Warna dipetakan ke token halaman ini. Aslinya memakai nama shadcn
      (bg-secondary, bg-popover, border-border, text-foreground) yang tidak
      ada di @theme proyek ini — kelasnya akan diam-diam tidak menghasilkan
      apa pun. Padanannya: soft, elevated, hairline, ink.
   5. Animasi mengambangnya dihentikan saat prefers-reduced-motion menyala.
      Gerakan tanpa henti di header yang selalu terlihat adalah persis yang
      dimatikan setelan itu, dan sisa halaman ini sudah menghormatinya. */

/* Beranotasi Variants supaya 'easeInOut' tetap terbaca sebagai Easing; tanpa
   anotasi TS melebarkannya jadi string dan motion menolaknya. */
const floatingAnimation: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-2, 2, -2],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

type DockItem = {
  icon: LucideIcon;
  label: string;
  href: string;
};

const ITEMS: DockItem[] = [
  { icon: User, label: 'About', href: '#about' },
  { icon: Cpu, label: 'Skills', href: '#skills' },
  { icon: LayoutGrid, label: 'Projects', href: '#experience' },
  { icon: Mail, label: 'Contact', href: '#contact' },
];

function DockIconButton({ icon: Icon, label, href }: DockItem) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        /* inline-flex, bukan <a> inline bawaan: ikon SVG yang inline duduk di
           garis dasar dan menyisakan ~2,5px di bawahnya — pil dock jadi 46,5px
           dan meleset dari 44px tetangganya tanpa ada yang terlihat salah. */
        'relative group inline-flex p-2 rounded-full',
        'text-bodytx hover:text-ink hover:bg-soft transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m-blue-dark)]'
      )}
    >
      <Icon className="w-5 h-5" />
      {/* opacity-0, bukan hidden: label ini nama aksesibel tautannya, jadi
          pembaca layar tetap harus menemukannya. Digantung di BAWAH ikon
          (top-full), bukan di atas seperti aslinya — dock ini menempel di tepi
          paling atas layar, dan tooltip -top-8 akan keluar dari viewport. */}
      <span
        className={cn(
          'absolute top-full mt-1.5 left-1/2 -translate-x-1/2',
          'px-2 py-1 rounded text-[11px] font-bold uppercase tracking-[1.5px]',
          'bg-elevated text-ink border border-hairline',
          'opacity-0 group-hover:opacity-100',
          'transition-opacity whitespace-nowrap pointer-events-none'
        )}
      >
        {label}
      </span>
    </motion.a>
  );
}

export function Dock({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      animate={reduced ? 'initial' : 'animate'}
      variants={floatingAnimation}
      className={cn(
        'flex items-center gap-0.5 h-11 p-1 rounded-full',
        'backdrop-blur-lg border shadow-lg',
        'bg-canvas/90 border-hairline',
        'hover:shadow-xl transition-shadow duration-300',
        className
      )}
    >
      {ITEMS.map((item) => (
        <DockIconButton key={item.label} {...item} />
      ))}
    </motion.div>
  );
}

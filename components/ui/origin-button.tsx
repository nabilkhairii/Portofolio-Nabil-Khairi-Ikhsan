'use client';

import { motion } from 'motion/react';
import * as React from 'react';

import { cn } from '@/lib/utils';

/* OriginButton (21st.dev) — satu lingkaran tumbuh dari titik masuk kursor
   sampai menutupi seluruh tombol, dan label berbalik warna di atasnya.
   Menggantikan efek titik-mengembang yang lama.

   Yang berbeda dari komponen aslinya, semuanya karena halaman ini:

   1. Bisa jadi <a>. Empat dari enam tombol di halaman ini sebenarnya tautan
      (#contact, #experience, /cv.pdf); memaksanya jadi <button> mematikan
      navigasi dan klik-kanan/buka-tab.
   2. Prop `en`. Ganti bahasa di portfolio-runtime.js menulis ulang innerHTML
      tiap elemen [data-en], jadi penanda itu harus duduk di SPAN LABEL, bukan
      di tombolnya — kalau di tombol, seluruh struktur efek ini ikut tersapu
      begitu bahasa ditukar.
   3. Rupa tombol datang dari .btn di portfolio.css (pil, huruf kapital, tinggi
      48px), jadi kelas rupa milik aslinya (h-12, rounded-xl, px-8, border,
      bg-card, text-[15px]) dan blok token --ic-* yang memberinya makna tidak
      dipakai. Yang tersisa murni mesin efeknya.
   4. Warna isian lewat --btn-fill/--btn-fill-ink (portfolio.css), bukan
      bg-foreground mati: tombol solid berlatar --ink dan tombol outline
      berlatar transparan butuh isian yang berlawanan supaya sama-sama terbaca.
   5. Bungkus luarnya <a>/<button> biasa, bukan motion.*; cuma lingkarannya yang
      perlu motion. whileTap-nya jadi active:scale-[.985] — CSS sudah cukup. */

const FILL_DURATION = 0.5;
const FILL_EASE = [0.16, 1, 0.3, 1] as const;

/* Jarak terjauh dari titik masuk ke salah satu sudut, dikali dua: itulah
   diameter minimum yang menjamin lingkarannya menutupi tombol dari sudut mana
   pun kursor datang. */
function getCoverDiameter(width: number, height: number, x: number, y: number) {
  return Math.ceil(
    2 *
      Math.max(
        Math.hypot(x, y),
        Math.hypot(width - x, y),
        Math.hypot(x, height - y),
        Math.hypot(width - x, height - y)
      )
  );
}

type OriginButtonProps = {
  text: string;
  /** Teks Inggrisnya. Dipasang sebagai data-en di span label. */
  en?: string;
} & (
  | ({ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
);

export function OriginButton({ text, en, className, ...props }: OriginButtonProps) {
  const nodeRef = React.useRef<HTMLElement>(null);
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [origin, setOrigin] = React.useState({ x: 0, y: 0 });
  const [coverSize, setCoverSize] = React.useState(0);

  const showFill = hovered || pressed;

  const updateOrigin = React.useCallback((x: number, y: number) => {
    const node = nodeRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    setOrigin({ x, y });
    setCoverSize(getCoverDiameter(rect.width, rect.height, x, y));
  }, []);

  const updateOriginFromPointer = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      updateOrigin(event.clientX - rect.left, event.clientY - rect.top);
    },
    [updateOrigin]
  );

  /* Keyboard tidak punya titik masuk, jadi isiannya tumbuh dari tengah. */
  const updateOriginFromCenter = React.useCallback(() => {
    const node = nodeRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    updateOrigin(rect.width / 2, rect.height / 2);
  }, [updateOrigin]);

  /* Ukur ulang selama isian tampak: lebar tombol berubah saat bahasa ditukar
     ("Hubungi Saya" → "Get in Touch") dan saat Inter selesai dimuat. Diameter
     yang telanjur kekecilan menyisakan sudut yang tidak tertutup. */
  React.useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!(node && showFill)) return;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      setCoverSize(getCoverDiameter(rect.width, rect.height, origin.x, origin.y));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    document.fonts?.ready.then(measure).catch(() => undefined);

    return () => observer.disconnect();
  }, [showFill, origin.x, origin.y]);

  const handlers = {
    onBlur: () => {
      setPressed(false);
      setHovered(false);
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.matches(':focus-visible')) return;
      updateOriginFromCenter();
      setHovered(true);
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.repeat || (event.key !== ' ' && event.key !== 'Enter')) return;
      if (event.key === ' ') event.preventDefault();
      updateOriginFromCenter();
      setPressed(true);
      setHovered(true);
    },
    onKeyUp: (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      setPressed(false);
      if (!event.currentTarget.matches(':focus-visible')) setHovered(false);
    },
    onPointerCancel: () => setPressed(false),
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      updateOriginFromPointer(event);
      setPressed(true);
      setHovered(true);
    },
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
      updateOriginFromPointer(event);
      setHovered(true);
    },
    onPointerLeave: () => {
      setHovered(false);
      setPressed(false);
    },
    onPointerUp: () => setPressed(false),
  };

  const classes = cn(
    'relative cursor-pointer touch-manipulation select-none overflow-hidden',
    /* transform & background-color ikut disebut: .glass punya hover scale +
       latar sendiri, dan utility transition menimpa shorthand miliknya. */
    'transition-[color,transform,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.985]',
    showFill && 'text-[var(--btn-fill-ink)]',
    className
  );

  const layers = (
    <>
      <motion.span
        animate={{ scale: showFill && coverSize > 0 ? 1 : 0 }}
        aria-hidden
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--btn-fill)]"
        initial={false}
        style={{ height: coverSize, left: origin.x, top: origin.y, width: coverSize }}
        transition={{ duration: FILL_DURATION, ease: FILL_EASE }}
      />
      <span className="relative z-10" data-en={en}>
        {text}
      </span>
    </>
  );

  return props.href !== undefined ? (
    <a
      className={classes}
      ref={nodeRef as React.RefObject<HTMLAnchorElement>}
      {...handlers}
      {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
    >
      {layers}
    </a>
  ) : (
    <button
      className={classes}
      ref={nodeRef as React.RefObject<HTMLButtonElement>}
      {...handlers}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {layers}
    </button>
  );
}

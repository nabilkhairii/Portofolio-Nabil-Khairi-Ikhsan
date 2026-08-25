"use client";

/* Disalin dari komponen rujukan. Seluruh koreografinya — tiga fase, angka
   keyframe, ukuran, z-index, kelas — utuh apa adanya. Dua hal yang berbeda,
   keduanya dipaksa oleh halaman tempatnya dipasang, bukan oleh selera:

   1. Importnya dari 'motion/react', bukan 'framer-motion'. Paket 'motion' v13
      adalah kelanjutan resmi framer-motion dengan API yang sama persis, dan
      repo ini sudah memakainya di dock-two.tsx dan origin-button.tsx —
      memasang framer-motion di sebelahnya berarti dua salinan pustaka animasi
      yang sama di satu bundel.

   2. useScroll({ target }) diganti pengukuran rect sendiri. INI BUKAN
      penyederhanaan; aslinya tidak jalan di halaman ini. body di-zoom .8
      (lihat blok ZOOM HALAMAN di app/portfolio.css), dan useScroll menghitung
      posisi target lewat rantai offsetTop — satuan TATA LETAK — lalu
      membandingkannya dengan offset gulir dalam piksel VISUAL. Untuk pita ini
      selisihnya persis 1/0.8: puncaknya terbaca 3547 padahal sebenarnya 2838,
      jadi progresnya mentok di (4647-3547)/1808 = 0.61 dan fase 3 — hero
      mengembang jadi satu layar penuh — tidak pernah tercapai. Tidak ada
      error, tidak ada peringatan; efeknya cuma berhenti di dua pertiga jalan.

      getBoundingClientRect() mengembalikan piksel visual, satuan yang sama
      dengan innerHeight, jadi hitungannya benar berapa pun zoom-nya. Rumusnya
      sendiri sama dengan offset ["start start", "end end"] aslinya: 0 saat
      puncak wadah menyentuh puncak layar, 1 saat dasarnya menyentuh dasar
      layar. Sisanya — useSpring dan seluruh useTransform di bawah — tidak
      berubah sedikit pun. */
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ScrollChoreographyProps {
  className?: string;
  images: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
  };
}

export function ScrollChoreography({
  className,
  images,
}: ScrollChoreographyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pengganti useScroll({ target, offset: ["start start", "end end"] }) — lihat
  // catatan (2) di kepala berkas. Satu pembacaan rect per event gulir, pasif.
  const scrollYProgress = useMotionValue(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      const run = r.height - window.innerHeight;
      scrollYProgress.set(run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [scrollYProgress]);

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 400, // Higher stiffness for a slightly faster snap
    damping: 50,   // Play with damping to add a little bounce/jerk
    mass: 1.2,     // Adds a bit more weight to the movement
    restDelta: 0.001,
  });

  // Default positions relative to center
  const xLeft = "-20vw";
  const xRight = "20vw";
  const yTop = "-14vh";
  const yBottom = "14vh";

  // Phase 1: 0 - 0.3 (Diagonal movement)
  // Phase 2: 0.35 - 0.65 (Stack alignment to center)
  // Phase 3: 0.7 - 0.9 (Top Right expands to full screen)

  // Top Left -> moves to Bottom Left, then to Center
  const tlX = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [xLeft, xLeft, xLeft, "0vw", "0vw"]);
  const tlY = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [yTop, yBottom, yBottom, "0vh", "0vh"]);

  // Bottom Right -> moves to Top Right, then to Center
  const brX = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [xRight, xRight, xRight, "0vw", "0vw"]);
  const brY = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [yBottom, yTop, yTop, "0vh", "0vh"]);

  // Bottom Left -> stays, then moves to Center
  const blX = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [xLeft, xLeft, xLeft, "0vw", "0vw"]);
  const blY = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [yBottom, yBottom, yBottom, "0vh", "0vh"]);

  // Top Right -> stays, then moves to Center, then expands
  const trX = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [xRight, xRight, xRight, "0vw", "0vw"]);
  const trY = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [yTop, yTop, yTop, "0vh", "0vh"]);

  // Top Right (Hero) scaling/expansion properties
  const heroWidth = useTransform(smoothProgress, [0.65, 0.7, 0.9, 1], ["36vw", "36vw", "100vw", "100vw"]);
  const heroHeight = useTransform(smoothProgress, [0.65, 0.7, 0.9, 1], ["24vh", "24vh", "100vh", "100vh"]);

  // Opacity fading for images underneath the hero as it expands
  const underImagesOpacity = useTransform(smoothProgress, [0.75, 0.85], [1, 0]);

  const baseImageClasses =
    "absolute left-1/2 top-1/2 w-[36vw] h-[24vh] overflow-hidden -translate-x-1/2 -translate-y-1/2 bg-muted shadow-2xl will-change-transform";

  return (
    <div ref={containerRef} className={cn("relative h-[300vh] w-full", className)}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">

          {/* Top Left Image */}
          <motion.div
            style={{ x: tlX, y: tlY, opacity: underImagesOpacity }}
            className={cn(baseImageClasses, "z-10")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images.topLeft} alt="Top Left" className="h-full w-full object-cover" />
          </motion.div>

          {/* Bottom Right Image */}
          <motion.div
            style={{ x: brX, y: brY, opacity: underImagesOpacity }}
            className={cn(baseImageClasses, "z-20")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images.bottomRight} alt="Bottom Right" className="h-full w-full object-cover" />
          </motion.div>

          {/* Bottom Left Image */}
          <motion.div
            style={{ x: blX, y: blY, opacity: underImagesOpacity }}
            className={cn(baseImageClasses, "z-30")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images.bottomLeft} alt="Bottom Left" className="h-full w-full object-cover" />
          </motion.div>

          {/* Top Right Image (Hero - expands at the end) */}
          <motion.div
            style={{
              x: trX,
              y: trY,
              width: heroWidth,
              height: heroHeight,
            }}
            className={cn(baseImageClasses, "z-40 origin-center bg-black/5")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images.topRight} alt="Top Right (Hero)" className="h-full w-full object-cover" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default ScrollChoreography;

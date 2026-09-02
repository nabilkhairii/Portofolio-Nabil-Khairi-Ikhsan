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
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* Berpasangan dengan blok HP di app/portfolio.css dan PHONE di
   components/lanyard-mount.tsx — ubah ketiganya atau tidak sama sekali. */
const PHONE = "(max-width: 640px)";

type ChoreoImages = {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
};

/* <picture>, bukan src yang ditukar di JS. Dengan penukaran JS peramban sudah
   mulai mengunduh set mendatar sebelum useEffect sempat jalan, jadi HP
   mengunduh delapan foto untuk menampilkan empat. `media` dipilih peramban
   sebelum satu byte pun diminta.

   <picture> sendiri elemen inline dan tingginya auto; tanpa `block h-full`
   di sini, h-full milik <img> tidak punya apa-apa untuk diukur dan fotonya
   mengempis jadi tinggi intrinsiknya. */
function Foto({ src, srcPhone, alt }: { src: string; srcPhone?: string; alt: string }) {
  return (
    <picture className="block h-full w-full">
      {srcPhone && <source media={PHONE} srcSet={srcPhone} />}
      {/* Tanpa eslint-disable, dan itu bukan kelalaian: @next/next/no-img-element
          memang tidak menyala untuk <img> di dalam <picture> — di sana <img>
          bukan pengganti next/image, melainkan bagian wajib elemennya. */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </picture>
  );
}

interface ScrollChoreographyProps {
  className?: string;
  images: ChoreoImages;
  /* Set khusus HP. Opsional: tanpa ini komponennya berperilaku persis seperti
     aslinya. Lihat catatan CHOREO_IMAGES_PHONE di app/page.tsx. */
  imagesPhone?: ChoreoImages;
}

export function ScrollChoreography({
  className,
  images,
  imagesPhone,
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

  /* Ukuran ubin harus dari JS, bukan kelas responsif: ubin hero-nya memakai
     width/height dari useTransform — gaya inline, dan itu selalu menang atas
     kelas apa pun — jadi ukuran fase-1-nya wajib datang dari sumber yang sama
     dengan ketiga ubin lain. Kalau tidak, di HP tiga ubin membesar dan yang
     keempat tetap kecil.

     false saat render pertama (dan di SSR) supaya markup server dan klien
     sama; useEffect yang membetulkannya. Pitanya duduk jauh di bawah lipatan
     — wadahnya sendiri 300vh — jadi ukuran desktop tak sempat terlihat. */
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = matchMedia(PHONE);
    const baca = () => setPhone(mq.matches);
    baca();
    mq.addEventListener("change", baca);
    return () => mq.removeEventListener("change", baca);
  }, []);

  /* Satu invarian mengikat keempat angka ini: offset = ukuran/2 + 2. Itu yang
     menaruh celah 4 di tengah tanpa ubin yang bertindih. Ubah ukurannya,
     hitung ulang offsetnya — kalau tidak, dua ubin saling menimpa di tengah.

     Desktop 36x36: sebelumnya 24vh, dan pada 1440x900 ubinnya 518x216 —
     rasio 2,4, pita yang terlalu pipih untuk foto Asprak yang TEGAK (0,75);
     yang tampak cuma 31% tingginya. Di 36vh ubinnya 518x324 (rasio 1,6) dan
     yang tampak jadi ~47%.

     36vh, bukan lebih: jejak tegaknya 2*(20+18) = 76vh, jadi masih ada 12vh
     di atas dan di bawah. vw dan vh BUKAN satuan yang sama panjang — 36x36
     tidak menghasilkan bujur sangkar; untuk rasio 1,0 di layar 16:9 tingginya
     harus 57,6vh, dan jejaknya 119vh: tidak muat.

     HP 44x32: ubinnya lebih tinggi DAN lebih lebar dari desktop, karena di
     layar 390px ubin desktop menyisakan pita yang terlalu pendek untuk isinya.
     Jejaknya mendatar -46..-2 dan +2..+46, tegak -34..-2 dan +2..+34. */
  const { w: boxW, h: boxH, x: offX, y: offY } = phone
    ? { w: "44vw", h: "32vh", x: "24vw", y: "18vh" }
    : { w: "36vw", h: "36vh", x: "20vw", y: "20vh" };

  // Default positions relative to center
  const xLeft = `-${offX}`;
  const xRight = offX;
  const yTop = `-${offY}`;
  const yBottom = offY;

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
  const heroWidth = useTransform(smoothProgress, [0.65, 0.7, 0.9, 1], [boxW, boxW, "100vw", "100vw"]);
  const heroHeight = useTransform(smoothProgress, [0.65, 0.7, 0.9, 1], [boxH, boxH, "100vh", "100vh"]);

  // Opacity fading for images underneath the hero as it expands
  const underImagesOpacity = useTransform(smoothProgress, [0.75, 0.85], [1, 0]);

  /* w/h lepas dari kelas ini dan pindah ke gaya inline tiap ubin: hero-nya
     memang sudah begitu (dari useTransform), dan dua sumber ukuran untuk satu
     baris ubin adalah cara termudah membuat keempatnya tidak lagi seragam. */
  const baseImageClasses =
    "absolute left-1/2 top-1/2 overflow-hidden -translate-x-1/2 -translate-y-1/2 bg-muted shadow-2xl will-change-transform";

  return (
    <div ref={containerRef} className={cn("relative h-[300vh] w-full", className)}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">

          {/* Top Left Image */}
          <motion.div
            style={{ x: tlX, y: tlY, opacity: underImagesOpacity, width: boxW, height: boxH }}
            className={cn(baseImageClasses, "z-10")}
          >
            <Foto src={images.topLeft} srcPhone={imagesPhone?.topLeft} alt="Top Left" />
          </motion.div>

          {/* Bottom Right Image */}
          <motion.div
            style={{ x: brX, y: brY, opacity: underImagesOpacity, width: boxW, height: boxH }}
            className={cn(baseImageClasses, "z-20")}
          >
            <Foto src={images.bottomRight} srcPhone={imagesPhone?.bottomRight} alt="Bottom Right" />
          </motion.div>

          {/* Bottom Left Image */}
          <motion.div
            style={{ x: blX, y: blY, opacity: underImagesOpacity, width: boxW, height: boxH }}
            className={cn(baseImageClasses, "z-30")}
          >
            <Foto src={images.bottomLeft} srcPhone={imagesPhone?.bottomLeft} alt="Bottom Left" />
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
            <Foto src={images.topRight} srcPhone={imagesPhone?.topRight} alt="Top Right (Hero)" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default ScrollChoreography;

/* Markup seluruh halaman. Isinya statis; yang menghidupkannya ada di tempat
   lain, dan keduanya terikat pada kelas & id di berkas ini:

   - app/portfolio.css   — seluruh gaya (diimpor lewat globals.css)
   - components/portfolio-runtime.js — seluruh perilaku (dijalankan
     <SiteBehavior />): bahasa, animasi, grid proyek, galeri, tema, form

   Karena itu kelas dan id di sini bukan hiasan: menghapus `.reveal`, `#filters`,
   atau `data-en` berarti mematikan satu fungsi halaman tanpa pesan error.
   Grid proyek (#project-grid) dan galeri (#gallery) sengaja dibiarkan kosong —
   isinya dibangun runtime dari daftar PROJECTS. */

import { LanyardMount } from '@/components/lanyard-mount';
import { SiteBehavior } from '@/components/site-behavior';
import { Dock } from '@/components/ui/dock-two';
import { FlowButton } from '@/components/ui/flow-button';
import { OriginButton } from '@/components/ui/origin-button';
import { ScrollChoreography } from '@/components/ui/scroll-choreography';
import { ThemeToggle } from '@/components/ui/theme-toggle';

/* Empat foto pita koreografi. Namanya ikut nama prop komponennya (topLeft dst),
   dan itu posisi AWAL — komponennya sendiri yang memindahkannya, dan `topRight`
   yang jadi foto terakhir yang mengembang memenuhi layar.

   thumbs/, bukan assets/: versi 1100px dari make-thumbs.mjs. Aslinya ada yang
   puluhan megapiksel, dan di sini empat sekaligus. */
const CHOREO_IMAGES = {
  topLeft: '/thumbs/Antam/System%20Placement%20Mapping.jpeg.webp',
  topRight: '/thumbs/AMX/PCB%20Layout%20Result.jpeg.webp',
  bottomLeft:
    '/thumbs/Robotika%20Cerdas%20Arm%20Robot/Design%20Process%20for%203D%20Printing%20a%20Robot%20Manipulator%20Body.png.webp',
  bottomRight:
    '/thumbs/Computer%20Vision%20%26%20AI/Computer%20Vision%20Based%20Vehicle%20Detection%20Results%20Us-Cover.jpg.webp',
};

/* Set kedua, khusus HP — dan alasannya bentuk fotonya, bukan selera.
   Keempat foto di atas MENDATAR (rasio 1,78-1,97). Di layar 390px ubin
   pitanya jadi kolom tegak, dan foto mendatar yang dipaksa masuk ke sana
   dipotong object-cover sampai tinggal pita tengahnya — isinya hilang.
   Keempat ini TEGAK (0,56 / 0,75 / 0,89 / 0,56), searah dengan ubinnya.

   Ditukar oleh <picture media> di scroll-choreography.tsx, bukan oleh JS:
   peramban memilih sebelum satu byte pun diminta, jadi HP tidak ikut
   mengunduh set mendatar yang tak akan pernah ditampilkannya. */
const CHOREO_IMAGES_PHONE = {
  topLeft:
    '/thumbs/Antam/Carrying%20out%20Preventive%20Maintenance%20in%20the%20Factory%20Area.png.webp',
  topRight:
    '/thumbs/AMX/Reverse%20Engineering%20(RE)%20Electric%20Drone%20Sprayer.jpeg.webp',
  bottomLeft:
    '/thumbs/Intalasi%20Mesin%20Listrik%20(SEM%202)/3%20Phase%20Power%20Motor%20Circuit%20to%20Manually%20Turn%20the%20Steering%20Right%20and%20Left%20Using%20a%203%20Phase%20Motor.jpeg.webp',
  bottomRight:
    '/thumbs/Robotika%20Lanjut/Component%20Checking%20before%20Implementation%20and%20Control%20Using%20ROS%202.jpeg.webp',
};

/* Isi chip Software & Tools. Urutannya urutan yang diminta, bukan abjad.
   Tiap chip tautan ke situs resmi produknya.

   `logo` = berkas di public/icons/: favicon resmi vendornya, berwarna,
   diambil sekali dari domain di `href` lewat layanan favicon Google. Disimpan
   lokal, bukan dihotlink — halaman tidak memanggil pihak ketiga saat dibuka.
   Sebelumnya sebagian memakai simple-icons (hitam polos, dibalik di mode
   gelap) dan sisanya monogram huruf; keduanya dilepas supaya semua chip
   memakai logo asli yang berwarna dari satu sumber yang sama.

   Lima produk memakai logo induknya karena produknya sendiri tidak punya:
   Fusion 360 -> Autodesk, Packet Tracer -> Cisco, Raspberry Pi OS ->
   Raspberry Pi, Arduino IDE -> Arduino, ROS 2 -> ROS. EAGLE punya ikon
   produknya sendiri (eagle.png), dipotong ke marka "E"-nya saja: wordmark
   di bawahnya tidak terbaca pada 20px. */
const TOOLS: { name: string; href: string; logo: string }[] = [
  { name: 'Autodesk Fusion 360', href: 'https://www.autodesk.com/products/fusion-360/overview', logo: 'autodesk' },
  { name: 'EasyEDA', href: 'https://easyeda.com/', logo: 'easyeda' },
  { name: 'Autodesk EAGLE', href: 'https://www.autodesk.com/products/eagle/overview', logo: 'eagle' },
  { name: 'Proteus', href: 'https://www.labcenter.com/', logo: 'proteus' },
  { name: 'Falstad Circuit Simulator', href: 'https://www.falstad.com/circuit/', logo: 'falstad' },
  { name: 'Omron CX-Programmer', href: 'https://industrial.omron.eu/en/products/cx-programmer', logo: 'omron' },
  { name: 'OpenPLC Editor', href: 'https://autonomylogic.com/', logo: 'openplc' },
  { name: 'Factory I/O', href: 'https://factoryio.com/', logo: 'factoryio' },
  { name: 'ROS 2', href: 'https://www.ros.org/', logo: 'ros' },
  { name: 'Webots', href: 'https://cyberbotics.com/', logo: 'webots' },
  { name: 'Arduino IDE', href: 'https://www.arduino.cc/en/software/', logo: 'arduino' },
  { name: 'Raspberry Pi OS', href: 'https://www.raspberrypi.com/software/', logo: 'raspberrypi' },
  { name: 'Linux', href: 'https://www.kernel.org/', logo: 'linux' },
  { name: 'Docker', href: 'https://www.docker.com/', logo: 'docker' },
  { name: 'Firebase', href: 'https://firebase.google.com/', logo: 'firebase' },
  { name: 'Cisco Packet Tracer', href: 'https://www.netacad.com/cisco-packet-tracer', logo: 'cisco' },
  { name: 'Microsoft Office', href: 'https://www.microsoft.com/microsoft-365', logo: 'microsoft-office' },
];

/* Logo baris Kontak Langsung. Inline, bukan berkas di public/icons/: tiap
   logo dipakai sekali dan warnanya tetap, jadi tidak ada yang perlu diunduh
   dan tidak ada permintaan jaringan saat halaman dibuka.

   Warnanya warna merek masing-masing, kecuali dua:
   - GitHub memang monokrom (#181717); di latar gelap ia hilang, jadi dipakai
     var(--ink) yang ikut bertukar bersama temanya — persis tampilan resminya.
   - Lokasi bukan merek. Pin-nya digambar sendiri dan memakai biru situs ini.
   Jalur GitHub/Gmail/WhatsApp/LinkedIn dari simple-icons v13. */
const CHAN_ICON = {
  email: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="var(--ink)" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  ),
  location: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="var(--m-blue-dark)" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  ),
};

/* Logo chip Bahasa Pemrograman. Inline, bukan favicon di public/icons/ seperti
   chip Software & Tools: keduanya ada di simple-icons, jadi vektor tajam lebih
   baik daripada PNG 16px, dan Ladder Diagram tidak punya vendor sama sekali —
   ia bahasa PLC di IEC 61131-3, bukan merek. Glifnya digambar sendiri: dua rel
   dengan satu kontak NO dan satu koil, bentuk paling dasar satu anak tangga. */
const LANG_ICON = {
  python: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#3776AB" d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z" />
    </svg>
  ),
  cpp: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#00599C" d="M22.394 6c-.167-.29-.398-.543-.652-.69L12.926.22c-.509-.294-1.34-.294-1.848 0L2.26 5.31c-.508.293-.923 1.013-.923 1.6v10.18c0 .294.104.62.271.91.167.29.398.543.652.69l8.816 5.09c.508.293 1.34.293 1.848 0l8.816-5.09c.254-.147.485-.4.652-.69.167-.29.27-.616.27-.91V6.91c.003-.294-.1-.62-.268-.91zM12 19.11c-3.92 0-7.109-3.19-7.109-7.11 0-3.92 3.19-7.11 7.11-7.11a7.133 7.133 0 016.156 3.553l-3.076 1.78a3.567 3.567 0 00-3.08-1.78A3.56 3.56 0 008.444 12 3.56 3.56 0 0012 15.555a3.57 3.57 0 003.08-1.778l3.078 1.78A7.135 7.135 0 0112 19.11zm7.11-6.715h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79zm2.962 0h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79z" />
    </svg>
  ),
  ladder: (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="var(--m-blue-dark)" strokeWidth="1.8" strokeLinecap="round">
      {/* dua rel daya */}
      <path d="M3 3v18M21 3v18" />
      {/* anak tangga: rel kiri - kontak NO - koil - rel kanan */}
      <path d="M3 12h5M11 12h2.5M16.5 12H21" />
      <path d="M8 9.5v5M11 9.5v5" />
      <path d="M16.5 12a1.5 2.5 0 0 0-3 0 1.5 2.5 0 0 0 3 0" />
    </svg>
  ),
};

export default function Home() {
  return (
    <>
      {/* ══ TOP NAV — 64px, flat black, no border until scrolled ══ */}
      <header id="topnav" className="topnav">
        <div className="shell flex items-center gap-6 h-16">
          <a href="#hero" className="brand">
            <span className="m-stripe m-stripe--brand" aria-hidden="true" />
            <span className="brand__name">NABIL KHAIRI</span>
          </a>

          {/* satu ml-auto di pembungkus; sebelumnya tiga anak berebut auto-margin.
              gap-3 seragam: jarak yang berbeda-beda antar kontrol membuat
              barisan ini terbaca seperti beberapa kelompok, bukan satu. */}
          <div className="ml-auto flex items-center gap-3">
            {/* <nav> tinggal di sini, bukan di dalam komponennya: aria-label-nya
                membawa data-en-aria-label, dan penanda itu harus berada di DOM
                sejak awal supaya portfolio-runtime.js merekamnya saat memindai
                [data-en-aria-label]. Label tiap item tetap teks biasa (bukan
                aria-label), jadi itu juga yang dibaca screen reader. */}
            {/* Kelas visibilitasnya pindah ke portfolio.css (.nav-dock), lepas
                dari `hidden md:block`: di HP nav ini tidak disembunyikan
                melainkan DIPINDAH — jadi taskbar mengambang di tepi bawah, di
                jangkauan jempol. Satu elemen yang sama untuk kedua tempat;
                menyalinnya jadi dua berarti dua <nav> berlabel sama di satu
                halaman. Tiga keadaannya (sembunyi / di header / taskbar) tidak
                bisa ditulis rapi dengan utility, dan `hidden` milik Tailwind
                ada di layer utilities yang selalu menang atas portfolio.css. */}
            <nav
              className="nav-dock"
              aria-label="Navigasi utama"
              data-en-aria-label="Main navigation"
            >
              {/* Tanpa prop: ikon lucide adalah fungsi, dan fungsi tidak bisa
                  dioper dari Server Component ke Client Component. */}
              <Dock />
            </nav>

            {/* Ukuran header, bukan ukuran bawaan FlowButton: min-h-11 + px-6 +
                12px menyamakannya dengan .lang-btn (44px, 12px) di sebelahnya.
                Yang di pita CTA tetap ukuran penuh 48px/14px. */}
            <FlowButton
              href="#contact"
              className="hidden sm:inline-flex min-h-11 px-6 text-[12px]"
              text="Hubungi Saya"
              en="Get in Touch"
            />

            <button
              id="lang-btn"
              className="lang-btn"
              aria-label="Ganti bahasa"
              data-en-aria-label="Switch language"
            >
              <span data-lang-opt="id">ID</span>
              <span data-lang-opt="en">EN</span>
            </button>

            {/* Tema sepenuhnya milik komponen ini sekarang — atribut data-theme,
                localStorage, dan meta theme-color. Blok tema di
                portfolio-runtime.js sudah dilepas; dua pemilik untuk satu
                keadaan akan saling menimpa diam-diam. */}
            <ThemeToggle className="flex-none" />

            <button
              id="menu-btn"
              className="menu-btn md:hidden"
              aria-label="Buka menu"
              data-en-aria-label="Open menu"
              aria-expanded="false"
              aria-controls="mobile-menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* mobile menu: full-screen black overlay with the M stripe at the top */}
      <div id="mobile-menu" className="mobile-menu" hidden>
        <span className="m-stripe" aria-hidden="true" />
        <nav
          className="shell py-10 flex flex-col gap-1"
          aria-label="Navigasi seluler"
          data-en-aria-label="Mobile navigation"
        >
          <a href="#about" className="mobile-menu__link">
            About
          </a>
          <a href="#skills" className="mobile-menu__link">
            Skills
          </a>
          <a href="#experience" className="mobile-menu__link">
            Projects
          </a>
          <a href="#contact" className="mobile-menu__link">
            Contact
          </a>
        </nav>
      </div>

      <main>
        {/* ══ HERO — photo band ══ */}
        <section id="hero" className="band band--hero">
          <canvas id="aurora" className="aurora" aria-hidden="true" />
          <div className="shell grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-16 items-center">
            <div className="reveal">
              <p className="label text-muted shimmer">
                Applied Bachelor (D4) · Electronics Engineering
              </p>
              {/* .split — mesin yang sama dengan heading "DARI SKEMATIK…":
                  portfolio-runtime.js memecahnya jadi satu span per huruf, lalu
                  CSS menaikkannya satu per satu saat observer .reveal menyala.
                  Tetap <h1> berisi nama utuh; splitChars memasang aria-label
                  supaya screen reader membaca kalimatnya, bukan hurufnya. */}
              <h1 className="display-xl mt-5 split">
                M. NABIL
                <br />
                KHAIRI
                <br />
                IKHSAN
              </h1>
              <span className="m-stripe mt-7" aria-hidden="true" />
              <p
                className="lead mt-7 max-w-[52ch]"
                data-en="Embedded systems, industrial automation, and electronic system integration. Built through industrial internship and academic projects, from concept design to results that match the original working principle."
              >
                Sistem embedded, otomasi industri, dan integrasi sistem
                elektronik. Dikerjakan melalui proyek magang industri maupun
                akademik, dari perancangan konsep sampai dengan hasil yang
                sesuai dengan prinsip kerja awal.
              </p>
              {/* `flex flex-wrap gap-3` pindah ke .hero-cta di portfolio.css,
                  nilainya sama persis (gap-3 = 12px). Harus pindah: di HP baris
                  ini jadi grid dua kolom sama lebar, dan `flex` milik Tailwind
                  ada di layer utilities yang selalu menang atas display apa pun
                  yang ditulis di sana. */}
              <div className="hero-cta mt-9">
                <OriginButton
                  href="#experience"
                  className="btn btn--solid glass"
                  text="Lihat Proyek"
                  en="View Projects"
                />
                {/* Ukuran HP-nya dioper dari sini, bukan dari portfolio.css:
                    px-8 dan text-[14px] milik komponen ini utility Tailwind,
                    dan layer utilities selalu menang atas berkas itu. Di
                    kolom 166px ukuran bawaannya mematahkan label jadi dua
                    baris. Pasangannya .hero-cta .btn di portfolio.css. */}
                <FlowButton
                  href="/Curriculum%20Vitae_M.%20Nabil%20Khairi%20Ikhsan.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="max-[640px]:px-3.5 max-[640px]:text-[12px] max-[640px]:tracking-[1px]"
                  text="Unduh CV"
                  en="Download CV"
                />
              </div>
            </div>

            <div className="reveal lanyard-slot" data-reveal-delay="140">
              {/* Slot memegang tinggi sendiri supaya <Canvas> R3F punya ukuran
                  sejak awal — Canvas menunggu wadahnya terukur sebelum memasang
                  isinya. Kotaknya dibiarkan transparan sampai kartunya
                  benar-benar berdiri, lalu .is-ready memudarkannya masuk. */}
              <LanyardMount />
            </div>
          </div>
        </section>

        {/* ══ SPEC BAND — the doc's spec-cell row ══ */}
        <section className="band band--tight">
          <div className="shell grid grid-cols-2 lg:grid-cols-4 gap-px bg-hairline-c reveal">
            <div className="spec">
              <span className="spec__v">
                3.69
              </span>
              <span className="label spec__l" data-en="GPA / 4.00">
                IPK / 4.00
              </span>
            </div>
            <div className="spec">
              <span className="spec__v">
                08
              </span>
              <span className="label spec__l" data-en="Documented Projects">
                Proyek Terdokumentasi
              </span>
            </div>
            <div className="spec">
              <span className="spec__v">
                04
              </span>
              <span className="label spec__l" data-en="Industry Experience">
                Pengalaman Industri
              </span>
            </div>
            <div className="spec">
              <span className="spec__v">
                05
              </span>
              <span className="label spec__l" data-en="National Certifications">
                Sertifikasi Nasional
              </span>
            </div>
          </div>
        </section>

        {/* ══ ABOUT ══ */}
        <section id="about" className="band">
          <div className="shell">
            {/* Pembungkus dua kolom KHUSUS HP: kartu lanyard di kiri, kepala
                seksi di kanannya. Slot ditulis lebih dulu di markup dan
                ditaruh di kolom kiri lewat grid-area di portfolio.css.
                Di layar lebar ia `display: contents` —
                pembungkusnya lenyap dari tata letak dan .sec-head kembali jadi
                anak langsung .shell, jadi desktop tidak berubah sepiksel pun.
                Slot di bawah kosong di markup: kartunya satu-satunya di
                halaman ini dan dipindahkan ke sini lewat portal saat lebar
                layar HP (components/lanyard-mount.tsx). */}
            <div className="about-head">
              <div id="lanyard-slot-about" className="lanyard-slot" />
 <div className="sec-head">
              <p className="label text-muted">01 — About</p>
              <h2
 className="display-lg mt-4 split"
                data-en="FROM SCHEMATIC<br>TO A SYSTEM THAT RUNS."
              >
                DARI SKEMATIK
                <br />
                KE SISTEM YANG JALAN.
              </h2>
              <span className="m-stripe mt-6" aria-hidden="true" />
            </div>
            </div>

            {/* max-[640px]: — jarak vertikalnya milik utility Tailwind (layer
                utilities, selalu menang atas portfolio.css), jadi versi HP-nya
                harus ditulis di sini. 48px/40px itu ritme untuk kolom selebar
                600px; di 342px ia jadi lubang. */}
            <div className="mt-12 grid gap-10 max-[640px]:mt-4 max-[640px]:gap-7 lg:grid-cols-[1.15fr_.85fr] lg:gap-16 items-start">
 <div>
                <p
                  className="lead"
                  data-en="Applied Bachelor (D4) student in Electronics Engineering with experience in embedded systems development, industrial automation, and electronic system integration through academic and industrial projects."
                >
                  Mahasiswa Sarjana Terapan (D4) Teknik Elektronika dengan
                  pengalaman di pengembangan sistem embedded, otomasi industri,
                  dan integrasi sistem elektronik melalui proyek akademik maupun
                  industri.
                </p>
                <p
                  className="prose mt-6"
                  data-en="Competent in PCB design, PLC programming, Mini PC system integration, and troubleshooting. Oriented toward developing efficient embedded solutions tailored to industrial control and automation needs."
                >
                  Menguasai PCB design, pemrograman PLC, integrasi sistem Mini
                  PC, dan troubleshooting. Berorientasi pada pengembangan solusi
                  embedded yang efisien dan sesuai kebutuhan kontrol serta
                  otomasi industri.
                </p>

                <h3 className="label text-muted mt-12 split split-fly">Core Competencies</h3>
                <ul className="comp-grid mt-5">
                  <li>PCB Design &amp; Layout</li>
                  <li>Control Systems Design</li>
                  <li>Electronic Measurements</li>
                  <li>Reverse Engineering</li>
                  <li>Embedded Programming</li>
                  <li>Sensor Interfacing</li>
                  <li>System Troubleshooting</li>
                  <li>Power Distribution Analysis</li>
                  <li>PLC Programming</li>
                  <li>Thermal Analysis</li>
                  <li>System Integration</li>
                  <li>Technical Documentation</li>
                </ul>
              </div>

 <div>
                <h3 className="label text-muted split split-fly">Education</h3>

                {/* Pembungkus dua kolom KHUSUS HP, sama polanya dengan
                    .about-head: `display: contents` di layar lebar, jadi kedua
                    kartu tetap anak langsung kolom ini dan desktop tidak
                    berubah. mt-5/mt-4 kartunya dinolkan di HP — di dalam grid
                    jaraknya urusan gap, dan margin atas pada kartu kanan akan
                    membuat keduanya tidak sejajar. */}
                {/* .reveal, bukan .split seperti judul seksinya: keduanya
                    dijalankan observer dan kelas .is-visible yang sama, tapi
                    .split memecah TIAP HURUF dan memang cuma untuk heading
                    (lihat catatannya di portfolio-runtime.js). Di kartu ini
                    yang dipecah jadi tanggal, nama kampus, jurusan, dan IPK
                    sekaligus — ~130 huruf beriak satu per satu di ketikan
                    sekecil .caption/.prose. Yang dicari cuma kartunya naik. */}
                <div className="edu-list">
                <article className="edu spotlight reveal mt-5 max-[640px]:mt-0">
                  <p className="caption text-muted" data-en="Sep 2023 – Present">
                    Sep 2023 – Sekarang
                  </p>
                  <h4 className="title-lg mt-2">
                    Universitas Negeri Yogyakarta
                  </h4>
                  <p className="prose mt-2">
                    Bachelor of Applied Science in Electronics Engineering
                  </p>
                  <p className="label mt-4 text-ink" data-en="GPA 3.69 / 4.00">
                    IPK 3.69 / 4.00
                  </p>
                </article>

                {/* Menyusul 140ms di belakang kartu pertama — angka yang sama
                    dipakai slot lanyard di hero. Di HP kedua kartu berdampingan
                    (kisi dua kolom), jadi jedanya terbaca sebagai sapuan
                    kiri-ke-kanan, bukan tumpukan yang tertinggal. */}
                <article
                  className="edu spotlight reveal mt-4 max-[640px]:mt-0"
                  data-reveal-delay="140"
                >
                  <p
                    className="caption text-muted"
                    data-en="May 2020 – May 2023"
                  >
                    Mei 2020 – Mei 2023
                  </p>
                  <h4 className="title-lg mt-2">SMK Telkom Makassar</h4>
                  <p className="prose mt-2">Access Network Engineering</p>
                  <p
                    className="label mt-4 text-ink"
                    data-en="GPA 90.5 / 100"
                  >
                    IPK 90.5 / 100
                  </p>
                </article>
                </div>

                <h3 className="label text-muted mt-10 split split-fly" data-en="Languages">
                  Bahasa
                </h3>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="chip">Indonesian (Native)</span>
                  <span className="chip">English (Intermediate)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SKILLS ══ */}
        <section id="skills" className="band">
          <div className="shell">
 <div className="sec-head">
              <p className="label text-muted">02 — Skills</p>
 <h2 className="display-lg mt-4 split">
                HARDWARE. FIRMWARE.
                <br />
                AUTOMATION.
              </h2>
              <span className="m-stripe mt-6" aria-hidden="true" />
            </div>

            <div className="mt-12 grid gap-10 max-[640px]:mt-6 max-[640px]:gap-7 lg:grid-cols-2 lg:gap-16">
              {/* Dua kolom di laptop, satu deret di HP — dan urutannya BEDA di
                  antara keduanya: laptop membaca per kolom (fokus lalu hard skill
                  di kiri; software lalu bahasa di kanan), HP membaca menurun
                  fokus - software - bahasa - hard skill. Karena itu tiap blok
                  dibungkus satu <div>: yang dipindahkan order harus satu elemen,
                  bukan pasangan <h3> + daftarnya yang berdiri terpisah.

                  .skills-col jadi `display: contents` di HP (portfolio.css) —
                  pembungkus kolomnya lenyap dari tata letak dan kelima blok jadi
                  anak langsung kisi ini, jaraknya diurus gap-7 dan urutannya oleh
                  order di bawah. Pola yang sama dipakai .about-head dan .edu-list,
                  cuma di sana `contents`-nya justru di layar lebar.

                  order ditulis lengkap 1..5, bukan cuma pada dua blok yang benar-
                  benar bertukar: order 0 selalu mendahului order positif, jadi
                  versi hematnya menuntut sisanya tetap 0 — invarian yang diam-diam
                  patah begitu blok keenam ditambahkan. */}
              <div className="skills-col">
                <div className="max-[640px]:order-1">
                  <h3 className="label text-muted split split-fly" data-en="Focus Areas">
                    Fokus Keahlian
                  </h3>
                  {/* divide-y/border-y dimatikan di HP: di sana daftar ini jadi
                      dua kolom (.focus-list), dan garis "antar anak" milik
                      divide-y digambar per anak — di dua kolom ia muncul di
                      tengah baris, bukan di antara baris. Garisnya diganti
                      border-bottom milik .meter sendiri di portfolio.css. */}
                  <dl className="focus-list mt-5 divide-y divide-hairline-c border-y border-hairline-c max-[640px]:mt-4 max-[640px]:divide-y-0 max-[640px]:border-y-0">
                    <div className="meter">
                      <dt>PCB Design &amp; Layout</dt>
                      <dd>
                        <i style={{ '--v': '92%' } as React.CSSProperties} />
                      </dd>
                    </div>
                    <div className="meter">
                      <dt>Embedded &amp; Mini PC</dt>
                      <dd>
                        <i style={{ '--v': '88%' } as React.CSSProperties} />
                      </dd>
                    </div>
                    <div className="meter">
                      <dt>PLC / Industrial Automation</dt>
                      <dd>
                        <i style={{ '--v': '85%' } as React.CSSProperties} />
                      </dd>
                    </div>
                    <div className="meter">
                      <dt>Computer Vision &amp; AI</dt>
                      <dd>
                        <i style={{ '--v': '80%' } as React.CSSProperties} />
                      </dd>
                    </div>
                    <div className="meter">
                      <dt>Electrical Measurement</dt>
                      <dd>
                        <i style={{ '--v': '90%' } as React.CSSProperties} />
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-10 max-[640px]:order-4 max-[640px]:mt-0">
                  <h3 className="label text-muted split split-fly">Hard Skills</h3>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="chip">PCB Design</span>
                    <span className="chip">Electronic Hardware Design</span>
                    <span className="chip">Electrical System Analysis</span>
                    <span className="chip">
                      Hardware Testing &amp; Troubleshooting
                    </span>
                    <span className="chip">
                      Artificial Intelligence (AI) Development
                    </span>
                    <span className="chip">Computer Vision</span>
                    <span className="chip">Industrial Automation (PLC)</span>
                    <span className="chip">
                      Surface Mount Device (SMD) Soldering
                    </span>
                    <span className="chip">PID Control System Tuning</span>
                    <span className="chip">Embedded Programming</span>
                    <span className="chip">Sensor Interfacing</span>
                    <span className="chip">Reverse Engineering</span>
                  </div>
                </div>
              </div>

              <div className="skills-col">
                <div className="max-[640px]:order-2">
                  <h3 className="label text-muted split split-fly">Software &amp; Tools</h3>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {TOOLS.map(({ name, href, logo }) => (
                      <a
                        key={name}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chip"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/icons/${logo}.png`} alt="" loading="lazy" />
                        {name}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="mt-10 max-[640px]:order-3 max-[640px]:mt-0">
                  <h3
                    className="label text-muted split split-fly"
                    data-en="Programming Languages"
                  >
                    Bahasa Pemrograman
                  </h3>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="chip">
                      {LANG_ICON.python}
                      Python
                    </span>
                    <span className="chip">
                      {LANG_ICON.cpp}
                      C++
                    </span>
                    <span className="chip">
                      {LANG_ICON.ladder}
                      Ladder Diagram
                    </span>
                  </div>
                </div>

                <div className="quote mt-10 max-[640px]:order-5 max-[640px]:mt-0">
                  <span className="m-stripe" aria-hidden="true" />
                  <p
                    className="title-md mt-5 split"
                    data-en="“Measure first, then draw conclusions. A design does not move forward until the instrument readings match the calculations and the requirements.”"
                  >
                    “Ukur dulu, baru mengambil kesimpulan. Rancangan tidak akan
                    dilanjutkan sampai angka di alat ukur sesuai dengan
                    perhitungan dan kebutuhan.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ PHOTO BAND — koreografi gulir empat foto ══
            components/ui/scroll-choreography.tsx, disalin apa adanya. Fase-nya
            miliknya sendiri: dua foto bergeser diagonal, keempatnya menumpuk di
            tengah, lalu yang teratas mengembang jadi satu layar penuh.

            Dekoratif: keempat fotonya sudah tampil bersama proyeknya di bawah,
            jadi seluruh seksinya aria-hidden — buat pembaca layar ini
            pengulangan. Sumbernya thumbs 1100px, bukan foto penuh: yang asli
            sampai puluhan megapiksel dan empat sekaligus di sini.

            Kalimatnya menumpang sebagai lapisan terpisah, BUKAN dengan menyunting
            komponennya: pembungkus setinggi seksi + sticky sendiri, jadi ia ikut
            terpaku di layar yang sama. Komponennya tidak menyediakan slot anak,
            dan menambahkannya berarti versi cabangan yang harus dirawat sendiri. */}
        <section aria-hidden="true" className="choreo-band relative">
          {/* Pembungkus pembatal zoom — lihat .choreo-band__fx di portfolio.css.
              Komponennya menulis 100vw/100vh apa adanya, dan di bawah body
              zoom .8 "satu layar penuh" itu jadi 80% layar. */}
          <div className="choreo-band__fx">
            <ScrollChoreography
              images={CHOREO_IMAGES}
              imagesPhone={CHOREO_IMAGES_PHONE}
            />
          </div>
          <div className="choreo__overlay">
            {/* Pembungkus tengah terpisah dari <p>-nya: .split memecah kalimat
                jadi satu <span> per kata, dan kalau <p>-nya sendiri yang jadi
                kisi, tiap kata menempati barisnya sendiri. */}
            <div>
              <p
                className="choreo__caption display-lg split"
                data-en="8 PROJECTS<br>ONE WAY OF WORKING"
              >
                8 PROYEK
                <br />
                SATU CARA KERJA
              </p>
            </div>
          </div>
        </section>

        {/* ══ EXPERIENCE & PROJECTS ══ */}
        <section id="experience" className="band">
          <div className="shell">
 <div className="sec-head">
              <p className="label text-muted">03 — Experience &amp; Projects</p>
              <h2
 className="display-lg mt-4 split"
                data-en="WORK DOCUMENTATION."
              >
                DOKUMENTASI KERJA.
              </h2>
              <span className="m-stripe mt-6" aria-hidden="true" />
              <p
                className="prose mt-6 max-w-[60ch]"
                data-en="Pick a category, then click a card to see the full documentation gallery."
              >
                Pilih kategori, lalu klik sebuah kartu untuk melihat galeri
                dokumentasi lengkap.
              </p>
            </div>

 <div className="mt-10">
              <div
                id="filters"
                className="tabs"
                role="tablist"
                aria-label="Filter kategori proyek"
                data-en-aria-label="Project category filter"
              />
            </div>

            {/* Diisi renderGrid() di portfolio-runtime.js dari daftar PROJECTS.
                .pgrid ada di sini, bukan ditulis runtime: wadahnya sendiri yang
                jadi kisinya, jadi kartu-kartu itu anak langsungnya. */}
 <div id="project-grid" className="pgrid mt-10" />
            <p
              id="grid-empty"
              className="hidden text-center py-16 prose"
              data-en="No projects in this category."
            >
              Tidak ada proyek pada kategori ini.
            </p>
          </div>
        </section>

        {/* ══ CTA BAND ══ */}
        <section className="band band--cta">
 <div className="shell text-center">
            {/* data-marquee: lajunya ikut kecepatan scroll, arahnya ikut arah
                scroll. CSS pendampingnya sudah ada sejak awal (.band--cta .mq,
                .mq.shimmer .mq__copy), begitu juga buildMarquees() di jalur
                ganti bahasa. */}
            <h2
              className="display-md shimmer"
              data-marquee="-60"
              data-en="Ready to build something together?"
            >
              Siap membangun sesuatu bersama?
            </h2>
            <p
              className="prose mt-5 mx-auto max-w-[52ch]"
              data-en="Open to internships, freelance projects, and technical collaboration in electronics and industrial automation."
            >
              Terbuka untuk magang, proyek freelance, dan kolaborasi teknis di
              bidang elektronika dan otomasi industri.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <FlowButton
                href="#contact"
                text="Hubungi Saya"
                en="Get in Touch"
              />
              <FlowButton
                href="/Curriculum%20Vitae_M.%20Nabil%20Khairi%20Ikhsan.pdf"
                target="_blank"
                rel="noopener noreferrer"
                text="Unduh CV (PDF)"
                en="Download CV (PDF)"
              />
            </div>
          </div>
        </section>

        {/* ══ CONTACT ══ */}
        <section id="contact" className="band">
          <div className="shell">
 <div className="sec-head">
              <p className="label text-muted">04 — Contact</p>
 <h2 className="display-lg mt-4 split" data-en="LET’S TALK.">
                MARI BICARA.
              </h2>
              <span className="m-stripe mt-6" aria-hidden="true" />
            </div>

            <div className="mt-12 grid gap-10 max-[640px]:mt-6 max-[640px]:gap-7 lg:grid-cols-2 lg:gap-16 items-start">
              <form
                id="contact-form"
                noValidate
              >
                <h3 className="label text-muted split split-fly" data-en="Send a Message">
                  Kirim Pesan
                </h3>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label className="field">
                    <span data-en={'Name<b aria-hidden="true">*</b>'}>
                      Nama<b aria-hidden="true">*</b>
                    </span>
                    <input
                      type="text"
                      name="nama"
                      required
                      maxLength={80}
                      autoComplete="name"
                      placeholder="Nama lengkap Anda"
                      data-en-placeholder="Your full name"
                    />
                    <em className="field__err" />
                  </label>
                  <label className="field">
                    <span>
                      Email<b aria-hidden="true">*</b>
                    </span>
                    <input
                      type="email"
                      name="email"
                      required
                      maxLength={120}
                      autoComplete="email"
                      placeholder="nama@perusahaan.com"
                      data-en-placeholder="name@company.com"
                    />
                    <em className="field__err" />
                  </label>
                </div>

                <label className="field mt-5">
                  <span data-en={'Subject<b aria-hidden="true">*</b>'}>
                    Subjek<b aria-hidden="true">*</b>
                  </span>
                  <input
                    type="text"
                    name="subjek"
                    required
                    maxLength={120}
                    placeholder="Contoh: Tawaran magang PCB design"
                    data-en-placeholder="e.g. PCB design internship offer"
                  />
                  <em className="field__err" />
                </label>

                <label className="field mt-5">
                  <span data-en={'Message<b aria-hidden="true">*</b>'}>
                    Pesan<b aria-hidden="true">*</b>
                  </span>
                  <textarea
                    name="pesan"
                    required
                    rows={5}
                    maxLength={1500}
                    placeholder="Ceritakan singkat kebutuhan atau proyek Anda…"
                    data-en-placeholder="Briefly describe your needs or project…"
                  />
                  <em className="field__err" />
                </label>

                <div className="form-cta mt-6">
                  <OriginButton
                    type="submit"
                    className="btn btn--solid glass"
                    text="Kirim Pesan"
                    en="Send Message"
                  />
                  <OriginButton
                    type="button"
                    id="copy-email"
                    className="btn btn--outline"
                    text="Salin Email"
                    en="Copy Email"
                  />
                </div>

                <p
                  className="caption text-muted mt-4 leading-relaxed"
                  data-en={
                    'The send button opens your email app with the message pre-filled. Not working? Write directly to <a href="mailto:nabilkhairiikhsan@gmail.com" class="tlink">nabilkhairiikhsan@gmail.com</a>.'
                  }
                >
                  Tombol kirim membuka aplikasi email Anda dengan pesan yang
                  sudah terisi. Tidak berfungsi? Kirim langsung ke{' '}
                  <a
                    href="mailto:nabilkhairiikhsan@gmail.com"
                    className="tlink"
                  >
                    nabilkhairiikhsan@gmail.com
                  </a>
                  .
                </p>
                <p
                  id="form-status"
                  role="status"
                  aria-live="polite"
                  className="form-status"
                />
              </form>

 <div>
                <h3
                  className="label text-muted split split-fly"
                  data-en="Information &amp; Direct Contact"
                >
                  Informasi &amp; Kontak Langsung
                </h3>

                <ul className="mt-5 border-t border-hairline-c">
                  <li>
                    <a className="chan" href="mailto:nabilkhairiikhsan@gmail.com">
                      <span className="chan__i">{CHAN_ICON.email}</span>
                      <span className="label chan__k">Email</span>
                      <span className="chan__v">nabilkhairiikhsan@gmail.com</span>
                      <span className="chan__x">→</span>
                    </a>
                  </li>
                  <li>
                    <a
                      className="chan"
                      href="https://wa.me/6285346567107"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="chan__i">{CHAN_ICON.whatsapp}</span>
                      <span className="label chan__k">WhatsApp</span>
                      <span className="chan__v">+62 853-4656-7107</span>
                      <span className="chan__x">→</span>
                    </a>
                  </li>
                  <li>
                    <a
                      className="chan"
                      href="https://linkedin.com/in/nabil-khairi-ikhsan"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="chan__i">{CHAN_ICON.linkedin}</span>
                      <span className="label chan__k">LinkedIn</span>
                      <span className="chan__v">in/nabil-khairi-ikhsan</span>
                      <span className="chan__x">→</span>
                    </a>
                  </li>
                  <li>
                    <a
                      className="chan"
                      href="https://github.com/nabilkhairii"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="chan__i">{CHAN_ICON.github}</span>
                      <span className="label chan__k">GitHub</span>
                      <span className="chan__v">nabilkhairii</span>
                      <span className="chan__x">→</span>
                    </a>
                  </li>
                  <li>
                    <span className="chan">
                      <span className="chan__i">{CHAN_ICON.location}</span>
                      <span className="label chan__k" data-en="Location">
                        Lokasi
                      </span>
                      <span className="chan__v" data-en="Depok, West Java">
                        Depok, Jawa Barat
                      </span>
                    </span>
                  </li>
                </ul>

                <div className="quote mt-10">
                  <span className="m-stripe" aria-hidden="true" />
                  <p className="label mt-5 text-ink shimmer">Open to work</p>
                  <p
                    className="prose mt-3"
                    data-en="Internships, freelance projects, and technical collaboration: Automation, PCB design, PLC, robotics, and computer vision."
                  >
                    Magang, proyek freelance, dan kolaborasi teknis: Automasi,
                    PCB design, PLC, robotika, dan computer vision.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ══ FOOTER ══ */}
      <footer className="footer border-t border-hairline-c">
        <div className="shell grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="m-stripe m-stripe--brand" aria-hidden="true" />
            <p className="title-lg mt-4">
              M. NABIL
              <br />
              KHAIRI IKHSAN
            </p>
            <p className="caption text-muted mt-3">
              Electronics Engineering · D4 UNY
            </p>
          </div>
          <nav
            aria-label="Navigasi footer"
            data-en-aria-label="Footer navigation"
          >
            <h3 className="label text-muted" data-en="Pages">
              Halaman
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="#hero" className="flink">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="flink">
                  About
                </a>
              </li>
              <li>
                <a href="#skills" className="flink">
                  Skills
                </a>
              </li>
              <li>
                <a href="#experience" className="flink">
                  Projects
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Kontak" data-en-aria-label="Contact">
            <h3 className="label text-muted" data-en="Contact">
              Kontak
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="mailto:nabilkhairiikhsan@gmail.com" className="flink">
                  Email
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/6285346567107"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flink"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/in/nabil-khairi-ikhsan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flink"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="/Curriculum%20Vitae_M.%20Nabil%20Khairi%20Ikhsan.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flink"
                  data-en="Download CV"
                >
                  Unduh CV
                </a>
              </li>
            </ul>
          </nav>
          <div>
            <h3 className="label text-muted" data-en="Location">
              Lokasi
            </h3>
            <p
              className="prose mt-4"
              data-en="Depok, West Java"
            >
              Depok, Jawa Barat
            </p>
          </div>
        </div>

        <div className="shell mt-14 pt-6 border-t border-hairline-c flex flex-wrap gap-3 justify-between">
          <p
            className="caption text-muted"
            data-en="© 2026 M. Nabil Khairi Ikhsan. All project documentation belongs to the author and the institutions involved."
          >
            © 2026 M. Nabil Khairi Ikhsan. Seluruh dokumentasi proyek milik
            pribadi dan institusi terkait.
          </p>
        </div>
      </footer>

      {/* ══ GALLERY MODAL — native <dialog> ══ */}
      <dialog id="gallery" aria-labelledby="g-title">
        <div className="g-shell">
          <span className="m-stripe" aria-hidden="true" />

          <header className="g-head">
            <div className="min-w-0">
              <p id="g-cat" className="label text-muted" />
              <h3 id="g-title" className="title-lg mt-2" />
              <p id="g-org" className="caption text-muted mt-1" />
            </div>
            <button
              id="g-close"
              className="g-close glass"
              aria-label="Tutup galeri"
              data-en-aria-label="Close gallery"
            >
              ✕
            </button>
          </header>

          <p id="g-desc" className="g-desc" />

          {/* Diisi openGallery(): tautan verifikasi sertifikat dan daftar
              sertifikat di LinkedIn. Kosong untuk proyek non-sertifikasi, dan
              .g-links:empty menyembunyikannya berikut garis bawahnya. */}
          <p id="g-links" className="g-links" />

          <div className="g-stage">
            {/* src-nya diisi runtime saat galeri dibuka, jadi next/image tidak
                bisa dipakai — ia menuntut sumbernya sudah diketahui saat render.
                Dulu ini ikut terbungkus `eslint-disable` milik barisan ikon
                toolchain yang berlaku sampai akhir berkas; barisan itu sudah
                tidak ada, jadi pengecualiannya sekarang berdiri di sini. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="g-img is-front" alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="g-img" alt="" />
            <video
              id="g-video"
              className="g-video"
              controls
              playsInline
              preload="metadata"
              hidden
            />
            <button
              className="g-nav g-nav--prev glass"
              data-step="-1"
              aria-label="Foto sebelumnya"
              data-en-aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              className="g-nav g-nav--next glass"
              data-step="1"
              aria-label="Foto berikutnya"
              data-en-aria-label="Next photo"
            >
              ›
            </button>
            <span id="g-count" className="g-count" />
          </div>

          <p id="g-caption" className="g-caption" />
          <div id="g-thumbs" className="g-thumbs" />
        </div>
      </dialog>

      {/* filter refraksi untuk .glass — dipakai Firefox; Chrome jatuh ke blur biasa */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <filter
          id="glass-warp"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves="1"
            seed="1"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="soft"
            scale="70"
            xChannelSelector="R"
            yChannelSelector="B"
            result="warped"
          />
          <feGaussianBlur in="warped" stdDeviation="4" />
        </filter>
      </svg>

      <SiteBehavior />
    </>
  );
}

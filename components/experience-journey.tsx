/* Bab pengalaman magang — timeline pembuka lalu satu bab per perusahaan,
   masing-masing Key Responsibilities → Final Project. Kecuali ICON+, yang
   ketiga kolom teksnya menyambung langsung ke kartu tanggung jawabnya tanpa
   bagian Proyek Akhir sendiri (lihat tipe Chapter).

   Seksi "Dokumentasi Kerja" sudah tidak ada: fotonya dipindah ke Key
   Responsibility yang menghasilkannya, dan dibuka lewat popup saat judul atau
   sampul kartunya diketuk. Sebagai hamparan tersendiri, foto-foto itu tidak
   pernah memberi tahu pekerjaan mana yang dipotretnya.

   Server Component, TANPA satu baris JS klien. Gerakannya dua-duanya CSS:
   header perusahaan `position: sticky` (bilah judul yang di slide sumbernya
   diulang di tiap halaman — di sini ia tinggal terpaku sendiri selama babnya
   digulir), dan panelnya `animation-timeline: view()` di app/portfolio.css.
   Itu sebabnya tidak ada useScroll di sini: `zoom` di <body> membuat useScroll
   salah hitung (lihat catatan panjangnya di scroll-choreography.tsx),
   sedangkan timeline gulir CSS dihitung peramban dari tata letaknya sendiri
   dan ikut memperhitungkan zoom.

   ISINYA DITURUNKAN, BUKAN DIKARANG: tiap butir Key Responsibilities berasal
   dari `desc` proyek yang bersangkutan di components/portfolio-runtime.js, dan
   tiap keterangan foto adalah nama berkas fotonya sendiri. Yang
   TIDAK punya sumber di data mana pun cuma Project Background dan Key
   Contribution di bagian Final Project — keduanya disusun dari capaian
   terbesar tiap magang dan perlu dikoreksi pemiliknya. */

/* Ikon judul kolom Final Project. lucide-react, sama seperti Core
   Competencies di app/page.tsx — sudah terpasang untuk Dock, jadi tidak ada
   berkas baru di public/icons/ dan tidak ada dependensi baru. */
import {
  ArrowUp,
  createLucideIcon,
  FileText,
  HandHelping,
  TriangleAlert,
  Wrench,
} from 'lucide-react';

/* Tiga ceklis bergaris, masing-masing satu baris pekerjaan. lucide punya
   ListChecks, tapi ceklisnya cuma DUA (baris tengahnya garis polos) — jadi
   ikon ini memakai pabrik ikon lucide sendiri dengan geometri ListChecks apa
   adanya plus satu ceklis di baris tengah. Bukan <svg> karangan sendiri:
   lewat createLucideIcon, ukuran, tebal garis, dan ujung-ujungnya tetap
   ditentukan lucide, sama persis dengan ikon lain di halaman ini. */
export const ListChecks3 = createLucideIcon('list-checks-3', [
  ['path', { d: 'M13 5h8', key: 'l1' }],
  ['path', { d: 'M13 12h8', key: 'l2' }],
  ['path', { d: 'M13 19h8', key: 'l3' }],
  ['path', { d: 'm3 7 2 2 4-4', key: 'c1' }],
  ['path', { d: 'm3 12 2 2 4-4', key: 'c2' }],
  ['path', { d: 'm3 17 2 2 4-4', key: 'c3' }],
]);

/* Tangan menadah dengan panah ke atas di atasnya: yang dikerjakan diserahkan
   ke atas, bukan disimpan. Disusun dari dua ikon lucide yang SUDAH ada, bukan
   path SVG karangan sendiri yang harus dijaga tetap cocok gayanya —
   HandHelping, karena telapak Hand yang terbuka terbaca sebagai "berhenti",
   bukan menadah. Ukuran & posisinya di .jr-ico-stack (app/portfolio.css). */
function HandUp(props: { 'aria-hidden'?: 'true' }) {
  return (
    <span className="jr-ico-stack" {...props}>
      <ArrowUp />
      <HandHelping />
    </span>
  );
}

/* [Indonesia, Inggris]. Indonesia yang ditulis di markup; yang Inggris
   menumpang di data-en dan ditukar portfolio-runtime.js saat bahasa diganti —
   pola yang sama dengan seluruh halaman. Keduanya string HTML, bukan teks
   biasa: <strong> di dalamnya harus bertahan di kedua bahasa, dan penukarnya
   memang bekerja lewat innerHTML. */
export type Bi = readonly [string, string];

/* Satu-satunya tempat dangerouslySetInnerHTML dipakai di repo ini, dan isinya
   literal dari berkas ini sendiri — tidak ada masukan pengguna yang lewat
   sini. Tanpa ini tiap butir harus ditulis dua kali: sekali sebagai JSX untuk
   bahasa Indonesia, sekali sebagai string untuk data-en. */
export function Bil({
  as: Tag = 'p',
  t,
  className,
  delay,
}: {
  as?: 'p' | 'li' | 'h4' | 'h5' | 'span' | 'strong';
  t: Bi;
  className?: string;
  /* Diteruskan apa adanya ke data-reveal-delay; observer .reveal di
     portfolio-runtime.js yang menyalinnya ke --reveal-delay. */
  delay?: number;
}) {
  return (
    <Tag
      className={className}
      data-en={t[1]}
      data-reveal-delay={delay}
      dangerouslySetInnerHTML={{ __html: t[0] }}
    />
  );
}

/* Versi 1100px dari make-thumbs.mjs — sama seperti pita choreo dan kartu
   proyek. Aslinya ada yang puluhan megapiksel, dan bab ini memuat 30+ foto. */
export const thumb = (folder: string, file: string) =>
  `/thumbs/${encodeURIComponent(folder)}/${encodeURIComponent(file + '.webp')}`;

/* Dipetakan dari jalurnya, bukan ditulis di tiap entri: satu logo dipakai di
   rel DAN di bilah bab, dan menuliskannya dua kali berarti dua tempat untuk
   lupa. Kelasnya memikul dua hal sekaligus di app/portfolio.css: perlakuan
   tema (AMX dan icon+) dan tinggi per logo — rasio keempatnya berjauhan, jadi
   satu tinggi seragam membuat ANTAM yang 2,84:1 mendominasi baris sementara
   UNY yang nyaris bujur sangkar terlihat separuhnya. */
const LOGO_FX: Record<string, string> = {
  '/icons/antam%20logo.svg': 'jr-logo--antam',
  '/icons/AMX%20logo.png': 'jr-logo--amx',
  '/icons/uny.png': 'jr-logo--uny',
  '/icons/icon+.png': 'jr-logo--iconplus',
};

/* ═══ TIMELINE PEMBUKA ═══
   Terbaru dulu, ANTAM di atas — urutan yang sama dengan CHAPTERS di bawah dan
   dengan daftar PROJECTS di portfolio-runtime.js. Keempatnya masuk sini;
   Asisten Praktikum bukan magang, jadi ia berhenti di rel ini dan tidak punya
   bab sendiri.

   Keempat logonya transparan, dan dua di antaranya monokrom-gelap di ujung
   skala yang berlawanan — keduanya perlu perlakuan tema (lihat
   app/portfolio.css): marka AMX putih polos dan hilang di tema terang,
   wordmark icon+ biru dongker dan hilang di tema gelap. */
const RAIL: {
  period: Bi;
  company: string;
  logo: string;
  role: Bi;
  place: Bi;
  focus: Bi;
  href?: string;
}[] = [
  {
    period: ['Jul 2026 – Sekarang', 'Jul 2026 – Present'],
    company: 'PT ANTAM Tbk UBPP Logam Mulia',
    logo: '/icons/antam%20logo.svg',
    role: ['Magang — Electrical Maintenance', 'Intern — Electrical Maintenance'],
    place: ['Pulogadung, Jakarta Timur', 'Pulogadung, East Jakarta'],
    focus: ['Inventaris gudang, PM, dan MMLA', 'Warehouse inventory, PM, and MMLA'],
    href: '#jr-antam',
  },
  {
    period: ['Feb 2026 – Mei 2026', 'Feb 2026 – May 2026'],
    company: 'AMX UAV Technologies',
    logo: '/icons/AMX%20logo.png',
    role: ['Magang — Reverse Engineering', 'Intern — Reverse Engineering'],
    place: ['Yogyakarta', 'Yogyakarta'],
    focus: ['Sistem kelistrikan Electric Drone Sprayer', 'Electric Drone Sprayer electrical system'],
    href: '#jr-amx',
  },
  {
    period: ['Agu 2025 – Des 2025', 'Aug 2025 – Dec 2025'],
    company: 'Universitas Negeri Yogyakarta',
    logo: '/icons/uny.png',
    role: ['Paruh waktu — Asisten Praktikum', 'Part-time — Teaching Assistant'],
    place: ['Lab Alat Ukur dan Pengukuran', 'Instrumentation and Measurement Lab'],
    focus: ['14 mahasiswa, 200+ laporan praktikum', '14 students, 200+ lab reports'],
  },
  {
    period: ['Mar 2022 – Jun 2022', 'Mar 2022 – Jun 2022'],
    company: 'PT PLN Icon Plus (Persero)',
    logo: '/icons/icon+.png',
    role: ['Magang — Field Network Technician', 'Intern — Field Network Technician'],
    place: ['Makassar, Sulawesi Selatan', 'Makassar, South Sulawesi'],
    focus: ['Survei & instalasi jaringan FTTH', 'FTTH network survey & installation'],
    href: '#jr-iconplus',
  },
];

/* ═══ BAB PER PERUSAHAAN ═══ */
type Chapter = {
  id: string;
  no: string;
  company: string;
  logo: string;
  unit: Bi;
  period: Bi;
  folder: string;
  /* photos[0] jadi sampul kartunya; SEMUANYA muncul di popup saat judul atau
     sampulnya diketuk. Dulu ini `photo` tunggal dan sisa fotonya berdiri di
     seksi "Dokumentasi Kerja" sendiri — satu hamparan foto tanpa keterangan
     pekerjaan mana yang dipotretnya. Sekarang tiap foto duduk di tanggung
     jawab yang menghasilkannya.

     Keterangan fotonya tidak ditulis di sini: popupnya memakai galeri proyek
     yang sama (#gallery), dan di sana keterangan diturunkan dari NAMA BERKAS
     lewat captionOf() di portfolio-runtime.js — sama seperti seluruh foto
     proyek di halaman ini. */
  resp: { title: Bi; photos: string[]; points: Bi[] }[];
  /* photos KOSONG = bab ini tidak punya Proyek Akhir yang berdiri sendiri, dan
     ketiga kolom teks di bawah menyambung langsung ke kartu tanggung jawab di
     atasnya — tanpa judul bagian, judul proyek, dan ubin foto. Itu ICON+:
     pemutakhiran basis data ODP-nya bukan proyek di samping pekerjaannya, ia
     PEKERJAANNYA, dan fotonya duduk di kartu tanggung jawab yang
     menghasilkannya. `title` ikut jadi opsional karena tak ada yang
     merendernya di bab seperti itu. */
  final: {
    title?: Bi;
    background: Bi[];
    activities: Bi[];
    contribution: Bi[];
    photos: string[];
  };
};

const CHAPTERS: Chapter[] = [
  /* ── 01. ANTAM ───────────────────────────────────────────── */
  {
    id: 'jr-antam',
    no: '01',
    company: 'PT ANTAM Tbk UBPP Logam Mulia',
    logo: '/icons/antam%20logo.svg',
    unit: ['Electrical Maintenance — Pulogadung, Jakarta', 'Electrical Maintenance — Pulogadung, Jakarta'],
    period: ['Jul 2026 – Sekarang', 'Jul 2026 – Present'],
    folder: 'Antam',
    resp: [
      {
        title: ['Preventive Maintenance', 'Preventive Maintenance'],
        photos: [
          'Carrying out Preventive Maintenance in the Factory Area.png',
          'Preventive Maintenance Preparation in the Smelting and Refining Section.jpeg',
          'Ensuring Normal Voltage and Current in Production Machinery Components.jpeg',
          'Performing Maintenance on the Pneumatic Components of Production Machinery.jpeg',
          'Vibration Check on Scrubber Motor for Work Instruction Documentation.jpeg',
        ],
        points: [
          [
            'Mendigitalkan instruksi kerja PM jadi dokumentasi visual untuk <strong>67 dari 107 mesin</strong> industri (63%).',
            'Digitised PM work instructions into visual documentation for <strong>67 of 107 industrial machines</strong> (63%).',
          ],
          [
            'Menyiapkan dan menjalankan PM di area <strong>Smelting &amp; Refining</strong>.',
            'Prepared and carried out PM in the <strong>Smelting &amp; Refining</strong> area.',
          ],
          [
            'Memastikan tegangan dan arus komponen mesin produksi berada di batas normal.',
            'Verified that voltage and current on production machinery components stayed within normal limits.',
          ],
        ],
      },
      {
        title: ['Sistem Inventaris Gudang', 'Warehouse Inventory System'],
        photos: ['System Placement Mapping.jpeg'],
        points: [
          [
            'Mengembangkan sistem inventaris berbasis <strong>Raspberry Pi</strong> untuk mendigitalkan transaksi gudang.',
            'Built a <strong>Raspberry Pi</strong>-based inventory system to digitise warehouse transactions.',
          ],
          [
            'Merancang wiring diagram dan layout PCB sistem pendataannya.',
            'Designed the wiring diagram and PCB layout for the data-collection system.',
          ],
          [
            'Memetakan penempatan sistem di area gudang electrical maintenance.',
            'Mapped where the system would sit inside the electrical maintenance warehouse.',
          ],
          [
            'Mendukung monitoring <strong>safety stock</strong> dan perencanaan pengadaan material (progres <strong>70%</strong>).',
            'Supported <strong>safety stock</strong> monitoring and material procurement planning (<strong>70%</strong> complete).',
          ],
        ],
      },
      {
        title: ['MMLA & KPI Control Board', 'MMLA & KPI Control Board'],
        photos: [
          "Training on the Implementation of the MMLA Method in the Company's Maintenance Department.jpeg",
          'Meeting on Planning and Revising the MMLA Method.jpeg',
        ],
        points: [
          [
            'Menyusun <strong>KPI Control Board Pillar 1</strong> untuk Maintenance Maturity Level Assessment.',
            'Compiled the <strong>Pillar 1 KPI Control Board</strong> for the Maintenance Maturity Level Assessment.',
          ],
          [
            'Menstandarkan indikator kinerja di tingkat <strong>Bureau, Work Unit, dan Cost Center</strong>.',
            'Standardised performance indicators at <strong>Bureau, Work Unit, and Cost Center</strong> level.',
          ],
          [
            'Mengikuti rapat perencanaan dan revisi metode MMLA.',
            'Took part in planning and revision meetings for the MMLA method.',
          ],
          [
            'Mendampingi pelatihan penerapan MMLA di departemen maintenance.',
            'Assisted the MMLA implementation training in the maintenance department.',
          ],
        ],
      },
    ],
    final: {
      title: [
        'Sistem Inventaris Gudang Electrical Maintenance',
        'Electrical Maintenance Warehouse Inventory System',
      ],
      background: [
        [
          'Transaksi keluar-masuk material gudang electrical maintenance masih dicatat manual.',
          'Material movement in the electrical maintenance warehouse was still logged by hand.',
        ],
        [
          'Akibatnya <strong>safety stock</strong> sulit dipantau dan nilai <strong>MTTR</strong> (Mean Time To Repair) pada MMLA (Maintenance Maturity Level Assessment) tidak pernah tercapai karena perencanaan pengadaan material meleset dari kebutuhan sebenarnya.',
          'That made <strong>safety stock</strong> hard to track, and the <strong>MTTR</strong> (Mean Time To Repair) target in the MMLA (Maintenance Maturity Level Assessment) was never met, because procurement planning kept missing what was actually needed.',
        ],
        [
          'Dibutuhkan pencatatan yang berjalan di titik transaksinya sendiri, bukan direkap belakangan.',
          'What was needed was logging that happens at the point of transaction, not a recap afterwards.',
        ],
      ],
      activities: [
        [
          'Merancang <strong>wiring diagram</strong> sistem pendataan inventaris.',
          'Designed the <strong>wiring diagram</strong> for the inventory data-collection system.',
        ],
        [
          'Mendesain dan me-<em>layout</em> PCB pendataan, dan melakukan fabrikasi hingga dapat digunakan.',
          'Designed and laid out the data-collection PCB, then fabricated it through to a working board.',
        ],
        [
          'Memetakan penempatan sistem di area gudang.',
          'Mapped the system placement across the warehouse area.',
        ],
        [
          'Mengintegrasikan <strong>Raspberry Pi</strong> sebagai pengendali dan pencatat transaksi.',
          'Integrated a <strong>Raspberry Pi</strong> as the controller and transaction logger.',
        ],
      ],
      contribution: [
        [
          'Mendigitalkan transaksi inventaris gudang electrical maintenance.',
          'Digitised inventory transactions for the electrical maintenance warehouse.',
        ],
        [
          'Membuka monitoring <strong>safety stock</strong> yang sebelumnya tidak terlihat.',
          'Opened up <strong>safety stock</strong> monitoring that had not been visible before.',
        ],
        [
          'Memperbaiki dasar perencanaan pengadaan material guna menurunkan nilai <strong>MTTR</strong> (Mean Time To Repair) pada metode MMLA sehingga dapat mencapai target.',
          'Improved the basis for material procurement planning, in order to bring down the <strong>MTTR</strong> (Mean Time To Repair) figure in the MMLA method and finally reach its target.',
        ],
      ],
      photos: [
        'Inventory System Wiring Diagram.png',
        'Verifying PCB Trace Connectivity.png',
        'PCB Layout Result.jpeg',
      ],
    },
  },

  /* ── 02. AMX ─────────────────────────────────────────────── */
  {
    id: 'jr-amx',
    no: '02',
    company: 'AMX UAV Technologies',
    logo: '/icons/AMX%20logo.png',
    unit: ['Reverse Engineering — Yogyakarta', 'Reverse Engineering — Yogyakarta'],
    period: ['Feb 2026 – Mei 2026', 'Feb 2026 – May 2026'],
    folder: 'AMX',
    resp: [
      {
        title: ['Perakitan & Validasi Kelistrikan', 'Electrical Assembly & Validation'],
        photos: [
          'Core Parts of a Drone System.jpeg',
          'Components of the Drone that are the System Center (GPS, I2C, etc.).jpeg',
        ],
        points: [
          [
            'Merakit dan memvalidasi sistem kelistrikan UAV yang mengintegrasikan <strong>10+ modul elektronik</strong>.',
            'Assembled and validated a UAV electrical system integrating <strong>10+ electronic modules</strong>.',
          ],
          [
            'Mengidentifikasi komponen inti dan pusat sistem drone (<strong>GPS, I2C</strong>, dan sejenisnya).',
            'Identified the core and system-hub components of the drone (<strong>GPS, I2C</strong>, and similar).',
          ],
          [
            'Menelusuri jalur distribusi daya ke sistem dan propeler.',
            'Traced the power distribution paths to the system and the propellers.',
          ],
        ],
      },
      {
        title: ['Reverse Engineering PDB', 'Power Distribution Board Reverse Engineering'],
        photos: [
          'the PCB part of the power drone that supplies all voltage and current to the system and propeller.jpeg',
          'Reverse Engineering (RE) Electric Drone Sprayer.jpeg',
        ],
        points: [
          [
            'Melakukan reverse engineering wiring diagram dan <strong>Power Distribution Board</strong>.',
            'Reverse-engineered the wiring diagram and the <strong>Power Distribution Board</strong>.',
          ],
          [
            'Mendukung distribusi daya ke <strong>7+ subsistem</strong> UAV.',
            'Supported power distribution across <strong>7+ UAV subsystems</strong>.',
          ],
          [
            'Mengukur dimensi PCB dan jarak antarkomponen sebagai dasar desain ulang.',
            'Measured PCB dimensions and component spacing as the basis for the redesign.',
          ],
        ],
      },
      {
        title: ['Redesain PCB 2 Layer', '2-Layer PCB Redesign'],
        photos: [
          'Conducting Research and Adjustment of Drone Components for PCB Design.jpeg',
          'Measuring the Dimensions of a PCB and the Distance between Components.jpeg',
          'Schematic PCB PDB (Power Distribution Board) Main.png',
          '3D PCB PDB (Power Distribution Board) Main.png',
        ],
        points: [
          [
            'Meredesain PCB <strong>2 layer</strong> di EasyEDA dengan <strong>high-current routing</strong>.',
            'Redesigned the <strong>2-layer</strong> PCB in EasyEDA with <strong>high-current routing</strong>.',
          ],
          [
            'Melakukan analisis termal dan optimasi tata letak komponen agar siap fabrikasi.',
            'Ran thermal analysis and optimised component placement for fabrication readiness.',
          ],
          [
            'Menguji distribusi daya, melakukan troubleshooting, dan memverifikasi desain PCB.',
            'Tested power distribution, troubleshot faults, and verified the PCB design.',
          ],
        ],
      },
    ],
    final: {
      title: [
        'Redesain Power Distribution Board Drone Sprayer',
        'Drone Sprayer Power Distribution Board Redesign',
      ],
      background: [
        [
          'Board <em>existing</em> tidak disertai dokumentasi teknis.',
          'The existing board came with no technical documentation.',
        ],
        [
          'Sebagian port keluaran <strong>Main PDB</strong> tidak terpakai selama operasi, menyisakan ruang dan titik sambungan tanpa fungsi.',
          'Some of the <strong>Main PDB</strong> output ports went unused in operation, leaving board space and solder points with no function.',
        ],
        [
          'Konektor <strong>Auxiliary PDB</strong> berorientasi horizontal, membuat kabel daya utama sulit dilepas karena arah cabutnya terhalang oleh desain mekaniknya.',
          'The <strong>Auxiliary PDB</strong> connector sat horizontally, making the main power cable hard to unplug because the pull direction ran into the mechanical design.',
        ],
        /* Butir TERAKHIR kolom Latar Proyek selalu tindakannya, bukan
           masalahnya: penanda ikonnya dipilih dari posisi (lihat render di
           bawah — segitiga peringatan untuk semua butir kecuali yang
           penghabisan, kunci pas untuk yang itu). Menaruh solusi di tengah
           daftar membuat ikonnya ikut salah. */
        [
          'Kedua papan dirancang ulang sesuai kondisi pemakaian sebenarnya: jumlah dan tata letak port <strong>Main PDB</strong> disesuaikan dengan beban asli <strong>X-30L</strong>, sedangkan konektor <strong>Auxiliary PDB</strong> diubah dari orientasi horizontal menjadi vertikal.',
          'Both boards were redesigned around how they are actually used: the <strong>Main PDB</strong> port count and layout were matched to the real <strong>X-30L</strong> load, and the <strong>Auxiliary PDB</strong> connector was turned from horizontal to vertical.',
        ],
      ],
      activities: [
        [
          'Mengukur dimensi PCB dan jarak antarkomponen dari unit aslinya.',
          'Measured PCB dimensions and component spacing from the original unit.',
        ],
        [
          'Menyusun ulang wiring diagram dan jalur distribusi dayanya.',
          'Reconstructed the wiring diagram and its power distribution paths.',
        ],
        [
          'Merutekan ulang jalur daya dengan <strong>high-current routing</strong> dan menata ulang orientasi konektor di EasyEDA.',
          'Re-routed the power paths with <strong>high-current routing</strong> and reworked the connector orientation in EasyEDA.',
        ],
        [
          'Menguji distribusi daya dan memverifikasi desain sebelum fabrikasi.',
          'Tested power distribution and verified the design before fabrication.',
        ],
      ],
      contribution: [
        [
          'Menghasilkan PCB <strong>2 layer</strong> siap fabrikasi lengkap dengan dokumentasi desainnya, sehingga perbaikan dan produksi ulang tidak lagi bergantung sepenuhnya pada unit fisik yang ada.',
          'Produced a fabrication-ready <strong>2-layer</strong> PCB together with its design documentation, so repair and re-manufacture no longer depend entirely on the physical unit at hand.',
        ],
        [
          'Analisis termal dan tata letak komponen yang dioptimasi untuk arus tinggi.',
          'Thermal analysis and component placement optimised for high current.',
        ],
        [
          'Distribusi daya ke <strong>7+ subsistem</strong> terverifikasi lewat pengujian.',
          'Power distribution to <strong>7+ subsystems</strong> verified through testing.',
        ],
      ],
      /* Ketiganya keluaran desain proyek ini sendiri, urut seperti
         mengerjakannya: wiring sistem, skematik papannya, lalu hasil 3D-nya.
         "Path when Routing PCB Power Parts" sudah tidak ada di public/assets,
         dan "PCB Layout Result" pindah ke galeri saja — hasil 3D di bawah
         menggantikan perannya di sini.

         TIGA, bukan lebih: zigzag HP di app/portfolio.css menaruh order untuk
         .jr-act:nth-child(1..3) saja, dan foto keempat akan ber-order 0 — yang
         mendahului semuanya, jadi ia melompat ke depan barisan.

         Rasionya dipilih yang dekat 4:3 (1,47 / 1,14 / 1,31) karena ubin di
         sini dipatok 4:3 dan object-cover memotong sisanya. Pasangan Main
         justru panorama (3,39 dan 2,93) — di ubin 4:3 yang tersisa cuma pita
         tengahnya, jadi keduanya ditaruh di kartu Tanggung Jawab Utama, yang
         popupnya memakai object-fit: contain. */
      photos: [
        'X-30L Drone System Wiring Diagram.png',
        'Schematic PCB PDB (Power Distribution Board) Auxiliary.png',
        '3D PCB PDB (Power Distribution Board) Auxiliary.png',
      ],
    },
  },

  /* ── 03. ICON+ ───────────────────────────────────────────── */
  {
    id: 'jr-iconplus',
    no: '03',
    company: 'PT PLN Icon Plus (Persero)',
    logo: '/icons/icon+.png',
    unit: ['Field Network Technician — Makassar', 'Field Network Technician — Makassar'],
    period: ['Mar 2022 – Jun 2022', 'Mar 2022 – Jun 2022'],
    folder: 'Magang ICON+',
    resp: [
      {
        title: ['Survei & Inspeksi FTTH', 'FTTH Survey & Inspection'],
        /* Urut alur kerjanya: penugasan lokasi dari tim kantor, koordinat
           titiknya, lalu pendataan di lapangan. Sampulnya tetap foto
           dokumentasi magangnya. */
        photos: [
          'Internship Documentation at PT ICON+ Makassar.jpg',
          'Receive information from the office team regarding ODP locations that need to be surveyed.png',
          'Waiting for ODP coordinates after identifying the location to be surveyed.png',
          'Documenting and Counting Output Ports on ICONNET ODPs.png',
          'Calculating the ODP port output utilized by users in the vicinity of a specified location or coordinate point.jpg',
        ],
        points: [
          [
            'Melakukan survei lapangan dan inspeksi jaringan <strong>FTTH</strong>.',
            'Carried out field surveys and <strong>FTTH</strong> network inspections.',
          ],
          [
            'Target harian sekitar <strong>30 Optical Distribution Point (ODP)</strong>.',
            'Daily target of roughly <strong>30 Optical Distribution Points (ODP)</strong>.',
          ],
          [
            'Memeriksa kondisi perangkat terpasang langsung di titiknya.',
            'Inspected the condition of installed equipment on site.',
          ],
          [
            'Mendokumentasikan dan menghitung <strong>port keluaran</strong> ODP ICONNET yang sudah terpakai di sekitar titik koordinatnya.',
            'Documented and counted the <strong>output ports</strong> already in use on ICONNET ODPs around each coordinate point.',
          ],
        ],
      },
      {
        title: ['Pemutakhiran Data ODP', 'ODP Data Update'],
        photos: [
          'Report Creation and Data Recapitulation.jpg',
          'Verify with the relevant office team regarding the number of ports currently in use by nearby users at the specified ODP coordinates.png',
        ],
        points: [
          [
            'Memperbarui data <strong>2.510 ODP</strong> lewat sistem pemetaan digital.',
            'Updated <strong>2,510 ODP</strong> records through the digital mapping system.',
          ],
          [
            'Menyusun laporan dan rekapitulasi data hasil survei.',
            'Compiled reports and data recaps from the survey results.',
          ],
          [
            'Mendukung akurasi dokumentasi dan perencanaan jaringan.',
            'Supported documentation accuracy and network planning.',
          ],
        ],
      },
      {
        title: ['Penyiapan Perangkat', 'Equipment Preparation'],
        photos: [
          'Preparing ODP Components.jpg',
          'Preparing New ODPs for Installation at New Locations.jpg',
          'Preparing the Splitter for a New ODP.jpg',
          'Installing an adapter on a new ODP.jpg',
        ],
        points: [
          [
            'Menyiapkan dan memasang perangkat <strong>ODP</strong> untuk deployment unit baru.',
            'Prepared and installed <strong>ODP</strong> equipment for new unit deployment.',
          ],
          [
            'Memasang adapter dan <strong>passive splitter 1:8</strong>.',
            'Fitted adapters and <strong>1:8 passive splitters</strong>.',
          ],
          [
            'Membantu penyelenggaraan kegiatan operasional PT Icon Plus.',
            'Helped run PT Icon Plus operational activities.',
          ],
        ],
      },
    ],
    /* Tanpa `title` dan dengan `photos` kosong: lihat catatan di tipe Chapter —
       ketiga kolom di bawah menyambung langsung ke kartu tanggung jawab. */
    final: {
      background: [
        [
          'Kondisi <strong>ODP</strong> di lapangan tidak lagi sinkron dengan basis data pemetaannya.',
          'The state of <strong>ODP</strong> units in the field no longer matched the mapping database.',
        ],
        [
          'Perencanaan jaringan dan penanganan gangguan bertumpu pada data yang sudah bergeser.',
          'Network planning and fault handling were resting on data that had drifted.',
        ],
        [
          'Perbaikannya harus dari lapangan: satu titik disurvei, satu baris data diperbarui.',
          'The fix had to start in the field: one point surveyed, one record updated.',
        ],
      ],
      activities: [
        [
          'Survei lapangan sekitar <strong>30 ODP per hari</strong>.',
          'Field surveys of roughly <strong>30 ODP per day</strong>.',
        ],
        [
          'Verifikasi kondisi perangkat dan kelengkapan terpasang.',
          'Verification of equipment condition and installed completeness.',
        ],
        [
          'Input hasil survei ke sistem pemetaan digital.',
          'Entry of survey results into the digital mapping system.',
        ],
        [
          'Rekapitulasi dan pelaporan berkala.',
          'Periodic recaps and reporting.',
        ],
      ],
      contribution: [
        [
          'Data <strong>2.510 ODP</strong> termutakhirkan di sistem pemetaan.',
          '<strong>2,510 ODP</strong> records brought up to date in the mapping system.',
        ],
        [
          'Dokumentasi jaringan kembali mencerminkan kondisi lapangan.',
          'Network documentation once again reflected field conditions.',
        ],
        [
          'Dasar perencanaan jaringan dan deployment unit baru jadi lebih akurat.',
          'A more accurate basis for network planning and new unit deployment.',
        ],
      ],
      photos: [],
    },
  },
];

/* Judul kolom Final Project + ikonnya. Dipisah dari datanya karena ketiganya
   sama di semua bab — mengulanginya tiga kali cuma menambah tempat untuk
   meleset. Ikonnya menandai WATAK kolomnya, bukan hiasan: Latar Proyek adalah
   duduk perkaranya (lembar keterangan), Kegiatan Utama daftar pekerjaan yang
   dikerjakan (tiga ceklis bergaris), Kontribusi hasil yang diserahkan (tangan
   menadah dengan panah ke atas).

   Segitiga peringatan pindah dari judul kolom Latar Proyek ke DALAM butirnya:
   di sana ia menandai butir mana yang masalah, satu tingkat lebih tepat
   daripada menandai seluruh kolom. */
const FINAL_HEADS = [
  [['Latar Proyek', 'Project Background'], FileText],
  [['Kegiatan Utama', 'Key Activities'], ListChecks3],
  [['Kontribusi', 'Key Contribution'], HandUp],
] as const;

/* Penanda perusahaan yang menemani tiap judul bagian di dalam bab: logonya
   saja, menempel persis di samping kanan teks judulnya. Nama yang dulu ikut
   melayang di tepi kiri layar sudah dilepas.

   alt DIISI nama perusahaannya: logo ini satu-satunya yang menyebut bab ini
   milik siapa, dan gambar yang memikul arti bukan hiasan.
   Keduanya telanjang di atas latar halaman — kapsul dongker, keping putih,
   dan segitiga kop laporannya sudah dilepas: di pinggir layar begitu, pelat
   sebesar itu lebih berat dari judul yang ditemaninya.

   Ini BUKAN bilah sticky yang dulu dilepas (lihat catatan di .jr-chapter,
   app/portfolio.css): ia menggulir bersama judulnya dan tidak mengambil satu
   baris pun di bawah .topnav. Yang dijawabnya keluhan yang sama — panggung
   pembuka bab sudah lewat berlayar-layar saat orang sampai di Proyek Akhir,
   dan tidak ada lagi yang menyebut perusahaan mana yang sedang dibaca.

   Namanya tidak punya data-en: ketiganya nama diri yang sama di kedua bahasa. */
function ChapterTag({ logo, company }: { logo: string; company: string }) {
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img className={`jr-hlogo ${LOGO_FX[logo] ?? ''}`} src={logo} alt={company} loading="lazy" />;
}

/* Ketiga kolom teks Proyek Akhir. Berdiri sebagai fungsinya sendiri karena
   dipakai di DUA tempat: di dalam .jr-final__grid berpasangan dengan ubin
   fotonya, dan telanjang di bab yang tidak punya Proyek Akhir (ICON+) —
   menyalinnya dua kali berarti dua tempat untuk lupa. */
function FinalCols({ final, solo }: { final: Chapter['final']; solo?: boolean }) {
  return (
    <div className={`jr-final__cols mt-8${solo ? ' jr-final__cols--solo' : ''}`}>
      {[final.background, final.activities, final.contribution].map((list, i) => {
        const [head, Icon] = FINAL_HEADS[i];
        /* .reveal + data-reveal-delay, BUKAN .jr-fx seperti ubin lain
           di bab ini. Keduanya sama-sama "naik sambil memudar masuk",
           tapi .jr-fx itu animation-timeline: view() — terikat posisi
           gulir, jadi ketiga kotak yang berdampingan naik serentak dan
           gulir cepat menyelesaikan ketiganya sekaligus. .reveal
           dipicu observer lalu berjalan atas waktu, jadi girannya
           benar-benar berurutan: Latar Proyek dulu, baru Kegiatan
           Utama, baru Kontribusi.

           350ms, bukan 600ms penuh durasi .reveal: easeOutQuart
           menyelesaikan hampir seluruh geraknya di paruh pertama,
           jadi kotak sebelumnya sudah terbaca mendarat di ~300ms.
           Menunggu durasi penuh membuat kotak ketiga baru selesai di
           detik ke-1,9 — berurutan, tapi terasa lama. Observernya
           menyalin angka ini ke --reveal-delay. */
        return (
          <section key={head[0]} className="jr-block reveal" data-reveal-delay={i * 350}>
            {/* data-en-nya di <span> di dalam, bukan di <h5>: penukar
                bahasa bekerja lewat innerHTML, dan kalau penandanya
                di judulnya ia ikut menyapu <svg> ikonnya. */}
            <h5 className="label jr-block__h">
              <Icon aria-hidden="true" />
              <Bil as="span" t={head} />
            </h5>
            {/* Kolom Latar Proyek saja yang butirnya berikon, dan
                polanya sama di ketiga bab karena isinya memang disusun
                begitu: dua butir pertama masalah yang ditemui, butir
                ketiga tindakan yang dituntutnya. Kotak persegi
                .jr-block__list li::before dimatikan untuk kolom ini —
                ikonnya YANG jadi butirnya, bukan tambahan di sampingnya. */}
            <ul className={`jr-block__list${i === 0 ? ' jr-block__list--ico' : ''}`}>
              {list.map((p, k) =>
                i === 0 ? (
                  <li key={p[0]}>
                    {k < list.length - 1 ? (
                      <TriangleAlert aria-hidden="true" />
                    ) : (
                      <Wrench aria-hidden="true" />
                    )}
                    <Bil as="span" t={p} />
                  </li>
                ) : (
                  <Bil key={p[0]} as="li" t={p} />
                ),
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function ExperienceJourney() {
  return (
    <section id="journey" className="band">
      <div className="shell">
        <div className="sec-head">
          <p className="label text-muted">03 — Internship Journey</p>
          <h2
            className="display-lg mt-4 split"
            data-en="FOUR ROLES,<br>ONE THREAD."
          >
            EMPAT PERAN,
            <br />
            SATU BENANG MERAH.
          </h2>
          <span className="m-stripe mt-6" aria-hidden="true" />
        </div>

        {/* DI LUAR .sec-head, dan itu satu-satunya cara melebarkannya:
            .sec-head dipatok max-width: 60ch di app/portfolio.css, jadi anak di
            dalamnya tidak bisa melewatinya berapa pun max-w-nya sendiri. Di
            sini ia anak langsung .shell.

            120ch, bukan lepas sama sekali: di 1440px .shell 1344px = ~168ch,
            dan baris sepanjang itu membuat mata kehilangan awal baris
            berikutnya. 120ch cukup untuk menahan kedua bahasa di DUA baris —
            versi Indonesianya ~262 huruf, yang terpanjang dari keduanya. */}
        <p
          className="prose mt-6 max-w-[120ch]"
          data-en="From learning what a workplace culture is at ICON+ Makassar, to applying what I had learned at AMX UAV Technologies, to reaching the point of being trusted with a project at PT ANTAM UBPP Logam Mulia in the Maintenance division."
        >
          Dari belajar mengenai pengenalan budaya kerja di ICON+ Makassar,
          kemudian mengimplementasikan ilmu yang telah dipelajari pada AMX UAV
          Technologies, sampai di titik bisa diberikan kesempatan untuk memegang
          proyek di PT ANTAM UBPP Logam Mulia pada divisi Maintenance.
        </p>

        {/* ═══ REL WAKTU ═══
            <ol>, bukan <div>: ini urutan yang bermakna, dan pembaca layar
            mengumumkannya sebagai "1 dari 4". Garis relnya digambar
            ::before milik .jr-rail, jadi tidak ada elemen kosong di markup
            yang cuma jadi garis. */}
        <ol className="jr-rail mt-12">
          {RAIL.map((r, i) => (
            /* 120ms per perhentian — angka yang sama dipakai kartu pendidikan
               dan slot lanyard. Yang membacanya observer .reveal di
               portfolio-runtime.js: ia menyalin data-reveal-delay ke
               --reveal-delay, dan menolkannya lagi saat elemennya keluar layar
               supaya gulir balik memainkan kaskade yang sama sekali lagi. */
            <li
              key={r.company}
              className="jr-stop reveal"
              data-reveal-delay={i * 120}
            >
              <span className="jr-stop__node" aria-hidden="true" />
              <Bil as="span" className="caption jr-stop__when" t={r.period} />
              <div className="jr-stop__card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={`jr-logo ${LOGO_FX[r.logo] ?? ''}`} src={r.logo} alt="" loading="lazy" />
                <h3 className="jr-stop__co">{r.company}</h3>
                <Bil as="p" className="jr-stop__role" t={r.role} />
                <Bil as="p" className="jr-stop__meta" t={r.place} />
                <Bil as="p" className="jr-stop__meta" t={r.focus} />
                {r.href && (
                  <a className="jr-stop__link" href={r.href}>
                    <span data-en="Read the chapter">Baca babnya</span>
                    <span aria-hidden="true">↓</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* ═══ BAB ═══ */}
      {CHAPTERS.map((c) => (
        <article key={c.id} id={c.id} className="jr-chapter">
          {/* Panggung pembuka setinggi layar: satu bab, satu layar penuh,
              sebelum isinya dimulai: nomor, logo, nama, unit, periode.
              Sempat ada bilah tipis yang terpaku di bawah .topnav sepanjang
              bab dan mengulang isi yang sama; bilah itu dilepas — judulnya
              sudah dibaca utuh sekali di sini.

              Penundaan reveal-nya bertingkat 0/90/180/260ms; observer yang
              sama dengan rel waktu di atas, tanpa satu baris JS baru. */}
          <div className="jr-intro">
            <div className="jr-intro__in">
              <span className="jr-intro__ghost" aria-hidden="true">
                {c.no}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={`jr-logo jr-logo--intro reveal ${LOGO_FX[c.logo] ?? ''}`}
                src={c.logo}
                alt=""
                loading="lazy"
              />
              <h3 className="jr-intro__co reveal" data-reveal-delay="90">
                {c.company}
              </h3>
              <Bil
                as="p"
                className="jr-intro__unit reveal"
                t={c.unit}
                delay={180}
              />
              <Bil
                as="p"
                className="jr-intro__when reveal"
                t={c.period}
                delay={260}
              />
            </div>
          </div>

          <div className="shell">
            {/* ── Key Responsibilities ── */}
            <div className="jr-hrow">
              <h3
                className="label text-muted jr-h split split-fly"
                data-en="Key Activities &amp; Responsibilities"
              >
                Kegiatan &amp; Tanggung Jawab Utama
              </h3>
              <ChapterTag logo={c.logo} company={c.company} />
            </div>
            {/* data-* di kartunya, bukan di pemicunya: SATU sumber untuk
                kedua pemicu (sampul dan judul), dan penangannya di
                portfolio-runtime.js tinggal naik ke .jr-card. Yang disimpan
                cuma yang tidak bisa dibaca dari DOM saat diketuk — judul dan
                butirnya sudah ada di dalam kartu ini dalam bahasa yang sedang
                aktif, jadi keduanya tidak diulang.

                data-period sengaja versi INDONESIANYA: period() di runtime
                yang menerjemahkan nama bulannya saat bahasa Inggris aktif,
                jadi satu string cukup untuk dua bahasa. */}
            <div className="jr-resp mt-6">
              {c.resp.map((r) => (
                <section
                  key={r.title[0]}
                  className="jr-card jr-fx"
                  data-folder={c.folder}
                  data-photos={JSON.stringify(r.photos)}
                  data-org={c.company}
                  data-period={c.period[0]}
                >
                  {/* Dua pemicu, SATU perhentian Tab. Sampulnya yang jadi
                      kontrol sungguhan (role/tabIndex, dijalankan Enter/Spasi
                      lewat penangan di portfolio-runtime.js); judulnya cuma
                      sasaran ketuk tambahan untuk tetikus dan jari. Menjadikan
                      keduanya bisa di-Tab berarti dua perhentian untuk satu
                      perbuatan yang sama — itu memperlambat penavigasi papan
                      ketik, bukan menolongnya.

                      aria-label lewat data-en-aria-label: tidak ada teks di
                      dalam kotak fotonya yang bisa jadi namanya. */}
                  <div
                    className="jr-card__media jr-open"
                    role="button"
                    tabIndex={0}
                    aria-label={`Lihat foto: ${r.title[0]}`}
                    data-en-aria-label={`View photos: ${r.title[1]}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(c.folder, r.photos[0])} alt="" loading="lazy" />
                    {/* aria-hidden: kotaknya sudah punya aria-label yang
                        menyebut perbuatan yang sama, dan membacakan keduanya
                        cuma mengulang. Ini isyarat untuk MATA. */}
                    <span
                      className="jr-cue"
                      aria-hidden="true"
                      data-en="Tap to see activity"
                    >
                      Ketuk untuk lihat kegiatan
                    </span>
                  </div>
                  <Bil as="h4" className="jr-card__title jr-open" t={r.title} />
                  <ul className="jr-card__list">
                    {r.points.map((p) => (
                      <Bil key={p[0]} as="li" t={p} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {/* ── Final Project ──
                Ada bab yang TIDAK punya, dan ICON+ satu-satunya sejauh ini:
                pemutakhiran basis data ODP-nya bukan proyek di samping
                pekerjaannya, ia pekerjaannya sendiri. Jadi ketiga kolom teksnya
                menyambung langsung ke kartu tanggung jawab di atas — tanpa
                judul bagian, tanpa judul proyek, tanpa ubin foto (fotonya sudah
                duduk di kartu yang menghasilkannya). Penandanya photos kosong;
                lihat catatan di tipe Chapter. */}
            {c.final.photos.length > 0 ? (
              <>
                <div className="jr-hrow">
                  <h3 className="label text-muted jr-h split split-fly" data-en="Final Project">
                    Proyek Akhir
                  </h3>
                  <ChapterTag logo={c.logo} company={c.company} />
                </div>
                {/* .split: huruf demi huruf naik 40px sambil memudar masuk — efek
                    yang sama dengan judul seksi lain di halaman ini, jadi tidak ada
                    animasi baru yang perlu dirawat. Judul ini 45 huruf, dua kali
                    heading yang jadi patokan 40ms, tapi tidak perlu disetel:
                    splitOne() di portfolio-runtime.js menulis --split-step
                    min(40, 900/n) sebagai gaya inline, jadi sapuannya selalu
                    selesai dalam 0,9 detik berapa pun panjangnya. */}
                {c.final.title && (
                  <Bil as="h4" className="jr-final__title mt-4 split" t={c.final.title} />
                )}
                {/* Ubin yang persis sama dengan Dokumentasi Kerja — .jr-acts/.jr-act
                    DIPAKAI ULANG, bukan disalin jadi kelas sendiri: sorot layar
                    penuh saat diketuk, pelat judul di kepala ubin, dan aturan ubin
                    melebar untuk baris yang tidak genap ikut terbawa tanpa satu
                    baris CSS atau JS baru. */}
                {/* Pembungkus foto + ketiga blok teks. Di layar lebar ia <div>
                    polos yang tidak mengubah apa pun — fotonya tetap tiga sebaris
                    dan teksnya tiga kolom di bawahnya. Di HP ia jadi KISI dua kolom
                    dan kedua wadah di dalamnya `display: contents`, sehingga
                    fotonya dan blok teksnya jadi item kisi yang sama dan bisa
                    diselang-seling kiri-kanan lewat `order` (app/portfolio.css).

                    Pembungkus, bukan menyatukan keduanya jadi satu daftar di
                    markup: urutan DOM-nya — semua foto dulu, baru semua teks —
                    itulah urutan yang benar untuk pembaca layar dan untuk layar
                    lebar. Yang berubah di HP cuma cara menggambarnya.

                    --2 saat fotonya cuma dua (AMX): blok ketiganya tidak kebagian
                    pasangan, dan tanpa penanda ini ia berdiri setengah lebar di
                    baris terakhir dengan sel kosong di sebelahnya. */}
                <div
                  className={`jr-final__grid mt-8${
                    c.final.photos.length < 3 ? ' jr-final__grid--2' : ''
                  }`}
                >
                  <div className="jr-acts">
                    {c.final.photos.map((f) => (
                      <figure
                        key={f}
                        className="jr-act jr-zoom jr-fx"
                        role="button"
                        tabIndex={0}
                        aria-expanded={false}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb(c.folder, f)} alt="" loading="lazy" />
                        {/* Judulnya nama berkasnya sendiri, bukan teks kedua yang
                            harus dijaga tetap cocok: nama-nama itu sudah frasa yang
                            bisa dibaca ("Verifying PCB Trace Connectivity"), dan
                            ganti foto = ganti judul, satu langkah. Bukan <Bil>: ini
                            nama gambar teknis, sama di kedua bahasa — tanpa data-en,
                            pengalih bahasa melewatinya.

                            KONSEKUENSINYA nama berkas harus pendek: pelatnya selebar
                            teksnya, dan nama sepanjang kalimat jadi slab tiga baris
                            yang menggencet fotonya sendiri. Patokannya ±38 karakter
                            — sepanjang itu masih satu baris di ubin tiga kolom. */}
                        <span className="jr-act__cap">{f.replace(/\.[^.]+$/, '')}</span>
                      </figure>
                    ))}
                  </div>
                  <FinalCols final={c.final} />
                </div>
              </>
            ) : (
              <FinalCols final={c.final} solo />
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

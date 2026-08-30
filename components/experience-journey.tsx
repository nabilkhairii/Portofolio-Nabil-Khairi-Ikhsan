/* Bab pengalaman magang — timeline pembuka lalu satu bab per perusahaan,
   masing-masing Key Responsibilities → Key Activities → Final Project.

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
   tiap keterangan Key Activities adalah nama berkas fotonya sendiri. Yang
   TIDAK punya sumber di data mana pun cuma Project Background dan Key
   Contribution di bagian Final Project — keduanya disusun dari capaian
   terbesar tiap magang dan perlu dikoreksi pemiliknya. */

/* [Indonesia, Inggris]. Indonesia yang ditulis di markup; yang Inggris
   menumpang di data-en dan ditukar portfolio-runtime.js saat bahasa diganti —
   pola yang sama dengan seluruh halaman. Keduanya string HTML, bukan teks
   biasa: <strong> di dalamnya harus bertahan di kedua bahasa, dan penukarnya
   memang bekerja lewat innerHTML. */
type Bi = readonly [string, string];

/* Satu-satunya tempat dangerouslySetInnerHTML dipakai di repo ini, dan isinya
   literal dari berkas ini sendiri — tidak ada masukan pengguna yang lewat
   sini. Tanpa ini tiap butir harus ditulis dua kali: sekali sebagai JSX untuk
   bahasa Indonesia, sekali sebagai string untuk data-en. */
function Bil({
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
const thumb = (folder: string, file: string) =>
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
    company: 'PT ANTAM Tbk UBPE Logam Mulia',
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
  resp: { title: Bi; photo: string; points: Bi[] }[];
  acts: { photo: string; caption: Bi }[];
  final: {
    title: Bi;
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
    company: 'PT ANTAM Tbk UBPE Logam Mulia',
    logo: '/icons/antam%20logo.svg',
    unit: ['Electrical Maintenance — Pulogadung, Jakarta', 'Electrical Maintenance — Pulogadung, Jakarta'],
    period: ['Jul 2026 – Sekarang', 'Jul 2026 – Present'],
    folder: 'Antam',
    resp: [
      {
        title: ['Preventive Maintenance', 'Preventive Maintenance'],
        photo: 'Carrying out Preventive Maintenance in the Factory Area.png',
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
          [
            'Melakukan <strong>vibration check</strong> pada motor scrubber sebagai bahan dokumentasi instruksi kerja.',
            'Ran <strong>vibration checks</strong> on the scrubber motor as source material for the work instructions.',
          ],
        ],
      },
      {
        title: ['Sistem Inventaris Gudang', 'Warehouse Inventory System'],
        photo: 'Wiring Diagram for the Electrical Maintenance Warehouse Inventory Data Collection Project.png',
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
        photo: "Training on the Implementation of the MMLA Method in the Company's Maintenance Department.jpeg",
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
    acts: [
      {
        photo: 'Become part of PT ANTAM (UBPP) Logam Mulia.jpeg',
        caption: ['Bergabung di UBPE Logam Mulia', 'Joining UBPE Logam Mulia'],
      },
      {
        photo: 'Preventive Maintenance Preparation in the Smelting and Refining Section.jpeg',
        caption: ['Persiapan PM di Smelting &amp; Refining', 'PM preparation in Smelting &amp; Refining'],
      },
      {
        photo: 'Ensuring Normal Voltage and Current in Production Machinery Components.jpeg',
        caption: ['Pemeriksaan tegangan &amp; arus', 'Voltage &amp; current check'],
      },
      {
        photo: 'Performing Maintenance on the Pneumatic Components of Production Machinery.jpeg',
        caption: ['Perawatan komponen pneumatik', 'Pneumatic component maintenance'],
      },
      {
        photo: 'Vibration Check on Scrubber Motor for Work Instruction Documentation.jpeg',
        caption: ['Vibration check motor scrubber', 'Scrubber motor vibration check'],
      },
      {
        photo: 'Meeting on Planning and Revising the MMLA Method.jpeg',
        caption: ['Rapat revisi metode MMLA', 'MMLA method revision meeting'],
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
          'Akibatnya <strong>safety stock</strong> sulit dipantau dan perencanaan pengadaan material meleset dari kebutuhan nyata.',
          'That made <strong>safety stock</strong> hard to track and pushed procurement planning away from real demand.',
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
          'Mendesain dan me-<em>layout</em> PCB pendataan, siap fabrikasi.',
          'Designed and laid out the data-collection PCB, ready for fabrication.',
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
          'Memperbaiki dasar perencanaan pengadaan material.',
          'Improved the basis for material procurement planning.',
        ],
        [
          'Penyelesaian proyek mencapai <strong>70%</strong> selama periode magang.',
          'Project reached <strong>70%</strong> completion during the internship.',
        ],
      ],
      photos: [
        'Wiring Diagram for the Electrical Maintenance Warehouse Inventory Data Collection Project.png',
        'PCB Layout Result for the Inventory Data Collection System.jpeg',
        'System Placement Mapping.jpeg',
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
        photo: 'Core Parts of a Drone System.jpeg',
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
        photo: 'Measuring the Dimensions of a PCB and the Distance between Components.jpeg',
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
        photo: 'PCB Layout Result.jpeg',
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
    acts: [
      {
        photo: 'Reverse Engineering (RE) Electric Drone Sprayer.jpeg',
        caption: ['Reverse engineering drone sprayer', 'Drone sprayer reverse engineering'],
      },
      {
        photo: 'Components of the Drone that are the System Center (GPS, I2C, etc.).jpeg',
        caption: ['Pusat sistem: GPS, I2C, dan lainnya', 'System hub: GPS, I2C, and more'],
      },
      {
        photo: 'Conducting Research and Adjustment of Drone Components for PCB Design.jpeg',
        caption: ['Penyesuaian komponen untuk desain PCB', 'Component adjustment for the PCB design'],
      },
      {
        photo: 'the PCB part of the power drone that supplies all voltage and current to the system and propeller.jpeg',
        caption: ['Bagian daya: pemasok tegangan &amp; arus', 'Power section: voltage &amp; current supply'],
      },
      {
        photo: 'Display for Function Efficient PCBs.jpeg',
        caption: ['Penataan fungsi PCB yang efisien', 'Efficient PCB function layout'],
      },
      {
        photo: 'AMX Electrical Team.jpeg',
        caption: ['Tim Electrical AMX', 'The AMX Electrical team'],
      },
    ],
    final: {
      title: [
        'Redesain Power Distribution Board Drone Sprayer',
        'Drone Sprayer Power Distribution Board Redesign',
      ],
      background: [
        [
          'Power Distribution Board yang terpasang tidak disertai dokumentasi desain.',
          'The installed Power Distribution Board came with no design documentation.',
        ],
        [
          'Perbaikan dan produksi ulang jadi bergantung sepenuhnya pada unit fisik yang ada.',
          'Repair and re-manufacture therefore depended entirely on the physical unit at hand.',
        ],
        [
          'Papan itu memasok tegangan dan arus ke seluruh sistem dan propeler — satu titik yang tidak boleh gagal.',
          'That board feeds voltage and current to the whole system and the propellers — a single point that cannot fail.',
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
          'Merutekan ulang jalur daya dengan <strong>high-current routing</strong> di EasyEDA.',
          'Re-routed the power paths with <strong>high-current routing</strong> in EasyEDA.',
        ],
        [
          'Menguji distribusi daya dan memverifikasi desain sebelum fabrikasi.',
          'Tested power distribution and verified the design before fabrication.',
        ],
      ],
      contribution: [
        [
          'Menghasilkan PCB <strong>2 layer</strong> siap fabrikasi lengkap dengan dokumentasi desainnya.',
          'Produced a fabrication-ready <strong>2-layer</strong> PCB together with its design documentation.',
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
      photos: [
        'Path when Routing PCB Power Parts.jpeg',
        'Display for Function Efficient PCBs.jpeg',
        'PCB Layout Result.jpeg',
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
        photo: 'Internship Documentation at PT ICON+ Makassar.jpg',
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
        ],
      },
      {
        title: ['Pemutakhiran Data ODP', 'ODP Data Update'],
        photo: 'Report Creation and Data Recapitulation.jpg',
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
        photo: 'Preparing ODP Components.jpg',
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
    acts: [
      {
        photo: 'Internship Opening and Briefing.jpg',
        caption: ['Pembukaan dan briefing magang', 'Internship opening and briefing'],
      },
      {
        photo: 'Preparing ODP Components.jpg',
        caption: ['Penyiapan komponen ODP', 'Preparing ODP components'],
      },
      {
        photo: 'Internship Documentation at PT ICON+ Makassar.jpg',
        caption: ['Dokumentasi lapangan Makassar', 'Field documentation in Makassar'],
      },
      {
        photo: 'Report Creation and Data Recapitulation.jpg',
        caption: ['Penyusunan laporan dan rekapitulasi', 'Report writing and data recap'],
      },
      {
        photo: 'Organizing PT. ICON+ Event Activities.jpg',
        caption: ['Penyelenggaraan kegiatan PT Icon Plus', 'Running PT Icon Plus activities'],
      },
    ],
    final: {
      title: ['Pemutakhiran Basis Data 2.510 ODP', 'Updating the 2,510-ODP Database'],
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
      photos: [
        'Report Creation and Data Recapitulation.jpg',
        'Preparing ODP Components.jpg',
        'Internship Documentation at PT ICON+ Makassar.jpg',
      ],
    },
  },
];

/* Judul kolom Final Project. Dipisah dari datanya karena ketiganya sama di
   semua bab — mengulanginya tiga kali cuma menambah tempat untuk meleset. */
const FINAL_HEADS: Bi[] = [
  ['Latar Proyek', 'Project Background'],
  ['Kegiatan Utama', 'Key Activities'],
  ['Kontribusi', 'Key Contribution'],
];

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
          <p
            className="prose mt-6 max-w-[60ch]"
            data-en="From ODP poles in Makassar to a drone power board in Yogyakarta to a smelter warehouse in Jakarta. Three internships get a chapter of their own below: what I was responsible for, what I did day to day, and what I left behind."
          >
            Dari tiang ODP di Makassar, papan daya drone di Yogyakarta, sampai
            gudang smelter di Jakarta. Tiga magang mendapat babnya sendiri di
            bawah: apa yang jadi tanggung jawab, apa yang dikerjakan sehari-hari,
            dan apa yang ditinggalkan.
          </p>
        </div>

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
            <h3 className="label text-muted jr-h split split-fly" data-en="Key Responsibilities">
              Tanggung Jawab Utama
            </h3>
            <div className="jr-resp mt-6">
              {c.resp.map((r) => (
                <section key={r.title[0]} className="jr-card jr-fx">
                  <div className="jr-card__media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(c.folder, r.photo)} alt="" loading="lazy" />
                  </div>
                  <Bil as="h4" className="jr-card__title" t={r.title} />
                  <ul className="jr-card__list">
                    {r.points.map((p) => (
                      <Bil key={p[0]} as="li" t={p} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {/* ── Key Activities ── */}
            {/* "Dokumentasi Kerja", bukan "Kegiatan Utama": nama itu sudah
                dipakai salah satu kolom Proyek Akhir di bawah, dan dua judul
                sama di satu bab membuat pembacanya mengira sudah membaca
                bagian ini. */}
            <h3 className="label text-muted jr-h mt-16 split split-fly" data-en="Work Documentation">
              Dokumentasi Kerja
            </h3>
            <div className="jr-acts mt-6">
              {c.acts.map((a) => (
                <figure key={a.photo} className="jr-act jr-fx">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb(c.folder, a.photo)} alt="" loading="lazy" />
                  <Bil as="span" className="jr-act__cap" t={a.caption} />
                </figure>
              ))}
            </div>

            {/* ── Final Project ── */}
            <h3 className="label text-muted jr-h mt-16 split split-fly" data-en="Final Project">
              Proyek Akhir
            </h3>
            <Bil as="h4" className="jr-final__title mt-4" t={c.final.title} />
            <div className="jr-final mt-8">
              <div className="jr-final__shots">
                {c.final.photos.map((f) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={f}
                    className="jr-fx"
                    src={thumb(c.folder, f)}
                    alt=""
                    loading="lazy"
                  />
                ))}
              </div>
              <div className="jr-final__cols">
                {[c.final.background, c.final.activities, c.final.contribution].map(
                  (list, i) => (
                    <section key={FINAL_HEADS[i][0]} className="jr-block jr-fx">
                      <Bil as="h5" className="label jr-block__h" t={FINAL_HEADS[i]} />
                      <ul className="jr-block__list">
                        {list.map((p) => (
                          <Bil key={p[0]} as="li" t={p} />
                        ))}
                      </ul>
                    </section>
                  ),
                )}
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

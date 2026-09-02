/* Proyek akademik — satu blok per proyek, langsung ke intinya.

   Server Component, TANPA satu baris JS klien, sama seperti
   components/experience-journey.tsx. Semua kelas yang dipakai di sini juga
   MILIK bab magang itu (.jr-hrow, .jr-final__cols, .jr-block, .jr-acts,
   .jr-act) — tidak ada satu pun aturan CSS baru yang ditulis untuk seksi ini.
   Itu disengaja: yang diminta memang "seperti pada magang", dan kelas yang
   sama berarti sorot foto, garis pemisah, dan animasi masuknya ikut terbawa
   apa adanya.

   BEDANYA dengan bab magang: di sana isinya dipecah tiga bagian yang dibaca
   berurutan (Tanggung Jawab → Dokumentasi Kerja → Proyek Akhir). Di sini
   ketiganya digabung jadi satu blok tiga kolom — apa yang dibuat, apa yang
   dilakukan, output yang dicapai — lalu seluruh fotonya di bawahnya.

   ISINYA DITURUNKAN, BUKAN DIKARANG: tiap butir adalah kalimat `desc` proyek
   yang bersangkutan di components/portfolio-runtime.js, dipecah per kalimat ke
   kolom yang cocok — kalimat pertama apa yang dibuat, kalimat tengah apa yang
   dikerjakan, kalimat terakhir (atau kalimat yang memuat angkanya) hasilnya.
   Yang Inggris diambil dari PROJECTS_EN di berkas yang sama. Satu-satunya yang
   dipecah lebih halus dari kalimat adalah p-cloud: `desc`-nya cuma SATU
   kalimat, jadi klausanya yang dibagi ke tiga kolom.

   Cakupannya cat: 'akademik' saja. ANTAM, AMX, dan ICON+ sudah punya bab
   magangnya sendiri di atas; sertifikasi dan organisasi tetap hanya sebagai
   kartu di Dokumentasi Kerja. */

import { Fragment, type ComponentType, type CSSProperties } from 'react';
import { Hammer, Target } from 'lucide-react';

/* Dipinjam dari bab magang, bukan disalin ulang: pembungkus dwibahasa,
   pembentuk jalur thumbnail, dan ikon tiga-ceklis yang ketiganya sudah
   dijelaskan panjang di sana. Menyalinnya ke sini berarti dua tempat yang
   harus berubah bersamaan setiap kali salah satunya disetel. */
import { Bil, ListChecks3, thumb, type Bi } from '@/components/experience-journey';

/* Rasio tiap foto, dibangkitkan tools/photo-ratios.mjs dari thumbnail-nya.
   Dipakai .sc-shots untuk melebarkan tiap ubin sebanding rasionya, jadi satu
   baris berakhir setinggi yang sama tanpa satu foto pun dipotong — CSS sendiri
   tidak bisa menanyakan ukuran gambar. Cast-nya karena JSON diimpor sebagai
   objek dengan kunci literal, bukan peta. */
import ratiosJson from '@/components/photo-ratios.json';

const RATIOS = ratiosJson as Record<string, number>;

/* Judul kolom + ikonnya, sama untuk kedelapan proyek. Ikonnya menandai WATAK
   kolomnya: palu untuk yang dibangun, tiga ceklis untuk pekerjaan yang
   dijalani (ikon yang sama dengan Kegiatan Utama di bab magang), dan target
   untuk hasil yang dicapai. */
const COLS = [
  [['Apa yang Dibuat', 'What Was Built'], Hammer],
  [['Apa yang Dilakukan', 'What Was Done'], ListChecks3],
  [['Output yang Dicapai', 'Output Achieved'], Target],
] as const;

/* Bentuk satu blok, dipakai seksi ini DAN components/certifications.tsx.
   Judul kolomnya tidak ikut di sini karena ketiganya sama sepanjang satu
   seksi — yang berbeda cuma isinya, dan itu `cols`. */
export type ShowcaseItem = {
  no: string;
  id: string;
  title: Bi;
  meta: Bi;
  folder: string;
  /* Tiga daftar, searah dengan tiga judul kolom yang diberikan seksinya. */
  cols: readonly [readonly Bi[], readonly Bi[], readonly Bi[]];
  /* Tautan opsional di bawah keterangan; yang memakainya sertifikat. */
  link?: { href: string; t: Bi };
  /* Nama berkas apa adanya dari `images` proyeknya di portfolio-runtime.js,
     dan urutannya pun sama. Berkas video (.mp4 milik ros2) TIDAK ikut: ubin
     .jr-act menampilkan <img> dari thumbnail, dan video tidak punya
     thumbnail — "semua foto" memang berhenti di foto. */
  photos: readonly string[];
};

/* Judul + ikon tiap kolom, tiga-tiganya. Ikonnya komponen apa pun yang mau
   menerima aria-hidden — ikon lucide dan tumpukan buatan sendiri di
   experience-journey.tsx dua-duanya masuk. */
export type ShowcaseCols = readonly [
  readonly [Bi, ComponentType<{ 'aria-hidden'?: 'true' }>],
  readonly [Bi, ComponentType<{ 'aria-hidden'?: 'true' }>],
  readonly [Bi, ComponentType<{ 'aria-hidden'?: 'true' }>],
];

/* Bentuk seksi ini sendiri: sama dengan ShowcaseItem, hanya ketiga daftarnya
   diberi nama supaya datanya terbaca sebagai cerita, bukan sebagai cols[0..2].
   Ditukar ke bentuk umum tepat di titik render. */
type Project = Omit<ShowcaseItem, 'cols' | 'link'> & {
  built: readonly Bi[];
  did: readonly Bi[];
  output: readonly Bi[];
};

const PROJECTS: readonly Project[] = [
  /* ── 01. Robot manipulator ─────────────────────────────────── */
  {
    no: '01',
    id: 'p-arm-robot',
    title: [
      'Robot Manipulator Berbasis AI untuk Klasifikasi Sampah Otomatis',
      'AI-Based Robot Manipulator for Automated Waste Classification',
    ],
    meta: [
      'Universitas Negeri Yogyakarta — Feb 2026 – Jun 2026',
      'Universitas Negeri Yogyakarta — Feb 2026 – Jun 2026',
    ],
    folder: 'Robotika Cerdas Arm Robot',
    built: [
      [
        'Robot manipulator berbasis AI dengan <strong>Raspberry Pi + Ubuntu</strong> yang mengintegrasikan computer vision, kontrol robotik, dan operasi sistem embedded untuk klasifikasi sampah otomatis.',
        'An AI-based robot manipulator on <strong>Raspberry Pi + Ubuntu</strong> integrating computer vision, robotic control, and embedded system operation for automated waste classification.',
      ],
    ],
    did: [
      [
        'Struktur manipulatornya dirancang di Autodesk Fusion 360, dicetak 3D, dan dihitung kebutuhan tegangan serta arusnya agar integrasi kelistrikannya andal.',
        'Designed the manipulator structure in Autodesk Fusion 360, 3D printed it, and calculated voltage and current requirements for reliable electrical integration.',
      ],
      [
        'Model deteksi objek dilatih dengan Python, OpenCV, dan YOLO untuk memilah sampah organik dan anorganik.',
        'Trained an object detection model with Python, OpenCV, and YOLO to sort organic and inorganic waste.',
      ],
      [
        'Model itu lalu diintegrasikan ke sistem robotiknya untuk deteksi dan klasifikasi real-time.',
        'Integrated the trained model into the robotic system for real-time detection and classification.',
      ],
    ],
    output: [
      [
        'Hasil validasi model: <strong>mAP@0.50 ~97%</strong>, Precision 98%, dan Recall 95%.',
        'Model validation: <strong>~97% mAP@0.50</strong>, 98% Precision, and 95% Recall.',
      ],
    ],
    photos: [
      'Design Process for 3D Printing a Robot Manipulator Body.png',
      'Printing 3D Designs for Base, Elbow, and Shoulder Robot Manipulator.jpeg',
      'Integration of Power and Communication Components for Robot Manipulator Testing.jpeg',
      'mAP50, Loss, Precision, and Recall Results from the Training Dataset.jpeg',
      'Organic Detection Results from Model Training.jpeg',
      'Organic Object Detection Testing Based on Model Training Results.png',
      'Testing of Inorganic Object Detection Based on Model Training Results.png',
      'Detection and Classification Testing of Two Objects in a Single Frame.jpeg',
      'Final Testing for Data Collection from Various Evaluations.jpeg',
    ],
  },

  /* ── 02. Deteksi kendaraan ─────────────────────────────────── */
  {
    no: '02',
    id: 'p-cv-ai',
    title: [
      'Sistem Deteksi Kendaraan dan Estimasi Kecepatan Berbasis Computer Vision',
      'Computer Vision-Based Vehicle Detection and Speed Estimation System',
    ],
    meta: [
      'Universitas Negeri Yogyakarta — Nov 2025 – Des 2025',
      'Universitas Negeri Yogyakarta — Nov 2025 – Dec 2025',
    ],
    folder: 'Computer Vision & AI',
    built: [
      [
        'Sistem deteksi dan klasifikasi kendaraan dengan <strong>YOLO11</strong>, OpenCV, dan ByteTrack untuk mengenali empat kelas kendaraan sekaligus mengestimasi kecepatannya.',
        'A vehicle detection and classification system using <strong>YOLO11</strong>, OpenCV, and ByteTrack to identify four vehicle classes and estimate their speed.',
      ],
    ],
    did: [
      [
        'Dataset kustom dibangun dengan mengumpulkan data dan menganotasi <strong>2.188 instance</strong> kendaraan secara otomatis untuk pelatihan model.',
        'Built a custom dataset by collecting data and automatically annotating <strong>2,188 vehicle instances</strong> for model training.',
      ],
      [
        'Perspective Transformation dan Exponential Moving Average diterapkan agar estimasi kecepatannya lebih stabil dan analisis risiko kendaraannya lebih akurat.',
        'Implemented Perspective Transformation and Exponential Moving Average to improve speed estimation stability and vehicle risk analysis.',
      ],
    ],
    output: [
      [
        'Hasil validasi model: <strong>mAP 91,3%</strong> (IoU = 0.50), Precision 91,3%, dan Recall 91,0%.',
        'Model validation: <strong>91.3% mAP</strong> (IoU = 0.50), 91.3% Precision, and 91.0% Recall.',
      ],
    ],
    photos: [
      'Computer Vision Based Vehicle Detection Results Us-Cover.jpg',
      'Automation Process For Annotating Vehicle Type Objects.jpeg',
      'Dividing the Dataset Results into Train, Valid, and Test.png',
      'Training Results for Creating Models of Desired Objects.jpeg',
      'Results of Each Loss, Precision, and mAP value.jpeg',
      'Results After Training and the Relationship between Precision and Recall.jpeg',
      'Results After Training and the Relationship between Recall and Confidence.jpeg',
      'Results After Train and the Relationship between F1 Score and Confidence.jpeg',
      'Confidence Test Values on Objects During the Training Process.jpeg',
      'Matrix of Prediction Results for Existing Objects.jpeg',
      'Project Group Members after Final Presentation.jpeg',
    ],
  },

  /* ── 03. Rover ROS2 ────────────────────────────────────────── */
  {
    no: '03',
    id: 'p-ros2',
    title: [
      'Pengembangan Rover Robot Berbasis ROS2 dengan Integrasi LiDAR',
      'ROS2-Based Rover Robot Development with LiDAR Integration',
    ],
    meta: [
      'Universitas Negeri Yogyakarta (Jetson Orin Nano) — Okt 2025 – Des 2025',
      'Universitas Negeri Yogyakarta (Jetson Orin Nano) — Oct 2025 – Dec 2025',
    ],
    folder: 'Robotika Lanjut',
    built: [
      [
        'Rover robot berbasis <strong>ROS2</strong> yang mengintegrasikan Jetson Orin Nano, LiDAR, dan motor driver untuk navigasi robot.',
        'A <strong>ROS2</strong>-based rover robot integrating Jetson Orin Nano, LiDAR, and a motor driver for robot navigation.',
      ],
    ],
    did: [
      [
        'ROS2 workspace dan komunikasi SSH dikonfigurasi, lalu kontrol motornya dikembangkan dengan Python.',
        'Configured the ROS2 workspace and SSH communication, then developed Python-based motor control.',
      ],
    ],
    output: [
      [
        'Visualisasi data <strong>LiDAR 360°</strong> lewat Foxglove menampilkan hasil pemindaian lingkungannya.',
        '<strong>360° LiDAR</strong> data visualization in Foxglove displaying environmental scanning results.',
      ],
    ],
    photos: [
      'Component Checking before Implementation and Control Using ROS 2.jpeg',
      'Robot Components for Remote Control Integration and LiDAR Sensor Detection.jpeg',
    ],
  },

  /* ── 04. Line follower ─────────────────────────────────────── */
  {
    no: '04',
    id: 'p-line-follower',
    title: [
      'Perancangan Robot Line Follower Otonom dengan Kontrol PID',
      'Autonomous Line Follower Robot Design with PID Control',
    ],
    meta: [
      'Universitas Negeri Yogyakarta, Semester 5 — Okt 2025 – Des 2025',
      'Universitas Negeri Yogyakarta, Semester 5 — Oct 2025 – Dec 2025',
    ],
    folder: 'P. Robotika Lanjut (SEM 5)',
    built: [
      [
        'Sistem elektronik dan mekanik line follower otonom: <strong>PCB kustom</strong>, sasis di Fusion 360, 8 sensor fotodioda, multiplexer, motor driver, dan modul manajemen daya.',
        'The electronic and mechanical systems of an autonomous line follower: a <strong>custom PCB</strong>, a Fusion 360 chassis, 8 photodiode sensors, a multiplexer, a motor driver, and power management modules.',
      ],
    ],
    did: [
      [
        'Pembacaan sensornya diimplementasikan dan parameter kontrol PD ditala untuk menaikkan responsivitas serta kestabilan geraknya.',
        'Implemented sensor reading and tuned PD control parameters to improve responsiveness and motion stability.',
      ],
    ],
    output: [
      [
        'Catatan waktu tercepat <strong>7,9 detik</strong> dengan performa yang stabil dan konsisten.',
        'A fastest track time of <strong>7.9 seconds</strong> with stable, consistent performance.',
      ],
    ],
    photos: [
      'Class Photo after the Line Follower Race.jpeg',
      'Robot Assembly Modelling in Fusion 360.jpeg',
      'Chassis Assembly Views from Every Angle.jpeg',
      'Sensor Board PCB Layout in EasyEDA.jpeg',
      'Technical Drawing with Robot Dimensions.jpeg',
      'Soldering the Etched Sensor Board.jpeg',
      'Soldering and Voltage Check under a Magnifier.jpeg',
      'Robots Lined Up on the Track before a Run.jpeg',
      'All Class Robots on the Race Track.jpeg',
      'Team Photo with the Finished Robots.jpeg',
      'Robot Crossing the Finish Line.jpeg',
      'Final Demonstration in the Laboratory.jpeg',
      'Sensor Calibration on the Arduino Serial Monitor.jpeg',
      'Checking Component Placement on the Sensor Board.jpeg',
      '3D Preview of the Assembled Sensor Board.jpeg',
    ],
  },

  /* ── 05. OpenPLC ───────────────────────────────────────────── */
  {
    no: '05',
    id: 'p-openplc',
    title: [
      'Pemrograman Logika Otomasi Industri dengan OpenPLC Editor',
      'Industrial Automation Logic Programming with OpenPLC Editor',
    ],
    meta: [
      'Universitas Negeri Yogyakarta, Semester 4 — Mei 2025',
      'Universitas Negeri Yogyakarta, Semester 4 — May 2025',
    ],
    folder: 'P. PLC (SEM 4)',
    built: [
      [
        'Logika otomasi industri di <strong>OpenPLC Editor</strong> dengan pemrograman Ladder Diagram (LD) untuk kontrol proses sekuensial.',
        'Industrial automation logic in <strong>OpenPLC Editor</strong> using Ladder Diagram (LD) programming for sequential process control.',
      ],
    ],
    did: [
      [
        'Fungsi PLC standar diterapkan — Timer (TON), Counter (CTU), operasi aritmetika, dan fungsi komparasi — untuk mengatur urutan proses dan penghitungan siklus produksi.',
        'Implemented standard PLC functions — Timer (TON), Counter (CTU), arithmetic operations, and comparison functions — to manage process sequencing and production cycle counting.',
      ],
    ],
    output: [
      [
        '<strong>Safety interlock</strong> yang mencegah konflik proses saat sistemnya beroperasi.',
        '<strong>Safety interlocks</strong> that prevent process conflicts while the system is running.',
      ],
    ],
    photos: [
      'Simple simulation when applied to conveyor logic.jpg',
      'Circuit Schematic for a Case Study of the Paint Mixing System Operational Process.jpeg',
      'Entering Variables For Project Series.jpeg',
      'The Circuit Component Responsible for Automation is That Every 4 Seconds, the Retail Valve Will Close and the Process Will Continue at the Mixing Stage.jpeg',
      'The Process Responsible for Preventing the Addition of Materials During the Process Stirring Begins.jpeg',
      'The Circuit Component That Acts as a Counter Increases by 1 to 4 when the Third Mixing Cycle is Completed.jpeg',
    ],
  },

  /* ── 06. Presensi OpenCV ───────────────────────────────────── */
  {
    no: '06',
    id: 'p-presensi',
    title: [
      'Pengembangan Sistem Manajemen Presensi dengan OpenCV dan MySQL',
      'Attendance Management System Development with OpenCV and MySQL',
    ],
    meta: [
      'Universitas Negeri Yogyakarta, Semester 3 — Nov 2024 – Des 2024',
      'Universitas Negeri Yogyakarta, Semester 3 — Nov 2024 – Dec 2024',
    ],
    folder: 'Pemrograman Komputer (SEM 3)',
    built: [
      [
        'Aplikasi presensi berbasis desktop dengan <strong>Python, Tkinter, OpenCV, dan MySQL</strong>.',
        'A desktop attendance application built with <strong>Python, Tkinter, OpenCV, and MySQL</strong>.',
      ],
    ],
    did: [
      [
        'Antarmuka grafisnya dirancang terintegrasi dengan modul kamera dan basis data untuk validasi identitas dan pencatatan kehadiran.',
        'Designed the graphical user interface integrated with camera and database modules for identity validation and attendance recording.',
      ],
    ],
    output: [
      [
        'Pengambilan citra, validasi ID mahasiswa, dan penyimpanan data kehadiran berjalan di <strong>MySQL</strong>.',
        'Image capture, student ID validation, and attendance data storage running on <strong>MySQL</strong>.',
      ],
    ],
    photos: [
      'Appearance and Implementation during Attendance.jpeg',
      "Recording each user's Presence in the Database.jpeg",
      'Attendance Recording Results in the Database.jpeg',
    ],
  },

  /* ── 07. Motor tiga fasa ───────────────────────────────────── */
  {
    no: '07',
    id: 'p-motor-3-fasa',
    title: [
      'Sistem Kontrol Motor Induksi Tiga Fasa dengan Kontaktor Magnetik',
      'Three-Phase Induction Motor Control System with Magnetic Contactors',
    ],
    meta: [
      'Universitas Negeri Yogyakarta, Instalasi Mesin Listrik Semester 2 — Mei 2024 – Jun 2024',
      'Universitas Negeri Yogyakarta, Electrical Machine Installation Semester 2 — May 2024 – Jun 2024',
    ],
    folder: 'Intalasi Mesin Listrik (SEM 2)',
    built: [
      [
        'Sistem kontrol <strong>motor induksi tiga fasa</strong> untuk operasi forward-reverse dengan kontaktor magnetik.',
        'A <strong>three-phase induction motor</strong> control system for forward-reverse operation using magnetic contactors.',
      ],
    ],
    did: [
      [
        'Rangkaian daya dan kontrolnya dirancang dengan MCB, push button, overload relay, dan modul indikator yang terintegrasi di panel kontrol.',
        'Designed the power and control circuits, integrating MCBs, push buttons, overload relays, and indicator modules into the control panel.',
      ],
    ],
    output: [
      [
        'Pengujian arus start, arus kerja, dan tegangan antar fasa memverifikasi <strong>keamanan operasi motornya</strong>.',
        'Starting current, running current, and phase-to-phase voltage testing verifying <strong>safe motor operation</strong>.',
      ],
    ],
    photos: [
      '3 Phase Power Motor Circuit to Manually Turn the Steering Right and Left Using a 3 Phase Motor.jpeg',
      'Practical work in the Control Instrumentation Lab.jpeg',
    ],
  },

  /* ── 08. Komputasi awan ────────────────────────────────────── */
  {
    no: '08',
    id: 'p-cloud',
    title: ['Praktikum Komputasi Awan', 'Cloud Computing Lab'],
    meta: [
      'Universitas Negeri Yogyakarta — 2025',
      'Universitas Negeri Yogyakarta — 2025',
    ],
    folder: 'P. Komputasi Awan',
    built: [
      [
        'Praktikum komputasi awan untuk sistem <strong>embedded dan IoT</strong>.',
        'Cloud computing coursework for <strong>embedded and IoT</strong> systems.',
      ],
    ],
    did: [
      [
        'Provisioning layanan dan kontainerisasi dengan <strong>Docker</strong>.',
        'Service provisioning and containerization with <strong>Docker</strong>.',
      ],
    ],
    output: [
      [
        'Layanan cloud yang terintegrasi sebagai <strong>backend</strong> sistem embedded dan IoT.',
        'Cloud services integrated as the <strong>backend</strong> for embedded and IoT systems.',
      ],
    ],
    photos: [
      'Create simple applications for control systems.jpeg',
      'Application display for monitoring reading results.jpeg',
      'Control when the light is on.jpeg',
      'Control when the lights are off.jpeg',
      'Graph of data obtained from sensor readings.jpeg',
      'Data graph on Influxdb obtained from sensor readings.jpeg',
    ],
  },
];

/* Deretan bloknya, dipakai seksi ini dan components/certifications.tsx.

   Satu .shell untuk SEMUANYA, bukan satu per blok: garis pemisah .jr-hrow
   dimatikan pada baris judul yang jadi anak pertama induknya (lihat
   .jr-hrow:first-child di app/portfolio.css). Dengan semuanya di satu induk,
   cuma blok pertama yang tanpa garis — persis seperti bab magang, dan tanpa
   satu aturan CSS baru.

   SATU KOTAK per blok, tidak seperti tiga kotak sejajar di Proyek Akhir bab
   magang: kolom pertama membentang penuh di kepalanya, lalu fotonya di kiri
   dan dua kolom sisanya di kanan — dan fotonya ikut MASUK ke kotak itu, bukan
   berdiri sebagai kisi ubin sendiri di bawahnya. */
function Part({
  col,
  list,
  className,
}: {
  col: ShowcaseCols[number];
  list: readonly Bi[];
  className?: string;
}) {
  const [head, Icon] = col;
  return (
    <section className={className}>
      {/* data-en-nya di <span> di dalam, bukan di <h5>: penukar bahasa bekerja
          lewat innerHTML, dan kalau penandanya di judulnya ia ikut menyapu
          <svg> ikonnya. */}
      <h5 className="label jr-block__h">
        <Icon aria-hidden="true" />
        <Bil as="span" t={head} />
      </h5>
      <ul className="jr-block__list">
        {list.map((b) => (
          <Bil key={b[0]} as="li" t={b} />
        ))}
      </ul>
    </section>
  );
}

export function ShowcaseBlocks({
  items,
  cols,
  word,
}: {
  items: readonly ShowcaseItem[];
  cols: ShowcaseCols;
  /* Kata di baris judul tiap blok: "Proyek 01", "Sertifikat 01". */
  word: Bi;
}) {
  return (
    <div className="shell">
      {items.map((it) => (
        <Fragment key={it.id}>
          <div className="jr-hrow" id={it.id}>
            <h3
              className="label text-muted jr-h split split-fly"
              data-en={`${word[1]} ${it.no}`}
            >
              {word[0]} {it.no}
            </h3>
          </div>
          <Bil as="h4" className="jr-final__title mt-4" t={it.title} />
          <Bil as="p" className="caption text-muted mt-1" t={it.meta} />
          {it.link && (
            /* rel noreferrer ikut noopener: tautannya keluar ke situs lain,
               dan halaman ini tidak punya urusan menitipkan alamat asalnya. */
            <p className="mt-2">
              <a className="tlink" href={it.link.href} target="_blank" rel="noopener noreferrer">
                <Bil as="span" t={it.link.t} />
              </a>
            </p>
          )}

          <div className="sc-card jr-fx mt-8">
            <Part className="sc-built" col={cols[0]} list={it.cols[0]} />
            <Part col={cols[1]} list={it.cols[1]} />
            <Part col={cols[2]} list={it.cols[2]} className="sc-just" />

            {/* Fotonya di bawah ketiga teksnya, satu hamparan yang rata dari
                tepi ke tepi: lebar tiap ubin sebanding rasio fotonya sendiri,
                jadi satu baris berakhir setinggi yang sama dengan foto yang
                UTUH — tidak ada yang dipotong — dan ubin baris terakhir
                melebar mengisi sisa barisnya (lihat .sc-shots di
                app/portfolio.css). Berapa pun jumlah fotonya, tidak ada sudut
                yang tertinggal kosong.

                .jr-zoom tetap dipakai, jadi sorot layar penuhnya ikut terbawa:
                penanganannya delegasi di portfolio-runtime.js, bukan
                pemasangan per elemen. Judulnya nama berkasnya sendiri, sama
                seperti di bab magang. */}
            <div className="sc-shots">
              {it.photos.map((f) => (
                <figure
                  key={f}
                  className="sc-shot jr-zoom"
                  /* Rasionya dititipkan sebagai custom property, bukan lebar
                     mati: yang menghitung lebar ubinnya tetap CSS, dan angka
                     ini cuma perbandingannya. */
                  style={{ '--ar': RATIOS[`${it.folder}/${f}`] ?? 1.5 } as CSSProperties}
                  role="button"
                  tabIndex={0}
                  aria-expanded={false}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb(it.folder, f)} alt="" loading="lazy" />
                  <span className="jr-act__cap">{f.replace(/\.[^.]+$/, '')}</span>
                </figure>
              ))}
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

export function AcademicProjects() {
  return (
    <section id="projects" className="band">
      <div className="shell">
        <div className="sec-head">
          <p className="label text-muted">04 — Academic Projects</p>
          <h2 className="display-lg mt-4 split" data-en="EIGHT PROJECTS,<br>ONE WORKBENCH.">
            DELAPAN PROYEK,
            <br />
            SATU MEJA KERJA.
          </h2>
          <span className="m-stripe mt-6" aria-hidden="true" />
          <p
            className="prose mt-6 max-w-[60ch]"
            data-en="Coursework projects from the electronics engineering program: what was built, what was done to build it, and what came out of it — each one followed by its full photo documentation."
          >
            Proyek-proyek kuliah di program studi teknik elektronika: apa yang
            dibuat, apa yang dikerjakan untuk membuatnya, dan apa hasilnya —
            masing-masing disusul dokumentasi fotonya yang lengkap.
          </p>
        </div>
      </div>

      {/* Tiga daftar bernama itu ditukar ke bentuk umum di sini, bukan di
          datanya: yang dibaca manusia tetap built/did/output. */}
      <ShowcaseBlocks
        cols={COLS}
        word={['Proyek', 'Project']}
        items={PROJECTS.map(({ built, did, output, ...rest }) => ({
          ...rest,
          cols: [built, did, output] as const,
        }))}
      />
    </section>
  );
}

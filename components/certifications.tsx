/* Sertifikasi — bentuk yang sama dengan proyek akademik, isi yang lain.

   Deretan bloknya DIRENDER komponen yang sama (ShowcaseBlocks di
   components/academic-projects.tsx), jadi tidak ada satu baris markup pun yang
   disalin: yang beda cuma tiga judul kolomnya, kata di baris judul, dan
   datanya. Kelas CSS-nya pun masih milik bab magang — nol aturan baru.

   Kolomnya tidak bisa "apa yang dibuat / dilakukan / dicapai" seperti proyek:
   sertifikat bukan sesuatu yang dibangun. Yang dipakai watak aslinya —
   programnya, materi yang dijalani, lalu sertifikatnya sendiri.

   ISINYA DITURUNKAN, BUKAN DIKARANG: `desc` tiap sertifikasi di
   components/portfolio-runtime.js berbentuk "<program>: <materi, materi,
   materi>" — potongan sebelum titik dua jadi kolom pertama, daftar sesudahnya
   dipecah per koma jadi butir kolom kedua. Kolom ketiga menyebut penerbit dan
   bulannya (dari `org` + `period`), dengan tautan verifikasi dari
   `credential`. Yang Inggris dari PROJECTS_EN. */

import { Award, GraduationCap } from 'lucide-react';

import {
  ShowcaseBlocks,
  type ShowcaseCols,
  type ShowcaseItem,
} from '@/components/academic-projects';
import { ListChecks3, type Bi } from '@/components/experience-journey';

const COLS: ShowcaseCols = [
  [['Programnya', 'The Program'], GraduationCap],
  [['Materi & Praktik', 'Topics & Practice'], ListChecks3],
  [['Sertifikatnya', 'The Certificate'], Award],
];

/* Kalimat kolom ketiga yang sama untuk keempatnya: keempat `credential`-nya
   memang satu tempat, halaman verifikasi SkillHub Kemnaker. Penerbit dan
   bulannya yang berbeda, dan itu sudah ada di baris keterangan tiap blok. */
const VERIFIED: Bi = [
  'Sertifikat elektronik yang bisa diperiksa langsung di halaman verifikasi <strong>SkillHub Kemnaker RI</strong>.',
  'An electronic certificate that can be checked directly on the <strong>Kemnaker SkillHub</strong> verification page.',
];

const LINK: Bi = ['Buka halaman verifikasi ↗', 'Open the verification page ↗'];

const CERTS: readonly ShowcaseItem[] = [
  /* ── 01. K3 Listrik ────────────────────────────────────────── */
  {
    no: '01',
    id: 'c-k3-listrik',
    title: ['Awareness K3 Listrik', 'Awareness K3 Electricity'],
    meta: [
      'BPVP Sidoarjo, Kementerian Ketenagakerjaan RI — Apr 2026',
      'BPVP Sidoarjo, Ministry of Manpower, Republic of Indonesia — Apr 2026',
    ],
    folder: 'Sertifikasi K3 Listrik',
    link: {
      href: 'https://skillhub.kemnaker.go.id/sertifikat/pelatihan/1d7ecb4f-36b2-4c32-be79-eb43601108a5',
      t: LINK,
    },
    cols: [
      [
        [
          'Sertifikasi kesadaran <strong>Keselamatan dan Kesehatan Kerja</strong> bidang kelistrikan.',
          '<strong>Occupational health and safety</strong> awareness certification for electrical work.',
        ],
      ],
      [
        ['Identifikasi bahaya listrik.', 'Electrical hazard identification.'],
        ['Prosedur <strong>LOTO</strong>.', '<strong>LOTO</strong> procedures.'],
        ['Proteksi arus bocor.', 'Earth-leakage protection.'],
        [
          'Penerapan standar keselamatan pada instalasi tegangan rendah.',
          'Applying safety standards to low-voltage installations.',
        ],
      ],
      [VERIFIED],
    ],
    photos: [
      'Explanation of Material from the Supervisor.png',
      'Application of Electric K3 during Installation.png',
      'Fire Hazard Protection for Electrical Installations.png',
    ],
  },

  /* ── 02. Komponen pasif ────────────────────────────────────── */
  {
    no: '02',
    id: 'c-komponen-pasif',
    title: [
      'Membaca dan Mengidentifikasi Komponen Elektronik Pasif',
      'Reading and Identifying Passive Electronic Components',
    ],
    meta: [
      'BPVP Ambon, Kementerian Ketenagakerjaan RI — Apr 2026',
      'BPVP Ambon, Ministry of Manpower, Republic of Indonesia — Apr 2026',
    ],
    folder: 'BPVP AMBON',
    link: {
      href: 'https://skillhub.kemnaker.go.id/sertifikat/pelatihan/c56c6b17-13b3-4f8b-ac5a-6320bbd46ba1',
      t: LINK,
    },
    cols: [
      [
        [
          'Sertifikasi pembacaan dan identifikasi <strong>komponen elektronik pasif</strong>.',
          'Certification in reading and identifying <strong>passive electronic components</strong>.',
        ],
      ],
      [
        [
          'Pembacaan kode warna resistor, kapasitor, dan induktor.',
          'Resistor, capacitor, and inductor color codes.',
        ],
        [
          'Fungsi dan formula keluaran masing-masing komponen.',
          'The function and output formula of each component.',
        ],
      ],
      [VERIFIED],
    ],
    photos: ['Introduction to the Functions and Output Formulas of Each Component.png'],
  },

  /* ── 03. Alat ukur ─────────────────────────────────────────── */
  {
    no: '03',
    id: 'c-alat-ukur',
    title: [
      'Menggunakan Alat Ukur Mekanis dan Elektrik',
      'Using Mechanical and Electrical Measuring Instruments',
    ],
    meta: [
      'BPVP Banyuwangi, Kementerian Ketenagakerjaan RI — Feb 2026',
      'BPVP Banyuwangi, Ministry of Manpower, Republic of Indonesia — Feb 2026',
    ],
    folder: 'BPVP Banyuwangi Short Course Menggunakan Alat Ukur Mekanis dan Elektrik',
    link: {
      href: 'https://skillhub.kemnaker.go.id/sertifikat/pelatihan/da5a85a0-6089-425c-b5fd-6a15765abc3a',
      t: LINK,
    },
    cols: [
      [
        [
          'Short course penggunaan <strong>alat ukur mekanis dan elektrik</strong>.',
          'A short course on using <strong>mechanical and electrical measuring instruments</strong>.',
        ],
      ],
      [
        ['Kalibrasi.', 'Calibration.'],
        ['Prosedur pengukuran yang benar.', 'Correct measurement procedure.'],
        ['Pembacaan skala.', 'Scale reading.'],
        [
          'Analisis ketidakpastian hasil ukur.',
          'Uncertainty analysis of the results.',
        ],
      ],
      [VERIFIED],
    ],
    photos: [
      'Learning How Micrometer Mechanical Measuring Instruments Work and Calculating Their Measurements (Case Study).png',
      'Learning How the Shove Term Works and Calculating Its Measurement (Case Study by Instructor).png',
    ],
  },

  /* ── 04. K3 umum ───────────────────────────────────────────── */
  {
    no: '04',
    id: 'c-k3-umum',
    title: [
      'Keselamatan dan Kesehatan Kerja (K3)',
      'Occupational Health and Safety (K3)',
    ],
    meta: ['PKBM & LPK ZIONA — Feb 2026', 'PKBM & LPK ZIONA — Feb 2026'],
    folder: 'Short Course Pelatihan keselamatan dan kesehatan kerja (K3)',
    link: {
      href: 'https://skillhub.kemnaker.go.id/sertifikat/pelatihan/47bbd3c5-f527-4d37-9139-d8443afdcb56',
      t: LINK,
    },
    cols: [
      [
        [
          'Pelatihan <strong>keselamatan dan kesehatan kerja</strong>.',
          '<strong>Occupational health and safety</strong> training.',
        ],
      ],
      [
        ['Identifikasi risiko di tempat kerja.', 'Workplace risk identification.'],
        ['Penggunaan <strong>APD</strong>.', '<strong>PPE</strong> use.'],
        ['Prosedur tanggap darurat.', 'Emergency response procedures.'],
        ['Penerapan budaya kerja aman.', 'Building a safe working culture.'],
      ],
      [VERIFIED],
    ],
    photos: [
      'How to Calculate and Management Risks at Work.png',
      'Frequency and Severity Values in a Job.png',
      'Risk Level Class from Calculation of Frequency and Severity Values.png',
    ],
  },
];

export function Certifications() {
  return (
    <section id="certifications" className="band">
      <div className="shell">
        <div className="sec-head">
          <p className="label text-muted">05 — Certifications</p>
          <h2 className="display-lg mt-4 split" data-en="FOUR CERTIFICATES,<br>ONE STANDARD.">
            EMPAT SERTIFIKAT,
            <br />
            SATU STANDAR.
          </h2>
          <span className="m-stripe mt-6" aria-hidden="true" />
          <p
            className="prose mt-6 max-w-[60ch]"
            data-en="Certified training from the Ministry of Manpower's vocational centres and a licensed training provider: the program, the topics covered, and a certificate anyone can verify — each one followed by its photo documentation."
          >
            Pelatihan bersertifikat dari balai pelatihan Kementerian
            Ketenagakerjaan dan lembaga pelatihan kerja: programnya, materi yang
            dijalani, dan sertifikat yang bisa diverifikasi siapa pun —
            masing-masing disusul dokumentasi fotonya.
          </p>
        </div>
      </div>

      <ShowcaseBlocks cols={COLS} word={['Sertifikat', 'Certificate']} items={CERTS} />
    </section>
  );
}

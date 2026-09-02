'use client';

/* Kartu identitas yang menggantung di kolom kanan hero. Komponennya sendiri ada
   di lanyard.tsx (salinan komponen Lanyard Vercel); berkas ini cuma memasangnya
   dengan parameter yang benar untuk hero ini.

   Client component karena satu alasan: kotaknya transparan sampai kartunya
   benar-benar berdiri (#lanyard-3d.is-ready di app/portfolio.css), dan yang
   tahu kapan itu terjadi hanya onReady dari dalam <Canvas>. */

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Lanyard, { type LanyardTheme } from '@/components/lanyard';

/* ═══ PERAMBAN TANPA WebGL ═══
   Bisa terjadi tanpa perambannya rusak: akselerasi grafis dimatikan di
   Settings, GPU-nya masuk blocklist Chrome, atau drivernya gagal
   ("GL_VENDOR = Disabled, Sandboxed = yes"). Tanpa penjagaan ini <Canvas>
   melempar "THREE.WebGLRenderer: Error creating WebGL context" — di dev jadi
   layar error, di produksi diam-diam menyisakan kolom hero KOSONG: #lanyard-3d
   tidak pernah dapat .is-ready, dan kotaknya memang transparan sampai itu.
   Kegagalannya tidak terlihat sebagai kegagalan.

   useSyncExternalStore, bukan useState+useEffect: yang dibaca kemampuan
   peramban di luar React, dan SSR tidak punya document. getServerSnapshot
   menjawab undefined, jadi server dan hidrasi sepakat "belum tahu" dan tidak
   ada mismatch; jawaban aslinya masuk tepat setelah hidrasi.

   Konteks ujinya langsung dibuang (loseContext): peramban membatasi jumlah
   konteks WebGL yang hidup bersamaan, dan yang ini cuma untuk bertanya. */
const bacaWebGL = () => {
  try {
    const uji = document.createElement('canvas');
    const gl = (uji.getContext('webgl2') || uji.getContext('webgl')) as WebGLRenderingContext | null;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
};
/* Dijawab sekali lalu dikunci. useSyncExternalStore memanggil getSnapshot di
   TIAP render dan membandingkan hasilnya dengan Object.is — tanpa cache, tiap
   render membuat satu konteks WebGL baru hanya untuk bertanya hal yang sama. */
let webglCache: boolean | undefined;
const snapshotWebGL = () => (webglCache ??= bacaWebGL());
const serverWebGL = () => undefined;
/* Kemampuan ini tidak berubah selama halaman hidup, jadi tidak ada yang perlu
   didengarkan — berhenti berlangganan pun tidak melepas apa pun. */
const langganWebGL = () => () => {};

/* Berpasangan dengan blok HP di app/portfolio.css — ubah keduanya atau tidak
   sama sekali. Ditulis di JS karena posisi DOM-nya yang berbeda, bukan cuma
   gayanya: di layar lebar kartu menggantung di kolom kanan hero, di HP ia
   pindah ke kolom kiri seksi About. CSS tidak bisa memindahkan elemen antar
   <section>, dan merendernya di dua tempat sekaligus berarti dua konteks
   WebGL untuk satu kartu. */
const PHONE = '(max-width: 640px)';

export function LanyardMount() {
  const [ready, setReady] = useState(false);

  /* undefined = breakpoint belum diketahui (render pertama & SSR, jadi
     Canvas-nya belum dipasang sama sekali), null = biarkan di tempatnya
     (hero), Element = pindahkan ke sana. */
  const [host, setHost] = useState<HTMLElement | null | undefined>(undefined);

  useEffect(() => {
    const mq = matchMedia(PHONE);
    const pilih = () => {
      setHost(mq.matches ? document.getElementById('lanyard-slot-about') : null);
      /* Pindah tempat = Canvas dibongkar-pasang, jadi kartunya harus berdiri
         lagi dari nol. Tanpa ini .is-ready terlanjur menyala dan kotak yang
         masih kosong ikut ditampilkan. */
      setReady(false);
    };
    pilih();
    mq.addEventListener('change', pilih);
    return () => mq.removeEventListener('change', pilih);
  }, []);

  /* ═══ JATUHNYA KARTU ═══
     Kartu ini tidak dianimasikan turun — ia memang jatuh. Rig rapier di
     lanyard.tsx memulai talinya di atas titik gantungnya, lalu gravitasi
     [0,-40,0] yang menurunkannya sampai tali menegang dan kartunya berayun
     berhenti. Seluruhnya terjadi dalam ~1,5 detik pertama setelah <Canvas>
     dipasang.

     Di hero itu pas: kotaknya sudah terlihat saat halaman dibuka. Di HP kartu
     ini duduk di seksi About — jatuhnya selesai jauh sebelum ada yang menggulir
     ke sana, dan yang ditemui pengunjung cuma kartu yang sudah diam.

     Jadi yang ditunda pemasangan <Canvas>-nya, bukan animasinya: begitu kotaknya
     masuk layar, fisikanya mulai dari nol dan jatuhnya tersaksikan. Di layar
     lebar tak ada yang berubah — kotak hero sudah memotong viewport sejak
     paint pertama, jadi observer langsung menyala pada pemeriksaan pertamanya.

     Sekali saja: setelah jatuh, kartunya milik fisika dan tangan pengguna.
     Menjatuhkannya ulang tiap kali seksinya lewat berarti membuang keadaan
     yang sedang dipegang pengguna. */
  const kotakRef = useRef<HTMLDivElement>(null);
  const [terlihat, setTerlihat] = useState(false);

  useEffect(() => {
    if (terlihat) return;
    /* Yang diamati induknya — .lanyard-slot — bukan kotak ini sendiri: kotak
       ini sengaja dilebarkan ±70% melewati slotnya (lihat #lanyard-3d di
       app/portfolio.css), jadi ia menyentuh layar ratusan piksel lebih awal
       dari kartunya. */
    const slot = kotakRef.current?.parentElement;
    if (!slot) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTerlihat(true); io.disconnect(); }
    });
    io.observe(slot);
    return () => io.disconnect();
  }, [terlihat, host]);

  /* Tema dibaca dari <html data-theme>, yang diisi skrip di layout.tsx dan
     diubah tombol tema di portfolio-runtime.js. MutationObserver, bukan event:
     runtime itu vanilla dan tidak memancarkan apa pun yang bisa didengar React
     — atributnya sendiri yang jadi sumber kebenaran, dan ini menangkap
     perubahannya dari mana pun asalnya. */
  const [theme, setTheme] = useState<LanyardTheme>('dark');

  useEffect(() => {
    const baca = () =>
      setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    baca();
    const mo = new MutationObserver(baca);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  /* Kartunya sedang ditarik (atau masih berayun sesudahnya). Di HP kotak
     canvas dilebarkan selama itu supaya kartu yang ditarik ke samping tidak
     terpotong tepi canvas — catatan lengkapnya di #lanyard-3d.is-active,
     app/portfolio.css. Di layar lebar kelasnya menempel juga tapi tidak ada
     aturan yang memakainya: di sana kotaknya memang sudah selebar itu. */
  const [aktif, setAktif] = useState(false);

  /* undefined = belum dijawab (SSR & hidrasi); lihat WEBGL di bawah berkas. */
  const webgl = useSyncExternalStore(langganWebGL, snapshotWebGL, serverWebGL);

  const kartu = (
    <div
      id="lanyard-3d"
      ref={kotakRef}
      className={[ready && 'is-ready', aktif && 'is-active'].filter(Boolean).join(' ') || undefined}
    >
      {terlihat && webgl === true && (
      <Lanyard
        /* Kamera ditarik mendekat, bukan kartunya diperbesar: fisikanya bekerja
           dalam satuan dunia, jadi menskalakan rig ikut mengubah panjang tali
           dan ayunannya.

           29, bukan 12: fov itu sudut vertikal, jadi ukuran kartu di layar
           sebanding dengan tinggi canvas dibagi z. #lanyard-3d sengaja
           dilebarkan melewati slotnya (lihat app/portfolio.css) sehingga
           canvas-nya 2,4x lebih tinggi, dan kartunya ikut membesar segitu tanpa
           ada yang menyentuh kameranya. z dikalikan faktor yang sama — 12 x 2,4
           — supaya ukurannya di layar tetap. Yang berubah cuma seberapa jauh
           kartu bisa ditarik sebelum tepi canvas memotongnya.

           60 di HP karena persis itulah yang diminta di sana: kotaknya
           dipanjangkan lagi (inset -200%, bukan -70%) supaya kartu bisa
           ditarik turun sampai Core Competencies, dan tingginya naik 2,08x —
           552px jadi 1150px. 29 x 2,08 = 60 mengembalikan ukuran kartunya
           persis seperti sebelum kotaknya dipanjangkan. Kedua angka itu satu
           pasang; catatan lengkapnya di #lanyard-3d, app/portfolio.css. */
        position={[0, 0, host ? 60 : 29]}
        gravity={[0, -40, 0]}
        containerClassName="lanyard-wrapper"
        /* Kartu dan talinya ikut tema supaya keduanya tetap terlihat: terang di
           atas halaman gelap, gelap di atas halaman terang. Fotonya sendiri
           tidak ikut berubah. Teksturnya dibuat tools/card-texture.mjs dan
           tools/lanyard-texture.mjs. */
        theme={theme}
        onReady={() => setReady(true)}
        onActive={setAktif}
      />
      )}
    </div>
  );

  /* Cadangannya berdiri SENDIRI, bukan di dalam #lanyard-3d: kotak itu
     dilebarkan jauh melewati slotnya (inset -70%, di HP -200%) semata untuk
     memberi ruang kartu 3D ditarik. Gambar diam tidak butuh ruang tarik, dan
     menaruhnya di sana berarti menghitung ulang ukurannya terhadap kotak yang
     2,4x slotnya. Sebagai anak langsung .lanyard-slot ia mewarisi
     inset: 0 yang sudah ada di app/portfolio.css. */
  const cadangan = (
    <div className="lanyard-fallback">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/card-face-${theme}.png`} alt="" width={700} height={1011} />
    </div>
  );

  if (host === undefined || webgl === undefined) return null;
  const isi = webgl ? kartu : cadangan;
  return host ? createPortal(isi, host) : isi;
}

'use client';

/* Kartu identitas yang menggantung di kolom kanan hero. Komponennya sendiri ada
   di lanyard.tsx (salinan komponen Lanyard Vercel); berkas ini cuma memasangnya
   dengan parameter yang benar untuk hero ini.

   Client component karena satu alasan: kotaknya transparan sampai kartunya
   benar-benar berdiri (#lanyard-3d.is-ready di app/portfolio.css), dan yang
   tahu kapan itu terjadi hanya onReady dari dalam <Canvas>. */

import { useEffect, useState } from 'react';
import Lanyard, { type LanyardTheme } from '@/components/lanyard';

export function LanyardMount() {
  const [ready, setReady] = useState(false);

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

  return (
    <div id="lanyard-3d" className={ready ? 'is-ready' : undefined}>
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
           kartu bisa ditarik sebelum tepi canvas memotongnya. */
        position={[0, 0, 29]}
        gravity={[0, -40, 0]}
        containerClassName="lanyard-wrapper"
        /* Kartu dan talinya ikut tema supaya keduanya tetap terlihat: terang di
           atas halaman gelap, gelap di atas halaman terang. Fotonya sendiri
           tidak ikut berubah. Teksturnya dibuat tools/card-texture.mjs dan
           tools/lanyard-texture.mjs. */
        theme={theme}
        onReady={() => setReady(true)}
      />
    </div>
  );
}

/* ═══ PENUKAR TEKS STATIS ID ⇄ EN ══════════════════════════
   Halaman ditulis dalam bahasa Indonesia; versi Inggrisnya menumpang di
   data-en / data-en-placeholder / data-en-aria-label / data-en-alt. Berkas ini
   yang menukarnya, dan cuma itu — animasi, kisi, galeri, dan sisa perilaku
   halaman tetap di portfolio-runtime.js.

   Dipisah karena WAKTU, bukan kerapian. Runtime itu diunduh sebagai chunk
   sendiri di dalam useEffect, dan di HP lambat (CPU 4x, 4G) ia baru selesai
   ~1,5 detik setelah teks pertama tampil — selama itu halaman yang bawaannya
   Inggris terbaca Indonesia, lalu berkedip. Berkas sekecil ini diimpor statis
   oleh site-behavior.tsx, jadi ikut bundel utama dan penukarannya terjadi
   tepat saat hidrasi selesai: di laptop sebelum cat pertama, di HP ~240 ms
   sesudahnya.

   Menukarnya lebih awal lagi (skrip inline sebelum hidrasi) TIDAK bisa: React
   membandingkan DOM dengan hasil rendernya saat hidrasi, dan teks yang sudah
   ditukar akan dianggap mismatch lalu dikembalikan ke bahasa Indonesia.

   SATU pemilik, dua pemanggil: site-behavior.tsx sekali saat mount,
   applyLang() di runtime tiap tombol bahasa ditekan. */

const EN_ATTRS = [
  ['placeholder', 'enPlaceholder'],
  ['aria-label', 'enAriaLabel'],
  ['alt', 'enAlt'],
] as const;

const ID_HTML = new Map<HTMLElement, string>();
const ID_ATTR = new Map<HTMLElement, Record<string, string | null>>();

/* Direkam SEKALI, sebelum penukaran pertama menyentuh DOM. Merekam ulang
   sesudahnya akan menyimpan teks Inggris sebagai "aslinya" dan tombol ID
   berhenti mengembalikan apa pun. Juga harus sebelum splitChars() di runtime:
   pemecah huruf itu membongkar markup asli jadi <span> per huruf. */
let terekam = false;

function rekam() {
  if (terekam) return;
  terekam = true;
  document.querySelectorAll<HTMLElement>('[data-en]')
    .forEach((el) => ID_HTML.set(el, el.innerHTML));
  document.querySelectorAll<HTMLElement>('[data-en-placeholder],[data-en-aria-label],[data-en-alt]')
    .forEach((el) =>
      ID_ATTR.set(el, Object.fromEntries(EN_ATTRS.map(([a]) => [a, el.getAttribute(a)]))));
}

/* Bawaan 'en', bukan 'id', meski markupnya ditulis dalam bahasa Indonesia:
   pengunjung pertama kali mendapat versi Inggris, dan pilihannya baru menang
   setelah ia menekan tombol bahasa. Markupnya tetap Indonesia karena itu yang
   jadi sumber — data-en yang menumpang di atasnya, bukan sebaliknya. */
export const langAwal = () => localStorage.getItem('lang') || 'en';

export function tukarTeksStatis(l: string) {
  rekam();
  document.documentElement.lang = l;
  ID_HTML.forEach((idHtml, el) => { el.innerHTML = l === 'en' ? el.dataset.en! : idHtml; });
  ID_ATTR.forEach((idAttr, el) => {
    for (const [attr, key] of EN_ATTRS) {
      const en = el.dataset[key];
      if (en != null) el.setAttribute(attr, l === 'en' ? en : idAttr[attr]!);
    }
  });
}

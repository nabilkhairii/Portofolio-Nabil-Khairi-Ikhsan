/* Pemeriksa kontras kedua tema. Nilai dibaca dari style.css, tidak disalin,
   supaya ikut basi kalau paletnya diubah.  Jalankan: node check-contrast.mjs */
import { readFileSync } from 'node:fs';
import assert from 'node:assert';

const css = readFileSync(new URL('../app/portfolio.css', import.meta.url), 'utf8');

/** Ambil satu blok `selector { ... }` lalu jadikan peta --nama → nilai. */
function palette(selector) {
  const at = css.indexOf(selector);
  assert.ok(at !== -1, `blok ${selector} tidak ada di style.css`);
  const body = css.slice(at, css.indexOf('\n}', at));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]),
  );
}

const lum = (hex) => {
  const h = hex.slice(1);
  // #fff / #000 dipakai di palet gelap — panjangkan dulu, kalau tidak #fff dibaca #000fff
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((c) => c / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Label situs ini tebal 14px — masih dihitung teks normal oleh WCAG, jadi 4.5.
const MIN = 4.5;
const PAIRS = [
  ['ink', 'canvas'], ['ink', 'card'],
  ['body', 'canvas'], ['body', 'soft'], ['body', 'card'], ['body', 'elevated'],
  ['body-strong', 'canvas'], ['body-strong', 'card'],
  ['muted', 'canvas'], ['muted', 'soft'], ['muted', 'card'], ['muted', 'elevated'],
  ['canvas', 'ink'],   // .btn--solid: teks kanvas di atas isian ink
];

let worst = Infinity;
for (const [name, sel] of [['gelap', ':root {'], ['terang', ':root[data-theme="light"] {']]) {
  const p = palette(sel);

  for (const [fg, bg] of PAIRS) {
    const r = ratio(p[fg], p[bg]);
    worst = Math.min(worst, r);
    assert.ok(r >= MIN, `${name}: --${fg} di atas --${bg} cuma ${r.toFixed(2)}:1 (min ${MIN})`);
  }

  // Pita shimmer menimpa warna teks saat menyapu — tiap stop harus terbaca.
  for (const stop of p['gs-stops'].match(/#[0-9a-fA-F]{6}/g)) {
    const r = ratio(stop, p.canvas);
    worst = Math.min(worst, r);
    assert.ok(r >= MIN, `${name}: stop shimmer ${stop} di atas --canvas cuma ${r.toFixed(2)}:1`);
  }
}

console.log(`OK — kedua tema lolos, rasio terburuk ${worst.toFixed(2)}:1 (min ${MIN})`);

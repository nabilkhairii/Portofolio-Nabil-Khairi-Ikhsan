/* Uji penyalinan marquee. Sumbernya diambil langsung dari script.js (antara
   penanda #region marquee) dan dieval — bukan disalin. Yang dijaga: barisan
   ikon ikut disalin seperti teks, dan membangun ulang (resize / ganti bahasa)
   tidak melipatgandakan isinya.  Jalankan: node check-marquee.mjs
   ponytail: DOM tiruan seadanya, cukup untuk yang dipakai buildMarquees;
   kalau nanti butuh selector/geometri sungguhan, pasang linkedom. */
import { readFileSync } from 'node:fs';
import assert from 'node:assert';

class El {
  constructor(tag = 'span') {
    this.tag = tag; this.kids = []; this.attrs = {}; this.dataset = {};
    this.className = ''; this._text = ''; this._w = 0;
    this.classList = { add: (c) => { this.className = `${this.className} ${c}`.trim(); } };
  }
  get children() { return [...this.kids]; }                  // spread di append menyalin dulu, sama seperti HTMLCollection
  get firstElementChild() { return this.kids[0] ?? null; }
  set textContent(t) { this._text = t; this.kids = []; }
  get textContent() { return this.kids.length ? this.kids.map(k => k.textContent).join('') : this._text; }
  get offsetWidth() { return this.kids.length ? this.kids.reduce((s, k) => s + k.offsetWidth, 0) : this._w || this._text.length * 10; }
  get clientWidth() { return this._cw ?? 0; }
  setAttribute(k, v) { this.attrs[k] = v; }
  append(...nodes) { for (const n of nodes) { n.parent?.kids.splice(n.parent.kids.indexOf(n), 1); n.parent = this; this.kids.push(n); } }
  replaceChildren(...nodes) { this.kids = []; this.append(...nodes); }
  find(pred) { return this.kids.reduce((hit, k) => hit || (pred(k) ? k : k.find(pred)), null); }
  querySelector(sel) { return this.find(k => k.className.split(' ').includes(sel.slice(1))); }
  cloneNode() { const c = Object.assign(new El(this.tag), { className: this.className, attrs: { ...this.attrs }, _text: this._text, _w: this._w }); c.append(...this.kids.map(k => k.cloneNode())); return c; }
}

const img = () => Object.assign(new El('img'), { _w: 68 });   // 40px ikon + 28px gap

const src = readFileSync(new URL('../components/portfolio-runtime.js', import.meta.url), 'utf8')
  .split('/* #region marquee */')[1]?.split('/* #endregion marquee */')[0];
assert.ok(src, 'blok #region marquee tidak ditemukan di script.js');

const icons = Object.assign(new El('div'), { _cw: 1000, dataset: { marquee: '-60' } });
icons.append(...Array.from({ length: 9 }, img));
const cta = Object.assign(new El('h2'), { _cw: 1000, dataset: { marquee: '-60' } });
cta.textContent = 'Siap membangun sesuatu bersama?';

const doc = { createElement: (t) => new El(t), querySelectorAll: () => [icons, cta] };
const { buildMarquees, marquees } = new Function('document', 'reduced',
  `${src}; return { buildMarquees, marquees };`)(doc, false);

const copies = (el) => el.querySelector('.mq__scroller').children;
const imgsIn = (el) => { let n = 0; el.find(k => (k.tag === 'img' && n++, false)); return n; };

buildMarquees();
assert.ok(copies(icons).length > 1, 'baris ikon harus disalin sampai menutup lebar wadah');
copies(icons).forEach(c => assert.equal(imgsIn(c), 9, 'tiap salinan memuat 9 ikon utuh'));
assert.ok(copies(cta).length > 1, 'kalimat CTA harus disalin');
assert.equal(cta.attrs['aria-label'], 'Siap membangun sesuatu bersama?', 'SR membaca kalimatnya sekali');

/* Bangun ulang (resize): scroller lama masih ada, jadi contohnya diambil dari
   ingatan. Kalau salah, isi hasil salinan dibaca ulang dan berlipat. */
const before = copies(icons).length;
buildMarquees();
assert.equal(copies(icons).length, before, 'bangun ulang tidak menambah salinan');
copies(icons).forEach(c => assert.equal(imgsIn(c), 9, 'bangun ulang tidak melipatgandakan ikon'));

/* Ganti bahasa: innerHTML ditimpa, jadi scroller hilang dan teks baru dipakai. */
cta.textContent = 'Ready to build something together?';
buildMarquees();
assert.equal(copies(cta)[0].textContent, 'Ready to build something together?', 'teks baru terpakai setelah ganti bahasa');
assert.equal(marquees.length, 2, 'dua marquee terdaftar untuk dijalankan');

console.log('OK — salinan marquee (ikon & teks) benar, bangun ulang tidak berlipat');

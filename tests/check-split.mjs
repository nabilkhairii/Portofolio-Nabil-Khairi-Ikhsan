/* Uji pemecah huruf. Sumbernya diambil langsung dari portfolio-runtime.js
   (antara penanda #region split-chars) dan dieval — bukan disalin.

   Yang dijaga, semuanya gagal tanpa suara kalau rusak:
   1. Elemen di dalam paragraf (penekanan .text-ink) tetap ada setelah dipecah.
   2. Tautan tidak ikut dipecah — .w ber-aria-hidden akan membuatnya tak bernama.
   3. Memanggil dua kali tidak menumpuk .w bersarang.
   4. <br> terbaca sebagai spasi di aria-label, bukan penyambung kata.
   Jalankan: node check-split.mjs
   ponytail: DOM tiruan seadanya, cukup untuk yang disentuh splitOne. */
import { readFileSync } from 'node:fs';
import assert from 'node:assert';

class El {
  constructor(tag = 'span') {
    this.tag = tag; this.nodeName = tag.toUpperCase(); this.nodeType = 1;
    this.childNodes = []; this.attrs = {}; this.className = '';
    this.style = { props: {}, setProperty: (k, v) => { this.style.props[k] = v; } };
  }
  set textContent(t) { this.childNodes = [new Txt(t)]; }
  get textContent() { return this.childNodes.map(n => n.textContent).join(''); }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  append(...ns) { for (const n of ns) this.childNodes.push(typeof n === 'string' ? new Txt(n) : n); }
  replaceChildren(...ns) { this.childNodes = []; for (const n of ns) this.append(...(n.frag ? n.childNodes : [n])); }
  cloneNode() { const c = new El(this.tag); c.className = this.className; c.attrs = { ...this.attrs }; return c; }
  *walk() { for (const n of this.childNodes) { yield n; if (n.walk) yield* n.walk(); } }
  querySelector(sel) {
    const want = sel.split(',').map(s => s.trim());
    for (const n of this.walk()) {
      if (n.nodeType !== 1) continue;
      if (want.includes(n.tag) || want.includes('.' + n.className)) return n;
    }
    return null;
  }
}
class Txt { constructor(t) { this.nodeType = 3; this.nodeName = '#text'; this._t = t; } get textContent() { return this._t; } }
class Frag extends El { constructor() { super('#fragment'); this.frag = true; } }

const doc = { createElement: (t) => new El(t), createDocumentFragment: () => new Frag() };

const src = readFileSync(new URL('../components/portfolio-runtime.js', import.meta.url), 'utf8')
  .split('/* #region split-chars */')[1]?.split('/* #endregion split-chars */')[0];
assert.ok(src, 'blok #region split-chars tidak ditemukan di portfolio-runtime.js');
const { splitOne } = new Function(`${src}; return { splitOne };`)();

const chars = (el) => [...el.walk()].filter(n => n.nodeType === 1 && n.tag === 'span' && n.className !== 'w').length;
const words = (el) => [...el.walk()].filter(n => n.className === 'w').length;

/* 1. Penekanan di tengah paragraf bertahan. */
const emph = new El('p');
const ink = new El('span');
ink.className = 'text-ink';
ink.textContent = 'ukur dulu';
emph.append(new Txt('Prinsip saya sederhana: '), ink);
const n1 = splitOne(emph, doc);
assert.ok(emph.querySelector('.text-ink'), 'span penekanan hilang saat dipecah');
assert.equal(emph.querySelector('.text-ink').textContent, 'ukur dulu', 'isi penekanan berubah');
assert.equal(emph.textContent.replace(/\s+/g, ' ').trim(), 'Prinsip saya sederhana: ukur dulu', 'teks berubah');
assert.ok(n1 > 20, `huruf terhitung cuma ${n1}`);
assert.ok(parseFloat(emph.style.props['--split-step']) <= 40, '--split-step tidak boleh melebihi 40ms');

/* 2. Paragraf bertautan dilewati utuh. */
const linked = new El('p');
const a = new El('a');
a.textContent = 'surel saya';
linked.append(new Txt('Kirim ke '), a);
assert.equal(splitOne(linked, doc), 0, 'paragraf bertautan seharusnya dilewati');
assert.equal(words(linked), 0, 'tautan tidak boleh dipecah — SR kehilangan namanya');

/* 3. Dua panggilan tidak menumpuk. */
const twice = new El('h2');
twice.textContent = 'DOKUMENTASI KERJA.';
splitOne(twice, doc);
const w1 = words(twice), c1 = chars(twice);
assert.equal(splitOne(twice, doc), 0, 'panggilan kedua seharusnya dilewati');
assert.equal(words(twice), w1, 'kata berlipat saat dipecah ulang');
assert.equal(chars(twice), c1, 'huruf berlipat saat dipecah ulang');

/* 4. <br> jadi spasi, bukan penyambung kata. */
const multi = new El('h1');
multi.append(new Txt('M. NABIL'), new El('br'), new Txt('KHAIRI'), new El('br'), new Txt('IKHSAN'));
splitOne(multi, doc);
assert.equal(multi.getAttribute('aria-label'), 'M. NABIL KHAIRI IKHSAN', 'baris tersambung tanpa spasi di aria-label');
assert.equal([...multi.walk()].filter(n => n.tag === 'br').length, 2, 'pemisah baris hilang');

console.log('OK — penekanan bertahan, tautan dilewati, pecah ulang tidak menumpuk, <br> jadi spasi');

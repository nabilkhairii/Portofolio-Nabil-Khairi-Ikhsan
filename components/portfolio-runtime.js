/* ═══════════════════════════════════════════════════════════
   Portfolio — M. Nabil Khairi Ikhsan
   Sections: motion runtime · project data · grid + filters · gallery modal
   ═══════════════════════════════════════════════════════════ */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══ 0. BAHASA ═════════════════════════════════════════════
   Halaman ditulis dalam bahasa Indonesia; versi Inggrisnya menumpang di
   data-en / data-en-placeholder / data-en-aria-label / data-en-alt.
   Aslinya direkam DI SINI, sebelum apa pun menyentuh DOM — pemecah huruf di
   bawah membongkar markup asli, jadi kalau direkam belakangan yang tersimpan
   sudah berupa span. */
/* Bawaan 'en', bukan 'id', meski markupnya ditulis dalam bahasa Indonesia:
   pengunjung pertama kali mendapat versi Inggris, dan pilihannya baru menang
   setelah ia menekan tombol bahasa. Markupnya tetap Indonesia karena itu yang
   jadi sumber — data-en yang menumpang di atasnya, bukan sebaliknya. */
let lang = localStorage.getItem('lang') || 'en';

const EN_ATTRS = [['placeholder', 'enPlaceholder'], ['aria-label', 'enAriaLabel'], ['alt', 'enAlt']];
const ID_HTML = new Map();
const ID_ATTR = new Map();

document.querySelectorAll('[data-en]').forEach(el => ID_HTML.set(el, el.innerHTML));
document.querySelectorAll('[data-en-placeholder],[data-en-aria-label],[data-en-alt]')
  .forEach(el => ID_ATTR.set(el, Object.fromEntries(EN_ATTRS.map(([a]) => [a, el.getAttribute(a)]))));

/* Teks yang lahir di JavaScript, bukan di HTML. */
const UI = {
  id: {
    gallery: 'Galeri', open: 'Buka galeri', preview: 'Pratinjau', photos: 'foto',
    doc: 'Dokumentasi', video: 'Video',
    credential: 'Verifikasi sertifikat', certList: 'Semua sertifikat di LinkedIn',
    expList: 'Semua pengalaman di LinkedIn', projList: 'Semua proyek di LinkedIn',
    github: 'Hasil dan Code di Github', activity: 'Aktivitas di LinkedIn',
    required: 'Wajib diisi', badEmail: 'Format email tidak valid',
    checkFields: 'Periksa kembali kolom yang ditandai.',
    mailOpened: 'Aplikasi email dibuka. Tidak muncul? Gunakan tombol "Salin Email".',
    copied: 'Email disalin: ', copyManual: 'Salin manual: ',
  },
  en: {
    gallery: 'Gallery', open: 'Open gallery', preview: 'Preview', photos: 'photos',
    doc: 'Documentation', video: 'Video',
    credential: 'Verify certificate', certList: 'All certificates on LinkedIn',
    expList: 'All experience on LinkedIn', projList: 'All projects on LinkedIn',
    github: 'Results and Code on GitHub', activity: 'Activity on LinkedIn',
    required: 'Required', badEmail: 'Invalid email format',
    checkFields: 'Check the highlighted fields.',
    mailOpened: 'Your email app should be open. Nothing happened? Use the "Copy Email" button.',
    copied: 'Email copied: ', copyManual: 'Copy manually: ',
  },
};
const T = () => UI[lang];

/* ═══ 1. MOTION RUNTIME ═════════════════════════════════════ */

/* Scroll reveal — dua arah. Kelasnya ikut DILEPAS begitu elemennya keluar
   layar, jadi scroll balik ke atas memainkan animasi masuk yang sama sekali
   lagi. Dulu sekali jalan (io.unobserve) dan efeknya cuma bisa dilihat satu
   kali seumur halaman. Tidak ada animasi baru yang ditulis untuk arah keluar:
   transisinya yang sama berjalan mundur, dan .meter, .split, dan .spec ikut
   ter-reset karena semuanya bergantung pada kelas ini.

   --reveal-delay dinolkan saat keluar. CSS mengambil properti transisi dari
   keadaan TUJUAN, dan delay itu tinggal di .reveal — tanpa penolan ini elemen
   ber-delay 200ms menggantung 200ms dulu sebelum mulai memudar pergi. */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const delay = e.isIntersecting ? e.target.dataset.revealDelay || 0 : 0;
    e.target.style.setProperty('--reveal-delay', delay + 'ms');
    e.target.classList.toggle('is-visible', e.isIntersecting);
  }
}, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

/* Tanpa :not(.is-visible) lagi: tidak ada yang dilepas dari observer, jadi
   saringan itu sekarang justru melewatkan elemen yang sedang terlihat. Memanggil
   observe() dua kali untuk elemen yang sama tidak melakukan apa-apa. */
const observeReveals = () =>
  document.querySelectorAll('.reveal, .split').forEach(el => io.observe(el));
observeReveals();

/* ═══ Angka spec menghitung naik ═══
   Nilai akhirnya tetap ditulis apa adanya di page.tsx — itu yang terbaca kalau
   JS mati, mesin telusur membacanya, atau reduced motion menyala. Di sini
   angkanya cuma DIBACA dari markup, tidak pernah ditentukan: ubah IPK di
   page.tsx dan hitungannya ikut, tanpa menyentuh berkas ini.

   Bentuk aslinya dipertahankan, dan itu bagian yang mudah salah: "04" harus
   tetap dua digit berimbuh nol, "3.69" harus tetap dua desimal. */
/* #region spec-count */
function fmtCount(raw, v) {
  const [int, frac = ''] = raw.split('.');
  return v.toFixed(frac.length).padStart(int.length + (frac.length && frac.length + 1), '0');
}

function countSpecs(root, raf, now) {
  root.querySelectorAll('.spec__v').forEach((el) => {
    const raw = el.textContent.trim();
    const end = parseFloat(raw);
    if (!isFinite(end)) return;
    const t0 = now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1200);
      el.textContent = fmtCount(raw, end * (1 - Math.pow(1 - p, 3)));   // easeOutCubic
      if (p < 1) raf(step);
    };
    raf(step);
  });
}
/* #endregion spec-count */

/* Pitanya satu blok, jadi satu observer untuk seluruh baris: keempat angka
   berangkat bersamaan, bukan satu per satu saat masing-masing lewat ambang.
   Ikut dua arah seperti .reveal — tiap kali pitanya masuk lagi, hitungannya
   berangkat ulang dari nol. */
const specBand = document.querySelector('.spec')?.closest('.reveal');
if (specBand && !reduced) {
  /* Angka tulisannya diingat sekali di sini, dan dikembalikan sebelum tiap
     putaran. countSpecs membaca targetnya DARI textContent: kalau hitungan
     sebelumnya berhenti di tengah jalan — tab pindah ke latar, rAF ikut
     berhenti — yang terbaca di putaran berikutnya adalah angka setengah jadi,
     dan target salah itu menempel selamanya. */
  const specs = [...specBand.querySelectorAll('.spec__v')].map(el => [el, el.textContent]);
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    for (const [el, raw] of specs) el.textContent = raw;
    countSpecs(specBand, requestAnimationFrame, () => performance.now());
  }, { threshold: 0.4 }).observe(specBand);
}

/* SplitText: one span per character, each tagged with its running index (--i)
   so CSS can stagger the transition-delay off it. GSAP SplitText + ScrollTrigger
   there; here the split is the only JS, and the .reveal observer below flips one
   class when the heading enters — nothing per-char runs during scroll.
   Multi-line text is split at <br> so each line stays its own line.

   Elemen di dalamnya DIPERTAHANKAN, bukan diratakan jadi teks polos. Versi yang
   meratakan sudah cukup selama .split hanya dipakai heading, tapi paragraf
   membawa penekanan seperti <span class="text-ink">ukur dulu, baru simpulkan.
   </span> — meratakannya menghapus itu tanpa error, dan baru ketahuan saat
   halamannya dibaca.

   Fungsi, bukan sekali jalan: ganti bahasa menimpa innerHTML (applyLang) dan
   pemecahan harus diulang di isi yang baru. */
/* #region split-chars */
function splitOne(el, doc) {
  /* Sudah dipecah -> jangan pecah ulang: memecah hasil pecahan menumpuk .w
     bersarang tiap pemanggilan. Ganti bahasa membuang .w lewat innerHTML, jadi
     yang isinya benar-benar baru tetap terpecah lagi. */
  if (el.querySelector('.w')) return 0;

  /* Kontrol interaktif tidak boleh ikut dipecah: .w dipasangi aria-hidden, dan
     tautan yang seluruh isinya tersembunyi jadi tautan tanpa nama bagi pembaca
     layar. Lebih baik satu paragraf tidak beranimasi daripada satu tautan
     tidak terbaca. */
  if (el.querySelector('a, button, input, textarea, select')) return 0;

  /* <br> dihitung sebagai spasi: textContent menyambung "M. NABIL" dan
     "KHAIRI" tanpa pemisah, dan itu yang dibaca pembaca layar. */
  const label = (function text(node) {
    let s = '';
    node.childNodes.forEach((n) => {
      if (n.nodeName === 'BR') s += ' ';
      else if (n.nodeType === 3) s += n.textContent;
      else s += text(n);
    });
    return s;
  })(el).replace(/\s+/g, ' ').trim();
  if (!label) return 0;
  el.setAttribute('aria-label', label);       // SR reads the sentence, not the letters

  let i = 0;                                  // berjalan lintas baris: stagger-nya satu untai
  const build = (src, out) => {
    src.childNodes.forEach((n) => {
      if (n.nodeName === 'BR') return void out.append(doc.createElement('br'));
      if (n.nodeType !== 3) {
        const clone = n.cloneNode(false);      // pembungkusnya utuh, isinya dipecah
        build(n, clone);
        return void out.append(clone);
      }
      n.textContent.replace(/\s+/g, ' ').split(' ').forEach((word, wi) => {
        // A real text-node space between words. An inline-block span holding only
        // a space collapses to zero width — that is what jammed words together
        // and let lines break in the middle of a word.
        if (wi) { out.append(' '); i++; }
        if (!word) return;
        const w = doc.createElement('span');
        w.className = 'w';                     // nowrap, so words stay whole
        w.setAttribute('aria-hidden', 'true');
        for (const ch of word) {
          const s = doc.createElement('span');
          s.textContent = ch;
          s.style.setProperty('--i', i++);
          w.append(s);
        }
        out.append(w);
      });
    });
  };

  const frag = doc.createDocumentFragment();
  build(el, frag);
  el.replaceChildren(frag);

  /* Jeda antar huruf dibagi rata ke dalam jendela tetap, bukan angka mati.
     Alasannya sama dengan alasan 50ms aslinya diturunkan ke 40ms: stagger
     menumpuk lurus dengan jumlah huruf. Nama hero 22 huruf tetap dapat 40ms,
     heading 36 huruf akan menggantung 1,4 detik, dan paragraf 400 huruf tak
     akan pernah selesai. Sepanjang apa pun teksnya, kini ~0,9 detik. */
  el.style.setProperty('--split-step', Math.min(40, 900 / i).toFixed(1) + 'ms');
  return i;
}
/* #endregion split-chars */

const splitChars = () => document.querySelectorAll('.split').forEach(el => splitOne(el, document));
splitChars();

/* ═══ SOFT AURORA ════════════════════════════════════════════
   SoftAurora (React Bits). Fragment shader-nya disalin utuh — di situlah
   seluruh tampilannya. Yang diganti pembungkusnya: ogl + React ditukar WebGL
   mentah, karena dari ogl cuma Renderer/Program/Mesh/Triangle yang dipakai
   dan halaman ini tidak punya bundler untuk memuat paketnya.
   Vertex shader dipangkas ke `position` saja: vUv di aslinya tidak pernah
   dibaca fragment shader. */
(function auroraInit() {
  const canvas = document.getElementById('aurora');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false });
  if (!gl) return;                    // tanpa WebGL: kanvas kosong, halaman tetap utuh

  /* Prop komponen aslinya. Warnanya diambil dari palet M di app/portfolio.css:
     default #f7f7f7 + #e100ff (magenta) sama sekali di luar template ini. */
  const P = {
    speed: 0.5, scale: 1.5, brightness: 0.9,
    color1: '#1c69d4',                // --m-blue-dark
    color2: '#e22718',                // --m-red
    noiseFrequency: 2.5, noiseAmplitude: 1.0,
    bandHeight: 0.42, bandSpread: 1.0,
    octaveDecay: 0.1, layerOffset: 0, colorSpeed: 1.0,
    enableMouseInteraction: true, mouseInfluence: 0.2,
  };
  /* Digambar pada setengah resolusi lalu direntang CSS. Shader ini menghitung
     3 oktaf Perlin 3D dua kali per piksel — pada layar retina itu mahal, dan
     cahaya selembut ini tidak punya detail yang hilang saat diperbesar. */
  const RES = 0.5;

  const hexToVec3 = (hex) => {
    const h = hex.replace('#', '');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  };

  const vert = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0, 1); }`;

  const frag = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uBandHeight;
uniform float uBandSpread;
uniform float uOctaveDecay;
uniform float uLayerOffset;
uniform float uColorSpeed;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define TAU 6.28318

vec3 gradientHash(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 234.6)),
    dot(p, vec3(269.5, 183.3, 198.3)),
    dot(p, vec3(169.5, 283.3, 156.9))
  );
  vec3 h = fract(sin(p) * 43758.5453123);
  float phi = acos(2.0 * h.x - 1.0);
  float theta = TAU * h.y;
  return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
}

float quinticSmooth(float t) {
  float t2 = t * t;
  float t3 = t * t2;
  return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3;
}

vec3 cosineGradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TAU * (c * t + d));
}

float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
  float x = px * frequency;
  float y = py * frequency;

  float fx = floor(x); float fy = floor(y); float fz = floor(pz);
  float cx = ceil(x);  float cy = ceil(y);  float cz = ceil(pz);

  vec3 g000 = gradientHash(vec3(fx, fy, fz));
  vec3 g100 = gradientHash(vec3(cx, fy, fz));
  vec3 g010 = gradientHash(vec3(fx, cy, fz));
  vec3 g110 = gradientHash(vec3(cx, cy, fz));
  vec3 g001 = gradientHash(vec3(fx, fy, cz));
  vec3 g101 = gradientHash(vec3(cx, fy, cz));
  vec3 g011 = gradientHash(vec3(fx, cy, cz));
  vec3 g111 = gradientHash(vec3(cx, cy, cz));

  float d000 = dot(g000, vec3(x - fx, y - fy, pz - fz));
  float d100 = dot(g100, vec3(x - cx, y - fy, pz - fz));
  float d010 = dot(g010, vec3(x - fx, y - cy, pz - fz));
  float d110 = dot(g110, vec3(x - cx, y - cy, pz - fz));
  float d001 = dot(g001, vec3(x - fx, y - fy, pz - cz));
  float d101 = dot(g101, vec3(x - cx, y - fy, pz - cz));
  float d011 = dot(g011, vec3(x - fx, y - cy, pz - cz));
  float d111 = dot(g111, vec3(x - cx, y - cy, pz - cz));

  float sx = quinticSmooth(x - fx);
  float sy = quinticSmooth(y - fy);
  float sz = quinticSmooth(pz - fz);

  float lx00 = mix(d000, d100, sx);
  float lx10 = mix(d010, d110, sx);
  float lx01 = mix(d001, d101, sx);
  float lx11 = mix(d011, d111, sx);

  float ly0 = mix(lx00, lx10, sy);
  float ly1 = mix(lx01, lx11, sy);

  return amplitude * mix(ly0, ly1, sz);
}

float auroraGlow(float t, vec2 shift) {
  vec2 uv = gl_FragCoord.xy / uResolution.y;
  uv += shift;

  float noiseVal = 0.0;
  float freq = uNoiseFreq;
  float amp = uNoiseAmp;
  vec2 samplePos = uv * uScale;

  for (float i = 0.0; i < 3.0; i += 1.0) {
    noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t);
    amp *= uOctaveDecay;
    freq *= 2.0;
  }

  float yBand = uv.y * 10.0 - uBandHeight * 10.0;
  return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * abs(noiseVal + yBand))), 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float t = uSpeed * 0.4 * uTime;

  vec2 shift = vec2(0.0);
  if (uEnableMouse) {
    shift = (uMouse - 0.5) * uMouseInfluence;
  }

  vec3 col = vec3(0.0);
  col += 0.99 * auroraGlow(t, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.2 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.20, 0.20)) * uColor1;
  col += 0.99 * auroraGlow(t + uLayerOffset, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.1 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25)) * uColor2;

  col *= uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}`;

  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
    console.error('aurora shader:', gl.getShaderInfoLog(sh));
    return null;
  };

  const vs = compile(gl.VERTEX_SHADER, vert), fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return void console.error('aurora link:', gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  // Satu segitiga yang lebih besar dari layar — lebih murah dari dua segitiga
  // quad, dan tidak ada jahitan di diagonalnya. Ini yang dilakukan Triangle ogl.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = (n) => gl.getUniformLocation(prog, n);
  gl.uniform1f(u('uSpeed'), P.speed);
  gl.uniform1f(u('uScale'), P.scale);
  gl.uniform1f(u('uBrightness'), P.brightness);
  gl.uniform3fv(u('uColor1'), hexToVec3(P.color1));
  gl.uniform3fv(u('uColor2'), hexToVec3(P.color2));
  gl.uniform1f(u('uNoiseFreq'), P.noiseFrequency);
  gl.uniform1f(u('uNoiseAmp'), P.noiseAmplitude);
  gl.uniform1f(u('uBandHeight'), P.bandHeight);
  gl.uniform1f(u('uBandSpread'), P.bandSpread);
  gl.uniform1f(u('uOctaveDecay'), P.octaveDecay);
  gl.uniform1f(u('uLayerOffset'), P.layerOffset);
  gl.uniform1f(u('uColorSpeed'), P.colorSpeed);
  gl.uniform1f(u('uMouseInfluence'), P.mouseInfluence);
  gl.uniform1i(u('uEnableMouse'), P.enableMouseInteraction ? 1 : 0);
  const uTime = u('uTime'), uRes = u('uResolution'), uMouse = u('uMouse');

  function resize() {
    const w = Math.max(1, Math.round(canvas.clientWidth * RES));
    const h = Math.max(1, Math.round(canvas.clientHeight * RES));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform3f(uRes, w, h, w / h);
  }

  const mouse = [0.5, 0.5], target = [0.5, 0.5];
  if (P.enableMouseInteraction) {
    // Didengarkan di window, bukan di kanvas: kanvasnya pointer-events none,
    // jadi mousemove tidak akan pernah sampai ke sana.
    addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      target[0] = (e.clientX - r.left) / r.width;
      target[1] = 1 - (e.clientY - r.top) / r.height;
    }, { passive: true });
  }

  const render = (tMs) => {
    resize();
    gl.uniform1f(uTime, tMs * 0.001);
    mouse[0] += 0.05 * (target[0] - mouse[0]);
    mouse[1] += 0.05 * (target[1] - mouse[1]);
    gl.uniform2f(uMouse, mouse[0], mouse[1]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  if (reduced) return void requestAnimationFrame(render);   // satu bingkai diam

  let raf = 0, running = false;
  const loop = (t) => { render(t); raf = requestAnimationFrame(loop); };
  // Shader ini yang paling mahal di halaman — berhenti total begitu hero lewat.
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting === running) return;
    running = e.isIntersecting;
    if (running) raf = requestAnimationFrame(loop);
    else cancelAnimationFrame(raf);
  }).observe(canvas);
})();

/* ScrollVelocity: marquee yang lajunya ikut kecepatan scroll.
   Salinan teks dibuat secukupnya untuk menutup lebar wadah — bukan 6 tetap
   seperti numCopies di aslinya, karena label pendek di layar lebar akan
   menyisakan celah. Teks sumbernya diingat: ganti bahasa menulis ulang isi
   elemen, dan membaca ulang hasil salinan akan melipatgandakan teksnya.
   Isinya boleh teks (kalimat CTA) atau elemen (barisan ikon toolchain): satu
   salinan contoh dibuat dari isi asli, sisanya klon dari contoh itu. */
/* #region marquee */
const MQ_TPL = new Map();
const marquees = [];

function buildMarquees() {
  if (reduced) return;
  marquees.length = 0;
  document.querySelectorAll('[data-marquee]').forEach((el) => {
    // Sudah berisi scroller = isinya hasil bangunan sendiri, pakai contoh yang diingat.
    let tpl = MQ_TPL.get(el);
    if (!el.querySelector('.mq__scroller')) {
      tpl = document.createElement('span');
      tpl.className = 'mq__copy';
      tpl.setAttribute('aria-hidden', 'true');
      if (el.firstElementChild) {
        tpl.append(...el.children);               // node asli dipindah jadi contoh
      } else {
        const text = el.textContent.replace(/\s+/g, ' ').trim();
        if (!text) return;
        tpl.textContent = text;
        el.setAttribute('aria-label', text);      // SR membaca kalimatnya sekali, bukan tiap salinan
      }
      MQ_TPL.set(el, tpl);
    }
    if (!tpl) return;
    el.classList.add('mq');

    const scroller = document.createElement('span');
    scroller.className = 'mq__scroller';
    scroller.append(tpl.cloneNode(true));
    el.replaceChildren(scroller);

    const w = scroller.firstElementChild.offsetWidth;
    if (!w) return;                               // font belum siap; fonts.ready memanggil ulang
    const n = Math.ceil(el.clientWidth / w) + 1;  // satu salinan cadangan untuk sambungan
    for (let i = 1; i < n; i++) scroller.append(tpl.cloneNode(true));

    marquees.push({ scroller, w, v: parseFloat(el.dataset.marquee) || 100, x: 0 });
  });
}
/* #endregion marquee */
buildMarquees();

let mqT = performance.now(), mqY = scrollY, mqV = 0, mqDir = 1;

function stepMarquees(now) {
  const dt = Math.min(.05, (now - mqT) / 1000);
  mqT = now;
  mqV += ((dt ? (scrollY - mqY) / dt : 0) - mqV) * .15;   // pengganti useSpring
  mqY = scrollY;
  const f = mqV / 200;                                    // velocityMapping [0,1000] -> [0,5]
  if (f < -.02) mqDir = -1; else if (f > .02) mqDir = 1;  // directionFactor
  for (const m of marquees) {
    m.x += mqDir * m.v * dt * (1 + Math.abs(f));
    m.x = ((m.x % m.w) - m.w) % m.w;                      // wrap(-w, 0, x)
    m.scroller.style.setProperty('--mq-x', m.x.toFixed(2) + 'px');
  }
}

let mqRe;
addEventListener('resize', () => {
  clearTimeout(mqRe);
  mqRe = setTimeout(buildMarquees, 200);
});
document.fonts?.ready.then(buildMarquees);

/* Dock tidak diurus di sini lagi — pembesaran-mengikuti-kursor diganti
   components/ui/dock-two.tsx, yang menggerakkan pil & ikonnya sendiri lewat
   motion. Pointermove per-frame beserta pembacaan rect seluruh item ikut
   hilang bersamanya. */

/* Satu-satunya yang tersisa di rAF: marquee. Rim spekular tombol dan scrub
   scroll (--p untuk seksi choreo) sudah dihapus bersama efeknya, jadi loop ini
   tidak lagi membaca rect siapa pun tiap frame. */
function tick(now) {
  stepMarquees(now);
  requestAnimationFrame(tick);
}
if (!reduced && marquees.length) requestAnimationFrame(tick);

/* Pointer position — one document listener, not one per card (as in
   spotlight-card.tsx). Drives bevel direction, not a glow. */
if (!reduced && matchMedia('(pointer: fine)').matches) {
  addEventListener('pointermove', (e) => {
    const s = document.documentElement.style;
    s.setProperty('--px', (e.clientX / innerWidth).toFixed(3));
    s.setProperty('--py', (e.clientY / innerHeight).toFixed(3));
  }, { passive: true });
}

/* ═══ 2. PROJECT DATA ═══════════════════════════════════════
   Static site, no build step — the file list is transcribed from assets/.
   Add a folder there? Add an entry here.                                  */

/* Categories carry no color of their own — the M tricolor is brand-identity
   only, so cards share one chrome and differ by label.

   `all` bukan kategori proyek: tidak ada satu pun entri PROJECTS yang memakai
   `cat: 'all'`, dan renderGrid memperlakukannya sebagai "jangan saring".
   Tempatnya di sini supaya ia ikut dua hal yang sudah berjalan dari objek ini —
   urutan tab (renderFilters memetakan Object.keys) dan tab pertama yang aktif
   saat halaman dibuka (activeFilter) — tanpa satu pun cabang baru di keduanya.
   Konsekuensinya cuma satu: catLabel('all') ikut terdefinisi, dan itu memang
   yang dipakai tabnya. */
/* Tautan luar per kategori: [kunci label di UI, alamatnya]. Dipasang lewat
   openGallery, bukan disalin ke tiap entri PROJECTS — satu daftar yang sama
   untuk seluruh kategori, dan kalau alamatnya berubah cuma satu baris di
   sini. Kategori yang tidak terdaftar tidak dapat tautan, dan satu entri
   PROJECTS bisa menimpanya lewat `links` miliknya sendiri. */
const LI = 'https://www.linkedin.com/in/nabil-khairi-ikhsan/';
const PROFILE_LINKS = {
  industri:    [['expList',  `${LI}details/experience/`, 'linkedin']],
  akademik:    [['projList', `${LI}details/projects/`, 'linkedin'],
                ['github',   'https://github.com/nabilkhairii', 'github']],
  sertifikasi: [['certList', `${LI}details/certifications/`, 'linkedin']],
  organisasi:  [['activity', `${LI}recent-activity/all/`, 'linkedin']],
};

/* Logo tautan, ditulis inline dan bukan <img> ke public/icons/: fill-nya
   currentColor, jadi ikut warna tautannya di terang maupun gelap. Favicon PNG
   kedua merek ini hitam di atas kotak putih — di mode gelap yang tampil kotak
   putihnya, bukan logonya. Jalur dari simple-icons v13. */
const LINK_ICON = {
  /* Centang dalam kotak untuk tautan verifikasi. Digambar sendiri, bukan logo
     merek: tujuannya Kemnaker, dan yang ditandai statusnya "terverifikasi",
     bukan siapa penerbitnya. Digoreskan, tidak diisi penuh, supaya kotaknya
     tetap terbaca sebagai kotak pada 15px. */
  verified: '<rect x="3" y="3" width="18" height="18" rx="3.5" fill="none" stroke="currentColor" stroke-width="2"/>'
    + '<path d="m7.8 12.2 2.9 2.9 5.5-5.9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  linkedin: '<path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
  github: '<path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>',
};

const CATEGORIES = {
  all:        { label: 'Semua' },
  industri:   { label: 'Experience' },
  akademik:   { label: 'Development Project' },
  sertifikasi:{ label: 'Sertifikasi' },
  organisasi: { label: 'Organization & Activities' },
};

const PROJECTS = [
  {
    id: 'antam', cat: 'industri', isNew: true,
    title: 'Sistem Inventaris Gudang & Preventive Maintenance',
    org: 'PT Aneka Tambang Tbk (ANTAM) UBPE Logam Mulia — Intern, Electrical Maintenance',
    period: 'Jul 2026 – Sekarang',
    desc: 'Mengembangkan sistem inventaris gudang berbasis Raspberry Pi untuk mendigitalkan transaksi inventaris, mendukung monitoring safety stock, dan memperbaiki perencanaan pengadaan material (penyelesaian proyek 70%). Mendigitalkan instruksi kerja Preventive Maintenance menjadi dokumentasi visual untuk 67 dari 107 mesin industri (63%), sehingga standardisasi perawatan dan pemahaman teknisi ikut naik. Menyusun KPI Control Board Pillar 1 untuk Maintenance Maturity Level Assessment (MMLA) dengan menstandarkan indikator kinerja di tingkat Bureau, Work Unit, dan Cost Center.',
    tags: ['Raspberry Pi', 'Preventive Maintenance', 'MMLA', 'PCB Design'],
    folder: 'Antam',
    images: [
      // Paling depan = sampul panel & thumbnail grid (lihat coverOf).
      'Become part of PT ANTAM (UBPP) Logam Mulia.jpeg',
      'Carrying out Preventive Maintenance in the Factory Area.png',
      'Preventive Maintenance Preparation in the Smelting and Refining Section.jpeg',
      'Ensuring Normal Voltage and Current in Production Machinery Components.jpeg',
      'Performing Maintenance on the Pneumatic Components of Production Machinery.jpeg',
      'Vibration Check on Scrubber Motor for Work Instruction Documentation.jpeg',
      'Wiring Diagram for the Electrical Maintenance Warehouse Inventory Data Collection Project.png',
      'PCB Layout Result for the Inventory Data Collection System.jpeg',
      'System Placement Mapping.jpeg',
      'Meeting on Planning and Revising the MMLA Method.jpeg',
      "Training on the Implementation of the MMLA Method in the Company's Maintenance Department.jpeg",
    ],
  },
  {
    id: 'amx', cat: 'industri', isNew: true,
    title: 'Reverse Engineering Sistem Kelistrikan Electric Drone Sprayer',
    org: 'AMX UAV Technologies, Yogyakarta — Intern, Reverse Engineering (RE) Electric Drone Sprayer',
    period: 'Feb 2026 – Mei 2026',
    desc: 'Merakit dan memvalidasi sistem kelistrikan UAV yang mengintegrasikan 10+ modul elektronik termasuk distribusi daya. Melakukan reverse engineering wiring diagram dan Power Distribution Board (PDB) untuk mendukung distribusi daya ke 7+ subsistem UAV. Meredesain PCB 2 layer menggunakan EasyEDA dengan high-current routing, analisis termal, dan optimasi tata letak komponen agar siap fabrikasi. Melakukan pengujian distribusi daya, troubleshooting, dan verifikasi desain PCB untuk memastikan integrasi kelistrikan dan mekanik yang andal.',
    tags: ['EasyEDA', 'PCB 2 Layer', 'Power Distribution', 'Thermal Analysis'],
    folder: 'AMX',
    images: [
      'Reverse Engineering (RE) Electric Drone Sprayer.jpeg',
      'Core Parts of a Drone System.jpeg',
      'Components of the Drone that are the System Center (GPS, I2C, etc.).jpeg',
      'Conducting Research and Adjustment of Drone Components for PCB Design.jpeg',
      'the PCB part of the power drone that supplies all voltage and current to the system and propeller.jpeg',
      'Measuring the Dimensions of a PCB and the Distance between Components.jpeg',
      'Path when Routing PCB Power Parts.jpeg',
      'Display for Function Efficient PCBs.jpeg',
      'PCB Layout Result.jpeg',
      'AMX Electrical Team.jpeg',
    ],
  },
  {
    id: 'asprak', cat: 'industri',
    title: 'Asisten Praktikum Alat Ukur dan Pengukuran',
    org: 'Universitas Negeri Yogyakarta (UNY) — Part-time, Instrumentation and Measurement Course',
    period: 'Agu 2025 – Des 2025',
    desc: 'Mendampingi 14 mahasiswa S1 pada sesi laboratorium instrumentasi dan pengukuran, mencakup pengoperasian multimeter, osiloskop, dan alat uji elektronik lainnya. Mengevaluasi 200+ laporan praktikum sepanjang semester dan memberikan umpan balik teknis untuk meningkatkan akurasi pengukuran. Mengelola sesi lab sesuai SOP dengan nol kerusakan alat dan nol insiden keselamatan kerja.',
    tags: ['Teaching', 'Osiloskop', 'Proteus', 'Lab SOP'],
    folder: 'Praktikum Asprak Alat Ukur dan Pengukuran',
    images: ['Providing Measuring and Measuring Instrument Materials and Implementing Them in Proteus.jpeg'],
  },
  {
    id: 'iconplus', cat: 'industri',
    title: 'Survei & Instalasi Jaringan FTTH',
    org: 'PT PLN Icon Plus (Persero), Makassar — Intern, Field Network Technician',
    period: 'Mar 2022 – Jun 2022',
    desc: 'Melakukan survei lapangan dan inspeksi jaringan FTTH dengan target sekitar 30 Optical Distribution Point (ODP) per hari. Memperbarui data 2.510 ODP menggunakan sistem pemetaan digital untuk mendukung akurasi dokumentasi dan perencanaan jaringan. Menyiapkan serta memasang perangkat ODP termasuk adapter dan passive splitter 1:8 untuk deployment unit baru.',
    tags: ['FTTH', 'ODP', 'Digital Mapping', 'Fiber Optic'],
    folder: 'Magang ICON+',
    images: [
      'Report Creation and Data Recapitulation.jpg',   // pertama = sampul kartu
      'Internship Opening and Briefing.jpg',
      'Preparing ODP Components.jpg',
      'Organizing PT. ICON+ Event Activities.jpg',
      'Internship Documentation at PT ICON+ Makassar.jpg',
    ],
  },
  {
    id: 'arm-robot', cat: 'akademik', isNew: true,
    title: 'Robot Manipulator Berbasis AI untuk Klasifikasi Sampah Otomatis',
    org: 'Universitas Negeri Yogyakarta',
    period: 'Feb 2026 – Jun 2026',
    desc: 'Robot manipulator berbasis AI dengan Raspberry Pi + Ubuntu yang mengintegrasikan computer vision, kontrol robotik, dan operasi sistem embedded untuk klasifikasi sampah otomatis. Struktur manipulator dirancang di Autodesk Fusion 360, dicetak 3D, dan dihitung kebutuhan tegangan serta arusnya agar integrasi kelistrikan andal. Model deteksi objek dilatih dengan Python, OpenCV, dan YOLO untuk memilah sampah organik dan anorganik, dengan hasil validasi mAP@0.50 sekitar 97%, Precision 98%, dan Recall 95%. Model itu lalu diintegrasikan ke sistem robotik untuk deteksi dan klasifikasi real-time.',
    tags: ['YOLO', 'OpenCV', 'Raspberry Pi', 'Fusion 360', '3D Printing'],
    folder: 'Robotika Cerdas Arm Robot',
    images: [
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
  {
    id: 'cv-ai', cat: 'akademik',
    title: 'Sistem Deteksi Kendaraan dan Estimasi Kecepatan Berbasis Computer Vision',
    org: 'Universitas Negeri Yogyakarta',
    period: 'Nov 2025 – Des 2025',
    desc: 'Sistem deteksi dan klasifikasi kendaraan menggunakan YOLO11, OpenCV, dan ByteTrack untuk mengidentifikasi empat kelas kendaraan sekaligus mengestimasi kecepatannya. Membangun dataset kustom dengan mengumpulkan data dan menganotasi 2.188 instance kendaraan secara otomatis untuk pelatihan model. Menerapkan Perspective Transformation dan Exponential Moving Average agar estimasi kecepatan lebih stabil dan analisis risiko kendaraan lebih akurat. Hasil validasi model: Mean Average Precision 91,3% (IoU = 0.50), Precision 91,3%, dan Recall 91,0%.',
    tags: ['YOLO11', 'ByteTrack', 'OpenCV', 'Perspective Transform'],
    folder: 'Computer Vision & AI',
    images: [
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
  {
    id: 'ros2', cat: 'akademik',
    title: 'Pengembangan Rover Robot Berbasis ROS2 dengan Integrasi LiDAR',
    org: 'Universitas Negeri Yogyakarta (Jetson Orin Nano)',
    period: 'Okt 2025 – Des 2025',
    desc: 'Mengembangkan rover robot berbasis ROS2 dengan mengintegrasikan Jetson Orin Nano, LiDAR, dan motor driver untuk navigasi robot. Mengonfigurasi ROS2 workspace, komunikasi SSH, dan mengembangkan kontrol motor berbasis Python. Mengimplementasikan visualisasi data LiDAR 360° menggunakan Foxglove untuk menampilkan hasil pemindaian lingkungan.',
    tags: ['ROS 2', 'LiDAR', 'Jetson Orin Nano', 'Foxglove', 'Python'],
    folder: 'Robotika Lanjut',
    images: [
      'Component Checking before Implementation and Control Using ROS 2.jpeg',
      'Robot Components for Remote Control Integration and LiDAR Sensor Detection.jpeg',
      'Control Implementation.mp4',
    ],
  },
  {
    id: 'p-robotika', cat: 'akademik',
    title: 'Perancangan Robot Line Follower Otonom dengan Kontrol PID',
    org: 'Universitas Negeri Yogyakarta, Semester 5',
    period: 'Okt 2025 – Des 2025',
    desc: 'Merancang sistem elektronik dan mekanik line follower otonom: PCB kustom, sasis robot di Fusion 360, integrasi 8 sensor fotodioda, multiplexer, motor driver, dan modul manajemen daya. Mengimplementasikan pembacaan sensor serta menala parameter kontrol PD untuk meningkatkan responsivitas dan kestabilan gerak. Catatan waktu tercepat 7,9 detik dengan performa yang stabil dan konsisten.',
    tags: ['PID / PD Control', 'Custom PCB', 'Fusion 360', 'Photodiode Array'],
    folder: 'P. Robotika Lanjut (SEM 5)',
    images: [
      'Class Photo after the Line Follower Race.jpeg',   // pertama = sampul kartu
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
  {
    id: 'p-plc', cat: 'akademik',
    title: 'Pemrograman Logika Otomasi Industri dengan OpenPLC Editor',
    org: 'Universitas Negeri Yogyakarta, Semester 4',
    period: 'Mei 2025',
    desc: 'Mengembangkan logika otomasi industri menggunakan OpenPLC Editor dan pemrograman Ladder Diagram (LD) untuk kontrol proses sekuensial. Mengimplementasikan fungsi PLC standar termasuk Timer (TON), Counter (CTU), operasi aritmetika, dan fungsi komparasi untuk mengatur urutan proses dan penghitungan siklus produksi. Merancang safety interlock untuk mencegah konflik proses saat sistem beroperasi.',
    tags: ['OpenPLC', 'Ladder Diagram', 'TON / CTU', 'Safety Interlock'],
    folder: 'P. PLC (SEM 4)',
    images: [
      'Simple simulation when applied to conveyor logic.jpg',   // pertama = sampul kartu
      'Circuit Schematic for a Case Study of the Paint Mixing System Operational Process.jpeg',
      'Entering Variables For Project Series.jpeg',
      'The Circuit Component Responsible for Automation is That Every 4 Seconds, the Retail Valve Will Close and the Process Will Continue at the Mixing Stage.jpeg',
      'The Process Responsible for Preventing the Addition of Materials During the Process Stirring Begins.jpeg',
      'The Circuit Component That Acts as a Counter Increases by 1 to 4 when the Third Mixing Cycle is Completed.jpeg',
    ],
  },
  {
    id: 'p-komputer', cat: 'akademik',
    title: 'Pengembangan Sistem Manajemen Presensi dengan OpenCV dan MySQL',
    org: 'Universitas Negeri Yogyakarta, Semester 3',
    period: 'Nov 2024 – Des 2024',
    desc: 'Membangun aplikasi presensi berbasis desktop menggunakan Python, Tkinter, OpenCV, dan MySQL. Merancang antarmuka grafis (GUI) yang terintegrasi dengan modul kamera dan basis data untuk validasi identitas dan pencatatan kehadiran. Mengimplementasikan pengambilan citra, validasi ID mahasiswa, serta penyimpanan data kehadiran pada MySQL.',
    tags: ['Python', 'Tkinter', 'OpenCV', 'MySQL'],
    folder: 'Pemrograman Komputer (SEM 3)',
    images: [
      'Appearance and Implementation during Attendance.jpeg',
      "Recording each user's Presence in the Database.jpeg",
      'Attendance Recording Results in the Database.jpeg',
    ],
  },
  {
    id: 'p-instalasi', cat: 'akademik',
    title: 'Sistem Kontrol Motor Induksi Tiga Fasa dengan Kontaktor Magnetik',
    org: 'Universitas Negeri Yogyakarta, Instalasi Mesin Listrik Semester 2',
    period: 'Mei 2024 – Jun 2024',
    desc: 'Merancang dan mengimplementasikan sistem kontrol motor induksi tiga fasa untuk operasi forward-reverse menggunakan kontaktor magnetik. Merancang rangkaian daya dan kontrol dengan mengintegrasikan MCB, push button, overload relay, dan modul indikator ke dalam panel kontrol. Melakukan pengujian sistem dengan mengukur arus start, arus kerja, dan tegangan antar fasa untuk memverifikasi keamanan operasi motor.',
    tags: ['Motor 3 Fasa', 'Kontaktor Magnetik', 'Overload Relay', 'Panel Kontrol'],
    folder: 'Intalasi Mesin Listrik (SEM 2)',
    images: [
      '3 Phase Power Motor Circuit to Manually Turn the Steering Right and Left Using a 3 Phase Motor.jpeg',
      'Practical work in the Control Instrumentation Lab.jpeg',
    ],
  },
  {
    id: 'p-cloud', cat: 'akademik',
    title: 'Praktikum Komputasi Awan',
    org: 'Universitas Negeri Yogyakarta',
    period: '2025',
    desc: 'Praktikum komputasi awan mencakup provisioning layanan, kontainerisasi dengan Docker, serta integrasi layanan cloud sebagai backend untuk sistem embedded dan IoT.',
    tags: ['Cloud', 'Docker', 'Linux', 'Firebase'],
    folder: 'P. Komputasi Awan',
    images: [
      'Create simple applications for control systems.jpeg',
      'Application display for monitoring reading results.jpeg',
      'Control when the light is on.jpeg',
      'Control when the lights are off.jpeg',
      'Graph of data obtained from sensor readings.jpeg',
      'Data graph on Influxdb obtained from sensor readings.jpeg',
    ],
  },
  {
    id: 'k3-listrik', cat: 'sertifikasi', isNew: true,
    title: 'Awareness K3 Listrik',
    org: 'BPVP Sidoarjo, Kementerian Ketenagakerjaan RI',
    period: 'Apr 2026',
    desc: 'Sertifikasi kesadaran Keselamatan dan Kesehatan Kerja bidang kelistrikan: identifikasi bahaya listrik, prosedur LOTO, proteksi arus bocor, dan penerapan standar keselamatan pada instalasi tegangan rendah.',
    tags: ['K3 Listrik', 'Kemnaker RI', 'Sertifikat'],
    /* Alamat asli halaman verifikasi Kemnaker. Tautan yang disalin dari
       LinkedIn adalah pembungkus /safety/go/ yang membawa token sesi
       (mt=, lipi=) milik satu sesi login — bukan sesuatu yang boleh terbit. */
    credential: 'https://skillhub.kemnaker.go.id/sertifikat/pelatihan/1d7ecb4f-36b2-4c32-be79-eb43601108a5',
    folder: 'Sertifikasi K3 Listrik',
    images: [
      'Explanation of Material from the Supervisor.png',
      'Application of Electric K3 during Installation.png',
      'Fire Hazard Protection for Electrical Installations.png',
    ],
  },
  {
    id: 'bpvp-ambon', cat: 'sertifikasi', isNew: true,
    title: 'Reading & Identifying Passive Electronic Components',
    org: 'BPVP Ambon, Kementerian Ketenagakerjaan RI',
    period: 'Apr 2026',
    desc: 'Sertifikasi pembacaan dan identifikasi komponen elektronik pasif: pembacaan kode warna resistor, kapasitor, dan induktor, beserta fungsi dan formula keluaran masing-masing komponen.',
    tags: ['Komponen Pasif', 'Kemnaker RI', 'Sertifikat'],
    credential: 'https://skillhub.kemnaker.go.id/sertifikat/pelatihan/c56c6b17-13b3-4f8b-ac5a-6320bbd46ba1',
    folder: 'BPVP AMBON',
    images: ['Introduction to the Functions and Output Formulas of Each Component.png'],
  },
  {
    id: 'bpvp-banyuwangi', cat: 'sertifikasi', isNew: true,
    title: 'Menggunakan Alat Ukur Mekanis dan Elektrik',
    org: 'BPVP Banyuwangi, Kementerian Ketenagakerjaan RI',
    period: 'Feb 2026',
    desc: 'Short course penggunaan alat ukur mekanis dan elektrik: kalibrasi, prosedur pengukuran yang benar, pembacaan skala, serta analisis ketidakpastian hasil ukur.',
    tags: ['Alat Ukur', 'Kalibrasi', 'Kemnaker RI'],
    credential: 'https://skillhub.kemnaker.go.id/sertifikat/pelatihan/da5a85a0-6089-425c-b5fd-6a15765abc3a',
    folder: 'BPVP Banyuwangi Short Course Menggunakan Alat Ukur Mekanis dan Elektrik',
    images: [
      'Learning How Micrometer Mechanical Measuring Instruments Work and Calculating Their Measurements (Case Study).png',
      'Learning How the Shove Term Works and Calculating Its Measurement (Case Study by Instructor).png',
    ],
  },
  {
    id: 'k3-ziona', cat: 'sertifikasi', isNew: true,
    title: 'Occupational Health and Safety (K3)',
    org: 'PKBM & LPK ZIONA',
    period: 'Feb 2026',
    desc: 'Pelatihan keselamatan dan kesehatan kerja: identifikasi risiko di tempat kerja, penggunaan APD, prosedur tanggap darurat, dan penerapan budaya kerja aman.',
    tags: ['K3 Umum', 'APD', 'Sertifikat'],
    credential: 'https://skillhub.kemnaker.go.id/sertifikat/pelatihan/47bbd3c5-f527-4d37-9139-d8443afdcb56',
    folder: 'Short Course Pelatihan keselamatan dan kesehatan kerja (K3)',
    images: [
      'How to Calculate and Management Risks at Work.png',
      'Frequency and Severity Values in a Job.png',
      'Risk Level Class from Calculation of Frequency and Severity Values.png',
    ],
  },
  {
    /* Kepengurusan, bukan aktivitas: `links` menggantikan daftar bawaan
       kategorinya, jadi yang tampil tautan pengalaman, bukan recent-activity. */
    id: 'hmve', cat: 'organisasi',
    links: [['expList', `${LI}details/experience/`, 'linkedin']],
    title: 'Wakil Kepala Divisi Kewirausahaan HMVE UNY',
    org: 'Himpunan Mahasiswa Vokasi Elektro dan Elektronika (HMVE UNY)',
    period: 'Jan 2025 – Des 2025',
    desc: 'Memimpin pengadaan, desain, dan distribusi jaket resmi untuk 38 anggota pengurus dengan penyelesaian 100% tepat waktu dalam kurang dari satu bulan. Mengelola penganggaran dan pelaporan keuangan empat program divisi, mencakup perencanaan modal, pengendalian biaya, dan evaluasi laba. Meningkatkan laba divisi lebih dari 100% dalam satu periode kepengurusan melalui penjualan merchandise dan inisiatif branding.',
    tags: ['Leadership', 'Kewirausahaan', 'Budgeting', 'Branding'],
    folder: 'Kepengurusan HMVE 2025',
    images: [
      'Welcoming the New HMVE Management for the 2025 Period.jpg',
      'End of Ceremony and Declared as HMVE 2025 Management.jpg',
      'HMVE Management Certificate 2025.png',
    ],
  },
  {
    id: 'diskusi', cat: 'organisasi',
    title: 'Diskusi Departemen Teknik Elektro & Elektronika',
    org: 'Himpunan Mahasiswa Vokasi Elektro dan Elektronika (HMVE UNY)',
    period: '2025',
    desc: 'Forum penyampaian aspirasi mahasiswa Program Studi Teknik Elektro dan Elektronika kepada dosen dan pengelola program studi.',
    tags: ['Forum Aspirasi', 'Organisasi', 'HMVE'],
    folder: 'Diskusi Departemen Teknik Elektro & Elektronika',
    images: [
      'Event Activities Organized by the Electrical and Electronics Engineering Student Association.webp',
      'I and the Electrical and Electronics Engineering Study Program students who want to convey aspirations to the study program.webp',
      'Lecturers Who Receive and Convey Opinions Regarding Student Aspirations.webp',
      'Participants Who Take Part in Activities.webp',
    ],
  },
  {
    id: 'studi-banding', cat: 'organisasi',
    title: 'Studi Banding Divisi Kewirausahaan HMVE UNY & HME Polines',
    org: 'Himpunan Mahasiswa Vokasi Elektro dan Elektronika (HMVE UNY)',
    period: '2025',
    desc: 'Studi banding Divisi Kewirausahaan HMVE UNY dengan HME Politeknik Negeri Semarang: membahas program kerja yang dijalankan tiap himpunan, mengevaluasi apa yang sudah berjalan dan apa yang bisa diperbaiki, serta bertukar praktik pengelolaan merchandise dan branding divisi.',
    tags: ['Studi Banding', 'Kewirausahaan', 'Organisasi', 'HMVE'],
    folder: 'Studi Banding',
    images: [
      'Meeting and Comparative Study of HMVE UNY and HME Polines.jpg',
      'HMVE Entrepreneurship Division.jpg',
      'HMVE and HME Polines after discussions regarding the Entrepreneurship Division.jpg',
      'Discuss the Work Programs Implemented in Each Association.jpg',
      'Each of them tells about what has been done and what can be improved in a group.jpg',
      'Comparative Study Farewell.jpg',
    ],
  },
  {
    id: 'kunjungan', cat: 'organisasi',
    title: 'Kunjungan Industri',
    org: 'Universitas Negeri Yogyakarta, Program Studi Teknik Elektronika',
    period: '2024 – 2025',
    desc: 'Kunjungan industri untuk mengamati langsung penerapan sistem otomasi, kelistrikan, dan proses produksi di lingkungan manufaktur.',
    tags: ['Industri', 'Otomasi', 'Studi Lapangan'],
    folder: 'Kunjungan Industri',
    images: [
      'Industrial Visit to LRT Jakarta.webp',
      'Explanation regarding the LRT Jakarta train operating system.webp',
      'Meetings and explanations related to JAKI.webp',
      'Industrial Visit to PT Infiniti Group.webp',
      'Explanation of material related to the development of robotics in the industrial era 4.0.webp',
      'Robot Control System using ROS2 in the Sorting Industry.webp',
      'Robot for sorting goods which is controlled directly from ROS2.png',
      'Seeing the development and transformation of tools in the field of robotics in industry 4.0.webp',
    ],
  },
  {
    id: 'expo', cat: 'organisasi',
    title: 'National Expo of Faculty of Vocational Products',
    org: 'Universitas Negeri Yogyakarta (UNY)',
    period: '2025',
    desc: 'Berpartisipasi dalam pameran nasional produk Fakultas Vokasi UNY, memamerkan hasil rancangan perangkat keras dan sistem elektronika kepada pengunjung akademik maupun industri.',
    tags: ['Pameran', 'Produk Vokasi', 'Presentasi Teknis'],
    folder: 'National Expo of Faculty of Vocational Products at Universitas Negeri Yogyakarta (UNY)',
    images: [
      '3 Axis Manipulator Robot.webp',
      'Explanation regarding the working principle of the robot manipulator.webp',
      'Drone prototype that has been developed.webp',
      'PCBs on Robot and Drone Systems.webp',
      'Several Robot Developments Undertaken to Support Project Needs.webp',
    ],
  },
];

/* ═══ 2b. TERJEMAHAN INGGRIS ════════════════════════════════
   Tabel terpisah, bukan field _en di tiap entri: data aslinya tidak perlu
   disentuh, dan yang sudah berbahasa Inggris (org, judul tertentu) tinggal
   dilewat — t() jatuh ke nilai Indonesia kalau kuncinya tidak ada. */
const PROJECTS_EN = {
  antam: {
    title: 'Warehouse Inventory System & Preventive Maintenance',
    desc: 'Developed a Raspberry Pi-based warehouse inventory system to digitalize inventory transactions, support safety stock monitoring, and improve material procurement planning (70% project completion). Digitized Preventive Maintenance work instructions into visual documentation for 67 of 107 industrial machines (63%), improving maintenance standardization and technician comprehension. Developed KPI Control Boards for Pillar 1 of the Maintenance Maturity Level Assessment (MMLA) by standardizing performance indicators across Bureau, Work Unit, and Cost Center levels.',
  },
  amx: {
    title: 'Reverse Engineering an Electric Drone Sprayer Electrical System',
    desc: 'Assembled and validated a UAV electrical system integrating 10+ electronic modules, including power distribution. Performed reverse engineering of the wiring diagram and Power Distribution Board (PDB) to support power distribution across 7+ UAV subsystems. Redesigned a 2-layer PCB using EasyEDA, including high-current routing, thermal analysis, and component layout optimization to support fabrication readiness. Conducted power distribution testing, troubleshooting, and PCB design verification to ensure reliable electrical and mechanical integration.',
  },
  asprak: {
    title: 'Teaching Assistant, Instrumentation and Measurement Course',
    desc: 'Mentored 14 undergraduate students through instrumentation and measurement lab sessions covering multimeters, oscilloscopes, and other electronic test equipment. Assessed 200+ lab reports across the semester and gave technical feedback to improve measurement accuracy. Ran lab sessions to SOP with zero equipment damage and zero safety incidents.',
  },
  iconplus: {
    title: 'FTTH Network Survey & Installation',
    desc: 'Ran field surveys and FTTH network inspections targeting roughly 30 Optical Distribution Points (ODP) per day. Updated records for 2,510 ODPs in a digital mapping system to support documentation accuracy and network planning. Prepared and installed ODP hardware including adapters and 1:8 passive splitters for new unit deployment.',
  },
  'arm-robot': {
    title: 'AI-Based Robot Manipulator for Automated Waste Classification',
    desc: 'Developed an AI-based robot manipulator using Raspberry Pi running Ubuntu to integrate computer vision, robotic control, and embedded system operation. Designed the manipulator structure in Autodesk Fusion 360, performed 3D printing, and calculated voltage and current requirements to ensure reliable electrical system integration. Trained and evaluated an object detection model for organic and inorganic waste classification using Python, OpenCV, and YOLO, achieving approximately 97% mAP@0.50, 98% Precision, and 95% Recall during validation. Integrated the trained model into the robotic system for real-time detection and classification.',
  },
  'cv-ai': {
    title: 'Computer Vision-Based Vehicle Detection and Speed Estimation System',
    desc: 'Developed a computer vision-based vehicle detection and classification system using YOLO11, OpenCV, and ByteTrack to identify four vehicle classes and estimate vehicle speed. Built a custom dataset by collecting data and automatically annotating 2,188 vehicle instances for model training. Implemented Perspective Transformation and Exponential Moving Average to improve speed estimation stability and vehicle risk analysis. Achieved 91.3% Mean Average Precision (IoU = 0.50), 91.3% Precision, and 91.0% Recall during model validation.',
  },
  ros2: {
    title: 'ROS2-Based Rover Robot Development with LiDAR Integration',
    desc: 'Developed a ROS2-based rover robot by integrating Jetson Orin Nano, LiDAR, and a motor driver to support robot navigation. Configured the ROS2 workspace, SSH communication, and developed Python-based motor control. Implemented 360° LiDAR data visualization using Foxglove to display environmental scanning results.',
  },
  'p-robotika': {
    title: 'Autonomous Line Follower Robot Design and Development Using PID Control',
    desc: 'Designed the electronic and mechanical systems, including a custom PCB, robot chassis in Fusion 360, and integration of 8 photodiode sensors, a multiplexer, motor driver, and power management modules. Implemented sensor reading and tuned PD control parameters to improve robot responsiveness and motion stability. Achieved a fastest track completion time of 7.9 seconds with stable and consistent performance during testing.',
  },
  'p-plc': {
    title: 'Industrial Automation Logic Programming Using OpenPLC Editor',
    desc: 'Developed industrial automation logic using OpenPLC Editor and Ladder Diagram (LD) programming for sequential process control. Implemented standard PLC functions, including Timer (TON), Counter (CTU), arithmetic operations, and comparison functions to manage process sequencing and production cycle counting. Designed safety interlocks to ensure safe operation sequencing and prevent process conflicts during system operation.',
  },
  'p-komputer': {
    title: 'Attendance Management System Development Using OpenCV and MySQL',
    desc: 'Developed a desktop-based attendance application using Python, Tkinter, OpenCV, and MySQL. Designed the graphical user interface (GUI) and integrated camera and database modules for identity validation and attendance recording. Implemented image capture, student ID validation, and attendance data storage using MySQL.',
  },
  'p-instalasi': {
    title: 'Three-Phase Induction Motor Control System Using Magnetic Contactors',
    org: 'Universitas Negeri Yogyakarta, Electrical Machine Installation Semester 2',
    desc: 'Designed and implemented a three-phase induction motor control system for forward-reverse operation using magnetic contactors. Designed the power and control circuits while integrating MCBs, push buttons, overload relays, and indicator modules into the control panel. Performed system testing by measuring starting current, running current, and phase-to-phase voltage to verify safe and reliable motor operation.',
  },
  'p-cloud': {
    title: 'Cloud Computing Lab',
    desc: 'Cloud computing coursework covering service provisioning, containerization with Docker, and using cloud services as a backend for embedded and IoT systems.',
  },
  kunjungan: {
    title: 'Industrial Visits',
    org: 'Universitas Negeri Yogyakarta, Electronics Engineering Study Program',
    desc: 'Industrial visits observing automation, electrical systems, and production processes first-hand in manufacturing environments.',
  },
  expo: {
    desc: 'Took part in the national expo of UNY Vocational Faculty products, showing hardware and electronic system designs to academic and industry visitors.',
  },
  'k3-listrik': {
    title: 'Awareness K3 Electricity',
    org: 'BPVP Sidoarjo, Ministry of Manpower, Republic of Indonesia',
    desc: 'Occupational health and safety awareness certification for electrical work: electrical hazard identification, LOTO procedures, earth-leakage protection, and applying safety standards to low-voltage installations.',
  },
  'bpvp-ambon': {
    title: 'Certificate in Reading and Identifying Passive Electronic Components',
    org: 'BPVP Ambon, Ministry of Manpower, Republic of Indonesia',
    desc: 'Certification in reading and identifying passive electronic components: resistor, capacitor, and inductor color codes, along with the function and output formula of each component.',
  },
  'bpvp-banyuwangi': {
    title: 'Certificate Using Mechanical and Electrical Measuring Instruments',
    org: 'BPVP Banyuwangi, Ministry of Manpower, Republic of Indonesia',
    desc: 'Short course on using mechanical and electrical measuring instruments: calibration, correct measurement procedure, scale reading, and uncertainty analysis of the results.',
  },
  'k3-ziona': {
    title: 'Occupational Health and Safety Certificate',
    desc: 'Occupational health and safety training: workplace risk identification, PPE use, emergency response procedures, and building a safe working culture.',
  },
  hmve: {
    title: 'Vice Head of Entrepreneurship Division, HMVE UNY',
    org: 'Electrical and Electronics Vocational Student Association (HMVE UNY)',
    desc: 'Led the procurement, design, and distribution of official jackets for 38 executive members, achieving 100% on-time completion in less than one month. Managed budgeting and financial reporting across four divisional programs, including capital planning, cost control, and profit evaluation. Increased divisional profit by over 100% within one leadership term through merchandise sales and branding initiatives.',
  },
  diskusi: {
    title: 'Electrical & Electronics Engineering Department Forum',
    org: 'Electrical and Electronics Vocational Student Association (HMVE UNY)',
    desc: 'A forum carrying student input from the Electrical and Electronics Engineering program to lecturers and program management.',
  },
  'studi-banding': {
    title: 'Comparative Study, HMVE UNY & HME Polines Entrepreneurship Divisions',
    org: 'Electrical and Electronics Vocational Student Association (HMVE UNY)',
    desc: 'Comparative study between the HMVE UNY and HME Politeknik Negeri Semarang entrepreneurship divisions: reviewing the work programs each association runs, evaluating what worked and what could be improved, and exchanging practices in merchandise management and divisional branding.',
  },
};

const CATEGORIES_EN = {
  all: 'All',
  industri: 'Experience',
  akademik: 'Development Project',
  sertifikasi: 'Certifications',
  organisasi: 'Organization & Activities',
};

/* Jan/Feb/Mar/Apr/Jun/Jul/Nov sama di kedua bahasa — cukup lima kata ini. */
const MONTHS_EN = { Mei: 'May', Agu: 'Aug', Okt: 'Oct', Des: 'Dec', Sekarang: 'Present' };

/** Ambil field proyek pada bahasa aktif; jatuh ke bahasa Indonesia bila tak ada. */
const t = (p, field) => (lang === 'en' && PROJECTS_EN[p.id]?.[field]) || p[field];
const catLabel = (key) => (lang === 'en' && CATEGORIES_EN[key]) || CATEGORIES[key].label;
/* Tidak ada penerjemah tag: `tags:` di PROJECTS memang tidak pernah dirender.
   Datanya sengaja ditinggalkan kalau nanti mau ditampilkan. */
const period = (s) =>
  lang === 'en' ? s.replace(/\b(Mei|Agu|Okt|Des|Sekarang)\b/g, (m) => MONTHS_EN[m]) : s;

/* Folder and file names carry spaces, &, +, ' and () — encode every segment. */
const imgSrc = (p, file) => `assets/${encodeURIComponent(p.folder)}/${encodeURIComponent(file)}`;

/* Versi 1100px dari make-thumbs.mjs, untuk semua yang tampil kecil: kartu
   proyek dan strip thumbnail. Aslinya foto penuh yang dipakai — satu di
   antaranya 64 megapiksel, dan dekodenya menahan main thread persis saat
   kartunya dibuat. Tampilan utama lightbox tetap memakai imgSrc. */
const thumbSrc = (p, file) => `thumbs/${encodeURIComponent(p.folder)}/${encodeURIComponent(file)}.webp`;

const isVideo = (f) => /\.(mp4|webm|mov|m4v)$/i.test(f);

/* Numbered files ("7.webp") get a generic caption; descriptive ones keep their name. */
const captionOf = (file, i) => {
  const name = file.replace(/\.[^.]+$/, '');
  const generic = /^\d+$/.test(name) || /^Screenshot/i.test(name);
  return generic ? `${isVideo(file) ? T().video : T().doc} ${i + 1}` : name;
};

const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ═══ 3. GRID + FILTERS ═════════════════════════════════════ */

const grid = document.getElementById('project-grid');
const emptyMsg = document.getElementById('grid-empty');
const filterBar = document.getElementById('filters');
let activeFilter = Object.keys(CATEGORIES)[0];

/* Satu kartu per proyek: kotak berisi foto sampul, teksnya selalu terbaca.
   Menggantikan AccordionGallery — di sana satu panel melebar saat disorot dan
   sisanya menyempit jadi bilah miring, teksnya baru muncul kalau panelnya
   terbuka, dan kategori panjang dipecah empat-empat dengan animasi geser
   antarhalaman. Yang dilepas bersamanya, semuanya di berkas ini: setActive dan
   --ag-d (tilt + parallax), PAGE_SIZE/pageSlice/slideTo (halaman + geser), dan
   pendengar pointerover/focusin di grid — kartu tidak punya keadaan aktif yang
   perlu dipindahkan, jadi satu klik langsung membuka galerinya. */
const coverOf = (p) => p.images.find(f => !isVideo(f)) || p.images[0];

/* Tanda "yang disorot ini" seluruhnya CSS: kartunya naik sedikit di :hover /
   :focus-visible (.pcard di portfolio.css). Tak ada pendengar pointer baru,
   tak ada yang berjalan per frame saat kursor bergerak, dan tak ada elemen
   tambahan di markup ini. `desc` dan `tags` tetap milik galeri — di kartu
   keduanya cuma menutupi foto sampulnya. */
const cardHTML = (p) => `
  <button type="button" class="pcard" data-id="${p.id}"
          aria-label="${T().open}: ${esc(t(p, 'title'))}, ${p.images.length} ${T().photos}">
    <span class="pcard__media">
      <img loading="lazy" decoding="async"
           src="${thumbSrc(p, coverOf(p))}"
           alt="${T().preview} ${esc(t(p, 'title'))}" draggable="false">
    </span>
    <span class="pcard__scrim" aria-hidden="true"></span>
    ${p.isNew ? '<span class="pcard__new">New</span>' : ''}
    ${p.images.some(isVideo) ? '<span class="pcard__play" aria-hidden="true">&#9658;</span>' : ''}
    <span class="pcard__cap" aria-hidden="true">
      <span class="pcard__bar"></span>
      <span class="pcard__txt">
        <span class="pcard__cat">${esc(catLabel(p.cat))}</span>
        <span class="pcard__title">${esc(t(p, 'title'))}</span>
        <span class="pcard__org">${esc(t(p, 'org'))} &middot; ${esc(period(p.period))}</span>
        <span class="pcard__cta">${T().gallery} (${p.images.length})</span>
      </span>
    </span>
  </button>`;

/* Seluruh kategori sekaligus, tanpa halaman: yang dulu memaksa pemecahan
   empat-empat adalah flex-grow yang dianimasikan (properti layout, satu reflow
   per panel per frame). Kartu tidak menganimasikan apa pun yang mengubah tata
   letak, jadi sepuluh kartu sama murahnya dengan empat. */
function renderGrid() {
  const list = activeFilter === 'all' ? PROJECTS : PROJECTS.filter(p => p.cat === activeFilter);
  grid.innerHTML = list.map(cardHTML).join('');
  emptyMsg.classList.toggle('hidden', list.length > 0);
}

const CAT_KEYS = Object.keys(CATEGORIES);

function renderFilters() {
  const counts = { all: PROJECTS.length };
  for (const p of PROJECTS) counts[p.cat] = (counts[p.cat] || 0) + 1;

  filterBar.innerHTML = CAT_KEYS.map(key => `
    <button class="tab" role="tab" data-filter="${key}" aria-selected="${key === activeFilter}">
      ${catLabel(key)}<span class="tab__n">${counts[key] || 0}</span>
    </button>`).join('');
}

filterBar.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]');
  if (!btn || btn.dataset.filter === activeFilter) return;
  activeFilter = btn.dataset.filter;
  renderFilters();
  renderGrid();
});

renderFilters();
renderGrid();

/* ═══ 4. GALLERY MODAL ══════════════════════════════════════
   Native <dialog>: ESC, focus trap and background inertness are free.
   Only the FLIP entrance and the crossfade are ours. */

const dlg      = document.getElementById('gallery');
const imgs     = [...dlg.querySelectorAll('.g-img')];
const vid      = document.getElementById('g-video');
const thumbBar = document.getElementById('g-thumbs');
const countEl  = document.getElementById('g-count');
const captionEl= document.getElementById('g-caption');
const linksEl  = document.getElementById('g-links');

let current = null;   // active project
let index = 0;        // active photo
let front = 0;        // which .g-img layer is visible

function show(i, instant = false) {
  const prev = index;
  index = (i + current.images.length) % current.images.length;
  const dir = instant ? 0 : Math.sign(i - prev);   // which way the new frame slides in from
  const file = current.images[index];
  const cap = captionOf(file, index);

  vid.pause();
  if (isVideo(file)) {
    vid.src = imgSrc(current, file);
    vid.hidden = false;
    imgs.forEach(el => el.classList.remove('is-front'));
  } else {
    if (vid.hasAttribute('src')) { vid.removeAttribute('src'); vid.load(); }  // drop the buffered stream
    vid.hidden = true;
    const back = imgs[1 - front];
    back.src = imgSrc(current, file);
    back.alt = cap;
    back.style.setProperty('--dir', dir * 5 + '%');
    if (instant) back.style.transition = 'none';
    imgs[front].classList.remove('is-front');
    back.classList.add('is-front');
    if (instant) requestAnimationFrame(() => (back.style.transition = ''));
    front = 1 - front;
  }

  captionEl.textContent = cap;
  countEl.textContent = `${index + 1} / ${current.images.length}`;
  thumbBar.querySelectorAll('[data-i]').forEach((t, n) => t.classList.toggle('is-active', n === index));
  thumbBar.querySelector('.is-active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });

  // preload the neighbour so the crossfade never lands on a blank frame
  const next = current.images[(index + 1) % current.images.length];
  if (!isVideo(next)) new Image().src = imgSrc(current, next);
}

function openGallery(p, card) {
  current = p;
  const multi = p.images.length > 1;

  document.getElementById('g-cat').textContent = catLabel(p.cat);
  document.getElementById('g-title').textContent = t(p, 'title');
  document.getElementById('g-org').textContent = `${t(p, 'org')} · ${period(p.period)}`;
  document.getElementById('g-desc').textContent = t(p, 'desc');

  /* Tautan: yang spesifik dulu (halaman verifikasi proyek ini), baru bagian
     profil LinkedIn untuk kategorinya. Alamatnya konstanta kita sendiri,
     labelnya tetap lewat esc() supaya tidak ada jalur innerHTML tanpa saring. */
  linksEl.innerHTML = [
    ...(p.credential ? [[T().credential, p.credential, 'verified']] : []),
    ...(p.links ?? PROFILE_LINKS[p.cat] ?? [])
      .map(([key, href, icon]) => [T()[key], href, icon]),
  ].map(([label, href, icon]) =>
    `<a href="${href}" target="_blank" rel="noopener noreferrer">`
    + (icon ? `<svg viewBox="0 0 24 24" aria-hidden="true">${LINK_ICON[icon]}</svg>` : '')
    + `<span>${esc(label)} ↗</span></a>`).join('');

  // #t=0.1 makes the browser seek one frame in, so video thumbs aren't black
  thumbBar.innerHTML = multi
    ? p.images.map((f, n) => isVideo(f)
        ? `<video src="${imgSrc(p, f)}#t=0.1" preload="metadata" muted playsinline data-i="${n}"></video>`
        : `<img src="${thumbSrc(p, f)}" alt="" loading="lazy" decoding="async" data-i="${n}">`).join('')
    : '';
  thumbBar.style.display = multi ? '' : 'none';
  dlg.querySelectorAll('.g-nav').forEach(b => (b.style.display = multi ? '' : 'none'));
  countEl.style.display = multi ? '' : 'none';

  const r = card.getBoundingClientRect();
  dlg.showModal();
  // lihat catatan back hijack di bawah; try karena sebagian browser menolak
  // pushState di file://, dan galerinya tetap harus terbuka kalau ditolak
  try { history.pushState({ gallery: true }, ''); histOwned = true; } catch { /* Back kembali ke bawaan */ }
  show(0, true);

  if (reduced) return;
  // FLIP: fly in from the card that was clicked
  const d = dlg.getBoundingClientRect();
  const dx = (r.left + r.width / 2) - (d.left + d.width / 2);
  const dy = (r.top + r.height / 2) - (d.top + d.height / 2);
  dlg.animate(
    [{ transform: `translate(${dx}px, ${dy}px) scale(${Math.max(0.15, r.width / d.width)})`, opacity: 0 },
     { transform: 'none', opacity: 1 }],
    { duration: 320, easing: 'cubic-bezier(.22,.61,.36,1)' }
  );
}

/* Back hijack — padanan BackTrigger (Framer), tapi menutup galeri, bukan
   meninggalkan halaman. Galerinya <dialog>, bukan alamat baru, jadi tanpa ini
   tombol Back ponsel langsung keluar dari situs saat galeri sedang terbuka.
   Satu entri riwayat ditambahkan waktu galeri dibuka dan dilepas waktu ditutup;
   histOwned menjaga agar entri itu tidak dilepas dua kali — yang berarti mundur
   satu halaman terlalu jauh. Aslinya history.back() tanpa syarat dengan
   location='/' sebagai cadangan; di sini tak perlu, entri yang dilepas selalu
   milik kita sendiri. */
let histOwned = false;

addEventListener('popstate', () => {
  if (dlg.open && histOwned) { histOwned = false; closeGallery(); }
});

function closeGallery() {
  vid.pause();
  if (histOwned) { histOwned = false; history.back(); }
  if (reduced) return dlg.close();
  dlg.animate([{ opacity: 1 }, { transform: 'scale(.94)', opacity: 0 }],
    { duration: 180, easing: 'ease-in' }).finished.then(() => dlg.close());
}

/* open — satu klik kartu. Dulu perlu dua ketukan di layar sentuh: yang pertama
   mengaktifkan panel akordeon, yang kedua baru membuka galeri. Kartu tidak
   punya keadaan aktif, jadi ketukan pertama sudah membuka; <button> mengurus
   Enter/Space sendiri. */
grid.addEventListener('click', (e) => {
  const card = e.target.closest('.pcard');
  if (!card) return;
  openGallery(PROJECTS.find(p => p.id === card.dataset.id), card);
});

/* in-modal controls */
dlg.addEventListener('click', (e) => {
  if (e.target === dlg) return closeGallery();                 // click outside the shell
  if (e.target.closest('#g-close')) return closeGallery();
  const nav = e.target.closest('[data-step]');
  if (nav) return show(index + Number(nav.dataset.step));
  const thumb = e.target.closest('#g-thumbs [data-i]');
  if (thumb) show(Number(thumb.dataset.i));
});

/* ESC is native; intercept it so the close animation still plays */
dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeGallery(); });

dlg.addEventListener('keydown', (e) => {
  if (e.target === vid) return;                  // let arrows scrub the video instead
  if (!current || current.images.length < 2) return;
  if (e.key === 'ArrowRight') show(index + 1);
  if (e.key === 'ArrowLeft')  show(index - 1);
});

/* ═══ 5. NAV CHROME ═════════════════════════════════════════
   Hairline appears on the nav only once the page has left the top —
   the doc's nav is flat and borderless over the hero. */
const topnav = document.getElementById('topnav');
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

new IntersectionObserver(
  ([e]) => topnav.classList.toggle('is-stuck', !e.isIntersecting),
  { rootMargin: '-64px 0px 0px 0px' }
).observe(document.getElementById('hero'));

const setMenu = (open) => {
  menuBtn.setAttribute('aria-expanded', String(open));
  mobileMenu.hidden = !open;
  document.body.style.overflow = open ? 'hidden' : '';
};
menuBtn.addEventListener('click', () => setMenu(mobileMenu.hidden));
mobileMenu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mobileMenu.hidden) setMenu(false); });

/* Tema TIDAK diurus di sini lagi — pindah ke components/ui/theme-toggle.tsx,
   yang memegang atribut data-theme, localStorage, dan meta theme-color
   sekaligus. Nilai awalnya tetap dipasang inline di <head> (anti-kedip).
   Jangan hidupkan kembali pembalik di berkas ini: dua pemilik untuk satu
   keadaan akan saling menimpa tanpa error. */

/* Bahasa. Tukar isi statis, pecah ulang huruf/kata (markup lama sudah hilang
   saat innerHTML ditimpa), lalu render ulang grid karena judul & deskripsi
   proyek datang dari JS, bukan dari HTML. */
const langBtn = document.getElementById('lang-btn');

function applyLang(l) {
  lang = l;
  document.documentElement.lang = l;
  langBtn.querySelectorAll('[data-lang-opt]')
    .forEach(s => s.classList.toggle('is-on', s.dataset.langOpt === l));

  ID_HTML.forEach((idHtml, el) => { el.innerHTML = l === 'en' ? el.dataset.en : idHtml; });
  ID_ATTR.forEach((idAttr, el) => {
    for (const [attr, key] of EN_ATTRS) {
      const en = el.dataset[key];
      if (en != null) el.setAttribute(attr, l === 'en' ? en : idAttr[attr]);
    }
  });

  splitChars();
  buildMarquees();     // teks CTA ditulis ulang oleh data-en; salinannya harus dibangun ulang
  renderFilters();
  renderGrid();
}

applyLang(lang);      // DOM ditulis dalam bahasa Indonesia; samakan dengan pilihan tersimpan

langBtn.addEventListener('click', () => {
  const next = lang === 'en' ? 'id' : 'en';
  applyLang(next);
  localStorage.setItem('lang', next);
});

/* ═══ 6. CONTACT FORM ═══════════════════════════════════════
   No backend on a static site, so submit composes a mailto:. The browser's
   own constraint validation decides what's valid; we only render its verdict.
   ponytail: mailto opens the user's mail client and can't confirm delivery —
   swap in a form endpoint (Formspree/Web3Forms) if you need real receipts. */

const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
const EMAIL = 'nabilkhairiikhsan@gmail.com';

/* Pesan status. ok=true menyelipkan centang beranimasi; node-nya sengaja
   dibuat ulang tiap panggilan supaya animasinya mengulang saat disalin lagi. */
const CHECK_SVG = '<svg class="t-check" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
  + '<path d="M4 12.6l5.4 5.4L20 6.6" stroke="currentColor" stroke-width="2.5" '
  + 'stroke-linecap="round" stroke-linejoin="round"/></svg>';

const say = (msg, ok) => {
  status.textContent = msg;
  if (ok) status.insertAdjacentHTML('afterbegin', CHECK_SVG);
  status.classList.add('is-shown');
};

function validate() {
  let ok = true;
  for (const el of form.elements) {
    if (!el.name) continue;
    const field = el.closest('.field');
    const valid = el.checkValidity() && el.value.trim() !== '';
    field.classList.toggle('is-invalid', !valid);
    field.querySelector('.field__err').textContent =
      valid ? '' : (el.validity.typeMismatch ? T().badEmail : T().required);
    if (!valid) { if (ok) el.focus(); ok = false; }
  }
  return ok;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate()) return say(T().checkFields);

  const f = Object.fromEntries(new FormData(form));
  const body = `${f.pesan.trim()}\n\n—\n${f.nama.trim()}\n${f.email.trim()}`;
  location.href = `mailto:${EMAIL}`
    + `?subject=${encodeURIComponent(f.subjek.trim())}`
    + `&body=${encodeURIComponent(body)}`;
  say(T().mailOpened);
});

/* clear a field's error as soon as it becomes valid again */
form.addEventListener('input', (e) => {
  const field = e.target.closest('.field');
  if (field?.classList.contains('is-invalid') && e.target.checkValidity() && e.target.value.trim())
    field.classList.remove('is-invalid');
});

/* Clipboard API cuma ada di konteks aman dan menolak kalau dokumennya sedang
   tidak fokus (mis. DevTools yang aktif) — dibuka lewat file:// ia langsung
   melempar, jadi status sukses tak pernah tercapai. Jalur mundurnya textarea +
   execCommand, yang jalan di mana saja selama masih di dalam gestur klik.
   ponytail: execCommand usang; buang saja kalau situsnya pasti dilayani https. */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch { /* lanjut ke cara lama */ }

  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.append(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { /* biar ok tetap false */ }
  ta.remove();
  return ok;
}

document.getElementById('copy-email').addEventListener('click', async () => {
  if (await copyText(EMAIL)) say(T().copied + EMAIL, true);
  else say(T().copyManual + EMAIL);
});

window.__portfolio = { observeReveals, PROJECTS };

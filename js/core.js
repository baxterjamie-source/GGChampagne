/* Core: maths helpers, asset loading, green/white keying, sound effects. */
'use strict';

const W = 1600, H = 900;               // logical film frame (16:9)
const PAL = {
  orange: '#F2A900', gold: '#C9A13B', goldHi: '#E8C872', green: '#1E3B2C',
  pink: '#F3C6C0', blush: '#E89A9A', black: '#121212', cream: '#FBF5E9',
};

const U = {
  lerp: (a, b, t) => a + (b - a) * t,
  clamp: (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)),
  ease: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOut: t => 1 - Math.pow(1 - t, 3),
  easeIn: t => t * t * t,
  // progress of t through [a,b], clamped 0..1
  seg: (t, a, b) => U.clamp((t - a) / (b - a)),
  hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); },
  noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return U.lerp(U.hash(i), U.hash(i + 1), u); },
  mix(c1, c2, t) { return [0, 1, 2].map(i => Math.round(U.lerp(c1[i], c2[i], t))); },
  rgb(c, a = 1) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; },
  rand: (a, b) => a + Math.random() * (b - a),
};

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/* ---------- Assets ----------
   Images and sounds live in assets/ next to index.html (copied there from reveal_app/images and
   reveal_app/sounds by tools/sync_assets.ps1). The one-file build puts them all in
   window.INLINE_ASSETS as data URLs, keyed by the same path, e.g. 'images/SandJ/Cit-side.jpg'. */
function assetUrl(rel) {
  const inl = window.INLINE_ASSETS && window.INLINE_ASSETS[rel];
  return inl || encodeURI('assets/' + rel);
}
/* sync_assets.ps1 reads this list to know which images to copy: keep one 'key: path' per line. */
const ASSET_FILES = {
  bottle: 'vyno-veuve-clicquot-brut-yellow-label-champagne-bottle.jpg',
  side: 'SandJ/Cit-side.jpg',
  sideWorried: 'SandJ/cit_worried_side.jfif',
  frontWorried: 'SandJ/cit_worried_front.jfif',
  scVinesFwd: 'scenery/shot0/vineyard_hills.jfif',   // looking down the rows: used behind the front-on car
  back: 'SandJ/Cit-back.jpg',
  dash: 'archive_Citroen_deux-cheveaux/2CV_CL-16.108.015-scaled_DASH.jpg',
  land: 'champagne-landscape- muddy_track.jpg',
  jWorried: 'SandJ/J-worried.jpg',
  sWorried: 'SandJ/S-worried-anxious.jpg',
  jShock: 'SandJ/J-shocked.jpg',
  sShock: 'SandJ/S-scared-shocked.jpg',
  jLaugh: 'SandJ/J-laughing.jpg',
  sLaugh: 'SandJ/S-laughing.jpg',
  jAwe: 'SandJ/J-amazed-in-awe.jpg',
  sAwe: 'SandJ/s-more-amazed-wow.jpg',
  cheers: 'SandJ/S-J_cheers.jfif',
  // painted scenery for the side-on vineyard drive (shot 0 and friends)
  scSky: 'scenery/shot0/sky.jfif',
  scFar: 'scenery/shot0/far_hills.jfif',
  scVines: 'scenery/shot0/vineyard_hills2.jfif',
  scRoadside: 'scenery/shot0/roadside.jfif',
  scRoad: 'scenery/shot0/road.jfif',
  scTree: 'scenery/shot0/tree_1.jfif',
};
const RAW = {};   // HTMLImageElements
const A = {};     // processed canvases

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('Could not load ' + src));
    img.src = assetUrl('images/' + src);
  });
}

async function loadAssets(onProgress) {
  const keys = Object.keys(ASSET_FILES);
  let done = 0;
  await Promise.all(keys.map(async k => {
    RAW[k] = await loadImage(ASSET_FILES[k]);
    onProgress && onProgress(++done / keys.length);
  }));
  processAssets();
}

/* Remove a green-screen background. Returns a canvas with alpha. */
function keyGreen(img, crop) {
  const sx = crop ? crop[0] : 0, sy = crop ? crop[1] : 0;
  const w = crop ? crop[2] : img.width, h = crop ? crop[3] : img.height;
  const c = makeCanvas(w, h), x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, sx, sy, w, h, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], g = p[i + 1], b = p[i + 2];
    const m = Math.max(r, b), diff = g - m;
    if (g > 80 && diff > 30) {
      const k = U.clamp((diff - 30) / 70);       // 0 = keep, 1 = fully keyed
      p[i + 3] = Math.round(p[i + 3] * (1 - k));
    }
    if (diff > 12) p[i + 1] = Math.min(g, m + 12); // despill the green fringe
  }
  // choke the edge: pixels touching the keyed area (2 px deep) lose most of their alpha and
  // all of their green tint, so no green halo shows round hair and faces when zoomed in
  const a0 = new Uint8Array(w * h);
  for (let j = 0; j < w * h; j++) a0[j] = p[j * 4 + 3];
  for (let pass = 0; pass < 2; pass++) {
    const src = pass === 0 ? a0 : Uint8Array.from({ length: w * h }, (_, j) => p[j * 4 + 3]);
    for (let y = 1; y < h - 1; y++) for (let xx = 1; xx < w - 1; xx++) {
      const j = y * w + xx;
      if (src[j] < 10) continue;
      const minN = Math.min(src[j - 1], src[j + 1], src[j - w], src[j + w]);
      if (minN > 200) continue;                         // not on an edge
      const o = j * 4, r = p[o], g = p[o + 1], b = p[o + 2];
      p[o + 1] = Math.min(g, Math.max(r, b) * 0.92);   // remove green tint
      p[o + 3] = Math.round(p[o + 3] * (pass === 0 ? 0.55 : 0.8));
    }
  }
  x.putImageData(d, 0, 0);
  return c;
}

/* Remove a flat magenta (#FF00FF) background, used for the painted scenery layers. */
function keyMagenta(img) {
  const w = img.width, h = img.height;
  const c = makeCanvas(w, h), x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, w, h), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], g = p[i + 1], b = p[i + 2];
    const ex = Math.min(r, b) - g;                 // how magenta it is
    if (ex > 40) {
      const k = U.clamp((ex - 40) / 90);
      p[i + 3] = Math.round(p[i + 3] * (1 - k));
    }
    if (ex > 15) { const s = (ex - 15) * 0.8; p[i] = Math.max(g, r - s); p[i + 2] = Math.max(g, b - s); } // despill
  }
  x.putImageData(d, 0, 0);
  return c;
}

/* Make a strip tile seamlessly: cross-fade its right end over its left end. */
function makeTileable(src, ov = 160) {
  const w = src.width, h = src.height, out = makeCanvas(w - ov, h), x = out.getContext('2d');
  x.drawImage(src, 0, 0);
  const strip = makeCanvas(ov, h), sx = strip.getContext('2d');
  sx.drawImage(src, w - ov, 0, ov, h, 0, 0, ov, h);
  sx.globalCompositeOperation = 'destination-in';
  const g = sx.createLinearGradient(0, 0, ov, 0); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
  sx.fillStyle = g; sx.fillRect(0, 0, ov, h);
  // fade the original left edge out under the strip, then lay the strip on top
  x.globalCompositeOperation = 'destination-out';
  const g2 = x.createLinearGradient(0, 0, ov, 0); g2.addColorStop(0, '#000'); g2.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g2; x.fillRect(0, 0, ov, h);
  x.globalCompositeOperation = 'source-over';
  x.drawImage(strip, 0, 0);
  return out;
}

/* Flood-fill near-white background from seed points and make it transparent. */
function keyWhite(img, seeds, tol = 26, scale = 1) {
  const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
  const c = makeCanvas(w, h), x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h), p = d.data;
  const seen = new Uint8Array(w * h);
  const isWhite = i => { const o = i * 4; return p[o] > 255 - tol && p[o + 1] > 255 - tol && p[o + 2] > 255 - tol; };
  const stack = [];
  seeds.forEach(([sx, sy]) => stack.push(Math.round(sy * scale) * w + Math.round(sx * scale)));
  while (stack.length) {
    const i = stack.pop();
    if (i < 0 || i >= w * h || seen[i] || !isWhite(i)) continue;
    seen[i] = 1;
    p[i * 4 + 3] = 0;
    const px = i % w;
    if (px > 0) stack.push(i - 1);
    if (px < w - 1) stack.push(i + 1);
    stack.push(i - w, i + w);
  }
  // soften the fringe: light pixels touching the keyed area become semi-transparent
  for (let y = 1; y < h - 1; y++) for (let xx = 1; xx < w - 1; xx++) {
    const i = y * w + xx;
    if (seen[i]) continue;
    if (seen[i - 1] || seen[i + 1] || seen[i - w] || seen[i + w]) {
      const o = i * 4, lum = (p[o] + p[o + 1] + p[o + 2]) / 3;
      if (lum > 170) p[o + 3] = Math.round(255 * U.clamp((255 - lum) / 85));
    }
  }
  x.putImageData(d, 0, 0);
  return c;
}

/* Car (side view) wheel positions in Cit-side.jpg pixels. Tuned by eye. */
const CAR_WHEELS = [
  { cx: 214, cy: 641, r: 87 },   // rear (top half hidden behind the rear wheel spat)
  { cx: 924, cy: 640, r: 90 },   // front
];

function processAssets() {
  A.bottle = keyWhite(RAW.bottle, [[2, 2], [597, 2], [2, 797], [597, 797], [300, 2]], 22);
  // remove the photo's soft grey floor shadow around the base (the glass there is near-black)
  {
    const bx = A.bottle.getContext('2d', { willReadFrequently: true });
    const d = bx.getImageData(0, 700, 600, 100), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const lum = (p[i] + p[i + 1] + p[i + 2]) / 3;
      if (lum > 70) p[i + 3] = Math.round(p[i + 3] * U.clamp((110 - lum) / 40));
    }
    bx.putImageData(d, 0, 700);
  }

  // Side car: key, cut wheels out so they can spin and bounce on their own.
  // Wheels: the lower half of each wheel is fully visible, so build a whole wheel by mirroring
  // it upwards (the top is hidden by the fender/spat). That wheel spins behind the body.
  // In the body, tyre/hub pixels inside the circle are removed; blue paint (fender, spat) stays on top.
  const parts = carParts(keyGreen(RAW.side));
  A.carBody = parts.body; A.carWheels = parts.wheels;
  A.carBodyWorried = carParts(keyGreen(RAW.sideWorried)).body;   // same car, worried faces
  A.carFront = keyGreen(RAW.frontWorried);
  A.scVinesFwd = keyMagenta(RAW.scVinesFwd);
  finishAssets();
}

function carParts(side) {
  const sx = side.getContext('2d', { willReadFrequently: true });
  const isPaint = (r, g, b) => b - r > 28 && b > 90;   // the 2CV's blue
  const wheels = CAR_WHEELS.map(wh => {
    const s = Math.ceil(wh.r * 2 + 4), c = makeCanvas(s, s), x = c.getContext('2d', { willReadFrequently: true });
    const ox = Math.round(wh.cx - s / 2), oy = Math.round(wh.cy - s / 2);
    const src = sx.getImageData(ox, oy, s, s), out = x.createImageData(s, s);
    const h = s / 2;
    for (let py = 0; py < s; py++) for (let px = 0; px < s; px++) {
      const i = (py * s + px) * 4, dx = px - h, dy = py - h, d = Math.hypot(dx, dy);
      if (d > wh.r) continue;
      const my = Math.min(s - 1, Math.round(h + Math.abs(dy)));   // mirror the top half from the bottom half
      const j = (my * s + px) * 4;
      out.data[i] = src.data[j]; out.data[i + 1] = src.data[j + 1]; out.data[i + 2] = src.data[j + 2];
      out.data[i + 3] = d > wh.r - 1.5 ? 140 : 255;
    }
    for (let py = 0; py < s; py++) for (let px = 0; px < s; px++) {   // remove tyre/hub from the body
      const i = (py * s + px) * 4;
      if (Math.hypot(px - h, py - h) > wh.r + 1) continue;
      if (!isPaint(src.data[i], src.data[i + 1], src.data[i + 2])) src.data[i + 3] = 0;
    }
    x.putImageData(out, 0, 0);
    sx.putImageData(src, ox, oy);
    return c;
  });
  return { body: side, wheels };
}

function finishAssets() {
  A.carBack = keyGreen(RAW.back);

  // Dashboard photo: remove the white windscreen + side window, then cut away the old wipers above the dash line.
  const dash = keyWhite(RAW.dash, [[1280, 20], [2500, 20], [700, 20], [60, 300], [40, 120], [200, 40]], 30, 0.625);
  const dx = dash.getContext('2d');
  dx.globalCompositeOperation = 'destination-out';
  dx.beginPath();
  dx.moveTo(250, 0); dx.lineTo(1600, 0); dx.lineTo(1600, 112); dx.lineTo(330, 112); dx.lineTo(250, 0);
  dx.fill();
  dx.globalCompositeOperation = 'source-over';
  A.dash = dash;

  for (const k of ['jWorried', 'sWorried', 'jShock', 'sShock', 'jLaugh', 'sLaugh', 'jAwe', 'sAwe']) A[k] = keyGreen(RAW[k]);
  A.cheers = keyGreen(RAW.cheers);   // 864x1152, glasses touch at ~(430,400)
  A.land = RAW.land;

  // painted scenery layers
  A.scSky = RAW.scSky;
  A.scFar = makeTileable(keyMagenta(RAW.scFar));
  A.scVines = makeTileable(keyMagenta(RAW.scVines));
  A.scRoadside = makeTileable(keyMagenta(RAW.scRoadside));
  A.scRoad = makeTileable(RAW.scRoad, 200);
  A.scTree = keyMagenta(RAW.scTree);
  // a second, different-looking tree: mirrored and slightly deeper green
  const t2 = makeCanvas(A.scTree.width, A.scTree.height), tx = t2.getContext('2d');
  tx.translate(t2.width, 0); tx.scale(-1, 1); tx.filter = 'hue-rotate(-12deg) saturate(1.15) brightness(0.92)';
  tx.drawImage(A.scTree, 0, 0);
  A.scTree2 = t2;
}

/* ---------- Sound effects (generated, no audio files) ---------- */
const SFX = {
  ctx: null, master: null, noiseBuf: null, rain: null, engine: null, birdsTimer: null, muted: false,

  init() {
    if (this.muted) return;              // ?mute in the URL: silent (for building/testing)
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  },
  get t() { return this.ctx ? this.ctx.currentTime : 0; },

  noise(loop = false) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf; s.loop = loop;
    return s;
  },
  filter(type, freq, q = 1) {
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    return f;
  },
  env(peak, attack, decay, start = this.t) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
    return g;
  },
  chain(...nodes) { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); nodes[nodes.length - 1].connect(this.master); },

  pop() {
    if (!this.ctx) return;
    const n = this.noise(), f = this.filter('bandpass', 1400, 0.8), g = this.env(0.9, 0.003, 0.09);
    this.chain(n, f, g); n.start(); n.stop(this.t + 0.2);
    const o = this.ctx.createOscillator(), og = this.env(0.7, 0.002, 0.16);
    o.frequency.setValueAtTime(320, this.t); o.frequency.exponentialRampToValueAtTime(70, this.t + 0.15);
    this.chain(o, og); o.start(); o.stop(this.t + 0.25);
  },
  fizz(dur = 3, level = 0.18) {
    if (!this.ctx) return;
    const n = this.noise(true), f = this.filter('highpass', 3500), g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, this.t);
    g.gain.exponentialRampToValueAtTime(level, this.t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, this.t + dur);
    this.chain(n, f, g); n.start(); n.stop(this.t + dur + 0.1);
  },
  hiss(n = 1) { // a faint escaping-pressure hiss, a little louder with each tap
    if (!this.ctx) return;
    const s = this.noise(), f = this.filter('highpass', 5000 - n * 600), g = this.env(0.015 + n * 0.02, 0.05, 0.4 + n * 0.3);
    this.chain(s, f, g); s.start(); s.stop(this.t + 1.5);
  },
  tick(level = 0.25) { // small glassy clink for each bottle tap
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.env(level, 0.002, 0.25);
    o.type = 'sine'; o.frequency.value = 1800 + Math.random() * 300;
    this.chain(o, g); o.start(); o.stop(this.t + 0.3);
  },
  thunder(power = 1) {
    if (!this.ctx) return;
    const t = this.t;
    const crack = this.noise(), cf = this.filter('highpass', 900), cg = this.env(0.35 * power, 0.005, 0.25, t);
    this.chain(crack, cf, cg); crack.start(t); crack.stop(t + 0.4);
    const n = this.noise(true), f = this.filter('lowpass', 260), g = this.ctx.createGain();
    f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(70, t + 3.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.0 * power, t + 0.15);
    g.gain.setValueAtTime(0.8 * power, t + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.8);
    this.chain(n, f, g); n.start(t); n.stop(t + 4);
  },
  setRain(level) {
    if (!this.ctx) return;
    if (!this.rain) {
      const n = this.noise(true), f1 = this.filter('bandpass', 1800, 0.4), f2 = this.filter('lowpass', 6000), g = this.ctx.createGain();
      g.gain.value = 0.0001;
      this.chain(n, f1, f2, g); n.start();
      this.rain = g;
    }
    this.rain.gain.setTargetAtTime(Math.max(0.0001, level * 0.35), this.t, 0.4);
  },
  setEngine(level, pitch = 1) {
    if (!this.ctx) return;
    if (!this.engine) {
      const o = this.ctx.createOscillator(), o2 = this.ctx.createOscillator();
      o.type = 'sawtooth'; o2.type = 'square';
      const f = this.filter('lowpass', 380, 2), g = this.ctx.createGain(), am = this.ctx.createGain();
      const lfo = this.ctx.createOscillator(), lfoG = this.ctx.createGain();
      lfo.frequency.value = 22; lfoG.gain.value = 0.5; am.gain.value = 0.5;
      lfo.connect(lfoG); lfoG.connect(am.gain);
      o.connect(f); o2.connect(f); f.connect(am); am.connect(g); g.connect(this.master);
      g.gain.value = 0.0001;
      o.start(); o2.start(); lfo.start();
      this.engine = { o, o2, lfo, g };
    }
    const e = this.engine;
    e.o.frequency.setTargetAtTime(48 * pitch, this.t, 0.3);
    e.o2.frequency.setTargetAtTime(24.3 * pitch, this.t, 0.3);
    e.lfo.frequency.setTargetAtTime(22 * pitch, this.t, 0.3);
    e.g.gain.setTargetAtTime(Math.max(0.0001, level * 0.12), this.t, 0.25);
  },
  skid(dur = 1) {
    if (!this.ctx) return;
    const n = this.noise(true), f = this.filter('bandpass', 700, 3), g = this.ctx.createGain();
    f.frequency.setValueAtTime(900, this.t); f.frequency.linearRampToValueAtTime(400, this.t + dur);
    g.gain.setValueAtTime(0.0001, this.t);
    g.gain.exponentialRampToValueAtTime(0.4, this.t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, this.t + dur);
    this.chain(n, f, g); n.start(); n.stop(this.t + dur + 0.1);
  },
  squelch() {
    if (!this.ctx) return;
    const n = this.noise(), f = this.filter('lowpass', 500, 4), g = this.env(0.5, 0.01, 0.25);
    f.frequency.setValueAtTime(900, this.t); f.frequency.exponentialRampToValueAtTime(150, this.t + 0.25);
    this.chain(n, f, g); n.start(); n.stop(this.t + 0.35);
  },
  thunk() {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.env(0.4, 0.003, 0.12);
    o.frequency.setValueAtTime(220, this.t); o.frequency.exponentialRampToValueAtTime(90, this.t + 0.1);
    this.chain(o, g); o.start(); o.stop(this.t + 0.2);
  },
  chirp(when = 0) {
    const t = this.t + when;
    const base = 2600 + Math.random() * 2200, n = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const o = this.ctx.createOscillator(), g = this.env(0.06, 0.01, 0.08, t + i * 0.11);
      o.frequency.setValueAtTime(base, t + i * 0.11);
      o.frequency.exponentialRampToValueAtTime(base * (Math.random() > .5 ? 1.5 : 0.7), t + i * 0.11 + 0.08);
      this.chain(o, g); o.start(t + i * 0.11); o.stop(t + i * 0.11 + 0.12);
    }
  },
  // Occasional birdsong: a short phrase (1–3 chirps), then a quiet spell of 3–10 s (× gap).
  birds(on, gap = 1) {
    if (!this.ctx) return;
    clearTimeout(this.birdsTimer);
    if (!on) return;
    const phrase = () => {
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) this.chirp(i * (0.5 + Math.random() * 0.6));
      this.birdsTimer = setTimeout(phrase, (3000 + Math.random() * 7000) * gap);
    };
    this.birdsTimer = setTimeout(phrase, 300 + Math.random() * 900);
  },
  clink() {
    if (!this.ctx) return;
    [2637, 3951, 5274].forEach((f, i) => {
      const o = this.ctx.createOscillator(), g = this.env(0.18 / (i + 1), 0.002, 1.4);
      o.frequency.value = f; this.chain(o, g); o.start(); o.stop(this.t + 1.5);
    });
  },
  sparkle() {
    if (!this.ctx) return;
    for (let i = 0; i < 8; i++) {
      const o = this.ctx.createOscillator(), g = this.env(0.05, 0.005, 0.5, this.t + i * 0.07);
      o.frequency.value = 1500 + Math.random() * 3000;
      this.chain(o, g); o.start(this.t + i * 0.07); o.stop(this.t + i * 0.07 + 0.6);
    }
  },
  stopAll() {
    if (!this.ctx) return;
    this.setRain(0); this.setEngine(0); this.birds(false);
  },
};

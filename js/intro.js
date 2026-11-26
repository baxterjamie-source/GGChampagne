/* Opening sequence (DESIGN.md, Batch 1): S & J in the 2CV, the storm, the bistro table, the reveal. */
'use strict';

function once(L, key, cond, fn) { if (cond && !L.fired[key]) { L.fired[key] = 1; fn(); } }

/* ---------- The fork in the road (painted), the car from behind heading up the right branch ---------- */
/* The centre of the right-hand track in the fork painting (frame units at zoom 1), and the car's
   size there (it shrinks with distance). Measured from fwd_fork. */
const FORK_PATH = [[965, 990, 0.36], [1040, 720, 0.25], [1115, 600, 0.18], [1172, 500, 0.13], [1215, 405, 0.088], [1250, 335, 0.058]];
function forkPoint(p) {                          // p 0..1 along the track by distance
  const P = FORK_PATH, len = [0];
  for (let i = 1; i < P.length; i++) len.push(len[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const d = U.clamp(p) * len[len.length - 1];
  let i = 1; while (i < P.length - 1 && len[i] < d) i++;
  const k = (d - len[i - 1]) / (len[i] - len[i - 1]), a = P[i - 1], b = P[i];
  return { x: U.lerp(a[0], b[0], k), y: U.lerp(a[1], b[1], k), s: U.lerp(a[2], b[2], k), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}
/* The car fishtails up the track: quick cuts between the square-on rear view (Cit-back) and the
   angled one (cit_back_turn_right2), the tail swinging out each time, mud flung off the rear wheels.
   Each picture is anchored where its wheels meet the ground, so it sits in the ruts.
   Per view: image, anchor (x, y of the wheels on the ground), size factor, tail lights, rear wheels. */
const FORK_VIEWS = {
  straight: { img: 'carBack', ax: 576, ay: 805, k: 1, lights: [[-210, -130], [214, -130]], wheels: [[-280, -20], [280, -20]], rot: -0.035, dx: -10 },
  angled: { img: 'carBackTurn', ax: 600, ay: 790, k: 1.22, lights: [[-472, -210], [-192, -180]], wheels: [[-390, -60], [30, 0]], rot: 0.03, dx: 12 },
};
function drawFork(ctx, t, light, carP, S, L, dt = 1 / 60) {
  // a very slow push in; the car is drawn inside the same transform so it stays in the ruts
  const z = 1 + t * 0.006;
  ctx.save(); ctx.translate(800, 450); ctx.scale(z, z); ctx.translate(-800, -450);
  drawCover(ctx, A.fwdFork, 1.0, 0.5, 0.5);
  const q = forkPoint(carP);
  // the fishtail: a cut every ~0.3 s, a little irregular, swinging between the two views
  const beat = Math.floor(t / 0.3 + Math.sin(t * 1.3) * 0.4), V = FORK_VIEWS[beat % 2 ? 'angled' : 'straight'];
  if (L && L.beat !== beat) { L.beat = beat; L.kick = 1; }
  const s = q.s * V.k, x = q.x + V.dx * s * 3, y = q.y;
  groundShadow(ctx, x + (V === FORK_VIEWS.angled ? 60 * s : 0), y, 380 * s * V.k, 0.55);
  // mud off the rear wheels: a burst at each swing, a steady spray in between
  if (S) {
    const burst = L && L.kick ? 10 : (Math.random() < 0.5 ? 1 : 0); if (L) L.kick = 0;
    for (const [wx, wy] of V.wheels) for (let i = 0; i < burst; i++)
      S.mud.add(x + wx * s, y + wy * s, (wx < 0 ? -1 : 1) * (60 + Math.random() * 260) * s * 3, (-200 - Math.random() * 380) * s * 3, (2 + Math.random() * 5) * s * 3, '#4a3220', 0.7);
    S.mud.update(dt); S.mud.draw(ctx);
  }
  ctx.save(); ctx.translate(x, y + Math.sin(t * 18) * 1.5 * s); ctx.rotate(V.rot + Math.sin(t * 7) * 0.01); ctx.scale(s, s);
  ctx.drawImage(A[V.img], -V.ax, -V.ay);
  ctx.globalCompositeOperation = 'lighter';
  for (const [lx, ly] of V.lights) {                                   // a soft glow round the rear lights
    const g = ctx.createRadialGradient(lx, ly, 4, lx, ly, 80);
    g.addColorStop(0, 'rgba(255,60,40,.6)'); g.addColorStop(1, 'rgba(255,60,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, 80, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.restore();
  darken(ctx, U.clamp((1 - light) * 0.62));
  nightShade(ctx, light, 0.85);
}
/* ---------- Title text ---------- */
const TITLE_LINES = [
  { text: 'Steph,', size: 120, y: 190 },
  { text: 'Welcome to Your', size: 92, y: 305 },
  { text: 'Champagne Birthday', size: 112, y: 430 },
];
function layoutTitle(ctx) {
  const letters = [];
  let n = 0, bottle = null;
  TITLE_LINES.forEach((ln, li) => {
    ctx.font = `italic 700 ${ln.size}px "Playfair Display", Georgia, serif`;
    const extra = li === 2 ? 70 : 0;                   // room for the bottle "!"
    const total = ctx.measureText(ln.text).width + extra;
    let x = 800 - total / 2;
    for (const ch of ln.text) {
      const w = ctx.measureText(ch).width;
      if (ch !== ' ') letters.push({ ch, x, y: ln.y, size: ln.size, i: n++ });
      x += w;
    }
    if (li === 2) bottle = { x: x + 36, y: ln.y + 8, h: 150 };
  });
  // each glowing gold letter is drawn once to its own little canvas (glows are slow to draw every frame on phones)
  for (const L of letters) {
    const pad = 44, f = `italic 700 ${L.size}px "Playfair Display", Georgia, serif`;
    ctx.font = f;
    const w = Math.ceil(ctx.measureText(L.ch).width) + pad * 2, h = Math.ceil(L.size * 1.35) + pad * 2;
    const c = makeCanvas(w, h), x = c.getContext('2d'), by = pad + L.size;
    x.font = f; x.textBaseline = 'alphabetic'; x.lineJoin = 'round';
    x.lineWidth = 9; x.strokeStyle = 'rgba(60,36,8,.55)'; x.strokeText(L.ch, pad, by + 4);
    x.shadowColor = 'rgba(242,169,0,.55)'; x.shadowBlur = 22;
    x.fillStyle = goldFill(x, by, L.size); x.fillText(L.ch, pad, by);
    L.spr = c; L.ox = pad; L.oy = by;
  }
  return { letters, bottle, count: n };
}
function goldFill(ctx, y, size) {
  const g = ctx.createLinearGradient(0, y - size * 0.8, 0, y + size * 0.1);
  g.addColorStop(0, '#FFF3C8'); g.addColorStop(0.35, '#E8C872'); g.addColorStop(0.65, '#F2A900'); g.addColorStop(1, '#B8902E');
  return g;
}
function drawTitle(ctx, T, t, shine) {
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  for (const L of T.letters) {
    const lt = t - L.i * 0.065;
    if (lt <= 0) continue;
    const p = U.clamp(lt / 0.55), e = U.easeOut(p);
    const y = L.y - (1 - e) * 90, a = U.clamp(lt / 0.3);
    ctx.globalAlpha = a;
    ctx.drawImage(L.spr, L.x - L.ox, y - L.oy);
    ctx.font = `italic 700 ${L.size}px "Playfair Display", Georgia, serif`;
    // moving shine
    const d = Math.abs(L.x - shine);
    if (d < 120) { ctx.globalAlpha = a * (1 - d / 120) * 0.8; ctx.fillStyle = '#FFFBEA'; ctx.fillText(L.ch, L.x, y); }
  }
  ctx.restore();
}

/* ---------- Bubbles that float up over the final scenes ---------- */
function drawRisingBubbles(ctx, t, n = 40, alpha = 1) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const sp = 40 + U.hash(i * 2.1) * 80, x = U.hash(i * 5.3) * W + Math.sin(t * 1.5 + i) * 12;
    const y = H + 20 - ((t * sp + U.hash(i) * (H + 40)) % (H + 40)), r = 2 + U.hash(i * 7.7) * 6;
    ctx.globalAlpha = alpha * 0.55;
    ctx.strokeStyle = '#FFF3C8'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,243,200,.35)'; ctx.beginPath(); ctx.arc(x - r * .3, y - r * .3, r * .35, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* ---------- Shot list ---------- */
const LANDSCAPE_FILTER = 'saturate(1.12) contrast(1.04) brightness(1.03)';

/* The final panorama. k = 0: framed for the windscreen (as the other forward views); k = 1: centred on the whole frame. */
function drawPano(ctx, zoom = 1, k = 0) {
  if (!A.panoF) {                                   // the colour lift baked in once, not filtered every frame
    const c = makeCanvas(A.pano.width, A.pano.height), x = c.getContext('2d');
    x.filter = LANDSCAPE_FILTER; x.drawImage(A.pano, 0, 0); A.panoF = c;
  }
  const img = A.panoF, sc = Math.max(W / img.width, H / img.height) * zoom, w = img.width * sc, h = img.height * sc, fy = 0.42;
  const x = U.lerp(WINDSCREEN.cx - w * 0.5, (W - w) * 0.5, k);
  const y = Math.min(0, Math.max(H - h, U.lerp(WINDSCREEN.cy - h * fy, (H - h) * fy, k)));
  ctx.drawImage(img, x, y, w, h);
}

function sideShot(o) {
  // shared logic for the side-on driving shots
  return (ctx, t, dt, S, L) => {
    const p = t / o.dur;
    const speed = typeof o.speed === 'function' ? o.speed(t) : o.speed;
    S.scroll += speed * dt;
    const light = typeof o.light === 'function' ? o.light(p) : o.light;
    const rain = typeof o.rain === 'function' ? o.rain(p) : o.rain;
    ctx.save();
    if (o.tiltWorld) { ctx.translate(800, 450); ctx.rotate(o.tiltWorld); ctx.scale(1.14, 1.14); ctx.translate(-800, -450); }
    drawSideWorld(ctx, { scroll: S.scroll, light, mode: o.mode, lit: U.clamp(1 - light), t: S.time, rain });
    const swerve = o.swerve ? o.swerve(t, L) : 0;
    const worried = typeof o.worried === 'function' ? o.worried(p) : (o.worried ?? 1);
    const car = { x: 720 + (o.carDX ? o.carDX(t) : 0), ground: 868, s: 0.62, scroll: S.scroll, rotateAll: swerve, bob: Math.sin(t * 23) * 2.5 * U.clamp(speed / 400), bumpAmt: U.clamp(speed / 300), worried };
    const wheels = drawCarSide(ctx, car);
    // mud thrown back by the rear wheel
    const rw = wheels[0];
    const rate = speed * dt * 0.08 * (o.mud ?? 1) * U.clamp((rain - 0.05) / 0.25);   // dry road: no mud
    for (let i = 0; i < rate + (Math.random() < rate % 1 ? 1 : 0); i++)
      S.mud.add(rw.x - rw.r * 0.6, rw.y + rw.r * 0.5, -speed * 0.35 - Math.random() * 260, -260 - Math.random() * 420, 3 + Math.random() * 6, '#4e3420', 1.2);
    if (L.burst) { for (let i = 0; i < 45; i++) S.mud.add(rw.x - rw.r * .2, rw.y + rw.r * .5, -200 - Math.random() * 700, -300 - Math.random() * 700, 4 + Math.random() * 9, '#4e3420', 1.6); L.burst = 0; }
    S.mud.update(dt); S.mud.draw(ctx);
    if (o.extra) o.extra(ctx, t, dt, S, L, light);
    darken(ctx, U.clamp((1 - light) * 0.75));
    nightShade(ctx, light);
    if (light > 1) sunshine(ctx, light - 1);
    if (light < 0.9) drawCarLights(ctx, { ...car, lights: U.clamp((0.9 - light) * 2) });
    ctx.restore();
    drawRain(ctx, t + S.time, rain);
    if (L.flash != null) drawLightning(ctx, t - L.flash, L.flashSeed);
    // mud flung onto the camera lens: splats, then slides down and away
    (o.lensSplats || []).forEach((ts, i) => once(L, 'lens' + i, t > ts, () => lensSplat(S, 3)));
    if (L.lensBurst) { lensSplat(S, 3); L.lensBurst = 0; }
    S.lens.update(dt, { rain: 0, refill: 0, mudSlide: 75 });
    S.lens.draw(ctx, 0, false);
  };
}
/* A messy splat of mud on the camera lens: an irregular clump thrown from the lower left,
   spatter flecks, drips that run, and a wet highlight. It then slides down and fades (Glass.update). */
/* Warm sunshine over the scene: a soft glow from the sun (top right) and gentle rays. k: 0..1 */
function sunshine(ctx, k) {
  k = U.clamp(k);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = `rgba(255,214,140,${0.55 * k})`; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(1450, 60, 10, 1450, 60, 900);
  g.addColorStop(0, `rgba(255,236,180,${0.45 * k})`); g.addColorStop(0.4, `rgba(255,214,140,${0.14 * k})`); g.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.07 * k; ctx.fillStyle = '#fff1c8';
  for (let i = 0; i < 6; i++) {
    const a = 1.9 + i * 0.13;
    ctx.beginPath(); ctx.moveTo(1450, 60);
    ctx.lineTo(1450 + Math.cos(a) * 2200, 60 + Math.sin(a) * 2200); ctx.lineTo(1450 + Math.cos(a + 0.05) * 2200, 60 + Math.sin(a + 0.05) * 2200);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function lensSplat(S, n) {
  const x = S.lens.mx;
  for (let k = 0; k < n; k++) {
    const cx = 80 + Math.random() * 900, cy = 380 + Math.random() * 420, r = 45 + Math.random() * 95;
    const ang = -0.5 + Math.random() * 0.6;                 // thrown up and to the right
    const base = [74 + Math.random() * 20, 50 + Math.random() * 12, 30 + Math.random() * 8];
    // clump: many overlapping lumps, denser in the middle
    for (let i = 0; i < 26; i++) {
      const d = Math.pow(Math.random(), 1.6) * r, a = Math.random() * Math.PI * 2;
      const lx = cx + Math.cos(a) * d * 1.3, ly = cy + Math.sin(a) * d * 0.8, lr = r * (0.18 + Math.random() * 0.32) * (1 - d / r * 0.5);
      const g = x.createRadialGradient(lx - lr * .3, ly - lr * .3, lr * .1, lx, ly, lr);
      g.addColorStop(0, U.rgb(U.mix(base, [140, 104, 70], 0.35), 0.97));
      g.addColorStop(0.7, U.rgb(base, 0.95));
      g.addColorStop(1, U.rgb(U.mix(base, [30, 20, 12], 0.4), 0.0));
      x.fillStyle = g; x.beginPath(); x.arc(lx, ly, lr, 0, Math.PI * 2); x.fill();
    }
    // spatter streaks in the direction of travel
    x.fillStyle = U.rgb(base, 0.9);
    for (let i = 0; i < 22; i++) {
      const a = ang + (Math.random() - 0.5) * 1.4, d = r * (0.9 + Math.random() * 1.6), sr = 2 + Math.random() * 7;
      x.beginPath(); x.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, sr * 1.8, sr, a, 0, Math.PI * 2); x.fill();
    }
    // drips running down
    for (let i = 0; i < 4; i++) {
      const dx = cx + (Math.random() - 0.5) * r * 1.4, w = 5 + Math.random() * 8, len = r * (0.6 + Math.random() * 1.5);
      x.beginPath(); x.roundRect(dx - w / 2, cy, w, len, w / 2); x.fill();
      x.beginPath(); x.arc(dx, cy + len, w * 0.8, 0, Math.PI * 2); x.fill();
    }
    // wet highlight
    x.fillStyle = 'rgba(255,240,215,.35)';
    x.beginPath(); x.ellipse(cx - r * 0.25, cy - r * 0.3, r * 0.22, r * 0.09, -0.5, 0, Math.PI * 2); x.fill();
  }
  SFX.squelch();
}

/* Inside the car from the back seat: the view (a painted forward picture, or o.outside), then the rain,
   mud and wipers on the glass, then the painted interior on top (its windows are keyed out).
   o.img: forward picture key · o.cabin: interior key, or fn(t) · o.zoom: fn(p) for the slow push in */
function insideShot(o) {
  return (ctx, t, dt, S, L) => {
    const p = t / o.dur;
    const speed = typeof o.speed === 'function' ? o.speed(t) : o.speed;
    S.z += speed * dt;
    const light = typeof o.light === 'function' ? o.light(p) : o.light;
    const rain = typeof o.rain === 'function' ? o.rain(p) : o.rain;
    const sway = o.sway ? o.sway(t, L) : 0;
    ctx.save();
    const jolt = L.jolt ? L.jolt * (Math.random() - .5) : 0;
    ctx.translate(jolt, jolt * 0.6 + Math.sin(t * 20) * 2 * U.clamp(speed / 8));
    // lightning, seen from inside: no bolt in the cabin; the landscape through the windows flashes bright
    const flashK = L.flash != null ? lightningFlick(t - L.flash) : 0;
    if (o.outside) o.outside(ctx, t, dt, S, L, light, sway, flashK);
    else drawForwardImg(ctx, A[o.img], { zoom: o.zoom ? o.zoom(p) : 1.15, fx: o.fx, fy: o.fy, light, sway, lights: U.clamp((0.9 - light) * 2), flash: flashK });
    S.inGlass.wipers = o.wipers ?? true;
    S.inGlass.update(dt, { rain, refill: o.refill ?? rain * 1.6, speed: o.wiperSpeed || 1.15, mudSlide: 55 });
    S.inGlass.draw(ctx, o.hazeMax ?? 0.82);
    const cab = typeof o.cabin === 'function' ? o.cabin(t, L) : (o.cabin || 'inAnxious');
    drawInterior(ctx, A[cab], light, {}, flashK);
    ctx.restore();
    if (L.jolt) L.jolt = Math.max(0, L.jolt - dt * 40);
  };
}

/* Behind the car when we look at it from the front: the vines, the forest track, or the forest in sunshine. */
function frontBackdrop(ctx, S, bg, light) {
  if (bg === 'forest' || bg === 'sunlit') {
    // pre-filtered once (canvas filters every frame are slow on phones)
    const key = '_bg_' + bg;
    if (!A[key]) {
      const c = makeCanvas(A.fwdForest.width, A.fwdForest.height), x = c.getContext('2d');
      x.filter = bg === 'sunlit' ? 'blur(3px) brightness(1.35) saturate(1.2) sepia(0.15)' : 'blur(3px)';
      x.drawImage(A.fwdForest, 0, 0); A[key] = c;
    }
    drawCover(ctx, A[key], 1.25, 0.5, 0.55);
    if (bg === 'forest') mist(ctx, 0.25, 200);
    return;
  }
  drawCover(ctx, A.scSky, 1.1, 0.5, 0.3);
  drawStormClouds(ctx, light, S.time * 25);
  drawCover(ctx, A.scVinesFwd, 1.35, 0.5, 0.45);
  mist(ctx, 0.3, 250);
}

/* Close-up on the faces using the front-on car picture: the windscreen fills the frame.
   o: { img, bg: 'vines'|'forest'|'sunlit', light, rain, zoom(p), shake(t), thunder, lurch(t) } */
function frontCloseShot(o) {
  return (ctx, t, dt, S, L) => {
    const p = t / o.dur, light = typeof o.light === 'function' ? o.light(p) : o.light;
    if (o.thunder) once(L, 'thunder', t > 0.05, () => { flash(L, t); SFX.thunder(1); });
    const sh = o.shake ? o.shake(t) : 0, z = o.zoom(p);
    frontBackdrop(ctx, S, o.bg || 'vines', light);
    darken(ctx, (1 - light) * 0.75);
    nightShade(ctx, light);
    ctx.save();
    ctx.translate(800 + (Math.random() - .5) * sh, 470 + Math.sin(t * 19) * 5 * (o.bob ?? 1) + (Math.random() - .5) * sh);
    if (o.lurch) ctx.rotate(o.lurch(t));
    ctx.scale(z, z);
    ctx.drawImage(A[o.img], -575, -262);      // centred on the faces behind the windscreen
    ctx.restore();
    darken(ctx, (1 - light) * 0.25);
    nightShade(ctx, light + 0.2);                     // the faces stay readable, but it's night on them too
    if (light > 1) sunshine(ctx, light - 1);
    drawRain(ctx, t + S.time, o.rain);
    if (L.flash != null) drawLightning(ctx, t - L.flash, L.flashSeed);
  };
}

function flash(L, t) { L.flash = t; L.flashSeed = Math.random() * 100; }
function thunderAfter(sec, power = 1) { setTimeout(() => SFX.thunder(power), sec * 1000); }

/* ---------- Batch 2: the roadside chat ---------- */
const CHAT_LINE = 'Bienvenue en Champagne ! Profitez bien de votre voyage et joyeux anniversaire !';
// S: leaning out chatting → looks ahead → waves goodbye → settles back (Cit-side, where shot 1 picks up)
function chatPoses(t) {
  const steps = [[0, 'carChat'], [3.0, 'carFwd'], [4.7, 'carWave'], [8.3, 'carBody']], fade = 0.6;
  let i = 0;
  while (i < steps.length - 1 && t >= steps[i + 1][0]) i++;
  const cur = A[steps[i][1]], prev = i > 0 ? A[steps[i - 1][1]] : null, k = i > 0 ? U.clamp((t - steps[i][0]) / fade) : 1;
  return prev && k < 1 ? [[prev, 1], [cur, U.ease(k)]] : [[cur, 1]];
}
/* The local woman, seen from behind, feet at (x, y). h = drawn height of the whole picture. */
function drawWoman(ctx, x, y, h, waving, t) {
  const img = waving ? A.womanWave : A.woman, w = img.width * h / img.height;
  const sway = waving ? Math.sin(t * 7) * 0.025 : Math.sin(t * 1.6) * 0.008;   // a lively wave, or a gentle shift of weight
  ctx.save(); ctx.translate(x, y); ctx.rotate(sway);
  ctx.drawImage(img, -w / 2, -h * 0.94, w, h);                                // boots end at ~94% of the picture
  ctx.restore();
}

const SHOTS = [
  { // 0. Sunshine. Wide, then a 2 s zoom in: the 2CV stopped on the lane, S leaning out of her window,
    // a local woman beside the car. She waves them off in French as they pull slowly away; S sits up and waves.
    name: 'roadside-chat', fy: 0.95, dur: 10,
    enter: (S, L) => { L.w0 = S.scroll; SFX.setRain(0); SFX.setEngine(0.0001, 0.6); SFX.loop('idle', 0.22, 1.5); },
    draw: (ctx, t, dt, S, L) => {
      once(L, 'bird1', t > 1.6, () => SFX.birdPhrase());
      once(L, 'say', t > 2.2, () => Lessons.say(CHAT_LINE, 0.95));
      once(L, 'go', t > 4.0, () => SFX.stopLoop('idle', 3));
      once(L, 'bird2', t > 6.6, () => SFX.birdPhrase());
      const speed = 520 * U.ease(U.seg(t, 4.0, 9.6));
      S.scroll += speed * dt;
      const zoom = 1 + 0.38 * (U.ease(U.seg(t, 0, 2)) - U.ease(U.seg(t, 6.0, 9.4))), fx = 700, fy = 900;
      ctx.save();
      ctx.translate(fx, fy); ctx.scale(zoom, zoom); ctx.translate(-fx, -fy);
      drawSideWorld(ctx, { scroll: S.scroll, light: 1.6, mode: 'vines', t: S.time, rain: 0 });
      const idle = speed < 1 ? Math.sin(t * 38) * 0.9 : 0;            // the engine ticking over
      drawCarSide(ctx, { x: 720, ground: 868, s: 0.62, scroll: S.scroll, bob: idle + Math.sin(t * 23) * 2.5 * U.clamp(speed / 400), bumpAmt: U.clamp(speed / 300), poses: chatPoses(t) });
      const wx = 540 - (S.scroll - L.w0);                               // she stays put as the car drives off
      if (wx > -250) drawWoman(ctx, wx, 894, 366, t > 2.1, t);
      ctx.restore();
      sunshine(ctx, 0.6);
    },
    tick: t => { if (t > 4) SFX.setEngine(U.lerp(0.35, 1, U.seg(t, 4, 9.6)), U.lerp(0.7, 1, U.seg(t, 4, 9.6))); },
  },
  { // 1. Driving through the vineyards at dusk; the rain starts
    name: 'vines-sun-to-rain', fy: 0.95, dur: 8,
    enter: S => { SFX.setEngine(1, 1); SFX.setRain(0.15); },
    // sunny and smiling → the light goes → rain sets in → she gets worried
    draw: sideShot({
      dur: 8, speed: 520, mode: 'vines',
      light: p => U.lerp(1.6, 0.62, U.ease(U.seg(p, 0.22, 0.9))),
      rain: p => U.lerp(0, 0.5, U.seg(p, 0.35, 0.8)),
      worried: p => U.ease(U.seg(p, 0.58, 0.72)),
      lensSplats: [5.6],
    }),
    tick: (t, S) => SFX.setRain(U.lerp(0, 0.5, U.seg(t / 8, 0.35, 0.8))),
  },
  { // 2. Front-on: the 2CV coming towards us through the rain, both a little worried
    name: 'front-worried', fy: 0.9, dur: 3.8,
    enter: S => { SFX.setRain(0.55); SFX.setEngine(0.8, 0.95); },
    draw: (ctx, t, dt, S, L) => {
      const p = t / 3.8, light = U.lerp(0.56, 0.48, p);
      // the muddy lane between the vines, running away behind them (the painted forward view, seen from the front of the car)
      drawCover(ctx, A.fwdVines, 1.0, 0.5, 0.5);
      mist(ctx, 0.15, 300);
      darken(ctx, (1 - light) * 0.5);
      // the car comes along the lane towards us: on the ground, in the ruts, sized to the lane
      const k = U.ease(p), gx = U.lerp(948, 905, k) + Math.sin(t * 1.7) * 6, gy = U.lerp(600, 740, k), s = U.lerp(0.27, 0.42, k);
      const bob = (Math.sin(t * 19) * 3 + Math.sin(t * 7.3) * 2) * s, sway = Math.sin(t * 2.6) * 0.018;
      groundShadow(ctx, gx, gy + 2, 360 * s, 0.5);
      ctx.save();
      ctx.translate(gx, gy + bob); ctx.rotate(sway); ctx.scale(s, s);
      ctx.drawImage(A.carFront, -576, -820);
      // headlights
      ctx.globalCompositeOperation = 'lighter';
      for (const lx of [-248, 248]) {
        const g = ctx.createRadialGradient(lx, -298, 6, lx, -298, 170);
        g.addColorStop(0, 'rgba(255,240,200,.85)'); g.addColorStop(0.25, 'rgba(255,232,170,.35)'); g.addColorStop(1, 'rgba(255,232,170,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, -298, 170, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      darken(ctx, (1 - light) * 0.25);
      // a little mud kicked up by the front tyres
      if (Math.random() < 0.4) for (const sx of [-260, 260]) S.mud.add(gx + sx * s, gy - 10, sx * 0.8 * s * 2 + (Math.random() - .5) * 160, -120 - Math.random() * 180, 2 + Math.random() * 3, '#4e3420', 0.8);
      S.mud.update(dt); S.mud.draw(ctx);
      drawRain(ctx, t + S.time, 0.65);
    },
  },
  { // 3. Storm: lightning, thunder, a swerve
    name: 'side-storm', fy: 0.95, dur: 6,
    enter: S => { SFX.setRain(0.75); SFX.setEngine(1, 1.05); },
    draw: sideShot({
      dur: 6, speed: 560, mode: 'vines', light: p => U.lerp(0.48, 0.38, p), rain: 0.8,
      swerve: (t, L) => {
        once(L, 'flash', t > 1.2, () => { flash(L, t); thunderAfter(0.35); });
        once(L, 'swerve', t > 3.4, () => { L.burst = 1; SFX.skid(1.1); });
        return t > 3.4 ? Math.sin((t - 3.4) * 9) * 0.06 * Math.exp(-(t - 3.4) * 1.6) : 0;
      },
    }),
  },
  { // 4. Close on the two of them through the windscreen as the thunder cracks: both shocked
    name: 'front-close-thunder', dur: 2.6,
    draw: frontCloseShot({ dur: 2.6, img: 'frontShock', light: p => U.lerp(0.38, 0.34, p), rain: 0.8, thunder: true, shake: t => t < 0.7 ? 14 * (1 - t / 0.7) : 0, zoom: p => U.lerp(2.35, 2.65, U.ease(p)) }),
  },
  { // 5. Inside, looking out: low visibility, wipers clear the odd swath, mud hits the screen
    name: 'inside-vines', dur: 6.5,
    enter: S => { S.inGlass.fillHaze(0.9); },
    draw: insideShot({
      dur: 6.5, speed: 9, img: 'fwdVines', fy: 0.4, zoom: p => 1.12 + p * 0.1, cabin: 'inAnxious', light: p => U.lerp(0.34, 0.27, p), rain: 0.9, hazeMax: 0.85,
      sway: (t, L) => {
        once(L, 'swerve', t > 2.3, () => { S_.inGlass.splat(7, [180, 90, 1240, 280]); SFX.skid(1); SFX.squelch(); L.jolt = 18; });
        once(L, 'flash', t > 4.6, () => { flash(L, t); thunderAfter(0.5, 0.8); });
        return t > 2.3 ? Math.sin((t - 2.3) * 7) * 0.09 * Math.exp(-(t - 2.3) * 1.2) : 0;
      },
    }),
  },
  { // 6. Sliding in the mud, a bit too fast; J and the stick shift
    name: 'side-slide', fy: 0.95, dur: 4.2,
    enter: S => { SFX.setEngine(1, 1.15); },
    draw: sideShot({
      dur: 4.2, speed: 600, mode: 'vines', light: p => U.lerp(0.27, 0.2, p), rain: 0.85, mud: 1.6,
      carDX: t => Math.sin(t * 2.2) * 40,
      swerve: (t, L) => {
        once(L, 's1', t > 0.6, () => { L.burst = 1; SFX.skid(0.8); });
        once(L, 's2', t > 2.4, () => { L.burst = 1; L.lensBurst = 1; SFX.skid(0.9); SFX.setEngine(1, 1.35); setTimeout(() => SFX.setEngine(1, 1.0), 400); });
        return Math.sin(t * 5.5) * 0.05;
      },
    }),
  },
  { // 7. The fork: right, and upwards into the trees
    name: 'fork', fy: 0.6, dur: 5,
    enter: S => { SFX.setEngine(0.8, 0.9); },
    draw: (ctx, t, dt, S, L) => {
      // unhurried: easing off as it climbs, and only about three-quarters of the way up the track by the cut
      const u = U.clamp(t / 5);
      drawFork(ctx, t, U.lerp(0.2, 0.14, u), 0.74 * (1 - Math.pow(1 - u, 1.8)), S, L, dt);
      drawRain(ctx, t + S.time, 0.85);
    },
  },
  { // 8. Uphill through the forest; it's nearly dark; they slow right down
    name: 'side-forest', fy: 0.95, dur: 5,
    enter: S => { SFX.setRain(0.9); },
    draw: sideShot({ dur: 5, speed: t => U.lerp(420, 150, U.clamp(t / 5)), mode: 'forest', light: p => U.lerp(0.13, 0.05, p), rain: 0.95, tiltWorld: -0.06 }),
    tick: (t) => SFX.setEngine(1, U.lerp(1.1, 0.7, t / 5)),
  },
  { // 9. Inside, creeping along… then J slams on the brakes
    name: 'inside-forest', dur: 4.6,
    enter: S => { S.inGlass.fillHaze(0.95); },
    draw: insideShot({
      dur: 4.6, speed: t => t < 3.3 ? 4 : Math.max(0, 4 - (t - 3.3) * 6), img: 'fwdForest', fy: 0.45, zoom: p => 1.12 + Math.min(p, 0.72) * 0.1,
      cabin: t => t < 3.3 ? 'inAnxious' : 'inShocked', light: p => U.lerp(0.05, 0.03, p), rain: 1, hazeMax: 0.92, wiperSpeed: 1.25,
      sway: (t, L) => {
        once(L, 'brake', t > 3.3, () => { SFX.skid(1.4); L.jolt = 26; SFX.setEngine(0.4, 0.6); });
        return t > 3.3 ? Math.sin((t - 3.3) * 10) * 0.07 : 0;
      },
    }),
  },
  { // 10. Two shocked faces: the car lurches to a stop, nose down
    name: 'faces-brake', dur: 1.6,
    draw: frontCloseShot({ dur: 1.6, img: 'frontShock', bg: 'forest', light: 0.1, rain: 0.9, shake: t => 16 * Math.exp(-t * 2), zoom: p => 1.55 + p * 0.12, bob: 0,
      lurch: t => Math.sin(t * 9) * 0.02 * Math.exp(-t * 2.5) }),
  },
  { // 11. Inside: the darkest moment. Rain, blackness, and just the dim backs of two café chairs in the headlights
    name: 'inside-chairs', dur: 2.2,
    draw: insideShot({
      dur: 2.2, speed: t => Math.max(0, 3 - t * 3), cabin: 'inShocked', light: 0.03, rain: 0.9, hazeMax: 0.6, refill: 0.5, wiperSpeed: 1.5,
      outside: (ctx, t, dt, S, L, light, sway) => {
        // the car rolls the last few metres: the chairs come from 6 m to their resting 3.6 m away (the set layout)
        const k = U.easeOut(U.clamp(t / 1.1)), dist = U.lerp(5.5, SET_STOP, k);
        drawForwardImg(ctx, A.fwdClearing, { zoom: 1.2, fy: 0.5, light, dark: 0.95, sway: sway * 0.5, lights: 0.8, propsBright: 0.32,
          glowY: setAheadFeetY(dist), props: c => drawSetAhead(c, dist, { table: false }) });
      },
      sway: (t, L) => { once(L, 'stop', t > 1.1, () => { L.jolt = 20; SFX.squelch(); }); return 0; },
    }),
  },
  { // 12. Side, in near darkness: the car slides to a stop just short of a café chair, which stands
    // in the headlight beam with its back to the car. The car and the forest are barely visible.
    name: 'side-tap', fy: 0.95, dur: 3.4,
    enter: S => { L_stopAt = S.scroll + 168; SFX.setEngine(0.3, 0.55); SFX.setRain(0.6); },   // 168 = how far it rolls before stopping
    draw: (ctx, t, dt, S, L) => {
      const speed = Math.max(0, 320 * (1 - t / 1.05));
      S.scroll += speed * dt;
      const light = 0.04;
      ctx.save();
      ctx.translate(800, 450); ctx.rotate(-0.03); ctx.scale(1.07, 1.07); ctx.translate(-800, -450);
      drawSideWorld(ctx, { scroll: S.scroll, light, mode: 'forest' });
      const car = { x: 720, ground: 868, s: 0.62, scroll: S.scroll, rotateAll: t < 1.05 ? Math.sin(t * 8) * 0.02 : 0, bumpAmt: U.clamp(speed / 300), worried: 1 };
      drawCarSide(ctx, car);
      S.mud.update(dt); S.mud.draw(ctx);
      darken(ctx, 0.92);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(-100, -100, W + 200, H + 200);   // the car and the trees barely there
      // the set (same layout as every other shot), the near chair caught in the beam, facing out towards the valley;
      // the far chair is lost in the dark and the table is beyond the light
      ctx.save(); ctx.filter = 'brightness(0.55) sepia(0.25)';
      drawSetSide(ctx, 720 + (L_stopAt - S.scroll), 868, 0.62, { table: false, farAlpha: 0.12 });
      ctx.restore();
      drawCarLights(ctx, { ...car, lights: 0.85 });
      ctx.restore();
      drawRain(ctx, t + S.time, 0.6);
    },
  },
  { // 13. Inside: the wipers clear and there's the table, a bottle of Veuve and two flutes
    name: 'inside-table', dur: 4.2,
    enter: S => { SFX.setEngine(0, 0.5); SFX.setRain(0.4); },
    draw: insideShot({
      // still night outside (the valley and the side windows stay black), but the whole set now stands in the headlights
      dur: 4.2, speed: 0, cabin: 'inSunny', light: p => U.lerp(0.04, 0.1, p), rain: p => U.lerp(0.5, 0.25, p), hazeMax: 0.7, refill: 0.5,
      outside: (ctx, t, dt, S, L, light) => {
        drawForwardImg(ctx, A.fwdClearing, { zoom: 1.2, fy: 0.5, light, dark: 0.95, lights: 1, propsBright: U.lerp(0.6, 0.85, U.clamp(t / 2.5)),
          glowY: setAheadFeetY(SET_STOP), props: c => drawSetAhead(c, SET_STOP) });
      },
    }),
  },
  { // 14. Smiles
    name: 'faces-smile', dur: 3,
    draw: frontCloseShot({ dur: 3, img: 'frontSmile', bg: 'forest', light: 0.32, rain: 0.25, zoom: p => U.lerp(2.0, 2.1, p), bob: 0.4 }),
  },
  { // 15. Side: forest to the left, a vast open space to the right; it brightens; birdsong
    name: 'side-open', fy: 0.95, dur: 4.8,
    enter: S => { SFX.setRain(0.05); setTimeout(() => SFX.birds(true), 1500); },
    draw: (ctx, t, dt, S, L) => {
      const p = t / 4.8, light = U.lerp(0.12, 1.15, U.ease(p));        // from near dark to a clearing sky, not yet full sun
      drawCover(ctx, A.clearing, 1.04 - p * 0.03, 0.4, 0.8);
      drawCarSide(ctx, { x: 560, ground: 838, s: 0.62, scroll: S.scroll, bumpAmt: 0 });
      drawSetSide(ctx, 560, 838, 0.62, { view: 'profile' });              // the chairs in true side view, facing the valley
      darken(ctx, U.clamp((1 - light) * 0.75));
      drawRain(ctx, t + S.time, U.clamp(0.4 - p * 0.8));
      // shafts of sunlight from the right
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = U.clamp((p - 0.5) * 1.5) * 0.25;
      const sg = ctx.createRadialGradient(W + 100, 300, 50, W + 100, 300, 1100);
      sg.addColorStop(0, 'rgba(255,230,160,1)'); sg.addColorStop(1, 'rgba(255,230,160,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); ctx.restore();
    },
  },
  { // 16. Amazed, in awe, warm sunshine on their faces
    name: 'faces-awe', dur: 3,
    draw: frontCloseShot({ dur: 3, img: 'frontAwe', bg: 'sunlit', light: 1.55, rain: 0, zoom: p => U.lerp(2.0, 2.12, p), bob: 0.3 }),
  },
  { // 17. Inside: the champagne landscape, a muddy grass track, a church… and a rainbow
    name: 'inside-landscape', dur: 5,
    enter: S => { SFX.setRain(0); SFX.sparkle(); },
    draw: insideShot({
      dur: 5, speed: 0, cabin: 'inSunny', light: 1.6, rain: 0, hazeMax: 0.4, refill: 0, wipers: false,
      outside: (ctx, t, dt, S, L) => {
        S.inGlass.hx.globalCompositeOperation = 'destination-out';
        S.inGlass.hx.globalAlpha = dt * 0.8; S.inGlass.hx.fillRect(0, 0, W, H);
        S.inGlass.hx.globalAlpha = 1; S.inGlass.hx.globalCompositeOperation = 'source-over';
        drawPano(ctx, 1 + t * 0.006);
        // (no table and chairs here: they're just below the bonnet, out of sight)
        drawRainbow(ctx, U.ease(U.clamp((t - 0.8) / 3)), 1150, 560, 330);
      },
    }),
  },
  { // 18. Dolly forward through the windscreen; the title in the sky; the "!" bottle pops
    name: 'dolly-title', fy: t => U.lerp(0.5, 0.2, U.ease(U.clamp(t / 2.6))), dur: 9,
    enter: (S, L) => { L.title = layoutTitle(S.ctx); },
    draw: (ctx, t, dt, S, L) => {
      const T = L.title;
      // the camera pulls back from the windscreen framing to the whole panorama
      const zk = U.ease(U.clamp(t / 2.6));
      drawPano(ctx, 1.03 + U.easeOut(U.clamp(t / 9)) * 0.08, zk);
      drawRainbow(ctx, 1, U.lerp(1150, 1200, zk), U.lerp(560, 800, zk), U.lerp(330, 600, zk));
      // the cabin grows and falls away as we pass through the windscreen
      const c = U.ease(U.clamp(t / 1.8));
      if (c < 1) drawInterior(ctx, A.inSunny, 1.6, { alpha: 1 - c, scale: 1 + c * 2.4 });
      // title
      const tt = t - 2.3;
      if (tt > 0) {
        once(L, 'chime', true, () => SFX.sparkle());
        drawTitle(ctx, T, tt, -300 + ((tt - 2.2) % 5) * 700);
        // the "!" is a bottle of Veuve
        const b = T.bottle, appear = U.clamp((tt - T.count * 0.065) / 0.6);
        if (appear > 0) {
          const pt = tt - T.count * 0.065 - 2.2;       // pops ~2.2s after it lands
          const wob = pt > -0.8 && pt < 0 ? Math.sin(pt * 40) * 0.05 : 0;
          ctx.save(); ctx.globalAlpha = appear;
          drawBottle(ctx, b.x, b.y - (1 - U.easeOut(appear)) * 80, b.h, wob);
          ctx.restore();
          once(L, 'pop', pt > 0, () => { SFX.pop(); SFX.fizz(2.5, 0.12); L.popT = t; L.spray = []; for (let i = 0; i < 70; i++) L.spray.push({ a: -Math.PI / 2 + (Math.random() - .5) * 0.9, v: 300 + Math.random() * 700, r: 2 + Math.random() * 5 }); });
          if (L.popT != null) {
            const a = t - L.popT, top = b.y - b.h - 6;
            drawCork(ctx, b.x + a * 260, top - a * 700 + a * a * 900, 0.9, a * 9);
            ctx.save(); ctx.fillStyle = '#FFF3C8';
            for (const s of L.spray) {
              const x = b.x + Math.cos(s.a) * s.v * a, y = top + Math.sin(s.a) * s.v * a + 500 * a * a;
              ctx.globalAlpha = U.clamp(1 - a / 1.6); ctx.beginPath(); ctx.arc(x, y, s.r, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
          }
        }
      }
      drawRisingBubbles(ctx, t, 30, U.clamp((t - 2) / 2));
    },
  },
  { // 19. The couple, cheers! Then the menu appears.
    name: 'toast', fy: 0.95, dur: 5.5, hold: true,
    enter: S => { setTimeout(() => SFX.clink(), 1900); },
    draw: (ctx, t, dt, S, L) => {
      drawCover(ctx, A.panoF || A.pano, 1.18, 0.6, 0.75);
      drawRainbow(ctx, 1 - U.seg(t, 5.0, 7.5), 1200, 800, 600);          // fades away as the menu comes up
      drawRisingBubbles(ctx, t + 9, 34, 0.9);
      // S & J, arm in arm; a slight nod and settle
      // sized to the rows on screen (a sideways phone trims the height): feet near the bottom, heads clear of the top
      const room = VIEW.bottom - VIEW.top, Y = Math.min(860, VIEW.bottom - 40);
      const img = A.cheers, h = Math.min(760, room - 50), w = img.width * h / img.height;
      // the bistro set, a few steps behind them on the grass beside the track (same layout as everywhere else:
      // we're on the car's side looking out over the valley, so two chair backs side by side, the table just beyond).
      // Sized to the couple: they're ~1.7 m tall at h * 0.8 px; the set stands further back, so smaller still.
      // (the only open grass in this view is the strip beside the track, level with the couple, so the set
      // stands there, a step behind them, feet on that grass; drawn a little under true scale so it stays modest)
      // nearer the camera than the couple: bigger, its feet below the bottom edge and partly cut off at the right,
      // like something in the foreground
      // (user: same place across the frame, 15% smaller, dropped by a quarter of its height)
      const m = h * 0.595, cx = 1330, gy = VIEW.bottom + h * 0.16;
      drawSetTable(ctx, cx, gy - 0.12 * m, m * 0.9);                         // 0.75 m further: a touch higher, smaller
      drawSetChair(ctx, cx - SET.chairZ * m * 1.15, gy, m, 1, 'back');
      drawSetChair(ctx, cx + SET.chairZ * m * 1.15, gy, m, 1, 'back');
      const intro = U.easeOut(U.clamp(t / 0.9));
      const nod = Math.sin(t * 2.4) * 0.012 * U.clamp(t - 0.8) * Math.exp(-Math.max(0, t - 3) * 0.4);
      ctx.save();
      ctx.translate(560, Y + (1 - intro) * 40); ctx.rotate(nod); ctx.scale(0.96 + intro * 0.04, 0.96 + intro * 0.04);
      ctx.globalAlpha = U.clamp(t / 0.5);
      ctx.drawImage(img, -w / 2, -h + 30, w, h);
      ctx.restore();
      // clink sparkle where the flutes meet
      const ct = t - 1.9;
      if (ct > 0 && ct < 1.2) {
        const gx = 560 + (430 - 432) * h / img.height, gy = Y - h + 30 + 400 * h / img.height;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 10; i++) {
          const a = i / 10 * Math.PI * 2, d = 18 + ct * 90;
          ctx.globalAlpha = 1 - ct / 1.2; ctx.fillStyle = '#FFF3C8';
          ctx.beginPath(); ctx.arc(gx + Math.cos(a) * d, gy + Math.sin(a) * d, 4, 0, Math.PI * 2); ctx.fill();
        }
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 70);
        g.addColorStop(0, `rgba(255,243,200,${0.9 * (1 - ct / 1.2)})`); g.addColorStop(1, 'rgba(255,243,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, 70, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    },
  },
];
let L_stopAt = 0;
let S_ = null;   // shared state (for callbacks that need it)

const Intro = {
  running: false,
  start(ctx, { from = 0, onMenu } = {}) {
    const S = S_ = {
      ctx, scroll: 0, z: 0, time: 0,
      mud: new Particles(),
      inGlass: makeInsideGlass('rgba(78,86,100,1)'),
      lens: new Glass({ path: c => { c.beginPath(); c.rect(0, 0, W, H); }, pivots: [], len: 0 }),
      off: makeCanvas(W, H),
    };
    S.offX = S.off.getContext('2d');
    S.inGlass.fillHaze(0.85);
    this.S = S; this.idx = -1; this.onMenu = onMenu; this.menuShown = false; this.running = true;
    this.go(from);
  },
  go(i) {
    this.idx = i; this.t = 0;
    this.L = { fired: {} };
    const sh = SHOTS[i];
    sh.enter && sh.enter(this.S, this.L);
  },
  frame(ctx, dt) {
    if (!this.running) return;
    const sh = SHOTS[this.idx];
    this.t += dt; this.S.time += dt;
    sh.tick && sh.tick(this.t, this.S);
    ctx.save(); sh.draw(ctx, this.t, dt, this.S, this.L); ctx.restore();
    if (this.t >= sh.dur) {
      if (this.idx < SHOTS.length - 1) this.go(this.idx + 1);
      else if (!this.menuShown) {
        this.menuShown = true;
        SFX.birds(false);
        setTimeout(() => SFX.birds(true, 2), 200);   // menu: birds half as often
        this.onMenu && this.onMenu();
      }
    }
  },
  stop() { this.running = false; SFX.stopAll(); },
  get total() { return SHOTS.reduce((a, s) => a + s.dur, 0); },
};

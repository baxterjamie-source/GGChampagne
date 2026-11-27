/* Opening sequence (DESIGN.md, Batch 1): S & J in the 2CV, the storm, the bistro table, the reveal. */
'use strict';

function once(L, key, cond, fn) { if (cond && !L.fired[key]) { L.fired[key] = 1; fn(); } }

/* ---------- The fork in the road (painted), the car from behind heading up the right branch ---------- */
/* The centre line between the two ruts of the right-hand track in the fork painting (frame units at
   zoom 1), and the car's size there (it shrinks with distance). Traced from fwd_fork by drawing where
   the two rear wheels run (centre ± 290 x size) and fitting those lines into the ruts. */
const FORK_PATH = [[1110, 990, 0.36], [1100, 800, 0.28], [1130, 700, 0.24], [1150, 620, 0.19], [1180, 570, 0.165],
  [1215, 525, 0.143], [1235, 500, 0.13], [1250, 450, 0.108], [1262, 400, 0.088], [1280, 335, 0.058]];
function forkPoint(p) {                          // p 0..1 along the track by distance
  const P = FORK_PATH, len = [0];
  for (let i = 1; i < P.length; i++) len.push(len[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const d = U.clamp(p) * len[len.length - 1];
  let i = 1; while (i < P.length - 1 && len[i] < d) i++;
  const k = (d - len[i - 1]) / (len[i] - len[i - 1]), a = P[i - 1], b = P[i];
  return { x: U.lerp(a[0], b[0], k), y: U.lerp(a[1], b[1], k), s: U.lerp(a[2], b[2], k), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}
/* The car going up the track, seen from behind. It wobbles up the straight in the ruts (the square-on
   picture, slid and turned a little in code). Just before the bend, shot 7 cuts to their worried faces;
   while we're on the faces the picture changes to the right-turned one, so when we cut back the car is
   already in the bend, with no fade.
   Per picture, in its own pixels (1152x864): f (front-axle midpoint on the ground: the wobble pivots
   there, so the front stays in the ruts and only the tail moves), k (size: the angled picture comes
   out a little smaller), tail lights, rear tyres (where the mud comes off). */
const FORK_VIEWS = {
  straight: { img: 'carBack', f: [572, 765], k: 1, lights: [[364, 670], [785, 670]], wheels: [[285, 790], [860, 790]] },
  right: { img: 'carBackRight', f: [760, 668], k: 1.2, lights: [[184, 641], [501, 655]], wheels: [[230, 770], [690, 805]] },
};
/* We're on the faces while the car's track point goes from y 655 to 585 (about 0.75 s, just before
   the bend), and the picture changes to the turned one at y 615, while nobody can see it. */
const FORK_CUT = [655, 585];
/* The wobble at time t: how far the nose is turned, -1 (fully left) to 1 (fully right). */
function forkYaw(t) { return Math.sin(t * 2.4) * 0.2 * U.seg(t, 0, 0.6); }
/* One picture of the car, pinned at its front axle (fx, fy). */
function drawForkCar(ctx, V, fx, fy, s0, shift, rot, sx) {
  const s = s0 * V.k;
  ctx.save();
  ctx.translate(fx + shift, fy); ctx.rotate(rot); ctx.scale(s * sx, s);
  ctx.drawImage(A[V.img], -V.f[0], -V.f[1]);
  drawCarMud(ctx, A[V.img], V.img, S_ ? S_.dirt : 0, -V.f[0], -V.f[1]);
  ctx.globalCompositeOperation = 'lighter';
  for (const [lx0, ly0] of V.lights) {                                 // a soft glow round the rear lights
    const lx = lx0 - V.f[0], ly = ly0 - V.f[1];
    const g = ctx.createRadialGradient(lx, ly, 4, lx, ly, 80);
    g.addColorStop(0, 'rgba(255,60,40,.6)'); g.addColorStop(1, 'rgba(255,60,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, 80, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function drawFork(ctx, t, light, carP, S, L, dt = 1 / 60) {
  // a very slow push in; the car is drawn inside the same transform so it stays in the ruts
  const z = 1 + t * 0.006;
  ctx.save(); ctx.translate(800, 450); ctx.scale(z, z); ctx.translate(-800, -450);
  drawCover(ctx, A.fwdFork, 1.0, 0.5, 0.5);
  const q = forkPoint(carP), yaw = forkYaw(t);
  // (user 27 Nov) the car starts further left, in the middle of the track, and 20% bigger; both ease
  // away as it climbs, gone by the cut to their faces, so from the bend on it's exactly as before
  // (w: 1 at the start, 0 at the cut)
  const w = U.ease(U.clamp((q.y - FORK_CUT[0]) / (FORK_PATH[0][1] - FORK_CUT[0])));
  q.x -= 95 * w; q.s *= 1 + 0.2 * w;
  const turned = q.y < FORK_CUT[1] + 30;            // past the switch (made while we're on the faces)
  // the front axle on the track (it sits 40 px above the track point in the square-on picture,
  // which is where that picture was tuned to sit in the ruts), with a little bounce
  const fx = q.x - 4 * q.s, fy = q.y - 40 * q.s + Math.sin(t * 18) * 1.5 * q.s, wob = Math.sin(t * 7) * 0.008;
  let V, shift, rot, sx;
  if (!turned) {
    // the square-on picture faking the wobble: tail slid the other way, a slight turn and squash
    V = FORK_VIEWS.straight; shift = -yaw * 130 * q.s; rot = yaw * 0.035 + wob; sx = 1 - 0.05 * Math.abs(yaw);
  } else {
    // turning, not sliding, so the turned picture sits centred on the track (midway between its axles)
    V = FORK_VIEWS.right; rot = 0.01 + wob; sx = 1;
    shift = (V.f[0] - (V.f[0] + (V.wheels[0][0] + V.wheels[1][0]) / 2) / 2) * V.k * q.s;
  }
  groundShadow(ctx, fx + shift, q.y + 5 * q.s, 380 * q.s, 0.55);
  // a spray of mud off the rear wheels, outwards from each tyre
  if (S) {
    const s = q.s * V.k, midX = (V.wheels[0][0] + V.wheels[1][0]) / 2;
    if (Math.random() < 0.35) for (const [px, py] of V.wheels) {
      const wx = fx + shift + (px - V.f[0]) * s, wy = fy + (py - V.f[1]) * s, out = px < midX ? -1 : 1;
      S.mud.add(wx, wy - 15 * s, out * (60 + Math.random() * 260) * s * 3, (-200 - Math.random() * 380) * s * 3, (2 + Math.random() * 5) * s * 3, '#4a3220', 0.7);
    }
    S.mud.update(dt); S.mud.draw(ctx);
  }
  drawForkCar(ctx, V, fx, fy, q.s, shift, rot, sx);
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
    const car = { x: 720 + (o.carDX ? o.carDX(t) : 0), ground: 868, s: 0.62, scroll: S.scroll, rotateAll: swerve, bob: Math.sin(t * 23) * 2.5 * U.clamp(speed / 400), bumpAmt: U.clamp(speed / 300), worried, dirt: S.dirt, body: o.body && A[o.body] };
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
    // (no mud on the camera any more, Batch 3: it hid the view. The mud goes on the car instead.)
  };
}
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
    // o.cabinB(t, sway) → [key, 0..1]: a second interior crossfaded over the first (J turning the wheel)
    const cb = o.cabinB && o.cabinB(t, sway);
    if (cb && cb[1] > 0.01) drawInterior(ctx, A[cb[0]], light, { alpha: cb[1] }, flashK);
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

/* The full night shading of a close-up (the same four passes the backdrop always had). */
function faceShade(c, light) {
  darken(c, (1 - light) * 0.75); nightShade(c, light);
  darken(c, (1 - light) * 0.25); nightShade(c, light + 0.2);
}
/* Roughly how bright faceShade leaves things (0..1), and the light level that comes out k times brighter. */
function shadeFactor(l) {
  const dk = a => 1 - 0.82 * U.clamp(a), ns = v => 1 - Math.pow(U.clamp((0.45 - v) / 0.42), 1.15) * 0.8;
  return dk((1 - l) * 0.75) * ns(l) * dk((1 - l) * 0.25) * ns(l + 0.2);
}
function liftLight(l, k) {
  if (k <= 1) return l;
  const goal = Math.min(1, shadeFactor(l) * k);
  let lo = l, hi = 1;
  for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (shadeFactor(m) < goal) lo = m; else hi = m; }
  return lo;
}
let _closeC = null;
const closeScratch = () => _closeC || (_closeC = makeCanvas(W, H));

/* Close-up on the faces using the front-on car picture: the windscreen fills the frame.
   o: { img, bg: 'vines'|'forest'|'sunlit', light, rain, zoom(p), shake(t), thunder, lurch(t) } */
function frontCloseShot(o) {
  return (ctx, t, dt, S, L) => {
    const p = t / o.dur, light = typeof o.light === 'function' ? o.light(p) : o.light;
    if (o.thunder) once(L, 'thunder', t > 0.05, () => { flash(L, t); SFX.thunder(1); });
    const sh = o.shake ? o.shake(t) : 0, z = o.zoom(p);
    frontBackdrop(ctx, S, o.bg || 'vines', light);
    const jx = (Math.random() - .5) * sh, jy = (Math.random() - .5) * sh;   // one shake per frame (placeCar may run twice)
    const placeCar = (c, mud = true) => {
      c.translate(800 + jx, 470 + Math.sin(t * 19) * 5 * (o.bob ?? 1) + jy);
      if (o.lurch) c.rotate(o.lurch(t));
      c.scale(z, z);
      c.drawImage(A[o.img], -575, -262);      // centred on the faces behind the windscreen
      if (mud) drawCarMud(c, A[o.img], 'front', S.dirt, -575, -262);
    };
    if (o.match) {
      // o.match (Batch 3): the car and the faces are darkened like the scene behind them, so they sit in
      // the same dark, but lifted by o.faceLift (×1.2 = 20% brighter, user 27 Nov) so the faces read.
      // The car is darkened on its own scratch canvas at a slightly higher light level.
      faceShade(ctx, light);
      const c = closeScratch(), x = c.getContext('2d');
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
      x.clearRect(0, 0, W, H);
      x.save(); placeCar(x); x.restore();
      faceShade(x, liftLight(light, o.faceLift ?? 1));
      x.globalCompositeOperation = 'destination-in';            // keep only the car (the shading filled the whole canvas)
      x.save(); placeCar(x, false); x.restore();      // the car's outline only (the mud lies inside it anyway)
      x.globalCompositeOperation = 'source-over';
      ctx.drawImage(c, 0, 0);
    } else {
      darken(ctx, (1 - light) * 0.75); nightShade(ctx, light);
      ctx.save(); placeCar(ctx); ctx.restore();
      darken(ctx, (1 - light) * 0.25);
      nightShade(ctx, light + 0.2);                   // the faces stay readable, but it's night on them too
    }
    if (light > 1) sunshine(ctx, light - 1);
    drawRain(ctx, t + S.time, o.rain);
    if (L.flash != null) drawLightning(ctx, t - L.flash, L.flashSeed);
  };
}

function flash(L, t) { L.flash = t; L.flashSeed = Math.random() * 100; }
function thunderAfter(sec, power = 1) { setTimeout(() => SFX.thunder(power), sec * 1000); }

/* ---------- Batch 2: the roadside chat ---------- */
const CHAT_LINE = 'Bienvenue en Champagne ! Profitez bien de votre voyage et joyeux anniversaire !';
// S: leaning out chatting → looks ahead → waves goodbye → ~1.5 s later both sit looking ahead
// (cit_side_forward, Batch 3; shot 1 picks up from the same picture)
function chatPoses(t) {
  const steps = [[0, 'carChat'], [3.0, 'carFwd'], [4.7, 'carWave'], [6.2, 'carLook']], fade = 0.6;
  let i = 0;
  while (i < steps.length - 1 && t >= steps[i + 1][0]) i++;
  const cur = A[steps[i][1]], prev = i > 0 ? A[steps[i - 1][1]] : null, k = i > 0 ? U.clamp((t - steps[i][0]) / fade) : 1;
  return prev && k < 1 ? [[prev, 1], [cur, U.ease(k)]] : [[cur, 1]];
}
/* A speech bubble whose tail points at (x, y), the speaker's head; the bubble sits above and to the
   left. lines: the text, already broken into lines. k: 0..1 appearance (pops in, fades out). */
function drawSpeechBubble(ctx, x, y, lines, k, minX = 14, cx = null) {
  if (k <= 0) return;
  const size = 28, lh = size * 1.3, pad = 20;
  ctx.save();
  ctx.font = `italic 600 ${size}px "Playfair Display", Georgia, serif`;
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + pad * 2, h = lines.length * lh + pad * 1.4;
  // bubble's top-left: low enough to survive the top being trimmed on wide phones, and kept on
  // screen at the left as she drifts off (the tail still reaches her). cx (Batch 3): start centred
  // there (over S and J); once she drifts left past its left end, the bubble goes with her.
  const bx = cx != null ? Math.max(Math.min(cx - w / 2, x - 44), minX) : Math.min(Math.max(x - w * 0.7, minX), x - 44), by = y - 30 - h;
  const pop = 0.6 + 0.4 * U.easeOut(U.clamp(k * 1.6));             // a little pop as it appears
  ctx.globalAlpha = U.clamp(k * 3);
  ctx.translate(x, y); ctx.scale(pop, pop); ctx.translate(-x, -y);
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, 26);
  ctx.moveTo(x - 34, by + h - 1); ctx.lineTo(x - 4, y - 6); ctx.lineTo(x - 8, by + h - 1);   // the tail, down to her head
  ctx.fillStyle = PAL.cream; ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.lineWidth = 3; ctx.strokeStyle = '#3a2a1c'; ctx.stroke();
  ctx.fillStyle = '#2a1d12'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, bx + pad, by + pad * 0.7 + lh * (i + 0.5)));
  ctx.restore();
}
const CHAT_BUBBLE = ['Bienvenue en Champagne !', 'Profitez bien de votre voyage', 'et joyeux anniversaire !'];
const CHAT_BUBBLE_CX = 735;   // over S's and J's heads in the side view (car at x 720)

/* The local woman, seen from behind, feet at (x, y). h = drawn height of the whole picture. */
function drawWoman(ctx, x, y, h, waving, t) {
  const img = waving ? A.womanWave : A.woman, w = img.width * h / img.height;
  const sway = waving ? Math.sin(t * 7) * 0.025 : Math.sin(t * 1.6) * 0.008;   // a lively wave, or a gentle shift of weight
  ctx.save(); ctx.translate(x, y); ctx.rotate(sway);
  ctx.drawImage(img, -w / 2, -h * 0.94, w, h);                                // boots end at ~94% of the picture
  ctx.restore();
}

/* Shots 10 and 12 (Batch 3): the same camera, beside the car stopped at the edge of the forest. */
function forestStopFrame(ctx) {
  // (no tilt: tilted, a sliver of sky showed under the trees at the bottom left once it brightens)
  ctx.translate(800, 450); ctx.scale(1.1, 1.1); ctx.translate(-800, -450);
}
/* Shot 12: a sliver of the open view at the right-hand edge of the forest (the right end of the clearing
   painting, feathered in from the left), so we sense the space beyond without seeing it. k: 0..1 */
let _glimpse = null;
function forestGlimpse(ctx, k) {
  if (k <= 0.01) return;
  if (!_glimpse) {
    const c = makeCanvas(W, H), x = c.getContext('2d');
    drawCover(x, A.clearing, 1.0, 1.0, 0.75);                      // the right-hand (valley) end of the picture
    x.globalCompositeOperation = 'destination-in';
    const g = x.createLinearGradient(1270, 0, 1560, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const v = x.createLinearGradient(0, 120, 0, 820);              // keep it to the gap between the canopy and the ground
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.25, 'rgba(0,0,0,1)'); v.addColorStop(0.85, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = v; x.fillRect(0, 0, W, H);
    _glimpse = c;
  }
  ctx.save(); ctx.globalAlpha = k; ctx.drawImage(_glimpse, 0, 0); ctx.restore();
}

/* Shot 6: the cut-away to the two of them through the windscreen, worried, bumping up the hill. */
const FORK_FACES = frontCloseShot({ dur: 0.85, img: 'carFront', light: 0.18, match: true, faceLift: 1.2, rain: 0.85, shake: () => 5, zoom: p => U.lerp(2.2, 2.35, p),
  lurch: t => Math.sin(t * 6) * 0.025 });

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
      // what she says, in French only: up as she starts speaking, gone once the line is done (~5 s)
      // (minX: the frame's left edge plus a margin, in the zoomed coordinates)
      drawSpeechBubble(ctx, wx + 10, 894 - 366 * 0.86, CHAT_BUBBLE, U.seg(t, 2.2, 2.6) * (1 - U.seg(t, 7.0, 7.4)), fx - (fx - 14) / zoom, CHAT_BUBBLE_CX);
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
      dur: 8, speed: 520, mode: 'vines', body: 'carLook',   // looking ahead, as shot 0 ends; then the worried faces
      light: p => U.lerp(1.6, 0.62, U.ease(U.seg(p, 0.22, 0.9))),
      rain: p => U.lerp(0, 0.5, U.seg(p, 0.35, 0.8)),
      worried: p => U.ease(U.seg(p, 0.58, 0.72)),
    }),
    dirt: [0, 0.08],
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
      drawCarMud(ctx, A.carFront, 'front', S.dirt, -576, -820);
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
    dirt: [0.12, 0.18],
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
    dirt: [0.2, 0.38],
  },
  // (Batch 3: the thunderclap close-up that was here, 'front-close-thunder', was dropped.)
  { // 4. Inside, looking out: low visibility, wipers clear the odd swath, mud hits the windscreen, lightning.
    // Batch 3: only the last 3 s of what was a 6.5 s shot (skip: 3.5); the mud now lands just after the cut in.
    name: 'inside-vines', dur: 3, skip: 3.5,
    enter: S => { S.inGlass.fillHaze(0.9); },
    draw: insideShot({
      dur: 6.5, speed: 9, img: 'fwdVines', fy: 0.4, zoom: p => 1.12 + p * 0.1, cabin: 'inAnxious', light: p => U.lerp(0.34, 0.27, p), rain: 0.9, hazeMax: 0.85,
      // J hauls the wheel right as the car slews, then lets it come back (only a right-turn painting exists)
      cabinB: (t, sway) => ['inSteerR', U.ease(U.clamp(sway / 0.05))],
      sway: (t, L) => {
        once(L, 'swerve', t > 3.7, () => { S_.inGlass.splat(7, [180, 90, 1240, 280]); SFX.skid(1); SFX.squelch(); L.jolt = 18; });
        once(L, 'flash', t > 4.8, () => { flash(L, t); thunderAfter(0.5, 0.8); });
        return t > 3.7 ? Math.sin((t - 3.7) * 7) * 0.09 * Math.exp(-(t - 3.7) * 1.2) : 0;
      },
    }),
    dirt: 0.4,
  },
  { // 5. Sliding in the mud, a bit too fast; J and the stick shift
    name: 'side-slide', fy: 0.95, dur: 4.2, dirt: [0.4, 0.6],
    enter: S => { SFX.setEngine(1, 1.15); },
    draw: sideShot({
      dur: 4.2, speed: 600, mode: 'vines', light: p => U.lerp(0.27, 0.2, p), rain: 0.85, mud: 1.6,
      carDX: t => Math.sin(t * 2.2) * 40,
      swerve: (t, L) => {
        once(L, 's1', t > 0.6, () => { L.burst = 1; SFX.skid(0.8); });
        once(L, 's2', t > 2.4, () => { L.burst = 1; SFX.skid(0.9); SFX.setEngine(1, 1.35); setTimeout(() => SFX.setEngine(1, 1.0), 400); });
        return Math.sin(t * 5.5) * 0.05;
      },
    }),
  },
  { // 6. The fork: right, and upwards into the trees
    name: 'fork', fy: 0.6, dur: 5, dirt: [0.6, 0.68],
    enter: S => { SFX.setEngine(0.8, 0.9); },
    draw: (ctx, t, dt, S, L) => {
      // unhurried: easing off as it climbs, and only about three-quarters of the way up the track by the cut
      const u = U.clamp(t / 5), carP = 0.74 * (1 - Math.pow(1 - u, 1.8));
      const y = forkPoint(carP).y;
      if (y < FORK_CUT[0] && y > FORK_CUT[1]) {      // the quick cut to their faces, hiding the turn
        if (L.cut0 == null) L.cut0 = t;
        FORK_FACES(ctx, t - L.cut0, dt, S, L);
        return;
      }
      drawFork(ctx, t, U.lerp(0.2, 0.14, u), carP, S, L, dt);
      drawRain(ctx, t + S.time, 0.85);
    },
  },
  { // 7. Uphill through the forest; it's nearly dark; they slow right down
    name: 'side-forest', fy: 0.95, dur: 5, dirt: [0.7, 0.86],
    enter: S => { SFX.setRain(0.9); },
    draw: sideShot({ dur: 5, speed: t => U.lerp(420, 150, U.clamp(t / 5)), mode: 'forest', light: p => U.lerp(0.13, 0.05, p), rain: 0.95, tiltWorld: -0.06 }),
    tick: (t) => SFX.setEngine(1, U.lerp(1.1, 0.7, t / 5)),
  },
  { // 8. Inside, creeping along… then J slams on the brakes (Batch 3: cut at 3.5 s, just as he brakes)
    name: 'inside-forest', dur: 3.5, dirt: 0.88,
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
  { // 9. Two shocked faces: the car lurches to a stop, nose down (Batch 3: as dark as the forest around them)
    name: 'faces-brake', dur: 1.6, dirt: 0.9,
    draw: frontCloseShot({ dur: 1.6, img: 'frontShock', bg: 'forest', light: 0.1, match: true, faceLift: 1.2, rain: 0.9, shake: t => 16 * Math.exp(-t * 2), zoom: p => 1.55 + p * 0.12, bob: 0,
      lurch: t => Math.sin(t * 9) * 0.02 * Math.exp(-t * 2.5) }),
  },
  // (Batch 3: 'inside-chairs', the chair backs seen from inside, was removed.)
  { // 10. Side, in near darkness: the car has just stopped short of the café chairs, which stand in the
    // headlight beam facing the valley, in true side view as in shot 12. The car and the forest are barely visible.
    // Batch 3: the sliding-in part is gone; this is what was its last 1.7 s, the car already stopped.
    name: 'side-tap', fy: 0.95, dur: 1.7, dirt: 0.95,
    enter: S => { L_stopAt = S.scroll; SFX.setEngine(0.3, 0.55); SFX.setRain(0.6); },
    draw: (ctx, t, dt, S, L) => {
      ctx.save();
      forestStopFrame(ctx);
      drawSideWorld(ctx, { scroll: S.scroll, light: 0.04, mode: 'forest' });
      const car = { x: 720, ground: 868, s: 0.62, scroll: S.scroll, bumpAmt: 0, worried: 1, dirt: S.dirt };
      drawCarSide(ctx, car);
      darken(ctx, 0.92);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(-100, -100, W + 200, H + 200);   // the car and the trees barely there
      // the set (same layout as every other shot), the near chair caught in the beam;
      // the far chair is lost in the dark and the table is beyond the light
      ctx.save(); ctx.filter = 'brightness(0.55) sepia(0.25)';
      drawSetSide(ctx, 720 + (L_stopAt - S.scroll), 868, 0.62, { table: false, farAlpha: 0.12, view: 'profile' });
      ctx.restore();
      drawCarLights(ctx, { ...car, lights: 0.85 });
      ctx.restore();
      drawRain(ctx, t + S.time, 0.6);
    },
  },
  // (From here on the car has stopped: no more bouncing.)
  { // 11. Smiles (Batch 3: darkened with the forest around them)
    name: 'faces-smile', dur: 3, dirt: 1,
    enter: S => { SFX.setEngine(0, 0.5); SFX.setRain(0.4); },
    draw: frontCloseShot({ dur: 3, img: 'frontSmile', bg: 'forest', light: 0.16, match: true, faceLift: 1.2, rain: 0.25, zoom: () => 2.05, bob: 0 }),   // static
  },
  { // 12. Side, from the same spot as shot 10, still in the forest: the storm clears and it brightens;
    // sunlight and a sliver of open sky at the right edge hint at what's beyond; birdsong.
    // Batch 3: moved back into the woods (the full view waits for shot 14), 3.5 s, the brightness
    // curve as before (it ends where the old shot was at 3.5 s).
    // (user 27 Nov: +3 s held at full brightness, a key moment: 6.5 s in all)
    name: 'side-open', fy: 0.95, dur: 6.5, dirt: 1,
    enter: S => { SFX.setRain(0.05); setTimeout(() => SFX.birds(true), 1500); },
    draw: (ctx, t, dt, S, L) => {
      const p = Math.min(t, 3.5) / 4.8, light = U.lerp(0.12, 1.15, U.ease(p));   // near dark → clearing sky by 3.5 s, then held
      ctx.save();
      forestStopFrame(ctx);
      drawSideWorld(ctx, { scroll: S.scroll, light, mode: 'forest' });
      forestGlimpse(ctx, U.ease(U.clamp(p * 1.6)));
      // S looking ahead, in wonder, once the painting exists (ART_PROMPTS L2); until then the usual picture
      drawCarSide(ctx, { x: 720, ground: 868, s: 0.62, scroll: S.scroll, bumpAmt: 0, body: A.carWonder, dirt: S.dirt });
      drawSetSide(ctx, 720, 868, 0.62, { view: 'profile' });              // the chairs in true side view, facing the valley
      ctx.restore();
      darken(ctx, U.clamp((1 - light) * 0.75));
      nightShade(ctx, light);
      drawRain(ctx, t + S.time, U.clamp(0.4 - p * 0.8));
      // shafts of sunlight from the right
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = U.clamp((p - 0.4) * 1.5) * 0.3;
      const sg = ctx.createRadialGradient(W + 100, 300, 50, W + 100, 300, 1100);
      sg.addColorStop(0, 'rgba(255,230,160,1)'); sg.addColorStop(1, 'rgba(255,230,160,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); ctx.restore();
    },
  },
  { // 13. Amazed, in awe, warm sunshine on their faces (bright, as before). Batch 3: 2 s.
    name: 'faces-awe', dur: 2, dirt: 1,
    draw: frontCloseShot({ dur: 2, img: 'frontAwe', bg: 'sunlit', light: 1.55, rain: 0, zoom: () => 2.06, bob: 0 }),   // static
  },
  { // 14. Inside: the champagne landscape, a muddy grass track, a church… and a rainbow
    name: 'inside-landscape', dur: 5,
    enter: S => { SFX.setRain(0); SFX.sparkle(); },
    draw: insideShot({
      dur: 5, speed: 0, cabin: 'inHands', light: 1.6, rain: 0, hazeMax: 0.4, refill: 0, wipers: false,   // inHands: holding hands (Batch 3)
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
  { // 15. Dolly forward through the windscreen; the title in the sky; the "!" bottle pops
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
      if (c < 1) drawInterior(ctx, A.inHands, 1.6, { alpha: 1 - c, scale: 1 + c * 2.4 });
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
  { // 16. The couple, cheers! Then the menu appears.
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
      // (user: same place across the frame, 15% smaller, dropped by a quarter of its height;
      //  then 27 Nov: another 20% smaller and dropped straight down a bit more, the feet well out of sight)
      const m = h * 0.595 * 0.8, cx = 1330, gy = VIEW.bottom + h * 0.2;
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
/* How muddy the car is (0..1) at time t of shot i. Each shot's dirt is a number or [start, end]; a shot
   without one keeps the level of the last shot before it that has one (so it works when jumping in with ?shot=N). */
function shotDirt(i, t) {
  for (let j = i; j >= 0; j--) {
    const d = SHOTS[j].dirt;
    if (d == null) continue;
    if (typeof d === 'number') return d;
    return j === i ? U.lerp(d[0], d[1], U.clamp(t / SHOTS[j].dur)) : d[1];
  }
  return 0;
}
let L_stopAt = 0;
let S_ = null;   // shared state (for callbacks that need it)

const Intro = {
  running: false,
  start(ctx, { from = 0, onMenu } = {}) {
    const S = S_ = {
      ctx, scroll: 0, z: 0, time: 0, dirt: 0,
      mud: new Particles(),
      inGlass: makeInsideGlass('rgba(78,86,100,1)'),
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
    this.S.dirt = shotDirt(this.idx, this.t);
    // shot.skip: the shot was trimmed at the start; its drawing still runs on its original clock
    const st = this.t + (sh.skip || 0);
    sh.tick && sh.tick(st, this.S);
    ctx.save(); sh.draw(ctx, st, dt, this.S, this.L); ctx.restore();
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

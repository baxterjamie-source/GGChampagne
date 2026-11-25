/* Opening sequence (DESIGN.md, Batch 1): S & J in the 2CV, the storm, the bistro table, the reveal. */
'use strict';

function once(L, key, cond, fn) { if (cond && !L.fired[key]) { L.fired[key] = 1; fn(); } }

/* ---------- Faces through the windscreen (front view into the car) ---------- */
const FACE_GLASS = { x: 250, y: 150, w: 1100, h: 620 };
function faceGlassPath(ctx, keep) { if (!keep) ctx.beginPath(); ctx.roundRect(FACE_GLASS.x, FACE_GLASS.y, FACE_GLASS.w, FACE_GLASS.h, 46); }
function makeFaceGlass() {
  return new Glass({ path: faceGlassPath, pivots: [{ x: 520, y: 790 }, { x: 1060, y: 790 }], len: 440, hazeCol: 'rgba(84,94,110,1)' });
}
function drawFacesShot(ctx, S, t, left, right, o) {
  // o: { light, shake, zoom, bob, lightning }
  const sh = o.shake || 0, z = o.zoom || 1;
  ctx.save();
  ctx.translate(800 + (Math.random() - .5) * sh, 450 + (Math.random() - .5) * sh);
  ctx.scale(z, z); ctx.translate(-800, -450);
  // car interior behind them, with the rear window glowing faintly
  const [top, hor] = skyCols(o.light);
  ctx.fillStyle = '#1b1e24'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = U.rgb(U.mix(hor, top, 0.4), 0.8); ctx.beginPath(); ctx.roundRect(470, 230, 660, 230, 30); ctx.fill();
  ctx.fillStyle = '#34405a'; ctx.fillRect(300, 470, 1000, 400);   // seat backs
  const bob = o.bob ?? 4;
  drawPortrait(ctx, left, 560, 545 + Math.sin(t * 9) * bob, 560);
  drawPortrait(ctx, right, 1050, 535 + Math.sin(t * 9 + 1) * bob, 580);
  darken(ctx, U.clamp((1 - o.light) * 0.45));
  S.faceGlass.draw(ctx, o.hazeMax ?? 0.55, false);
  // car body around the windscreen
  ctx.beginPath(); ctx.rect(-200, -200, W + 400, H + 400); faceGlassPath(ctx, true);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2f3a4a'); g.addColorStop(0.16, '#2f3a4a'); g.addColorStop(0.17, '#7d9cbf'); g.addColorStop(1, '#5a7898');
  ctx.fillStyle = g; ctx.fill('evenodd');
  faceGlassPath(ctx); ctx.lineWidth = 12; ctx.strokeStyle = '#1a1d22'; ctx.stroke();
  // bonnet ridges
  ctx.strokeStyle = 'rgba(40,60,85,.5)'; ctx.lineWidth = 4;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(800 + i * 70, 800); ctx.lineTo(800 + i * 120, H + 20); ctx.stroke(); }
  S.faceGlass.drawWipers(ctx);   // wipers on top of the body
  darken(ctx, U.clamp((1 - o.light) * 0.35));
  ctx.restore();
}

/* ---------- The fork in the road ---------- */
function drawFork(ctx, t, light, carP) {
  const hy = 360;
  drawSky(ctx, light, hy);
  ctx.fillStyle = '#6f8492'; ctx.beginPath(); ctx.moveTo(0, hy + 5);
  for (let x = 0; x <= W; x += 20) ctx.lineTo(x, hy - 30 - 30 * U.noise1(x / 200 + 4)); ctx.lineTo(W, hy + 5); ctx.fill();
  ctx.fillStyle = '#6a9142'; ctx.fillRect(0, hy, W, H - hy);
  ctx.strokeStyle = '#3e6a2a';
  for (let i = -20; i <= 6; i++) { ctx.lineWidth = 3 + Math.abs(i) * .6; ctx.beginPath(); ctx.moveTo(560 + i * 5, hy); ctx.lineTo(560 + i * 140, H + 200); ctx.stroke(); }
  // forested hill on the right
  for (let i = 0; i < 16; i++) {
    const x = 880 + i * 52, y = hy + 70 - i * 14 - U.hash(i) * 30, r = 80 + U.hash(i * 3) * 60 + i * 4;
    ctx.fillStyle = i % 2 ? '#22412a' : '#1b3523';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#1b3523'; ctx.fillRect(880, hy + 40, W - 880, H);
  // roads: trunk, left branch to the vines, right branch climbing into the trees
  ctx.fillStyle = '#6a4a30';
  ctx.beginPath(); ctx.moveTo(250, H); ctx.lineTo(790, 600); ctx.lineTo(560, hy + 4); ctx.lineTo(575, hy + 4); ctx.lineTo(860, 590); ctx.lineTo(1340, H); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(800, 610); ctx.quadraticCurveTo(930, 520, 1030, 395); ctx.lineTo(1052, 398); ctx.quadraticCurveTo(990, 530, 900, 620); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(40,26,16,.5)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(520, H); ctx.lineTo(820, 610); ctx.quadraticCurveTo(940, 520, 1036, 398); ctx.moveTo(1080, H); ctx.lineTo(860, 610); ctx.stroke();
  // fork signpost
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(744, 470, 7, 110);
  ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.moveTo(700, 478); ctx.lineTo(752, 478); ctx.lineTo(752, 500); ctx.lineTo(700, 500); ctx.lineTo(690, 489); ctx.fill();
  ctx.beginPath(); ctx.moveTo(752, 506); ctx.lineTo(806, 506); ctx.lineTo(816, 517); ctx.lineTo(806, 528); ctx.lineTo(752, 528); ctx.fill();
  // the car, from behind, heading up the right fork
  const p = carP;
  const pts = [[800, 960, 0.6], [835, 640, 0.26], [935, 520, 0.16], [1040, 400, 0.06]];
  const seg = Math.min(2, Math.floor(p * 3)), k = p * 3 - seg;
  const a = pts[seg], b = pts[seg + 1];
  const cx = U.lerp(a[0], b[0], k), cy = U.lerp(a[1], b[1], k), s = U.lerp(a[2], b[2], k);
  ctx.save(); ctx.translate(cx, cy + Math.sin(t * 18) * 3 * s); ctx.rotate(0.12 * U.clamp(p * 3 - 1) + Math.sin(t * 7) * 0.03); ctx.scale(s, s);
  ctx.drawImage(A.carBack, -576, -805);
  ctx.globalCompositeOperation = 'lighter';
  for (const lx of [-210, 214]) {
    const g = ctx.createRadialGradient(lx, -130, 4, lx, -130, 90);
    g.addColorStop(0, 'rgba(255,60,40,.8)'); g.addColorStop(1, 'rgba(255,60,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, -130, 90, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  darken(ctx, U.clamp((1 - light) * 0.75));
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
    ctx.font = `italic 700 ${L.size}px "Playfair Display", Georgia, serif`;
    ctx.globalAlpha = a;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(60,36,8,.55)'; ctx.strokeText(L.ch, L.x, y + 4);
    ctx.shadowColor = 'rgba(242,169,0,.55)'; ctx.shadowBlur = 22;
    ctx.fillStyle = goldFill(ctx, y, L.size); ctx.fillText(L.ch, L.x, y);
    ctx.shadowBlur = 0;
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
const LANDSCAPE_FILTER = 'saturate(1.25) contrast(1.06) brightness(1.04)';

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
    if (o.outside) o.outside(ctx, t, dt, S, L, light, sway);
    else drawForward(ctx, { z: S.z, light, mode: o.mode, sway, lights: U.clamp((0.9 - light) * 2), lit: U.clamp(1 - light) });
    S.inGlass.wipers = o.wipers ?? true;
    S.inGlass.update(dt, { rain, refill: o.refill ?? rain * 1.6, speed: o.wiperSpeed || 1.15, mudSlide: 55 });
    S.inGlass.draw(ctx, o.hazeMax ?? 0.82);
    drawCabin(ctx, light);
    ctx.restore();
    if (L.jolt) L.jolt = Math.max(0, L.jolt - dt * 40);
    if (L.flash != null) drawLightning(ctx, t - L.flash, L.flashSeed);
  };
}

function facesShot(o) {
  return (ctx, t, dt, S, L) => {
    const p = t / o.dur;
    const light = typeof o.light === 'function' ? o.light(p) : o.light;
    const rain = o.rain ?? 0.6;
    S.faceGlass.wipers = o.wipers ?? true;
    S.faceGlass.update(dt, { rain, refill: rain * 1.4, speed: 1.15, mudSlide: 40 });
    const [l, r] = typeof o.faces === 'function' ? o.faces(t) : o.faces;
    drawFacesShot(ctx, S, t, A[l], A[r], { light, shake: o.shake ? o.shake(t) : 0, zoom: o.zoom ? o.zoom(p) : 1, bob: o.bob, hazeMax: o.hazeMax });
    drawRain(ctx, t + S.time, rain * 0.6);
    if (L.flash != null) drawLightning(ctx, t - L.flash, L.flashSeed);
  };
}

/* Close-up on the faces using the front-on car picture: the windscreen fills the frame. */
function frontCloseShot(o) {
  return (ctx, t, dt, S, L) => {
    const p = t / o.dur, light = typeof o.light === 'function' ? o.light(p) : o.light;
    if (o.thunder) once(L, 'thunder', t > 0.05, () => { flash(L, t); SFX.thunder(1); });
    const sh = o.shake ? o.shake(t) : 0, z = o.zoom(p);
    drawCover(ctx, A.scSky, 1.1, 0.5, 0.3);
    drawStormClouds(ctx, light, S.time * 25);
    drawCover(ctx, A.scVinesFwd, 1.35, 0.5, 0.45);
    mist(ctx, 0.3, 250);
    darken(ctx, (1 - light) * 0.75);
    ctx.save();
    ctx.translate(800 + (Math.random() - .5) * sh, 470 + Math.sin(t * 19) * 5 + (Math.random() - .5) * sh);
    ctx.scale(z, z);
    ctx.drawImage(A[o.img], -575, -262);      // centred on the faces behind the windscreen
    ctx.restore();
    darken(ctx, (1 - light) * 0.25);
    drawRain(ctx, t + S.time, o.rain);
    if (L.flash != null) drawLightning(ctx, t - L.flash, L.flashSeed);
  };
}

function flash(L, t) { L.flash = t; L.flashSeed = Math.random() * 100; }
function thunderAfter(sec, power = 1) { setTimeout(() => SFX.thunder(power), sec * 1000); }

const SHOTS = [
  { // 1. Driving through the vineyards at dusk; the rain starts
    name: 'vines-sun-to-rain', dur: 8,
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
    name: 'front-worried', dur: 3.8,
    enter: S => { SFX.setRain(0.55); SFX.setEngine(0.8, 0.95); },
    draw: (ctx, t, dt, S, L) => {
      const p = t / 3.8, light = U.lerp(0.6, 0.52, p);
      drawCover(ctx, A.scSky, 1.1, 0.5, 0.3);
      drawStormClouds(ctx, light, S.time * 25);
      // the vineyard rows running away behind them; we drift back slowly as the car comes on
      drawCover(ctx, A.scVinesFwd, 1.12 - p * 0.04, 0.5, 0.5);
      mist(ctx, 0.3, 300);
      darken(ctx, (1 - light) * 0.75);
      // the car: bouncing on the ruts, a little sway, growing as it approaches
      const s = 0.72 + p * 0.08, bob = Math.sin(t * 19) * 4 + Math.sin(t * 7.3) * 3, sway = Math.sin(t * 2.6) * 0.025;
      ctx.save();
      ctx.translate(800 + Math.sin(t * 1.7) * 18, 915 + bob); ctx.rotate(sway); ctx.scale(s, s);
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
      if (Math.random() < 0.5) for (const sx of [-260, 260]) S.mud.add(800 + sx * s, 900, sx * 1.2 + (Math.random() - .5) * 300, -200 - Math.random() * 300, 3 + Math.random() * 5, '#4e3420', 0.9);
      S.mud.update(dt); S.mud.draw(ctx);
      drawRain(ctx, t + S.time, 0.65);
    },
  },
  { // 3. Storm: lightning, thunder, a swerve
    name: 'side-storm', dur: 6,
    enter: S => { SFX.setRain(0.75); SFX.setEngine(1, 1.05); },
    draw: sideShot({
      dur: 6, speed: 560, mode: 'vines', light: p => U.lerp(0.52, 0.42, p), rain: 0.8,
      swerve: (t, L) => {
        once(L, 'flash', t > 1.2, () => { flash(L, t); thunderAfter(0.35); });
        once(L, 'swerve', t > 3.4, () => { L.burst = 1; SFX.skid(1.1); });
        return t > 3.4 ? Math.sin((t - 3.4) * 9) * 0.06 * Math.exp(-(t - 3.4) * 1.6) : 0;
      },
    }),
  },
  { // 4. Close on the two of them through the windscreen as the thunder cracks
    // (uses cit_worried_front; swap to cit_front_S_shocked when it exists)
    name: 'front-close-thunder', dur: 2.6,
    draw: frontCloseShot({ dur: 2.6, img: 'carFront', light: p => U.lerp(0.42, 0.38, p), rain: 0.8, thunder: true, shake: t => t < 0.7 ? 14 * (1 - t / 0.7) : 0, zoom: p => U.lerp(2.35, 2.65, U.ease(p)) }),
  },
  { // 5. Inside, looking out: low visibility, wipers clear the odd swath, mud hits the screen
    name: 'inside-vines', dur: 6.5,
    enter: S => { S.inGlass.fillHaze(0.9); },
    draw: insideShot({
      dur: 6.5, speed: 9, mode: 'vines', light: p => U.lerp(0.38, 0.3, p), rain: 0.9, hazeMax: 0.85,
      sway: (t, L) => {
        once(L, 'swerve', t > 2.3, () => { S_.inGlass.splat(7, [180, 90, 1240, 280]); SFX.skid(1); SFX.squelch(); L.jolt = 18; });
        once(L, 'flash', t > 4.6, () => { flash(L, t); thunderAfter(0.5, 0.8); });
        return t > 2.3 ? Math.sin((t - 2.3) * 7) * 0.09 * Math.exp(-(t - 2.3) * 1.2) : 0;
      },
    }),
  },
  { // 6. Sliding in the mud, a bit too fast; J and the stick shift
    name: 'side-slide', dur: 4.2,
    enter: S => { SFX.setEngine(1, 1.15); },
    draw: sideShot({
      dur: 4.2, speed: 600, mode: 'vines', light: p => U.lerp(0.3, 0.21, p), rain: 0.85, mud: 1.6,
      carDX: t => Math.sin(t * 2.2) * 40,
      swerve: (t, L) => {
        once(L, 's1', t > 0.6, () => { L.burst = 1; SFX.skid(0.8); });
        once(L, 's2', t > 2.4, () => { L.burst = 1; L.lensBurst = 1; SFX.skid(0.9); SFX.setEngine(1, 1.35); setTimeout(() => SFX.setEngine(1, 1.0), 400); });
        return Math.sin(t * 5.5) * 0.05;
      },
    }),
  },
  { // 7. The fork: right, and upwards into the trees
    name: 'fork', dur: 5,
    enter: S => { SFX.setEngine(0.8, 0.9); },
    draw: (ctx, t, dt, S, L) => {
      drawFork(ctx, t, U.lerp(0.2, 0.12, t / 5), U.ease(U.clamp(t / 5)));
      drawRain(ctx, t + S.time, 0.85);
    },
  },
  { // 8. Uphill through the forest; it's nearly dark; they slow right down
    name: 'side-forest', dur: 5,
    enter: S => { SFX.setRain(0.9); },
    draw: sideShot({ dur: 5, speed: t => U.lerp(420, 150, U.clamp(t / 5)), mode: 'forest', light: p => U.lerp(0.13, 0.1, p), rain: 0.95, tiltWorld: -0.06 }),
    tick: (t) => SFX.setEngine(1, U.lerp(1.1, 0.7, t / 5)),
  },
  { // 9. Inside, creeping along… then J slams on the brakes
    name: 'inside-forest', dur: 4.6,
    enter: S => { S.inGlass.fillHaze(0.95); },
    draw: insideShot({
      dur: 4.6, speed: t => t < 3.3 ? 4 : Math.max(0, 4 - (t - 3.3) * 6), mode: 'forest', light: 0.12, rain: 1, hazeMax: 0.92, wiperSpeed: 1.25,
      sway: (t, L) => {
        once(L, 'brake', t > 3.3, () => { SFX.skid(1.4); L.jolt = 26; SFX.setEngine(0.4, 0.6); });
        return t > 3.3 ? Math.sin((t - 3.3) * 10) * 0.07 : 0;
      },
    }),
  },
  { // 10. Two shocked faces
    name: 'faces-brake', dur: 1.6,
    draw: facesShot({ dur: 1.6, faces: ['sShock', 'jShock'], light: 0.28, rain: 0.9, shake: t => 16 * Math.exp(-t * 2), zoom: p => 1.04 + p * 0.08, bob: 0 }),
  },
  { // 11. Inside: two café chairs, right in front of them!
    name: 'inside-chairs', dur: 2.2,
    draw: insideShot({
      dur: 2.2, speed: t => Math.max(0, 3 - t * 3), light: 0.16, rain: 0.8, hazeMax: 0.35, refill: 0.3, wiperSpeed: 1.5,
      outside: (ctx, t, dt, S, L, light, sway) => {
        drawForward(ctx, { z: S.z, light, mode: 'forest', sway: sway * 0.5, lights: 1 });
        const k = U.easeOut(U.clamp(t / 1.1));
        drawBistro(ctx, 800, 760 + k * 120, 1.1 + k * 0.7, { table: false });
        // caught in the headlights
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(800, 450, 20, 800, 450, 520);
        g.addColorStop(0, 'rgba(255,230,160,.3)'); g.addColorStop(1, 'rgba(255,230,160,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      },
      sway: (t, L) => { once(L, 'stop', t > 1.1, () => { L.jolt = 20; SFX.squelch(); }); return 0; },
    }),
  },
  { // 12. Side: the car taps a chair, which hops up and lands back on its feet
    name: 'side-tap', dur: 3.4,
    enter: S => { L_stopAt = S.scroll + 260; SFX.setEngine(0.3, 0.55); SFX.setRain(0.6); },
    draw: (ctx, t, dt, S, L) => {
      const speed = Math.max(0, 320 * (1 - t / 1.05));
      S.scroll += speed * dt;
      const light = 0.16;
      ctx.save();
      ctx.translate(800, 450); ctx.rotate(-0.03); ctx.scale(1.07, 1.07); ctx.translate(-800, -450);
      drawSideWorld(ctx, { scroll: S.scroll, light, mode: 'forest' });
      const chairX = 1180 + (L_stopAt - S.scroll);
      const tip = t > 1.0 && t < 1.75 ? Math.sin((t - 1.0) / 0.75 * Math.PI) * 0.32 : 0;
      once(L, 'tap', t > 1.0, () => SFX.thunk());
      once(L, 'land', t > 1.75, () => SFX.thunk());
      drawChair(ctx, chairX, 868, 0.62, 1, tip);
      const car = { x: 720, ground: 868, s: 0.62, scroll: S.scroll, rotateAll: t < 1.05 ? Math.sin(t * 8) * 0.03 : 0, bumpAmt: U.clamp(speed / 300), worried: 1 };
      drawCarSide(ctx, car);
      S.mud.update(dt); S.mud.draw(ctx);
      darken(ctx, U.clamp((1 - light) * 0.75));
      drawCarLights(ctx, { ...car, lights: 1 });
      ctx.restore();
      drawRain(ctx, t + S.time, 0.6);
    },
  },
  { // 13. Inside: the wipers clear and there's the table, a bottle of Veuve and two flutes
    name: 'inside-table', dur: 4.2,
    enter: S => { SFX.setEngine(0, 0.5); SFX.setRain(0.4); },
    draw: insideShot({
      dur: 4.2, speed: 0, light: p => U.lerp(0.18, 0.4, p), rain: p => U.lerp(0.5, 0.25, p), hazeMax: 0.7, refill: 0.5,
      outside: (ctx, t, dt, S, L, light) => {
        drawForward(ctx, { z: S.z, light, mode: 'forest', lights: 1 });
        drawBistro(ctx, 800, 760, 1.2, { bottle: true, flutes: true, fill: 0 });
        darken(ctx, U.clamp((1 - light) * 0.35));
        // headlight glow on the table
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(800, 520, 20, 800, 520, 460);
        g.addColorStop(0, 'rgba(255,230,160,.22)'); g.addColorStop(1, 'rgba(255,230,160,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      },
    }),
  },
  { // 14. Smiles
    name: 'faces-smile', dur: 3,
    draw: facesShot({ dur: 3, faces: ['sLaugh', 'jLaugh'], light: 0.45, rain: 0.25, bob: 3 }),
  },
  { // 15. Side: forest to the left, a vast open space to the right; it brightens; birdsong
    name: 'side-open', dur: 4.8,
    enter: S => { SFX.setRain(0.05); setTimeout(() => SFX.birds(true), 1500); },
    draw: (ctx, t, dt, S, L) => {
      const p = t / 4.8, light = U.lerp(0.4, 1.7, U.ease(p));
      drawSky(ctx, light, 700);
      // distant open country, low down: it feels huge
      ctx.fillStyle = '#9bb0b8'; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 700 - 30 * U.noise1(x / 300 + 2)); ctx.lineTo(W, H); ctx.fill();
      ctx.fillStyle = '#86a858'; ctx.fillRect(0, 735, W, H);
      // forest on the left, fading out towards the open right
      const off = S.off, ox = S.offX;
      ox.clearRect(0, 0, W, H);
      drawFarHills(ox, S.scroll, [50, 70, 60]);
      drawForestBand(ox, S.scroll, 0.3, 760, 440, [40, 74, 46], 3, 40);
      drawForestBand(ox, S.scroll, 0.6, 820, 560, [30, 62, 38], 7, 70);
      ox.globalCompositeOperation = 'destination-in';
      const g = ox.createLinearGradient(520, 0, 980, 0); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ox.fillStyle = g; ox.fillRect(0, 0, W, H); ox.globalCompositeOperation = 'source-over';
      ctx.drawImage(off, 0, 0);
      // grass track instead of the road
      ctx.fillStyle = '#6a8a3e'; ctx.fillRect(0, 795, W, H);
      ctx.fillStyle = '#7a5838'; ctx.fillRect(0, 840, 1000, 60);
      drawBistro(ctx, 1290, 868, 0.58, { bottle: true, flutes: true, fill: 0 });
      drawCarSide(ctx, { x: 700, ground: 868, s: 0.62, scroll: S.scroll, bumpAmt: 0 });
      darken(ctx, U.clamp((1 - light) * 0.75));
      drawRain(ctx, t + S.time, U.clamp(0.4 - p * 0.8));
      // shafts of sunlight from the right
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = U.clamp((p - 0.4) * 1.5) * 0.35;
      const sg = ctx.createRadialGradient(W + 100, 300, 50, W + 100, 300, 1100);
      sg.addColorStop(0, 'rgba(255,230,160,1)'); sg.addColorStop(1, 'rgba(255,230,160,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); ctx.restore();
    },
  },
  { // 16. Amazed, in awe
    name: 'faces-awe', dur: 3,
    draw: facesShot({ dur: 3, faces: ['sAwe', 'jAwe'], light: 1.6, rain: 0, wipers: false, bob: 1.5, hazeMax: 0.3, zoom: p => 1 + p * 0.05 }),
  },
  { // 17. Inside: the champagne landscape, a muddy grass track, a church… and a rainbow
    name: 'inside-landscape', dur: 5,
    enter: S => { SFX.setRain(0); SFX.sparkle(); },
    draw: insideShot({
      dur: 5, speed: 0, light: 1.6, rain: 0, hazeMax: 0.4, refill: 0, wipers: false,
      outside: (ctx, t, dt, S, L) => {
        S.inGlass.hx.globalCompositeOperation = 'destination-out';
        S.inGlass.hx.globalAlpha = dt * 0.8; S.inGlass.hx.fillRect(0, 0, W, H);
        S.inGlass.hx.globalAlpha = 1; S.inGlass.hx.globalCompositeOperation = 'source-over';
        ctx.save(); ctx.filter = LANDSCAPE_FILTER; drawCover(ctx, A.land, 1.12 + t * 0.006, 0.5, 0.42); ctx.restore();
        drawRainbow(ctx, U.ease(U.clamp((t - 0.8) / 3)));
        drawBistro(ctx, 800, 700, 0.8, { bottle: true, flutes: true, fill: 0 });
      },
    }),
  },
  { // 18. Dolly forward through the windscreen; the title in the sky; the "!" bottle pops
    name: 'dolly-title', dur: 9,
    enter: (S, L) => { L.title = layoutTitle(S.ctx); },
    draw: (ctx, t, dt, S, L) => {
      const T = L.title;
      ctx.save(); ctx.filter = LANDSCAPE_FILTER;
      drawCover(ctx, A.land, 1.12 + U.easeOut(U.clamp(t / 9)) * 0.22, 0.5, 0.42);
      ctx.restore();
      drawRainbow(ctx, 1);
      // table rushes past underneath us
      const k = U.easeIn(U.clamp(t / 2.2));
      if (k < 1) drawBistro(ctx, 800, 700 + k * 900, 0.8 + k * 2.2, { bottle: true, flutes: true, fill: 0 });
      // cabin grows and falls away as we pass through the windscreen
      const c = U.ease(U.clamp(t / 1.8));
      if (c < 1) {
        ctx.save(); ctx.globalAlpha = 1 - c;
        ctx.translate(800, 330); ctx.scale(1 + c * 2.2, 1 + c * 2.2); ctx.translate(-800, -330);
        drawCabin(ctx, 1.6); ctx.restore();
      }
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
    name: 'toast', dur: 5.5, hold: true,
    enter: S => { setTimeout(() => SFX.clink(), 1900); },
    draw: (ctx, t, dt, S, L) => {
      ctx.save(); ctx.filter = LANDSCAPE_FILTER; drawCover(ctx, A.land, 1.3, 0.5, 0.5, 0, 40); ctx.restore();
      drawRainbow(ctx, 0.9, 1000, 820, 700);
      drawRisingBubbles(ctx, t + 9, 34, 0.9);
      // the bistro table beside them, the bottle open
      drawTable(ctx, 1160, 880, 1.15, { bottle: true });
      drawChair(ctx, 1390, 888, 1.15, -1);
      // S & J, arm in arm; a slight nod and settle
      const img = A.cheers, h = 860, w = img.width * h / img.height;
      const intro = U.easeOut(U.clamp(t / 0.9));
      const nod = Math.sin(t * 2.4) * 0.012 * U.clamp(t - 0.8) * Math.exp(-Math.max(0, t - 3) * 0.4);
      ctx.save();
      ctx.translate(560, 905 + (1 - intro) * 40); ctx.rotate(nod); ctx.scale(0.96 + intro * 0.04, 0.96 + intro * 0.04);
      ctx.globalAlpha = U.clamp(t / 0.5);
      ctx.drawImage(img, -w / 2, -h + 30, w, h);
      ctx.restore();
      // clink sparkle where the flutes meet
      const ct = t - 1.9;
      if (ct > 0 && ct < 1.2) {
        const gx = 560 + (430 - 432) * h / img.height, gy = 905 - h + 30 + 400 * h / img.height;
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
      faceGlass: makeFaceGlass(),
      lens: new Glass({ path: c => { c.beginPath(); c.rect(0, 0, W, H); }, pivots: [], len: 0 }),
      off: makeCanvas(W, H),
    };
    S.offX = S.off.getContext('2d');
    S.inGlass.fillHaze(0.85); S.faceGlass.fillHaze(0.6);
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

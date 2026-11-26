/* Scenes: painted scenery, the 2CV, rain, wipers, glass, bistro set and other drawing helpers.
   Everything draws in the 1600x900 logical frame. */
'use strict';

/* ---------- Light / sky ---------- */
// light: 0 = storm night, 1 = dusk, 2 = clear day
function skyCols(light) {
  const storm = [[16, 20, 30], [48, 54, 66]], dusk = [[64, 84, 132], [236, 158, 92]], day = [[78, 146, 222], [222, 236, 244]];
  if (light <= 1) return [U.mix(storm[0], dusk[0], light), U.mix(storm[1], dusk[1], light)];
  const k = light - 1;
  return [U.mix(dusk[0], day[0], k), U.mix(dusk[1], day[1], k)];
}
function drawSky(ctx, light, horizon = 620) {
  const [top, hor] = skyCols(light);
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, U.rgb(top)); g.addColorStop(1, U.rgb(hor));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon + 4);
  ctx.fillStyle = U.rgb(hor); ctx.fillRect(0, horizon, W, H - horizon);
  // storm clouds
  const storm = U.clamp(1 - light);
  if (storm > 0.02) {
    ctx.save(); ctx.globalAlpha = storm * 0.85;
    for (let i = 0; i < 9; i++) {
      const cx = (U.hash(i * 9.1) * W * 1.2) - 100, cy = 60 + U.hash(i * 3.3) * 170, r = 140 + U.hash(i) * 160;
      const cg = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
      cg.addColorStop(0, 'rgba(40,44,56,0.9)'); cg.addColorStop(1, 'rgba(40,44,56,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.6, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}
// darken everything drawn so far (multiply), plus a little blue
function darken(ctx, amount) {
  if (amount <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = U.rgb(U.mix([255, 255, 255], [34, 42, 64], U.clamp(amount)));
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/* ---------- Scenery pieces ---------- */
function outline(ctx, w = 2, a = 0.35) { ctx.lineWidth = w; ctx.strokeStyle = `rgba(20,16,12,${a})`; ctx.stroke(); }

function drawTree(ctx, x, y, s, seed = 1, col = [62, 104, 50]) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#5a4030';
  ctx.beginPath(); ctx.moveTo(-9, 0); ctx.quadraticCurveTo(-5, -60, -12, -120); ctx.lineTo(8, -120); ctx.quadraticCurveTo(4, -60, 10, 0); ctx.closePath();
  ctx.fill(); outline(ctx, 2, .3);
  const blobs = 9;
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2 + seed, rr = 48 + U.hash(seed + i) * 26;
    const bx = Math.cos(a) * 62 * (0.6 + U.hash(i + seed * 2) * 0.5), by = -170 + Math.sin(a) * 50;
    const c = pass === 0 ? U.mix(col, [20, 40, 24], 0.35) : U.mix(col, [180, 200, 110], 0.18 * (1 - Math.sin(a)));
    ctx.fillStyle = U.rgb(c);
    ctx.beginPath(); ctx.arc(bx + (pass ? -4 : 4), by + (pass ? -6 : 6), rr * (pass ? 0.85 : 1), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawChurch(ctx, x, y, s, lit = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const stone = '#cfc0a0', shade = '#a8977a', slate = '#4f5662';
  ctx.fillStyle = stone; ctx.beginPath(); ctx.rect(-60, -55, 90, 55); ctx.fill(); outline(ctx);
  ctx.fillStyle = '#8a5a48'; ctx.beginPath(); ctx.moveTo(-66, -55); ctx.lineTo(-15, -85); ctx.lineTo(36, -55); ctx.closePath(); ctx.fill(); outline(ctx);
  ctx.fillStyle = shade; ctx.beginPath(); ctx.rect(30, -110, 34, 110); ctx.fill(); outline(ctx);
  ctx.fillStyle = slate; ctx.beginPath(); ctx.moveTo(26, -110); ctx.lineTo(47, -185); ctx.lineTo(68, -110); ctx.closePath(); ctx.fill(); outline(ctx);
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(47, -185); ctx.lineTo(47, -205); ctx.moveTo(40, -197); ctx.lineTo(54, -197); ctx.stroke();
  ctx.fillStyle = lit > 0 ? `rgba(255,200,110,${0.4 + lit * 0.6})` : '#3a3530';
  ctx.beginPath(); ctx.arc(47, -80, 7, Math.PI, 0); ctx.rect(40, -80, 14, 12); ctx.fill();
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-45 + i * 25, -32, 6, Math.PI, 0); ctx.rect(-51 + i * 25, -32, 12, 14); ctx.fill(); }
  ctx.restore();
}

function drawHouse(ctx, x, y, s, seed = 1, lit = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const w = 70 + U.hash(seed) * 40;
  ctx.fillStyle = U.hash(seed * 2) > .5 ? '#e6d6b4' : '#d4c09a';
  ctx.beginPath(); ctx.rect(-w / 2, -50, w, 50); ctx.fill(); outline(ctx);
  ctx.fillStyle = U.hash(seed * 3) > .5 ? '#9b5c44' : '#6d6a70';
  ctx.beginPath(); ctx.moveTo(-w / 2 - 8, -50); ctx.lineTo(-w / 2 + 14, -82); ctx.lineTo(w / 2 - 14, -82); ctx.lineTo(w / 2 + 8, -50); ctx.closePath(); ctx.fill(); outline(ctx);
  ctx.fillStyle = lit > 0 ? `rgba(255,196,100,${0.35 + lit * 0.65})` : '#4a5560';
  for (let i = 0; i < 2; i++) ctx.fillRect(-w / 2 + 12 + i * (w - 36), -38, 12, 14);
  ctx.fillStyle = '#5b4030'; ctx.fillRect(-6, -24, 12, 24);
  ctx.restore();
}

/* Side-on world (camera beside the road, car facing right). */
function farY(u) { return 560 - 70 * U.noise1(u / 380) - 25 * U.noise1(u / 120 + 9); }
function midY(u) { return 650 - 85 * U.noise1(u / 520 + 3) - 15 * U.noise1(u / 150 + 1); }

function drawFarHills(ctx, scroll, col = [118, 136, 150]) {
  ctx.fillStyle = U.rgb(col);
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 10) ctx.lineTo(x, farY(x + scroll * 0.08));
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
}

function drawVineHills(ctx, scroll, lit = 0) {
  const par = 0.32, off = scroll * par;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 10) ctx.lineTo(x, midY(x + off));
  ctx.lineTo(W, H); ctx.closePath();
  ctx.fillStyle = '#6f9a46'; ctx.fill();
  ctx.clip();
  // vine rows running up the slope
  const sp = 24, o = off % sp;
  ctx.lineCap = 'round';
  for (let x0 = -400 - o; x0 < W + 200; x0 += sp) {
    ctx.strokeStyle = '#3f6b2c'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(x0, H); ctx.lineTo(x0 + 300, 480); ctx.stroke();
    ctx.strokeStyle = 'rgba(170,200,100,.55)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x0 - 4, H); ctx.lineTo(x0 + 296, 480); ctx.stroke();
  }
  ctx.restore();
  // villages / churches / lone trees sitting on the hill line
  const cell = 620, first = Math.floor(off / cell) - 1;
  for (let c = first; c < first + 5; c++) {
    const h = U.hash(c * 3.7);
    const x = c * cell + U.hash(c + 11) * 320 - off;
    const y = midY(x + off) + 8;
    if (h < 0.3) drawChurch(ctx, x, y, 0.55, lit);
    else if (h < 0.55) { drawHouse(ctx, x - 30, y, 0.5, c, lit); drawHouse(ctx, x + 26, y + 3, 0.45, c + 5, lit); }
    else if (h < 0.8) drawTree(ctx, x, y + 4, 0.42, c);
  }
}

function drawForestBand(ctx, scroll, par, base, height, col, seed = 0, spacing = 46) {
  const off = scroll * par, first = Math.floor((off - 200) / spacing);
  for (let i = first; i < first + Math.ceil((W + 400) / spacing); i++) {
    const x = i * spacing - off, hh = height * (0.65 + 0.45 * U.hash(i * 1.7 + seed));
    const c = U.mix(col, [10, 24, 14], U.hash(i * 5.1 + seed) * 0.5);
    ctx.fillStyle = '#3b2c22'; ctx.fillRect(x - 5, base - hh * 0.45, 10, hh * 0.45);
    ctx.fillStyle = U.rgb(c);
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(x + (U.hash(i + k) - .5) * 40, base - hh * (0.45 + k * 0.17), hh * (0.28 - k * 0.04), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function roadBump(u, amt = 1) { return ((U.noise1(u / 70) - .5) * 16 + (U.noise1(u / 23 + 5) - .5) * 6) * amt; }

function drawRoadSide(ctx, scroll, top = 805) {
  ctx.fillStyle = '#5f7f3a'; ctx.fillRect(0, top - 14, W, 20);           // grass verge
  ctx.fillStyle = '#6b4c32'; ctx.fillRect(0, top, W, H - top);             // mud
  ctx.save();
  for (let i = Math.floor((scroll - 100) / 90); i < Math.floor((scroll + W + 100) / 90); i++) {
    const x = i * 90 - scroll;
    if (U.hash(i) > .55) {                                                 // puddles
      ctx.fillStyle = 'rgba(150,160,172,.45)';
      ctx.beginPath(); ctx.ellipse(x, top + 30 + U.hash(i * 2) * 50, 40 + U.hash(i * 3) * 50, 7, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(40,26,16,.5)'; ctx.lineWidth = 3;               // ruts
    ctx.beginPath(); ctx.moveTo(x, top + 22); ctx.lineTo(x + 70, top + 24); ctx.moveTo(x + 20, top + 64); ctx.lineTo(x + 85, top + 62); ctx.stroke();
  }
  ctx.restore();
}

/* ---------- Painted side-on vineyard (your artwork, shot 0) ---------- */
function drawTiled(ctx, img, off, y, s) {
  const w = img.width * s, h = img.height * s;
  let x = -(((off % w) + w) % w);
  for (; x < W; x += w) ctx.drawImage(img, Math.floor(x), y, Math.ceil(w) + 1, h);
}
function drawStormClouds(ctx, light, drift = 0) {
  const storm = U.clamp(1 - light);
  if (storm <= 0.02) return;
  ctx.save(); ctx.globalAlpha = storm * 0.9;
  for (let i = 0; i < 10; i++) {
    const cx = ((U.hash(i * 9.1) * W * 1.4 - drift * (0.3 + U.hash(i) * 0.4)) % (W + 600) + W + 600) % (W + 600) - 300;
    const cy = 50 + U.hash(i * 3.3) * 220, r = 150 + U.hash(i) * 170;
    const cg = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
    cg.addColorStop(0, 'rgba(46,50,64,0.95)'); cg.addColorStop(1, 'rgba(46,50,64,0)');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.7, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function mist(ctx, a, y0 = 0) {
  if (a <= 0.01) return;
  const g = ctx.createLinearGradient(0, y0, 0, H);
  g.addColorStop(0, `rgba(150,156,176,${a * 0.4})`); g.addColorStop(0.5, `rgba(150,156,176,${a})`); g.addColorStop(1, `rgba(150,156,176,${a * 0.6})`);
  ctx.fillStyle = g; ctx.fillRect(0, y0, W, H - y0);
}
function drawPaintedVineyard(ctx, o) {
  const { scroll, light, t = 0, rain = 0 } = o;
  const murk = U.clamp(1 - light);                      // 0 at dusk, 1 in the storm
  drawCover(ctx, A.scSky, 1.1, 0.5, 0.35, 75 - U.clamp(scroll * 0.01, 0, 150));
  drawStormClouds(ctx, light, scroll * 0.03);
  drawTiled(ctx, A.scFar, scroll * 0.08, 80, 1.0);
  mist(ctx, 0.08 + murk * 0.45, 380);                   // distance fades first as visibility drops
  drawTiled(ctx, A.scVines, scroll * 0.3, 162, 1.15);
  mist(ctx, 0.03 + murk * 0.25, 420);
  // occasional big shade trees, between the hillside and the roadside vines
  const par = 0.6, off = scroll * par, cell = 1300, ts = 0.55;
  for (let c = Math.floor(off / cell) - 1; c < Math.floor(off / cell) + 3; c++) {
    if (U.hash(c * 9.3) < 0.55) {
      const img = U.hash(c * 4.1) < 0.5 ? A.scTree : A.scTree2;
      const x = c * cell + U.hash(c) * 600 - off;
      ctx.drawImage(img, x - 512 * ts, 712 - 960 * ts, 1024 * ts, 1024 * ts);
    }
  }
  drawTiled(ctx, A.scRoadside, scroll * 0.85, 313, 0.85);
  drawTiled(ctx, A.scRoad, scroll, 790, 0.35);
  // raindrops landing in the mud: little expanding rings
  if (rain > 0.2) {
    ctx.save(); ctx.lineWidth = 1.5;
    const n = Math.round(rain * 40);
    for (let i = 0; i < n; i++) {
      const per = 0.6 + U.hash(i * 1.7) * 0.5, ph = (t + U.hash(i) * per) / per, cyc = Math.floor(ph), k = ph - cyc;
      const x = U.hash(i * 3.1 + cyc * 7.7) * W, y = 822 + U.hash(i * 5.3 + cyc * 2.9) * 70;
      ctx.strokeStyle = `rgba(225,230,240,${(1 - k) * 0.55})`;
      ctx.beginPath(); ctx.ellipse(x, y, 3 + k * 16, (3 + k * 16) * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
}

/* Painted side-on forest (shots 7 and 11): misty canopy far off, big trunks near the lane, the same muddy road. */
function drawPaintedForest(ctx, o) {
  const { scroll, light } = o;
  drawCover(ctx, A.scSky, 1.1, 0.5, 0.35);
  drawStormClouds(ctx, Math.min(light, 0.35), scroll * 0.03);
  drawTiled(ctx, A.forestFar, scroll * 0.15, 150, 1.0);
  mist(ctx, 0.4, 260);
  drawTiled(ctx, A.forestNear, scroll * 0.6, 805 - 640 * 1.2, 1.2);
  mist(ctx, 0.12, 400);
  drawTiled(ctx, A.scRoad, scroll, 790, 0.35);
}

/* Full side-on scene. mode: 'vines' | 'forest' */
function drawSideWorld(ctx, o) {
  const { scroll, light, mode = 'vines', lit = 0 } = o;
  if (mode === 'vines' && A.scVines) return drawPaintedVineyard(ctx, o);
  if (mode === 'forest' && A.forestFar) return drawPaintedForest(ctx, o);
  drawSky(ctx, light, 640);
  if (mode === 'vines') {
    drawFarHills(ctx, scroll);
    drawVineHills(ctx, scroll, lit);
    // big shade trees, nearer
    const par = 0.7, off = scroll * par, cell = 1150;
    for (let c = Math.floor(off / cell) - 1; c < Math.floor(off / cell) + 3; c++) {
      if (U.hash(c * 9.3) < 0.5) drawTree(ctx, c * cell + U.hash(c) * 500 - off, 800, 1.25, c, [70, 112, 52]);
    }
    // vine row along the roadside
    const off2 = scroll * 0.9;
    ctx.fillStyle = '#4c7a32';
    for (let x = -(off2 % 34) - 34; x < W + 34; x += 34) {
      ctx.beginPath(); ctx.arc(x, 790, 20, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#3a2a1c'; ctx.fillRect(x - 2, 772, 4, 22); ctx.fillStyle = '#4c7a32';
    }
  } else {
    drawFarHills(ctx, scroll, [60, 78, 72]);
    drawForestBand(ctx, scroll, 0.3, 720, 420, [40, 74, 46], 3, 40);
    drawForestBand(ctx, scroll, 0.6, 800, 520, [30, 62, 38], 7, 70);
  }
  drawRoadSide(ctx, scroll);
}

/* ---------- The 2CV, side view ---------- */
const CAR_BASE = 722;        // sprite y where tyres meet the road
function carWheelWorld(o) {
  const s = o.s;
  return CAR_WHEELS.map((wh, i) => {
    const wx = o.x + (wh.cx - 576) * s;
    const bump = roadBump(o.scroll + wx, o.bumpAmt ?? 1);
    return { x: wx, y: o.ground + bump - wh.r * s, r: wh.r * s };
  });
}
function carTransform(ctx, o) {
  const [r, f] = carWheelWorld(o), [R, F] = CAR_WHEELS;
  const ang = Math.atan2(f.y - r.y, f.x - r.x) - Math.atan2(F.cy - R.cy, F.cx - R.cx) + (o.tilt || 0);
  const mx = (r.x + f.x) / 2, my = (r.y + f.y) / 2 + (o.bob || 0);
  ctx.translate(mx, my); ctx.rotate(ang); ctx.scale(o.s, o.s);
  ctx.translate(-(R.cx + F.cx) / 2, -(R.cy + F.cy) / 2);
}
function drawCarSide(ctx, o) {
  // o: { x, ground, s, scroll, spin, tilt, bob, lights, bumpAmt, rotateAll }
  const wheels = carWheelWorld(o);
  ctx.save();
  if (o.rotateAll) { ctx.translate(o.x, o.ground); ctx.rotate(o.rotateAll); ctx.translate(-o.x, -o.ground); }
  wheels.forEach((w, i) => {
    const img = A.carWheels[i];
    ctx.save(); ctx.translate(w.x, w.y); ctx.rotate((o.spin ?? o.scroll) / w.r);
    ctx.drawImage(img, -img.width / 2 * o.s, -img.height / 2 * o.s, img.width * o.s, img.height * o.s);
    ctx.restore();
  });
  ctx.save(); carTransform(ctx, o);
  const wor = o.worried || 0;                       // 0 = happy faces, 1 = worried faces (crossfade)
  if (wor < 1) ctx.drawImage(A.carBody, 0, 0);
  if (wor > 0) { ctx.globalAlpha = wor; ctx.drawImage(A.carBodyWorried, 0, 0); ctx.globalAlpha = 1; }
  ctx.restore();
  ctx.restore();
  if (o.lights) drawCarLights(ctx, o);
  return wheels;
}
function drawCarLights(ctx, o) {
  ctx.save();
  if (o.rotateAll) { ctx.translate(o.x, o.ground); ctx.rotate(o.rotateAll); ctx.translate(-o.x, -o.ground); }
  {
    ctx.save(); carTransform(ctx, o);
    ctx.globalCompositeOperation = 'lighter';
    const lx = 1062, ly = 488;
    const g = ctx.createRadialGradient(lx, ly, 5, lx, ly, 900);
    g.addColorStop(0, `rgba(255,236,180,${0.55 * o.lights})`); g.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(lx, ly - 14); ctx.lineTo(lx + 1000, ly - 120); ctx.lineTo(lx + 1000, ly + 260); ctx.lineTo(lx, ly + 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(255,245,210,${0.9 * o.lights})`; ctx.beginPath(); ctx.arc(lx, ly, 16, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/* ---------- Particles: mud flung from the tyres ---------- */
class Particles {
  constructor() { this.p = []; }
  add(x, y, vx, vy, r, col, life = 1.5) { this.p.push({ x, y, vx, vy, r, col, life, age: 0 }); }
  update(dt, g = 1400) {
    for (const q of this.p) { q.age += dt; q.vy += g * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
    this.p = this.p.filter(q => q.age < q.life && q.y < H + 60);
  }
  draw(ctx) {
    for (const q of this.p) {
      ctx.fillStyle = q.col;
      ctx.globalAlpha = U.clamp(1 - q.age / q.life);
      ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r * 1.3, q.r, Math.atan2(q.vy, q.vx), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/* ---------- Rain & lightning ---------- */
function drawRain(ctx, t, level, wind = -0.28, speed = 1500) {
  if (level <= 0.01) return;
  const n = Math.round(level * 520);
  ctx.save();
  ctx.strokeStyle = 'rgba(205,215,235,0.38)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const hx = U.hash(i * 1.31), hy = U.hash(i * 7.17), len = 20 + U.hash(i * 3.3) * 26, sp = speed * (0.75 + U.hash(i * 2.93) * 0.5);
    const y = ((hy * (H + 80) + t * sp) % (H + 80)) - 40;
    const x = ((hx * (W + 300) + t * speed * wind * 0.6) % (W + 300) + W + 300) % (W + 300) - 150;
    ctx.moveTo(x, y); ctx.lineTo(x + wind * len, y + len);
  }
  ctx.stroke();
  ctx.restore();
}

function drawLightning(ctx, age, seed) {
  if (age < 0 || age > 0.9) return;
  // bolt
  if (age < 0.28) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    let x = 300 + U.hash(seed) * 1000, y = 0;
    ctx.beginPath(); ctx.moveTo(x, y);
    let i = 0;
    while (y < 520) { y += 30 + U.hash(seed + i) * 40; x += (U.hash(seed * 2 + i) - .5) * 90; ctx.lineTo(x, y); i++; }
    ctx.strokeStyle = 'rgba(200,220,255,0.5)'; ctx.lineWidth = 14; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 3.5; ctx.stroke();
    ctx.restore();
  }
  // flash
  const flick = age < 0.08 ? 0.75 : age < 0.14 ? 0.15 : age < 0.22 ? 0.55 : 0.55 * Math.exp(-(age - 0.22) * 6);
  ctx.fillStyle = `rgba(225,232,255,${flick})`;
  ctx.fillRect(0, 0, W, H);
}

/* ---------- Glass: rain haze, drops, mud, wipers ---------- */
class Glass {
  constructor(o) {
    this.path = o.path;           // fn(ctx) that builds the glass outline
    this.pivots = o.pivots;       // [{x,y}]
    this.len = o.len;
    this.rest = o.rest ?? Math.PI - 0.1;
    this.max = o.max ?? 0.33 * Math.PI;
    this.hazeCol = o.hazeCol || 'rgba(120,130,145,1)';
    this.haze = makeCanvas(W, H); this.hx = this.haze.getContext('2d');
    this.mud = makeCanvas(W, H); this.mx = this.mud.getContext('2d');
    this.mud2 = makeCanvas(W, H); this.mx2 = this.mud2.getContext('2d');
    this.phase = 0; this.prevA = this.rest; this.a = this.rest;
    this.wipers = false;
  }
  fillHaze(alpha = 1) { this.hx.globalAlpha = alpha; this.hx.fillStyle = this.hazeCol; this.hx.fillRect(0, 0, W, H); this.hx.globalAlpha = 1; }
  clearHaze() { this.hx.clearRect(0, 0, W, H); }
  angle(ph) { return this.rest + (this.max - this.rest) * (1 - Math.cos(ph)) / 2; }
  splat(n = 6, area = [200, 80, 1200, 300]) {
    const x = this.mx;
    for (let i = 0; i < n; i++) {
      const cx = area[0] + Math.random() * area[2], cy = area[1] + Math.random() * area[3], r = 18 + Math.random() * 55;
      x.fillStyle = `rgba(${86 + Math.random() * 30},${58 + Math.random() * 20},${34 + Math.random() * 14},0.92)`;
      x.beginPath(); x.ellipse(cx, cy, r, r * (0.6 + Math.random() * 0.4), Math.random() * 3, 0, Math.PI * 2); x.fill();
      for (let k = 0; k < 6; k++) {   // splatter specks
        const a = Math.random() * Math.PI * 2, d = r * (1 + Math.random() * 1.2);
        x.beginPath(); x.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 3 + Math.random() * 8, 0, Math.PI * 2); x.fill();
      }
      for (let k = 0; k < 3; k++) {   // drips
        const dx = cx + (Math.random() - .5) * r;
        x.fillRect(dx - 3, cy, 6 + Math.random() * 4, r * (0.8 + Math.random() * 1.6));
      }
    }
  }
  wedge(ctx, a0, a1, p) {
    const steps = 10, r0 = this.len * 0.18, r1 = this.len * 1.02;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) { const a = a0 + (a1 - a0) * i / steps; ctx.lineTo(p.x + Math.cos(a) * r1, p.y - Math.sin(a) * r1); }
    for (let i = steps; i >= 0; i--) { const a = a0 + (a1 - a0) * i / steps; ctx.lineTo(p.x + Math.cos(a) * r0, p.y - Math.sin(a) * r0); }
    ctx.closePath(); ctx.fill();
  }
  update(dt, o) {
    // o: { rain (0..1), refill (per sec), speed (sweeps/sec), mudSlide (px/sec) }
    const hx = this.hx;
    if (o.refill > 0) { hx.globalAlpha = 1 - Math.exp(-o.refill * dt); hx.fillStyle = this.hazeCol; hx.fillRect(0, 0, W, H); hx.globalAlpha = 1; }
    const drops = Math.round((o.rain || 0) * dt * 160 + Math.random());
    for (let i = 0; i < drops; i++) {
      const x = Math.random() * W, y = Math.random() * H, r = 2 + Math.random() * 6;
      hx.fillStyle = 'rgba(30,36,48,0.35)'; hx.beginPath(); hx.arc(x, y + 1, r, 0, Math.PI * 2); hx.fill();
      hx.fillStyle = 'rgba(230,236,245,0.55)'; hx.beginPath(); hx.arc(x - r * .3, y - r * .3, r * .45, 0, Math.PI * 2); hx.fill();
    }
    // wipers
    this.prevA = this.a;
    if (this.wipers || (this.phase % (Math.PI * 2)) > 0.001) {
      const before = this.phase;
      this.phase += dt * (o.speed || 1.1) * Math.PI * 2;
      if (!this.wipers && Math.floor(before / (Math.PI * 2)) !== Math.floor(this.phase / (Math.PI * 2))) this.phase = Math.ceil(before / (Math.PI * 2)) * Math.PI * 2;
    }
    this.a = this.angle(this.phase);
    if (Math.abs(this.a - this.prevA) > 1e-4) {
      hx.globalCompositeOperation = 'destination-out'; hx.fillStyle = '#000';
      this.mx.globalCompositeOperation = 'destination-out'; this.mx.fillStyle = 'rgba(0,0,0,0.35)';
      for (const p of this.pivots) { this.wedge(hx, this.prevA, this.a, p); this.wedge(this.mx, this.prevA, this.a, p); }
      hx.globalCompositeOperation = 'source-over'; this.mx.globalCompositeOperation = 'source-over';
    }
    // mud slides slowly down the glass and thins out
    const slide = (o.mudSlide ?? 40) * dt;
    this.mx2.clearRect(0, 0, W, H);
    this.mx2.globalAlpha = Math.pow(0.82, dt);
    this.mx2.drawImage(this.mud, 0, slide);
    this.mx2.globalAlpha = 1;
    [this.mud, this.mud2] = [this.mud2, this.mud]; [this.mx, this.mx2] = [this.mx2, this.mx];
  }
  draw(ctx, hazeMax = 0.8, drawWipers = true) {
    ctx.save(); this.path(ctx); ctx.clip();
    ctx.globalAlpha = hazeMax; ctx.drawImage(this.haze, 0, 0);
    ctx.globalAlpha = 1; ctx.drawImage(this.mud, 0, 0);
    ctx.restore();
    if (drawWipers) this.drawWipers(ctx);
  }
  drawWipers(ctx) {
    for (const p of this.pivots) {
      const c = Math.cos(this.a), s = -Math.sin(this.a), L = this.len;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#1b1b1d'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + c * L * 0.5, p.y + s * L * 0.5 - 6); ctx.lineTo(p.x + c * L, p.y + s * L); ctx.stroke();
      ctx.strokeStyle = '#0c0c0c'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(p.x + c * L * 0.2, p.y + s * L * 0.2); ctx.lineTo(p.x + c * L * 1.02, p.y + s * L * 1.02); ctx.stroke();
      ctx.fillStyle = '#2a2a2c'; ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
    }
  }
}

/* ---------- Inside the car, looking out (painted interiors, green windows keyed out) ----------
   The interiors are 16:9 and fill the 1600x900 frame. The windscreen sits in the band
   x 340..1260, y 232..464; between the two heads it's clear from x 585 to 1025. */
const WINDSCREEN = { cx: 800, cy: 348, top: 232, bottom: 464 };
function makeInsideGlass(hazeCol) {
  // haze and mud cover the whole frame; the interior painting on top leaves them visible only in the windows
  return new Glass({ path: c => { c.beginPath(); c.rect(0, 0, W, H); }, pivots: [{ x: 600, y: 486 }, { x: 1010, y: 486 }], len: 300, hazeCol });
}
function drawInterior(ctx, img, light = 1, o = {}) {
  ctx.save();
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  if (o.scale) { ctx.translate(WINDSCREEN.cx, WINDSCREEN.cy); ctx.scale(o.scale, o.scale); ctx.translate(-WINDSCREEN.cx, -WINDSCREEN.cy); }
  const b = U.clamp(1 - (1 - Math.min(light, 1)) * 0.6, 0.35, 1);
  if (b < 0.99) ctx.filter = `brightness(${b.toFixed(3)})`;
  ctx.drawImage(img, 0, 0, W, H);
  ctx.restore();
}

/* ---------- Forward view (a painted picture out of the windscreen) ----------
   The picture is drawn to cover the frame with its focus point (fx, fy) at the windscreen centre.
   o: { zoom, fx, fy, light, sway, lights } */
function drawForwardImg(ctx, img, o) {
  const fx = o.fx ?? 0.5, fy = o.fy ?? 0.42, z = o.zoom ?? 1.15;
  const sc = Math.max(W / img.width, H / img.height) * z, w = img.width * sc, h = img.height * sc;
  ctx.save();
  if (o.sway) { ctx.translate(800, 600); ctx.rotate(o.sway); ctx.translate(-800, -600); }
  ctx.drawImage(img, WINDSCREEN.cx - w * fx, WINDSCREEN.cy - h * fy, w, h);
  ctx.restore();
  darken(ctx, U.clamp((1 - o.light) * 0.75));
  if (o.lights) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(800, 470, 20, 800, 400, 420);
    g.addColorStop(0, `rgba(255,232,170,${0.3 * o.lights})`); g.addColorStop(1, 'rgba(255,232,170,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(480, 560); ctx.lineTo(740, 340); ctx.lineTo(860, 340); ctx.lineTo(1120, 560); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

/* ---------- Bistro set (painted props, magenta keyed and trimmed) ----------
   Anchored bottom-centre on the ground. In units of s: a chair is 310 tall, the table with its bottle 500. */
const CHAIR_H = 310, TABLE_H = 500;
function drawChair(ctx, x, y, s, flip = 1, tip = 0) {
  const img = A.chair, h = CHAIR_H, w = img.width * h / img.height;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * flip, s);
  if (tip) { ctx.translate(-w * 0.4, 0); ctx.rotate(-tip); ctx.translate(w * 0.4, 0); }   // tips up on its back foot
  ctx.drawImage(img, -w / 2, -h, w, h);
  ctx.restore();
}
function drawTable(ctx, x, y, s) {
  const img = A.table, h = TABLE_H, w = img.width * h / img.height;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.drawImage(img, -w / 2, -h, w, h);
  ctx.restore();
}
function drawBottle(ctx, x, y, h, rot = 0) {   // bottom-centre anchored
  const img = A.bottle, k = h / 680;              // bottle spans ~65..745 px of the 800px image
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.drawImage(img, -300 * k, -745 * k, 600 * k, 800 * k);
  ctx.restore();
}
/* A matte champagne cork: rounded mushroom head of agglomerated cork, a slightly pinched waist,
   and a stem with two lighter natural-cork discs at the bottom. Origin = where it meets the lip. */
function drawCork(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(-13, 34);                                   // stem bottom
    ctx.lineTo(-13, 0);
    ctx.quadraticCurveTo(-13, -5, -17, -8);                // waist flaring into the head
    ctx.bezierCurveTo(-24, -12, -25, -30, -20, -38);       // head side
    ctx.quadraticCurveTo(0, -48, 20, -38);                 // domed top
    ctx.bezierCurveTo(25, -30, 24, -12, 17, -8);
    ctx.quadraticCurveTo(13, -5, 13, 0);
    ctx.lineTo(13, 34); ctx.closePath();
  };
  // body: matte, soft side shading only
  const g = ctx.createLinearGradient(-25, 0, 25, 0);
  g.addColorStop(0, '#8a6440'); g.addColorStop(0.35, '#b08458'); g.addColorStop(0.6, '#a87d52'); g.addColorStop(1, '#7c5836');
  shape(); ctx.fillStyle = g; ctx.fill();
  ctx.save(); shape(); ctx.clip();
  // two lighter natural-cork discs at the base of the stem
  ctx.fillStyle = 'rgba(214,184,140,.55)'; ctx.fillRect(-14, 20, 28, 6); ctx.fillRect(-14, 28, 28, 6);
  ctx.strokeStyle = 'rgba(90,60,35,.35)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-14, 20); ctx.lineTo(14, 20); ctx.moveTo(-14, 27); ctx.lineTo(14, 27); ctx.stroke();
  // granular texture: little dark flecks and pale grains
  for (let i = 0; i < 70; i++) {
    const px = (U.hash(i * 3.17) - 0.5) * 48, py = -46 + U.hash(i * 7.31) * 80, r = 0.6 + U.hash(i * 1.9) * 1.3;
    ctx.fillStyle = U.hash(i * 5.5) > 0.4 ? 'rgba(70,45,25,.45)' : 'rgba(225,200,160,.4)';
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  }
  // gentle shadow under the dome, faint rim on top (no shine)
  ctx.fillStyle = 'rgba(60,40,22,.25)'; ctx.fillRect(-20, -10, 40, 6);
  ctx.fillStyle = 'rgba(230,205,165,.18)'; ctx.beginPath(); ctx.ellipse(0, -41, 15, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  shape(); ctx.strokeStyle = 'rgba(70,46,26,.7)'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.restore();
}
/* Two chairs either side of the table. o: { table:false, tipL, tipR } */
function drawBistro(ctx, x, y, s, o = {}) {
  drawChair(ctx, x - 170 * s, y + 6 * s, s, 1, o.tipL || 0);
  drawChair(ctx, x + 170 * s, y + 6 * s, s, -1, o.tipR || 0);
  if (o.table !== false) drawTable(ctx, x, y, s);
}

function drawRainbow(ctx, alpha, cx = 980, cy = 760, r = 620) {
  if (alpha <= 0) return;
  const cols = ['#e8443a', '#f39a2c', '#f6d84a', '#5cb85c', '#3d8fd6', '#5b5bc8', '#8f53b8'];
  ctx.save(); ctx.globalAlpha = alpha * 0.55; ctx.lineWidth = 16;
  cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(cx, cy, r - i * 15, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); });
  ctx.restore();
}

function drawCover(ctx, img, zoom = 1, fx = 0.5, fy = 0.5, ox = 0, oy = 0) {
  const sc = Math.max(W / img.width, H / img.height) * zoom;
  const w = img.width * sc, h = img.height * sc;
  ctx.drawImage(img, W * fx - w * fx + ox, H * fy - h * fy + oy, w, h);
}

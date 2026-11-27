/* App flow: loading → bottle (tap 4×) → cork pop + bubbles → opening sequence (first visit) → menu. */
'use strict';

const CONFIG = {
  firstReveal: new Date('2027-01-01T08:00:00'),   // placeholder: reveal day not decided yet
};

const $ = s => document.querySelector(s);
const stage = $('#stage'), sctx = stage.getContext('2d');
const params = new URLSearchParams(location.search);

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode: fine */ } },
  del(k) { try { localStorage.removeItem(k); } catch { } },
};
if (params.has('reset')) store.del('introSeen');
if (params.has('mute')) SFX.muted = true;

function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }

/* ---------- Stage canvas + render loop ---------- */
let dpr = 1, mode = null;   // mode: { frame(dt) }
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  // size the pixels to the canvas as laid out (100vw x 100dvh), falling back to the window
  const w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight;
  stage.width = Math.round(w * dpr); stage.height = Math.round(h * dpr);
  $('#rotate-hint').hidden = !(Intro.running && !Intro.menuShown && h > w);
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 250));
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  // iPhones sometimes report the old size right after rotating: re-check against the real CSS size
  if (stage.clientWidth && (Math.abs(stage.width - Math.round(stage.clientWidth * dpr)) > 2 ||
      Math.abs(stage.height - Math.round(stage.clientHeight * dpr)) > 2)) resize();
  if (mode) mode.frame(dt);
  requestAnimationFrame(loop);
}

/* ---------- Bottle screen ---------- */
const bottleCanvas = $('#bottle-canvas');
let taps = 0, popping = false, corkLift = 0, corkLiftTarget = 0, idleTimer = null, bottleBase = null;
const CORK = { x: 301, y: 103, s: 1.38, lip: 93 };   // cork seat in bottle-image pixels

/* The bottle with its foil torn off: green glass neck, lip, wire cage ring (the cork is drawn live). */
function makeOpenBottle() {
  const c = makeCanvas(600, 800), x = c.getContext('2d');
  x.drawImage(A.bottle, 0, 0);
  // tear away the foil capsule above a ragged edge
  x.globalCompositeOperation = 'destination-out';
  x.beginPath(); x.moveTo(240, 0); x.lineTo(360, 0); x.lineTo(360, 140);
  for (let px = 360; px >= 240; px -= 6) x.lineTo(px, 140 + (U.hash(px) - 0.5) * 10 + (px % 12 ? 3 : -2));
  x.closePath(); x.fill();
  // glass neck behind the remaining foil
  x.globalCompositeOperation = 'destination-over';
  const g = x.createLinearGradient(268, 0, 334, 0);
  g.addColorStop(0, '#0b1f15'); g.addColorStop(0.3, '#2c5a3f'); g.addColorStop(0.42, '#5d8a6c'); g.addColorStop(0.55, '#244b34'); g.addColorStop(1, '#09180f');
  x.fillStyle = g;
  x.beginPath(); x.moveTo(273, 160); x.lineTo(274, 104); x.lineTo(328, 104); x.lineTo(329, 160); x.closePath(); x.fill();
  x.globalCompositeOperation = 'source-over';
  // the lip (bead) of the bottle
  x.fillStyle = g; x.beginPath(); x.roundRect(268, 92, 66, 14, 6); x.fill();
  x.strokeStyle = 'rgba(160,200,170,.45)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(272, 95); x.lineTo(330, 95); x.stroke();
  return c;
}
function drawBottleFrame() {
  const x = bottleCanvas.getContext('2d');
  x.clearRect(0, 0, 600, 800);
  x.drawImage(bottleBase, 0, 0);
  if (popping) return;
  // the cork, creeping out of the neck as the pressure builds
  x.save();
  x.beginPath(); x.rect(0, 0, 600, CORK.lip + 2); x.clip();    // the part still inside the neck is hidden
  drawCork(x, CORK.x, CORK.y - corkLift, CORK.s, 0);
  x.restore();
}
function setupBottle() {
  bottleCanvas.width = 600; bottleCanvas.height = 800;
  bottleBase = makeOpenBottle();
  drawBottleFrame();
  $('.bottle-stage').addEventListener('pointerdown', onTap);
  // ease the cork towards its target lift
  (function corkLoop() {
    if (popping) return;
    if (Math.abs(corkLift - corkLiftTarget) > 0.05) { corkLift += (corkLiftTarget - corkLift) * 0.12; drawBottleFrame(); }
    requestAnimationFrame(corkLoop);
  })();
  scheduleNudge();
}
// If she doesn't touch it, the bottle gives a tiny wobble now and then.
function scheduleNudge() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (taps > 0 || popping) return;
    bottleCanvas.classList.remove('nudge'); void bottleCanvas.offsetWidth; bottleCanvas.classList.add('nudge');
    scheduleNudge();
  }, 5000 + Math.random() * 4000);
}
/* Android: go true full screen (no status bar, address bar or camera strip) on the first tap.
   Browsers only allow it from a tap. iPhones don't support it for pages; that's fine, nothing happens. */
function goFullscreen() {
  const el = document.documentElement, fn = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!fn || document.fullscreenElement || document.webkitFullscreenElement) return;
  try { const p = fn.call(el, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } catch { }
}
function onTap() {
  if (popping) return;
  SFX.init();
  goFullscreen();
  clearTimeout(idleTimer);
  taps++;
  bottleCanvas.classList.remove('nudge', 'tap1', 'tap2', 'tap3');
  void bottleCanvas.offsetWidth;   // restart the animation
  if (taps < 4) {
    bottleCanvas.classList.add('tap' + taps);
    corkLiftTarget = [0, 3, 7, 13][taps];
    SFX.tick(0.08 + taps * 0.05);
    SFX.hiss(taps);
    if (navigator.vibrate) navigator.vibrate(12 * taps);
    return;
  }
  popping = true;
  drawBottleFrame();               // the cork leaves the bottle…
  popCork();                       // …and flies off in the pop animation
}

/* Cork pops, foam gushes, then bubbles pour down the screen for 3 seconds. */
function popCork() {
  const r = bottleCanvas.getBoundingClientRect();
  const sc = r.height / 800 * dpr;
  const neck = { x: (r.left + r.width * CORK.x / 600) * dpr, y: (r.top + r.height * (CORK.y - corkLift) / 800) * dpr };
  SFX.pop(); SFX.fizz(3.6, 0.2);
  if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
  stage.classList.add('on'); stage.classList.remove('solid');
  const foam = [], bubbles = [];
  let t = 0, done = false;
  mode = {
    frame(dt) {
      t += dt;
      const cw = stage.width, ch = stage.height, x = sctx;
      x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cw, ch);
      // golden wash builds up behind the bubbles
      const wash = U.clamp((t - 0.6) / 2.2);
      if (wash > 0) {
        const g = x.createLinearGradient(0, 0, 0, ch);
        g.addColorStop(0, `rgba(248,222,140,${0.9 * wash})`); g.addColorStop(1, `rgba(226,169,42,${0.95 * wash})`);
        x.fillStyle = g; x.fillRect(0, 0, cw, ch);
      }
      // cork + cage flying off
      const ca = t;
      if (ca < 1.5) drawCork(x, neck.x + ca * 420 * dpr, neck.y - ca * 1500 * dpr + ca * ca * 1400 * dpr, sc * CORK.s, ca * 12);
      // foam gush from the neck
      if (t < 0.7) for (let i = 0; i < 14; i++) foam.push({ x: neck.x, y: neck.y, vx: (Math.random() - .5) * 500 * dpr, vy: (-600 - Math.random() * 900) * dpr, r: (3 + Math.random() * 7) * dpr, age: 0 });
      x.fillStyle = 'rgba(255,248,225,.9)';
      for (const f of foam) { f.age += dt; f.vy += 1500 * dpr * dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.age < 1.4) { x.globalAlpha = 1 - f.age / 1.4; x.beginPath(); x.arc(f.x, f.y, f.r, 0, Math.PI * 2); x.fill(); } }
      x.globalAlpha = 1;
      // bubbles pouring down the screen
      if (t > 0.25 && t < 3.3) {
        const n = Math.round(U.lerp(6, 40, U.clamp((t - 0.25) / 1.5)));
        for (let i = 0; i < n; i++) bubbles.push({ x: Math.random() * cw, y: -20 * dpr - Math.random() * 60 * dpr, v: (250 + Math.random() * 700) * dpr, r: (2 + Math.random() * 10) * dpr, ph: Math.random() * 6 });
      }
      for (const b of bubbles) {
        b.y += b.v * dt; b.ph += dt * 3;
        const bx = b.x + Math.sin(b.ph) * 8 * dpr;
        x.strokeStyle = 'rgba(255,246,214,.85)'; x.lineWidth = 1.3 * dpr;
        x.beginPath(); x.arc(bx, b.y, b.r, 0, Math.PI * 2); x.stroke();
        x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(bx - b.r * .35, b.y - b.r * .35, b.r * .3, 0, Math.PI * 2); x.fill();
      }
      for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].y > ch + 30) bubbles.splice(i, 1);
      // fade out to the next screen
      if (t > 3.3) {
        x.fillStyle = `rgba(18,18,18,${U.clamp((t - 3.3) / 0.6)})`; x.fillRect(0, 0, cw, ch);
      }
      if (t > 3.9 && !done) { done = true; afterPop(); }
    },
  };
}

function afterPop() {
  show(null);
  const seen = store.get('introSeen') === '1';
  startIntro(seen ? SHOTS.length - 1 : 0);
}

/* ---------- Tweak bar (?tweak): pause / step / jump through the film while we fine-tune it ----------
   TEMPORARY. To remove: delete this block, the two "Tweak" lines in startIntro, and .tweak in style.css. */
const Tweak = {
  on: params.has('tweak'), paused: false, stepBy: 0, bar: null,
  dt(dt) {                                   // the time to advance this frame, or null to hold the picture
    if (!this.paused) return dt;
    if (this.stepBy) { const s = this.stepBy; this.stepBy = 0; return s; }
    return null;
  },
  setPaused(p) {
    this.paused = p;
    if (SFX.ctx) p ? SFX.ctx.suspend() : SFX.ctx.resume();
    if ('speechSynthesis' in window) p ? speechSynthesis.pause() : speechSynthesis.resume();
    this.update();
  },
  jump(i) {
    i = U.clamp(i, 0, SHOTS.length - 1);
    SFX.birds(false); if ('speechSynthesis' in window) speechSynthesis.cancel();
    Intro.menuShown = false; hideMenu(); Intro.running = true;
    Intro.go(i); this.stepBy = 1 / 30;       // draw its first frame even while paused
    this.update();
  },
  show() {
    if (this.bar) { this.bar.hidden = false; return; }
    const b = this.bar = document.createElement('div');
    b.className = 'tweak';
    b.innerHTML = '<button data-k="prev" title="Previous shot">⏮</button><button data-k="back" title="Restart this shot">↺</button>' +
      '<button data-k="play" title="Play / pause (space)">⏸</button><button data-k="step" title="Step 0.1 s">+0.1s</button>' +
      '<button data-k="next" title="Next shot">⏭</button><span></span>';
    b.addEventListener('click', e => {
      const k = e.target.dataset && e.target.dataset.k;
      if (k === 'play') this.setPaused(!this.paused);
      else if (k === 'step') { if (!this.paused) this.setPaused(true); this.stepBy = 0.1; }
      else if (k === 'prev') this.jump(Intro.idx - 1);
      else if (k === 'next') this.jump(Intro.idx + 1);
      else if (k === 'back') this.jump(Intro.idx);
      e.stopPropagation();
    });
    addEventListener('keydown', e => {
      if (e.key === ' ') { e.preventDefault(); this.setPaused(!this.paused); }
      else if (e.key === 'ArrowRight') { if (!this.paused) this.setPaused(true); this.stepBy = 0.1; }
      else if (e.key === 'ArrowUp' || e.key === 'PageDown') this.jump(Intro.idx + 1);
      else if (e.key === 'ArrowDown' || e.key === 'PageUp') this.jump(Intro.idx - 1);
    });
    document.body.append(b);
    setInterval(() => this.update(), 100);
  },
  update() {
    if (!this.bar) return;
    this.bar.querySelector('[data-k="play"]').textContent = this.paused ? '▶' : '⏸';
    const sh = SHOTS[Intro.idx] || {};
    this.bar.querySelector('span').textContent = `Shot ${Intro.idx} · ${sh.name || ''} · ${(Intro.t || 0).toFixed(1)} s / ${sh.dur || 0}`;
  },
};

/* ---------- Intro ---------- */
function startIntro(from = 0) {
  stage.classList.add('on', 'solid');
  hideMenu();
  Intro.start(sctx, { from, onMenu: showMenu });
  $('#skip').hidden = from >= SHOTS.length - 1;
  resize();
  if (Tweak.on) Tweak.show();
  mode = {
    frame(dt) {
      if (Tweak.on) { dt = Tweak.dt(dt); if (dt === null) return; }   // paused: keep the frame on screen
      // Fill the screen. Wider than 16:9 (a phone held sideways, even with the browser bar showing,
      // up to ~2.6:1): always fill the width and trim the spare height. Narrower (tablets): scale up
      // past "fit" by at most 25%. The trim happens where each shot can lose it: shot.fy is
      // 0 = keep the top, 0.5 = trim evenly, 1 = keep the bottom (a number, or fn(t)).
      // VIEW tells the shots which rows of the 1600x900 frame are actually on screen.
      const cw = stage.width, ch = stage.height;
      const sc = cw / ch >= W / H ? cw / W : Math.min(ch / H, (cw / W) * 1.25);
      const sh = SHOTS[Intro.idx] || {}, spare = ch - H * sc;
      const fy = spare >= 0 ? 0.5 : (typeof sh.fy === 'function' ? sh.fy(Intro.t) : (sh.fy ?? 0.5));
      VIEW.top = Math.max(0, -spare * fy / sc); VIEW.bottom = Math.min(H, VIEW.top + ch / sc);
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.fillStyle = '#000'; sctx.fillRect(0, 0, cw, ch);
      sctx.setTransform(sc, 0, 0, sc, (cw - W * sc) / 2, spare * fy);
      sctx.save(); sctx.beginPath(); sctx.rect(0, 0, W, H); sctx.clip();
      Intro.frame(sctx, dt);
      sctx.restore();
    },
  };
}
$('#skip').addEventListener('click', () => {
  SFX.setRain(0); SFX.setEngine(0);
  Intro.go(SHOTS.length - 1);
  $('#skip').hidden = true;
});

/* ---------- Menu ---------- */
function showMenu() {
  store.set('introSeen', '1');
  $('#skip').hidden = true; $('#rotate-hint').hidden = true;
  const m = $('#menu');
  m.classList.add('active'); m.classList.remove('standalone');
  requestAnimationFrame(() => m.classList.add('shown'));
  updateNextReveal();
}
function hideMenu() { const m = $('#menu'); m.classList.remove('active', 'shown'); $('#menu-toast').hidden = true; }

function daysUntil(d) { return Math.ceil((d - new Date()) / 86400000); }
function updateNextReveal() {
  const n = daysUntil(CONFIG.firstReveal);
  $('#next-reveal').textContent = n > 0 ? `First reveal in ${n} day${n === 1 ? '' : 's'}` : "This week's reveal";
  $('#french-sub').textContent = Lessons.menuLabel();
}
document.addEventListener('lessonclosed', () => {
  // a lesson opened straight from a link (?lesson=N) has no menu under it: bring up the menu scene
  if (!$('#menu').classList.contains('active')) { SFX.init(); startIntro(SHOTS.length - 1); }
  updateNextReveal();
});
function toast(html) { const t = $('#menu-toast'); t.innerHTML = html; t.hidden = false; }

$('#menu').addEventListener('click', e => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  SFX.init();
  if (b.dataset.action === 'replay') goFullscreen();
  const a = b.dataset.action;
  if (a === 'replay') { SFX.stopAll(); startIntro(0); }
  else if (a === 'reveal') {
    const n = daysUntil(CONFIG.firstReveal);
    toast(n > 0 ? `🍾 Patience, Steph… the first secret is uncorked on <b>Friday 1 January</b>.` : `🍾 Your reveal is ready!`);
  } else if (a === 'french') {
    $('#menu-toast').hidden = true;
    if (!Lessons.openFromMenu()) toast(`🇫🇷 Your first French lesson unlocks on <b>Christmas Day</b>.`);
  } else if (a === 'trip') {
    toast(`🔒 <i>Le voyage</i> unlocks just before we leave in June.`);
  }
});

/* ---------- Boot ---------- */
(async function boot() {
  requestAnimationFrame(loop);
  try {
    await Promise.all([
      loadAssets(p => { $('#loading-text').textContent = `Un instant… ${Math.round(p * 100)}%`; }),
      // the title font: wait for it, but never more than 2 s (a slow connection must not block the app)
      Promise.race([
        document.fonts ? document.fonts.load('italic 700 100px "Playfair Display"').catch(() => { }) : null,
        new Promise(r => setTimeout(r, 2000)),
      ]),
    ]);
  } catch (err) {
    $('#loading-text').textContent = location.protocol === 'file:'
      ? 'Oh là là! Open this through the preview server: run "node reveal_app/serve.js", then go to http://localhost:8427/'
      : 'Oh là là, something did not load. ' + err.message;
    console.error(err);
    return;
  }
  setupBottle();
  resize();
  if (params.has('debug')) {            // dev: screen-size readout, e.g. ?shot=1&mute&debug
    const box = document.createElement('div'), probe = document.createElement('div');
    box.style.cssText = 'position:fixed;left:50%;top:40%;transform:translateX(-50%);z-index:99;background:rgba(0,0,0,.8);color:#ff0;font:14px/1.4 monospace;padding:8px 12px;border:2px solid #ff0;white-space:pre';
    probe.style.cssText = 'position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.append(box, probe);
    const tick = () => {
      const p = getComputedStyle(probe), vv = window.visualViewport, r = stage.getBoundingClientRect();
      box.textContent = `window ${innerWidth}x${innerHeight}  visual ${vv ? Math.round(vv.width) + 'x' + Math.round(vv.height) : '-'}\n` +
        `canvas css ${Math.round(r.width)}x${Math.round(r.height)} at ${Math.round(r.left)},${Math.round(r.top)}  px ${stage.width}x${stage.height}  dpr ${devicePixelRatio}\n` +
        `screen ${screen.width}x${screen.height}  safe T${p.paddingTop} R${p.paddingRight} B${p.paddingBottom} L${p.paddingLeft}\n` +
        `view rows ${Math.round(VIEW.top)}-${Math.round(VIEW.bottom)}  ${navigator.userAgent.match(/(iPhone|Android|CriOS|FxiOS|Version\/[\d.]+|Chrome\/\d+)/g)?.join(' ') || ''}`;
    };
    tick(); setInterval(tick, 1000);
  }
  if (params.has('lesson')) {           // dev: open a lesson straight away, e.g. ?lesson=0 (&tab=sayit)
    show(null); SFX.init();
    Lessons.open(Lessons.byWeek(+params.get('lesson') || 0), { tab: params.get('tab') || 'lesson' });
    return;
  }
  if (params.has('shot')) {             // dev: jump straight to a shot, e.g. ?shot=5
    show(null); SFX.init(); startIntro(U.clamp(+params.get('shot') || 0, 0, SHOTS.length - 1));
    return;
  }
  show('bottle-screen');
})();

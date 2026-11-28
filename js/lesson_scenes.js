/* Lesson scenes as SVG, viewBox 0 0 1000 625. Each tappable thing is a <g class="obj" data-id="…"> with no
   transform (the zoom uses getBBox). In the painted scenes the pictures sit OUTSIDE those groups; each .obj holds
   only an invisible hit shape and a soft spotlight (.hl) that pulses while it glows.
   Green-screen layers are keyed at lesson open (LESSON_SCENES.prepare) and swapped by pose (LESSON_SCENES.pose). */
'use strict';

/* sync_assets.ps1 copies every 'lessons/…' path in this file into assets/: keep one per line. */
const LESSON_ART = {
  terrasse: {
    bg: 'lessons/terrasse/terrace_bg.jpg',
    sj_table: 'lessons/terrasse/sj_table.jpg',
    sj_ordering: 'lessons/terrasse/sj_table_ordering.jpg',
    sj_cheers: 'lessons/terrasse/sj_table_cheers.jpg',
    w_tray: 'lessons/terrasse/serveur.jpg',
    w_bow: 'lessons/terrasse/serveur_bow.jpg',
  },
  restaurant: {
    bg: 'lessons/restaurant/restaurant_bg.jfif',
    sj_menus: 'lessons/restaurant/sj_menus.jfif',
    sj_asking: 'lessons/restaurant/sj_asking.jfif',
    sj_meal: 'lessons/restaurant/sj_meal.jfif',
    sj_bill: 'lessons/restaurant/sj_bill.jfif',
    w_bow: 'lessons/terrasse/serveur_bow.jpg',
    w_rose: 'lessons/restaurant/serveur_rose.jfif',
    w_machine: 'lessons/restaurant/serveur_machine.jfif',
  },
};

const LESSON_SCENES = {
  _keyed: {},   // path -> blob URL of the keyed picture (kept for the session)

  /* Key the green layers of a freshly built scene, then show them. */
  async prepare(svg) {
    const imgs = [...svg.querySelectorAll('image[data-key]')];
    await Promise.all(imgs.map(async im => {
      const path = im.dataset.key;
      if (!this._keyed[path]) {
        this._keyed[path] = (async () => {
          const raw = await loadImage(path);
          const c = keyGreen(raw, null, 4);
          const blob = await new Promise(r => c.toBlob(r, 'image/png'));
          return URL.createObjectURL(blob);
        })();
      }
      try { im.setAttribute('href', await this._keyed[path]); } catch (e) { console.warn(e); }
    }));
  },

  /* Show a pose per layer, e.g. { sj: 'ordering', serveur: 'bow' }. null = the scene's defaults (data-pose on the svg). */
  pose(svg, p) {
    if (!svg) return;
    p = p || JSON.parse(svg.dataset.pose || '{"sj":"table","serveur":"tray"}');
    for (const layer of Object.keys(p)) {
      svg.querySelectorAll(`.layer-${layer} .pose`).forEach(im => im.classList.toggle('on', im.dataset.pose === p[layer]));
    }
  },

  terrasse() {
    const ART = LESSON_ART.terrasse, bg = assetUrl('images/' + ART.bg);
    // S & J at their table (1152x864), scaled to the waiter (v1.04: was 0.56), feet on the tiles at y 600,
    // between the church and the waiter. Their content spans x 165-990, feet at y 830 in the picture.
    // v1.05: 20% bigger again (0.41 -> 0.492) and shifted left to x 350 so J's chair clears the waiter
    // v1.06: 7% smaller (0.492 -> 0.4576), kept centred where they were (x 553) with feet on the same line
    const sj = { s: 0.4576 }; sj.x = 553 - (165 + 990) / 2 * sj.s; sj.y = 600 - 830 * sj.s;
    const sjImg = (key, pose, on) => `<image class="pose${on ? ' on' : ''}" data-pose="${pose}" data-key="${ART[key]}" x="${sj.x}" y="${sj.y}" width="${1152 * sj.s}" height="${864 * sj.s}"/>`;
    // shapes over the S & J picture, given in that picture's pixels. Hit shapes are kept a little larger
    // than the things themselves so they are easy to tap on a phone.
    const P = (ix, iy) => [(sj.x + ix * sj.s).toFixed(1), (sj.y + iy * sj.s).toFixed(1)];
    const E = (ix, iy, rx, ry, a = '') => { const [cx, cy] = P(ix, iy); return `<ellipse ${a} cx="${cx}" cy="${cy}" rx="${(rx * sj.s).toFixed(1)}" ry="${(ry * sj.s).toFixed(1)}"/>`; };
    const R = (x0, y0, x1, y1, a = '') => { const [x, y] = P(x0, y0); return `<rect ${a} x="${x}" y="${y}" width="${((x1 - x0) * sj.s).toFixed(1)}" height="${((y1 - y0) * sj.s).toFixed(1)}"/>`; };
    // the waiter (832x1248) on the right. The tray picture faces right, so it is mirrored to face the table
    const wt = { x: 697, y: 126, s: 0.4 }, wb = { x: 696, y: 136, s: 0.4 };
    // the string of bulbs painted in the background (1280x800 -> x0.78125): a soft twinkle over each
    const BULBS = [[30, 207], [95, 212], [165, 208], [232, 195], [293, 175], [353, 148], [422, 165], [484, 184], [553, 196], [625, 203],
      [698, 198], [770, 188], [836, 172], [915, 147], [972, 175], [1037, 193], [1105, 208], [1177, 212], [1244, 207]]
      .map(([x, y]) => [+(x * .78125).toFixed(1), +(y * .78125).toFixed(1)]);
    const bulbs = BULBS.map(([x, y], i) => `<circle class="bulb" cx="${x}" cy="${y}" r="9" fill="url(#t-bulb)" style="animation-delay:${(i % 5) * .4}s"/>`).join('');
    const wire = 'M' + BULBS.map(([x, y]) => `${x} ${y - 6}`).join(' L');
    const hit = 'fill="#000" fill-opacity="0"';

    return `<svg class="art" viewBox="0 0 1000 625" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A café terrace among the vines at sunset">
<defs>
  <radialGradient id="t-bulb"><stop offset="0" stop-color="#FFF4C8" stop-opacity=".9"/><stop offset="1" stop-color="#FFD873" stop-opacity="0"/></radialGradient>
  <radialGradient id="hl-gold"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".75"/><stop offset=".6" stop-color="#F2C14E" stop-opacity=".35"/><stop offset="1" stop-color="#F2A900" stop-opacity="0"/></radialGradient>
  <radialGradient id="hl-green"><stop offset="0" stop-color="#B8F5C0" stop-opacity=".8"/><stop offset="1" stop-color="#7CDB8A" stop-opacity="0"/></radialGradient>
  <radialGradient id="hl-red"><stop offset="0" stop-color="#FFB3B3" stop-opacity=".8"/><stop offset="1" stop-color="#FF6B6B" stop-opacity="0"/></radialGradient>
</defs>
<image href="${bg}" x="0" y="0" width="1000" height="625" preserveAspectRatio="none"/>
${bulbs}

<g class="layer-sj">
  ${sjImg('sj_table', 'table', true)}${sjImg('sj_ordering', 'ordering')}${sjImg('sj_cheers', 'cheers')}
</g>
<g class="layer-serveur"><g class="waiter">
  <image class="pose on" data-pose="tray" data-key="${ART.w_tray}" x="0" y="0" width="832" height="1248" transform="translate(${wt.x + 832 * wt.s} ${wt.y}) scale(${-wt.s} ${wt.s})"/>
  <image class="pose" data-pose="bow" data-key="${ART.w_bow}" x="${wb.x}" y="${wb.y}" width="${832 * wb.s}" height="${1248 * wb.s}"/>
</g></g>

<g class="obj" data-id="terrasse">
  <ellipse class="hl" cx="170" cy="560" rx="190" ry="70"/><rect x="0" y="484" width="1000" height="141" ${hit}/>
</g>
<g class="obj" data-id="store">
  <ellipse class="hl" cx="500" cy="50" rx="560" ry="80"/><rect x="0" y="0" width="1000" height="104" ${hit}/>
</g>
<g class="obj" data-id="guirlande">
  ${BULBS.map(([x, y]) => `<circle class="hl" cx="${x}" cy="${y}" r="20"/>`).join('')}
  <path d="${wire}" fill="none" stroke="#000" stroke-opacity="0" stroke-width="44" stroke-linejoin="round"/>
</g>
<g class="obj" data-id="eglise">
  <ellipse class="hl" cx="334" cy="285" rx="62" ry="66"/><rect x="288" y="220" width="94" height="116" ${hit}/>
</g>
<g class="obj" data-id="soleil">
  <circle class="hl" cx="219" cy="277" r="72"/><circle cx="219" cy="277" r="52" ${hit}/>
</g>
<g class="obj" data-id="lune">
  <circle class="hl" cx="750" cy="205" r="42"/><circle cx="750" cy="205" r="34" ${hit}/>
</g>
<g class="obj" data-id="serveur">
  <ellipse class="hl" cx="868" cy="385" rx="95" ry="230"/><rect x="775" y="160" width="215" height="440" ${hit}/>
</g>
<g class="obj" data-id="chaise">
  ${E(218, 570, 100, 260, 'class="hl"')}${R(150, 340, 275, 815, hit)}
</g>
<g class="obj" data-id="table">
  ${E(580, 440, 215, 75, 'class="hl"')}${E(580, 438, 185, 50, hit)}${R(480, 470, 680, 800, hit)}
</g>
<g class="obj" data-id="bouteille">
  ${E(584, 325, 70, 145, 'class="hl"')}${E(584, 330, 48, 120, hit)}
</g>
<g class="obj" data-id="verre">
  ${E(510, 370, 52, 100, 'class="hl"')}${E(650, 370, 52, 100, 'class="hl"')}
  ${E(512, 370, 34, 88, hit)}${E(648, 370, 34, 88, hit)}
</g>
</svg>`;
  },

  /* Lesson 1: a cosy village restaurant at night. The background (1344x756) is 16:9, so it is scaled to the full
     height (x0.82672) and trimmed ~56 px at each side. In the viewBox: the till x 2-125, the wine rack x 230-473
     (y 103-316), the chalkboard x 508-686 (y 160-288), the toilet door x 755-887 (y 165-475, plaque at 817,234),
     the floor from y 475. S & J sit left of centre; the waiter stands on the right, just past the door's plaque. */
  restaurant() {
    const ART = LESSON_ART.restaurant, bg = assetUrl('images/' + ART.bg);
    // S & J (1152x864, the same framing in all four poses: content x 164-986, feet at y 826; the bucket stand in
    // sj_meal reaches y 858). Same size as on the terrace, centred on x 440, feet at y 605.
    const sj = { s: 0.4576 }; sj.x = 440 - (164 + 986) / 2 * sj.s; sj.y = 605 - 826 * sj.s;
    const sjImg = (key, pose, on) => `<image class="pose${on ? ' on' : ''}" data-pose="${pose}" data-key="${ART[key]}" x="${sj.x.toFixed(1)}" y="${sj.y.toFixed(1)}" width="${(1152 * sj.s).toFixed(1)}" height="${(864 * sj.s).toFixed(1)}"/>`;
    const P = (ix, iy) => [(sj.x + ix * sj.s).toFixed(1), (sj.y + iy * sj.s).toFixed(1)];
    const E = (ix, iy, rx, ry, a = '') => { const [cx, cy] = P(ix, iy); return `<ellipse ${a} cx="${cx}" cy="${cy}" rx="${(rx * sj.s).toFixed(1)}" ry="${(ry * sj.s).toFixed(1)}"/>`; };
    const R = (x0, y0, x1, y1, a = '') => { const [x, y] = P(x0, y0); return `<rect ${a} x="${x}" y="${y}" width="${((x1 - x0) * sj.s).toFixed(1)}" height="${((y1 - y0) * sj.s).toFixed(1)}"/>`; };
    // the waiter (832x1248, feet at y 1186, content right edge ~640): all three poses already face left, so none is
    // mirrored. Same size as on the terrace, feet on the same line as S & J.
    const w = { s: 0.4 }; w.x = 1000 - 640 * w.s; w.y = 605 - 1186 * w.s;
    const wImg = (key, pose, on) => `<image class="pose${on ? ' on' : ''}" data-pose="${pose}" data-key="${ART[key]}" x="${w.x}" y="${w.y.toFixed(1)}" width="${832 * w.s}" height="${1248 * w.s}"/>`;
    // a soft flicker over the two pendant lamps and the candle (the candle sits on the table in every pose)
    const [cx, cy] = P(563, 432);
    const glows = [[149, 157, 26], [645, 122, 26], [+cx, +cy, 10]]
      .map(([x, y, r], i) => `<circle class="bulb" cx="${x}" cy="${y}" r="${r}" fill="url(#r-lamp)" style="animation-delay:${i * .7}s"/>`).join('');
    const hit = 'fill="#000" fill-opacity="0"';

    // default pose: the meal (the bucket, the bowls, the candle and the carafe all show) with the waiter at rest
    return `<svg class="art" viewBox="0 0 1000 625" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A cosy village restaurant at night" data-pose='{"sj":"meal","serveur":"bow"}'>
<defs>
  <radialGradient id="r-lamp"><stop offset="0" stop-color="#FFF4C8" stop-opacity=".8"/><stop offset="1" stop-color="#FFD873" stop-opacity="0"/></radialGradient>
  <radialGradient id="hl-gold"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".75"/><stop offset=".6" stop-color="#F2C14E" stop-opacity=".35"/><stop offset="1" stop-color="#F2A900" stop-opacity="0"/></radialGradient>
  <radialGradient id="hl-green"><stop offset="0" stop-color="#B8F5C0" stop-opacity=".8"/><stop offset="1" stop-color="#7CDB8A" stop-opacity="0"/></radialGradient>
  <radialGradient id="hl-red"><stop offset="0" stop-color="#FFB3B3" stop-opacity=".8"/><stop offset="1" stop-color="#FF6B6B" stop-opacity="0"/></radialGradient>
</defs>
<image href="${bg}" x="0" y="0" width="1000" height="625" preserveAspectRatio="xMidYMid slice"/>

<g class="layer-sj">
  ${sjImg('sj_menus', 'menus')}${sjImg('sj_asking', 'asking')}${sjImg('sj_meal', 'meal', true)}${sjImg('sj_bill', 'bill')}
</g>
<g class="layer-serveur"><g class="waiter">
  ${wImg('w_bow', 'bow', true)}${wImg('w_rose', 'rose')}${wImg('w_machine', 'machine')}
</g></g>
${glows}

<g class="obj" data-id="serveur">
  <ellipse class="hl" cx="912" cy="380" rx="90" ry="235"/><rect x="822" y="150" width="178" height="455" ${hit}/>
</g>
<g class="obj" data-id="porte">
  <ellipse class="hl" cx="805" cy="300" rx="62" ry="155"/><rect x="755" y="165" width="72" height="310" ${hit}/>
</g>
<g class="obj" data-id="caisse">
  <ellipse class="hl" cx="64" cy="285" rx="80" ry="72"/><rect x="0" y="212" width="135" height="140" ${hit}/>
</g>
<g class="obj" data-id="casier">
  <ellipse class="hl" cx="352" cy="205" rx="140" ry="118"/><rect x="230" y="103" width="243" height="150" ${hit}/>
</g>
<g class="obj" data-id="ardoise">
  <ellipse class="hl" cx="597" cy="224" rx="105" ry="75"/><rect x="508" y="160" width="178" height="98" ${hit}/>
</g>
<g class="obj" data-id="chaise">
  ${E(228, 600, 90, 220, 'class="hl"')}${R(165, 340, 290, 800, hit)}
</g>
<g class="obj" data-id="table">
  ${E(577, 500, 280, 80, 'class="hl"')}${R(318, 455, 835, 570, hit)}${R(360, 570, 800, 820, hit)}
</g>
<g class="obj" data-id="seau">
  ${E(705, 630, 85, 230, 'class="hl"')}${R(645, 420, 765, 860, hit)}
</g>
<g class="obj" data-id="plat">
  ${E(460, 425, 85, 45, 'class="hl"')}${E(702, 425, 80, 45, 'class="hl"')}
  ${E(460, 425, 75, 36, hit)}${E(702, 425, 70, 36, hit)}
</g>
<g class="obj" data-id="carafe">
  ${E(592, 395, 42, 75, 'class="hl"')}${E(592, 395, 30, 62, hit)}
</g>
<g class="obj" data-id="bougie">
  ${E(563, 438, 38, 40, 'class="hl"')}${E(563, 438, 26, 30, hit)}
</g>
</svg>`;
  },
};

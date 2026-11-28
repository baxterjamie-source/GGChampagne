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
  marche: {
    bg: 'lessons/marche/marche_bg.jfif',
    sj_browsing: 'lessons/marche/sj_browsing.jfif',
    sj_asking: 'lessons/marche/sj_asking.jfif',
    sj_paying: 'lessons/marche/sj_paying.jfif',
    sj_tasting: 'lessons/marche/sj_tasting.jfif',
    m_rest: 'lessons/marche/marchande.jfif',
    m_hello: 'lessons/marche/marchande_hello.jfif',
    m_bag: 'lessons/marche/marchande_bag.jfif',
    m_clock: 'lessons/marche/marchande_clock.jfif',
  },
};

/* Touch-ups after keying, per picture: glass shapes (in the picture's pixels) where the green seen THROUGH the glass
   is turned into a pale glass tint instead of being keyed away. The restaurant's right-hand water tumbler stands
   above the table's back edge, so its top keyed out and looked broken (v1.08). A shape is a cylinder:
   { x0, x1, top, bottom }, with an elliptical rim at its top (4 px deep). */
const GLASS_FILL = {};
for (const k of ['sj_menus', 'sj_asking', 'sj_meal', 'sj_bill']) GLASS_FILL[`lessons/restaurant/${k}.jfif`] = [{ x0: 605, x1: 644, top: 413, bottom: 438 }];

function fillGlass(c, raw, shapes) {
  const g = c.getContext('2d');
  const src = document.createElement('canvas'); src.width = raw.width; src.height = raw.height;
  const sg = src.getContext('2d'); sg.drawImage(raw, 0, 0);
  for (const { x0, x1, top, bottom } of shapes) {
    const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2, ry = 4, y0 = top - ry, w = x1 - x0 + 1, h = bottom - y0 + 1;
    const im = g.getImageData(x0, y0, w, h), d = im.data, s = sg.getImageData(x0, y0, w, h).data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const px = x0 + x, py = y0 + y;
      if (py < top && ((px - cx) / rx) ** 2 + ((py - top) / ry) ** 2 > 1) continue;   // outside the rim
      const i = (y * w + x) * 4, r = s[i], gr = s[i + 1], b = s[i + 2];
      const green = gr - Math.max(r, b);
      if (green < 25) continue;                                   // a painted line or highlight: keep it
      const k = Math.min(1, (green - 25) / 60);                   // how much of it was green
      const lum = (r + b) / 2;                                    // the shading without the green
      d[i] = 0.55 * lum + 0.45 * 226; d[i + 1] = 0.55 * lum + 0.45 * 234; d[i + 2] = 0.55 * lum + 0.45 * 240;
      d[i + 3] = Math.max(d[i + 3] * (1 - k), 150);
    }
    g.putImageData(im, x0, y0);
  }
}

/* Bonus words (v1.12): tap shapes for the VOCAB words (lesson_data.js), in viewBox units. Each item is
   [id, shapes, when?]; a shape is ['r', x, y, w, h], ['e', cx, cy, rx, ry] or ['p', 'M… Z'] (straight lines only).
   `when` ('sj:meal') keeps it tappable only while that pose shows. Shapes on S & J and the local character are
   placed for the scene's default pose. Each gets its own soft spotlight, lit for a moment when tapped. */
function extras(list) {
  const hit = 'fill="#000" fill-opacity="0"';
  const hl = (cx, cy, rx, ry) => `<ellipse class="hl" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${Math.max(14, rx).toFixed(1)}" ry="${Math.max(14, ry).toFixed(1)}"/>`;
  return list.map(([id, shapes, when]) => {
    const out = shapes.map(([k, ...a]) => {
      if (k === 'r') { const [x, y, w, h] = a; return hl(x + w / 2, y + h / 2, w * .62, h * .62) + `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${hit}/>`; }
      if (k === 'e') { const [cx, cy, rx, ry] = a; return hl(cx, cy, rx * 1.2, ry * 1.2) + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${hit}/>`; }
      const n = a[0].match(/-?[\d.]+/g).map(Number), xs = n.filter((_, i) => !(i % 2)), ys = n.filter((_, i) => i % 2);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      return hl((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) * .55, (y1 - y0) * .55) + `<path d="${a[0]}" ${hit}/>`;
    }).join('');
    return `<g class="obj extra" data-id="${id}"${when ? ` data-when="${when}"` : ''}>${out}</g>`;
  }).join('\n');
}

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
          if (GLASS_FILL[path]) fillGlass(c, raw, GLASS_FILL[path]);
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
    // bonus words that belong to one pose (the flutes in a toast…) only answer while it shows
    svg.querySelectorAll('.obj[data-when]').forEach(g => {
      const [layer, want] = g.dataset.when.split(':'), on = svg.querySelector(`.layer-${layer} .pose.on`);
      g.classList.toggle('off', !on || on.dataset.pose !== want);
    });
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
  <radialGradient id="hl-gold"><stop offset="0" stop-color="#FFF0C4" stop-opacity=".85"/><stop offset=".6" stop-color="#F2C14E" stop-opacity=".5"/><stop offset="1" stop-color="#F2A900" stop-opacity="0"/></radialGradient>
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

${extras([
  ['ciel', [['r', 0, 104, 1000, 160]]],
  ['vignes', [['r', 0, 262, 1000, 140]]],
  ['muret', [['r', 0, 400, 1000, 84]]],
  ['maison', [['r', 385, 300, 145, 45]]],
  ['geraniums', [['e', 115, 378, 42, 30], ['e', 345, 378, 26, 32]]],
  ['trench', [['r', 400, 345, 120, 150]]],
  ['robe', [['r', 440, 450, 85, 80]]],
  ['pull', [['r', 585, 325, 120, 120]]],
  ['pantalon', [['r', 570, 440, 135, 110]]],
])}

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

${extras([
  ['cheveux', [['e', 455, 292, 48, 45]]],
  ['cheveux', [['e', 635, 272, 40, 20]]],
  ['echarpe', [['e', 465, 362, 20, 30]]],
  ['bottines', [['r', 455, 545, 105, 52]]],
  ['lunettes', [['r', 598, 282, 64, 24]]],
  ['montre', [['e', 625, 413, 11, 11]]],
  ['chaussures', [['r', 560, 548, 85, 52]]],
  ['tablier', [['r', 800, 372, 95, 140]]],
  ['serviette', [['r', 783, 330, 42, 75]]],
  ['noeud', [['e', 858, 257, 16, 9]]],
  ['moustache', [['e', 862, 221, 17, 7]]],
  ['chaussures', [['r', 805, 560, 105, 45]]],
  ['plateau', [['e', 943, 249, 46, 11]], 'serveur:tray'],
  ['flutes', [['e', 940, 220, 27, 30]], 'serveur:tray'],
])}
</svg>`;
  },

  /* Lesson 1: a cosy village restaurant at night. The background (1344x756) is 16:9, so it is scaled to the full
     height (x0.82672) and trimmed ~56 px at each side. In the viewBox: the till x 2-125, the wine rack x 230-473
     (y 103-316), the chalkboard x 508-686 (y 160-288), the toilet door x 755-887 (y 165-475, plaque at 817,234),
     the floor from y 475. S & J sit left of centre; the waiter stands close to their table, between the chalkboard
     and the toilet door (v1.08, the user's call), leaving the door's plaque clear. */
  restaurant() {
    const ART = LESSON_ART.restaurant, bg = assetUrl('images/' + ART.bg);
    // S & J (1152x864, the same framing in all four poses: content x 164-986, feet at y 826; the bucket stand in
    // sj_meal reaches y 858). Same size as on the terrace, centred on x 400 (v1.08: was 440, to make room for the
    // waiter), feet at y 605. Their content spans x 137-513.
    const sj = { s: 0.4576 }; sj.x = 400 - (164 + 986) / 2 * sj.s; sj.y = 605 - 826 * sj.s;
    const sjImg = (key, pose, on) => `<image class="pose${on ? ' on' : ''}" data-pose="${pose}" data-key="${ART[key]}" x="${sj.x.toFixed(1)}" y="${sj.y.toFixed(1)}" width="${(1152 * sj.s).toFixed(1)}" height="${(864 * sj.s).toFixed(1)}"/>`;
    const P = (ix, iy) => [(sj.x + ix * sj.s).toFixed(1), (sj.y + iy * sj.s).toFixed(1)];
    const E = (ix, iy, rx, ry, a = '') => { const [cx, cy] = P(ix, iy); return `<ellipse ${a} cx="${cx}" cy="${cy}" rx="${(rx * sj.s).toFixed(1)}" ry="${(ry * sj.s).toFixed(1)}"/>`; };
    const R = (x0, y0, x1, y1, a = '') => { const [x, y] = P(x0, y0); return `<rect ${a} x="${x}" y="${y}" width="${((x1 - x0) * sj.s).toFixed(1)}" height="${((y1 - y0) * sj.s).toFixed(1)}"/>`; };
    // the waiter (832x1248, feet at y 1186, content right edge ~640): all three poses already face left, so none is
    // mirrored. Same size as on the terrace, feet on the same line as S & J. v1.08: his right edge at x 790 (was the
    // frame's edge), so he stands by the table, over the chalkboard's right end, and the door from x 790 stays clear.
    const w = { s: 0.4 }; w.x = 790 - 640 * w.s; w.y = 605 - 1186 * w.s;
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
  <radialGradient id="hl-gold"><stop offset="0" stop-color="#FFF0C4" stop-opacity=".85"/><stop offset=".6" stop-color="#F2C14E" stop-opacity=".5"/><stop offset="1" stop-color="#F2A900" stop-opacity="0"/></radialGradient>
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

${extras([
  ['plafond', [['r', 0, 0, 1000, 82]]],
  ['poutres', [['p', 'M0 0 L40 0 L165 58 L165 80 L140 80 L0 25 Z'], ['p', 'M170 0 L215 0 L285 58 L285 80 L250 80 L170 22 Z'],
    ['p', 'M325 0 L365 0 L400 58 L400 80 L350 80 Z'], ['p', 'M480 0 L520 0 L520 80 L485 80 Z'], ['p', 'M640 0 L680 0 L635 80 L600 80 L600 58 Z'],
    ['p', 'M760 0 L800 0 L760 80 L715 80 L715 58 Z'], ['p', 'M890 0 L935 0 L880 80 L830 80 L830 58 Z'], ['p', 'M975 0 L1000 0 L1000 40 L975 80 L940 80 L940 58 Z']]],
  ['mur', [['r', 0, 82, 1000, 390]]],
  ['sol', [['r', 0, 472, 1000, 153]]],
  ['comptoir', [['p', 'M0 325 L225 325 L225 345 L210 600 L0 625 Z']]],
  ['etagere', [['r', 105, 246, 105, 34]]],
  ['lampe', [['e', 149, 150, 36, 26], ['r', 143, 20, 12, 105]]],
  ['lampe', [['e', 645, 113, 36, 26], ['r', 639, 20, 12, 72]]],
  ['porteverres', [['r', 0, 40, 100, 58]]],
  ['verres', [['r', 0, 95, 88, 72]]],
  ['trench', [['r', 250, 345, 65, 150]]],
  ['robe', [['r', 285, 470, 90, 75]]],
  ['pull', [['r', 450, 335, 115, 105]]],
  ['pantalon', [['r', 425, 470, 130, 90]]],
])}

<g class="obj" data-id="serveur">
  <ellipse class="hl" cx="702" cy="380" rx="90" ry="235"/><rect x="615" y="150" width="175" height="455" ${hit}/>
</g>
<g class="obj" data-id="porte">
  <ellipse class="hl" cx="840" cy="300" rx="62" ry="155"/><rect x="792" y="165" width="95" height="310" ${hit}/>
</g>
<g class="obj" data-id="caisse">
  <ellipse class="hl" cx="64" cy="285" rx="80" ry="72"/><rect x="0" y="212" width="135" height="140" ${hit}/>
</g>
<g class="obj" data-id="casier">
  <ellipse class="hl" cx="352" cy="205" rx="140" ry="118"/><rect x="230" y="103" width="243" height="150" ${hit}/>
</g>
<g class="obj" data-id="ardoise">
  <ellipse class="hl" cx="565" cy="215" rx="70" ry="65"/><rect x="508" y="160" width="110" height="80" ${hit}/>
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

${extras([
  ['plaque', [['e', 817, 234, 22, 11]]],
  ['cheveux', [['e', 300, 312, 42, 52]]],
  ['cheveux', [['e', 505, 278, 30, 14]]],
  ['echarpe', [['e', 310, 355, 20, 28]]],
  ['sac', [['r', 224, 440, 46, 52]]],
  ['bottines', [['r', 315, 535, 95, 65]]],
  ['lunettes', [['r', 474, 295, 46, 20]]],
  ['montre', [['e', 511, 435, 10, 10]]],
  ['chaussures', [['r', 410, 555, 80, 45]]],
  ['cuillere', [['e', 330, 439, 22, 7]]],
  ['verres', [['e', 368, 437, 10, 13], ['e', 423, 433, 10, 12]]],
  ['flutes', [['e', 385, 365, 15, 35], ['e', 415, 365, 15, 35]], 'sj:meal'],
  ['bouteille', [['e', 467, 440, 13, 25]], 'sj:meal'],
  ['tablier', [['r', 668, 380, 100, 140]]],
  ['noeud', [['e', 675, 258, 15, 8]]],
  ['moustache', [['e', 655, 241, 15, 6]]],
  ['plateau', [['e', 752, 355, 38, 50]], 'serveur:bow'],
  ['serviette', [['r', 626, 322, 34, 72]], 'serveur:bow'],
  ['chaussures', [['r', 650, 560, 90, 45]]],
])}
</svg>`;
  },

  /* Lesson 2: a Saturday-morning market on a village square. The background (1280x800) is exactly 16:10, so it maps
     onto the viewBox at x0.78125. In the viewBox: the notice board x 43-215 (its blank paper x 92-180, y 307-437,
     written on here), the town hall x 465-809 with its clock at (615.6, 114.8), the stall x 570-957 under its parasol
     (y 199-301). S & J stand left of centre; the stallholder stands in front of the left end of her stall, facing them. */
  marche() {
    const ART = LESSON_ART.marche, bg = assetUrl('images/' + ART.bg);
    // S & J standing (864x1152, the same framing in all four poses: content x 64-742 (to 828 when J holds out the
    // coins), feet at y 1078). Centred on x 285, feet at y 610.
    const sj = { s: 0.4 }; sj.x = 285 - (64 + 742) / 2 * sj.s; sj.y = 610 - 1078 * sj.s;
    const sjImg = (key, pose, on) => `<image class="pose${on ? ' on' : ''}" data-pose="${pose}" data-key="${ART[key]}" x="${sj.x.toFixed(1)}" y="${sj.y.toFixed(1)}" width="${(864 * sj.s).toFixed(1)}" height="${(1152 * sj.s).toFixed(1)}"/>`;
    const P = (ix, iy) => [(sj.x + ix * sj.s).toFixed(1), (sj.y + iy * sj.s).toFixed(1)];
    const E = (ix, iy, rx, ry, a = '') => { const [cx, cy] = P(ix, iy); return `<ellipse ${a} cx="${cx}" cy="${cy}" rx="${(rx * sj.s).toFixed(1)}" ry="${(ry * sj.s).toFixed(1)}"/>`; };
    // the stallholder (832x1248, feet at y 1186, body centred on x ~445; all four poses face left, none mirrored),
    // a little smaller than J, feet on the same line, centred on x 540: her body spans x ~475-605
    const m = { s: 0.35 }; m.x = 540 - 445 * m.s; m.y = 610 - 1186 * m.s;
    const mImg = (key, pose, on) => `<image class="pose${on ? ' on' : ''}" data-pose="${pose}" data-key="${ART[key]}" x="${m.x.toFixed(1)}" y="${m.y.toFixed(1)}" width="${(832 * m.s).toFixed(1)}" height="${(1248 * m.s).toFixed(1)}"/>`;
    // the clock: the painted hands (at one o'clock) are covered with a fresh face and new hands drawn at ten o'clock,
    // to match « Il est dix heures » in the dialogue
    const ck = { x: 615.6, y: 114.8 };
    const hand = (deg, len, w) => { const a = (deg - 90) * Math.PI / 180; return `<line x1="${ck.x}" y1="${ck.y}" x2="${(ck.x + len * Math.cos(a)).toFixed(2)}" y2="${(ck.y + len * Math.sin(a)).toFixed(2)}" stroke="#2B2520" stroke-width="${w}" stroke-linecap="round"/>`; };
    const clock = `<circle cx="${ck.x}" cy="${ck.y}" r="9.6" fill="#F1EADB"/>${hand(300, 6, 1.5)}${hand(0, 8.8, 1)}<circle cx="${ck.x}" cy="${ck.y}" r="1.1" fill="#2B2520"/>`;
    // the notice on the board, written here so Gemini never has to (no capitals on days in French)
    const T = (y, size, txt, extra = '') => `<text x="136" y="${y}" font-size="${size}" text-anchor="middle" ${extra}>${txt}</text>`;
    const notice = `<g font-family="'Playfair Display', Georgia, serif" fill="#4A2E1C">
      ${T(330, 14, 'MARCHÉ', 'font-weight="800" letter-spacing="1.5"')}
      <line x1="104" y1="338" x2="168" y2="338" stroke="#C0563F" stroke-width="1.2"/>
      ${T(357, 10.5, 'tous les', 'font-style="italic"')}
      ${T(372, 12.5, 'samedis', 'font-weight="700"')}
      ${T(392, 12, '8h – 13h', 'font-weight="700" fill="#C0563F"')}
      ${T(411, 8.5, 'et le mercredi', 'font-style="italic"')}
      ${T(423, 8.5, 'matin', 'font-style="italic"')}
    </g>`;
    const hit = 'fill="#000" fill-opacity="0"';

    return `<svg class="art" viewBox="0 0 1000 625" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A Saturday-morning market on a village square" data-pose='{"sj":"browsing","marchande":"rest"}'>
<defs>
  <radialGradient id="hl-gold"><stop offset="0" stop-color="#FFF0C4" stop-opacity=".85"/><stop offset=".6" stop-color="#F2C14E" stop-opacity=".5"/><stop offset="1" stop-color="#F2A900" stop-opacity="0"/></radialGradient>
  <radialGradient id="hl-green"><stop offset="0" stop-color="#B8F5C0" stop-opacity=".8"/><stop offset="1" stop-color="#7CDB8A" stop-opacity="0"/></radialGradient>
  <radialGradient id="hl-red"><stop offset="0" stop-color="#FFB3B3" stop-opacity=".8"/><stop offset="1" stop-color="#FF6B6B" stop-opacity="0"/></radialGradient>
</defs>
<image href="${bg}" x="0" y="0" width="1000" height="625" preserveAspectRatio="none"/>
${clock}
${notice}

<g class="layer-marchande"><g class="waiter">
  ${mImg('m_rest', 'rest', true)}${mImg('m_hello', 'hello')}${mImg('m_bag', 'bag')}${mImg('m_clock', 'clock')}
</g></g>
<g class="layer-sj">
  ${sjImg('sj_browsing', 'browsing', true)}${sjImg('sj_asking', 'asking')}${sjImg('sj_paying', 'paying')}${sjImg('sj_tasting', 'tasting')}
</g>

${extras([
  ['ciel', [['r', 0, 0, 1000, 150]]],
  ['maison', [['p', 'M0 50 L240 85 L310 185 L470 200 L470 400 L0 400 Z']]],
  ['maison', [['r', 855, 0, 145, 520]]],
  ['vignes', [['r', 270, 118, 200, 82]]],
  ['toit', [['p', 'M0 52 L245 88 L312 192 L0 168 Z']]],
  ['cheminee', [['r', 80, 42, 45, 58], ['r', 230, 88, 32, 45], ['r', 502, 102, 28, 40], ['r', 755, 77, 26, 68]]],
  ['fenetre', [['r', 5, 170, 45, 68], ['r', 95, 185, 32, 60], ['r', 190, 200, 38, 45], ['r', 52, 105, 35, 45], ['r', 222, 125, 25, 35], ['r', 950, 45, 50, 120], ['r', 950, 250, 50, 150]]],
  ['volets', [['r', 40, 175, 18, 62], ['r', 78, 185, 16, 62], ['r', 128, 188, 14, 58], ['r', 180, 200, 12, 48], ['r', 230, 203, 12, 46], ['r', 910, 50, 32, 122]]],
  ['porte', [['r', 0, 295, 35, 105]]],
  ['arbre', [['r', 790, 120, 70, 190]]],
  ['paves', [['r', 0, 400, 1000, 225]]],
  ['etal', [['p', 'M590 432 L960 432 L960 600 L590 600 Z']]],
  ['cagette', [['r', 900, 515, 100, 85]]],
  ['trench', [['r', 185, 320, 120, 165]]],
  ['robe', [['r', 205, 430, 95, 115]]],
  ['pull', [['r', 290, 295, 125, 140]]],
  ['pantalon', [['r', 315, 435, 85, 135]]],
])}

<g class="obj" data-id="mairie">
  <ellipse class="hl" cx="637" cy="250" rx="185" ry="140"/><rect x="465" y="130" width="344" height="95" ${hit}/><rect x="610" y="225" width="199" height="80" ${hit}/>
</g>
<g class="obj" data-id="parasol">
  <ellipse class="hl" cx="780" cy="250" rx="195" ry="60"/><path d="M600 300 L700 215 L780 200 L880 215 L965 290 L965 305 L600 305 Z" ${hit}/>
</g>
<g class="obj" data-id="horloge">
  <circle class="hl" cx="${ck.x}" cy="${ck.y}" r="34"/><circle cx="${ck.x}" cy="${ck.y}" r="24" ${hit}/>
</g>
<g class="obj" data-id="affiche">
  <ellipse class="hl" cx="136" cy="372" rx="70" ry="88"/><rect x="86" y="298" width="100" height="146" ${hit}/>
</g>
<g class="obj" data-id="marchande">
  <ellipse class="hl" cx="540" cy="400" rx="80" ry="220"/><rect x="478" y="196" width="128" height="414" ${hit}/>
</g>
<g class="obj" data-id="fraises">
  <ellipse class="hl" cx="633" cy="408" rx="40" ry="38"/><rect x="606" y="378" width="56" height="58" ${hit}/>
</g>
<g class="obj" data-id="cerises">
  <ellipse class="hl" cx="702" cy="405" rx="50" ry="45"/><rect x="662" y="365" width="80" height="78" ${hit}/>
</g>
<g class="obj" data-id="fromage">
  <ellipse class="hl" cx="788" cy="440" rx="58" ry="32"/><rect x="744" y="420" width="96" height="44" ${hit}/>
</g>
<g class="obj" data-id="fleurs">
  <ellipse class="hl" cx="744" cy="380" rx="40" ry="48"/><ellipse class="hl" cx="834" cy="390" rx="42" ry="52"/>
  <rect x="716" y="340" width="57" height="78" ${hit}/><rect x="798" y="345" width="72" height="72" ${hit}/>
</g>
<g class="obj" data-id="balance">
  <ellipse class="hl" cx="891" cy="400" rx="55" ry="68"/><rect x="852" y="342" width="80" height="112" ${hit}/>
</g>
<g class="obj" data-id="panier">
  ${E(148, 760, 120, 110, 'class="hl"')}${E(148, 765, 95, 95, hit)}
</g>

${extras([
  ['drapeau', [['e', 585, 242, 15, 26]]],
  ['lanterne', [['e', 407, 270, 10, 14], ['e', 632, 312, 8, 12]]],
  ['seauzinc', [['e', 752, 410, 12, 12], ['e', 832, 414, 18, 15]]],
  ['cheveux', [['e', 245, 280, 45, 48]]],
  ['cheveux', [['e', 352, 230, 36, 18]]],
  ['cheveux', [['e', 537, 250, 36, 24]]],
  ['echarpe', [['e', 255, 345, 20, 35]]],
  ['sac', [['r', 195, 385, 42, 70]]],
  ['bottines', [['r', 220, 550, 60, 60]]],
  ['lunettes', [['r', 323, 250, 62, 20]]],
  ['montre', [['e', 398, 426, 10, 10]]],
  ['chaussures', [['r', 310, 570, 90, 45]]],
  ['tablier', [['r', 487, 315, 98, 185]]],
  ['chaussures', [['r', 490, 570, 90, 42]]],
])}
</svg>`;
  },
};

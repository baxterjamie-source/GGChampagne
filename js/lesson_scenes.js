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

  /* Show a pose per layer, e.g. { sj: 'ordering', serveur: 'bow' }. null = the defaults. */
  pose(svg, p) {
    if (!svg) return;
    p = p || { sj: 'table', serveur: 'tray' };
    for (const layer of Object.keys(p)) {
      svg.querySelectorAll(`.layer-${layer} .pose`).forEach(im => im.classList.toggle('on', im.dataset.pose === p[layer]));
    }
  },

  terrasse() {
    const ART = LESSON_ART.terrasse, bg = assetUrl('images/' + ART.bg);
    // S & J at their table (1152x864), scaled to the waiter (v1.04: was 0.56), feet on the tiles at y 600,
    // between the church and the waiter. Their content spans x 165-990, feet at y 830 in the picture.
    const sj = { s: 0.41 }; sj.x = 380 - 165 * sj.s; sj.y = 600 - 830 * sj.s;
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
};

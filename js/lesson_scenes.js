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
    // S & J at their table (1152x864), feet on the tiles, centred so the sun stays clear on the left
    const sj = { x: 197.6, y: 137, s: 0.56 };
    const sjImg = (key, pose, on) => `<image class="pose${on ? ' on' : ''}" data-pose="${pose}" data-key="${ART[key]}" x="${sj.x}" y="${sj.y}" width="${1152 * sj.s}" height="${864 * sj.s}"/>`;
    // the waiter (832x1248) on the right. The tray picture faces right, so it is mirrored to face the table
    const wt = { x: 697, y: 126, s: 0.4 }, wb = { x: 696, y: 136, s: 0.4 };
    // the string of bulbs painted in the background (1280x800 -> x0.78125): a soft twinkle over each
    const bulbs = [[30, 207], [95, 212], [165, 208], [232, 195], [293, 175], [353, 148], [422, 165], [484, 184], [553, 196], [625, 203],
      [698, 198], [770, 188], [836, 172], [915, 147], [972, 175], [1037, 193], [1105, 208], [1177, 212], [1244, 207]]
      .map(([x, y], i) => `<circle class="bulb" cx="${(x * .78125).toFixed(1)}" cy="${(y * .78125).toFixed(1)}" r="9" fill="url(#t-bulb)" style="animation-delay:${(i % 5) * .4}s"/>`).join('');
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

<g class="obj" data-id="soleil">
  <circle class="hl" cx="219" cy="277" r="72"/><circle cx="219" cy="277" r="52" ${hit}/>
</g>
<g class="obj" data-id="lune">
  <circle class="hl" cx="750" cy="205" r="42"/><circle cx="750" cy="205" r="34" ${hit}/>
</g>
<g class="obj" data-id="serveur">
  <ellipse class="hl" cx="868" cy="385" rx="95" ry="230"/><rect x="775" y="160" width="215" height="440" ${hit}/>
</g>
<g class="obj" data-id="table">
  <ellipse class="hl" cx="523" cy="385" rx="118" ry="40"/><ellipse cx="523" cy="383" rx="102" ry="26" ${hit}/><rect x="472" y="400" width="104" height="185" ${hit}/>
</g>
<g class="obj" data-id="chaise">
  <ellipse class="hl" cx="320" cy="455" rx="50" ry="135"/><rect x="286" y="330" width="62" height="262" ${hit}/>
</g>
<g class="obj" data-id="bouteille">
  <ellipse class="hl" cx="525" cy="320" rx="34" ry="76"/><ellipse cx="525" cy="322" rx="22" ry="62" ${hit}/>
</g>
<g class="obj" data-id="verre">
  <ellipse class="hl" cx="487" cy="344" rx="26" ry="52"/><ellipse class="hl" cx="558" cy="344" rx="26" ry="52"/>
  <ellipse cx="487" cy="344" rx="16" ry="42" ${hit}/><ellipse cx="558" cy="344" rx="16" ry="42" ${hit}/>
</g>
</svg>`;
  },
};

/* Lesson scenes as SVG, viewBox 0 0 1000 625. Each tappable thing is a <g class="obj" data-id="…">
   with no transform (the zoom uses getBBox). These are code-drawn placeholders: swap in Gemini art later,
   keeping the same ids and rough positions. */
'use strict';

const LESSON_SCENES = {
  terrasse() {
    // awning stripes + scallops
    let awning = '';
    for (let i = 0; i < 20; i++) {
      const x = i * 50, c = i % 2 ? '#FBF5E9' : '#E89A9A';
      awning += `<rect x="${x}" y="26" width="50" height="30" fill="${c}"/><path d="M${x} 56 a25 25 0 0 0 50 0 Z" fill="${c}"/>`;
    }
    // string lights along a dip
    let lights = '';
    for (let i = 1; i < 24; i++) {
      const t = i / 24, x = 1000 * t, y = 82 + 2 * t * (1 - t) * 120;
      lights += `<circle class="bulb" cx="${x.toFixed(1)}" cy="${(y + 6).toFixed(1)}" r="4.5" fill="#FFE9A8" style="animation-delay:${(i % 5) * .4}s"/>`;
    }
    // vine rows on the near hill
    let vines = '';
    for (let i = 0; i < 6; i++) {
      const y = 402 + i * 9;
      vines += `<path d="M0 ${y + 6} C 250 ${y - 10}, 600 ${y + 14}, 1000 ${y}" stroke="#2f5a40" stroke-width="3" fill="none" stroke-dasharray="7 5"/>`;
    }
    // floor tiles
    let tiles = '';
    for (let x = -600; x <= 1600; x += 110) tiles += `<path d="M${500 + (x - 500) * .45} 447 L${x} 625" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`;
    for (const y of [470, 505, 552, 612]) tiles += `<path d="M0 ${y} H1000" stroke="rgba(0,0,0,.16)" stroke-width="2"/>`;
    const flute = cx => `
      <ellipse cx="${cx}" cy="455" rx="16" ry="4" fill="rgba(251,245,233,.75)"/>
      <path d="M${cx} 452 V408" stroke="rgba(251,245,233,.8)" stroke-width="3"/>
      <path d="M${cx - 10} 350 L${cx + 10} 350 L${cx + 9} 392 Q${cx} 410 ${cx - 9} 392 Z" fill="#F2C14E"/>
      <path d="M${cx - 13} 322 L${cx + 13} 322 L${cx + 10} 394 Q${cx} 414 ${cx - 10} 394 Z" fill="rgba(251,245,233,.12)" stroke="rgba(251,245,233,.85)" stroke-width="2"/>
      <circle class="fizz" cx="${cx - 3}" cy="385" r="1.8" fill="#FFF7DA"/><circle class="fizz" cx="${cx + 3}" cy="372" r="1.5" fill="#FFF7DA" style="animation-delay:.5s"/><circle class="fizz" cx="${cx}" cy="390" r="1.3" fill="#FFF7DA" style="animation-delay:1s"/>`;

    return `<svg viewBox="0 0 1000 625" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A café terrace among the vines at sunset">
<defs>
  <linearGradient id="t-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2440"/><stop offset=".42" stop-color="#b8607a"/><stop offset=".72" stop-color="#E89A9A"/><stop offset="1" stop-color="#F2A900"/></linearGradient>
  <radialGradient id="t-sun"><stop offset="0" stop-color="#FFF1C4"/><stop offset=".6" stop-color="#F7C948"/><stop offset="1" stop-color="#F2A900"/></radialGradient>
  <radialGradient id="t-glow"><stop offset="0" stop-color="#FFE08A" stop-opacity=".75"/><stop offset="1" stop-color="#F2A900" stop-opacity="0"/></radialGradient>
  <linearGradient id="t-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c6a45"/><stop offset="1" stop-color="#4a2e1d"/></linearGradient>
  <linearGradient id="t-bottle" x1="0" x2="1"><stop offset="0" stop-color="#0b1f15"/><stop offset=".35" stop-color="#2c5a3f"/><stop offset=".45" stop-color="#5d8a6c"/><stop offset=".6" stop-color="#1f4330"/><stop offset="1" stop-color="#09180f"/></linearGradient>
  <linearGradient id="t-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0b06e"/><stop offset="1" stop-color="#a8743f"/></linearGradient>
  <mask id="t-crescent"><rect width="1000" height="625" fill="#fff"/><circle cx="884" cy="180" r="28" fill="#000"/></mask>
</defs>
<rect width="1000" height="625" fill="url(#t-sky)"/>
<g fill="#FBF5E9"><circle cx="640" cy="150" r="1.6" opacity=".7"/><circle cx="720" cy="110" r="1.2" opacity=".6"/><circle cx="950" cy="250" r="1.4" opacity=".5"/><circle cx="560" cy="200" r="1.1" opacity=".5"/><circle cx="780" cy="230" r="1.3" opacity=".6"/></g>

<g class="obj" data-id="lune">
  <rect x="820" y="140" width="100" height="100" fill="#000" fill-opacity="0"/>
  <circle cx="870" cy="190" r="30" fill="#FBF5E9" mask="url(#t-crescent)"/>
</g>
<g class="obj" data-id="soleil">
  <circle cx="230" cy="345" r="140" fill="url(#t-glow)"/>
  <circle cx="230" cy="345" r="62" fill="url(#t-sun)"/>
</g>

<path d="M0 360 C150 322 300 345 450 330 S750 300 1000 340 L1000 460 L0 460Z" fill="#3d6b4c"/>
<path d="M640 318 l8 -34 l8 34 Z M636 318 h24 v22 h-24 Z" fill="#2c5040"/>
<path d="M0 395 C200 370 380 400 560 380 S850 365 1000 385 L1000 470 L0 470Z" fill="#1E3B2C"/>
${vines}
<rect x="0" y="424" width="1000" height="24" fill="#cdb68b"/><rect x="0" y="422" width="1000" height="5" fill="#e6d4ac"/>
<rect x="0" y="447" width="1000" height="178" fill="url(#t-floor)"/>
${tiles}

<rect width="1000" height="26" fill="#121212"/>
<text x="500" y="19" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-size="15" letter-spacing="7" fill="#E8C872">CAFÉ DES VIGNES</text>
${awning}
<path d="M0 88 Q500 328 1000 88" stroke="#3a2a20" stroke-width="1.5" fill="none"/>
${lights}

<g class="obj" data-id="chaise">
  <path d="M266 420 L272 590 M316 420 L310 590" stroke="#121212" stroke-width="7" stroke-linecap="round"/>
  <rect x="258" y="420" width="66" height="14" rx="4" fill="url(#t-wood)"/>
  <rect x="260" y="442" width="62" height="12" rx="4" fill="url(#t-wood)"/>
  <path d="M250 505 L332 505 L340 521 L242 521 Z" fill="url(#t-wood)"/>
  <path d="M248 521 L236 594 M334 521 L346 594" stroke="#121212" stroke-width="7" stroke-linecap="round"/>
</g>

<g class="obj" data-id="table">
  <rect x="473" y="478" width="14" height="100" fill="#121212"/>
  <path d="M430 594 Q480 570 530 594" stroke="#121212" stroke-width="9" fill="none" stroke-linecap="round"/>
  <ellipse cx="480" cy="462" rx="140" ry="30" fill="#8a5a2f"/>
  <ellipse cx="480" cy="455" rx="140" ry="28" fill="url(#t-wood)"/>
</g>

<g class="obj" data-id="bouteille">
  <path d="M410 452 L410 345 C410 320 423 312 423 292 L423 255 L439 255 L439 292 C439 312 452 320 452 345 L452 452 Z" fill="url(#t-bottle)"/>
  <path d="M421 250 L441 250 L441 300 C441 307 421 307 421 300 Z" fill="#C9A13B"/>
  <rect x="412" y="368" width="38" height="52" rx="2" fill="#F2A900"/>
  <rect x="417" y="388" width="28" height="5" fill="#121212"/>
  <path d="M417 340 V440" stroke="rgba(255,255,255,.25)" stroke-width="3"/>
</g>

<g class="obj" data-id="verre">
  <rect x="505" y="315" width="90" height="145" fill="#000" fill-opacity="0"/>
  ${flute(525)}${flute(575)}
</g>

<g class="obj" data-id="serveur">
  <rect x="800" y="480" width="17" height="110" fill="#121212"/><rect x="826" y="480" width="17" height="110" fill="#121212"/>
  <ellipse cx="806" cy="594" rx="16" ry="6" fill="#121212"/><ellipse cx="838" cy="594" rx="16" ry="6" fill="#121212"/>
  <path d="M788 350 Q770 400 780 445" stroke="#FBF5E9" stroke-width="16" fill="none" stroke-linecap="round"/>
  <rect x="770" y="410" width="20" height="44" rx="3" fill="#F3C6C0"/>
  <rect x="790" y="345" width="64" height="100" rx="18" fill="#FBF5E9"/>
  <path d="M790 360 L813 360 L822 420 L831 360 L854 360 L854 448 L790 448 Z" fill="#121212"/>
  <path d="M790 440 L854 440 L862 570 L782 570 Z" fill="#FBF5E9"/>
  <path d="M852 365 Q885 360 895 330" stroke="#FBF5E9" stroke-width="15" fill="none" stroke-linecap="round"/>
  <circle cx="897" cy="326" r="9" fill="#e9b98f"/>
  <ellipse cx="900" cy="316" rx="44" ry="6" fill="#C9A13B"/>
  <path d="M812 352 L822 358 L812 364 Z M832 352 L822 358 L832 364 Z" fill="#121212"/>
  <rect x="814" y="330" width="16" height="16" fill="#e0ad80"/>
  <g class="head">
    <circle cx="822" cy="308" r="30" fill="#e9b98f"/>
    <path d="M792 304 Q795 272 824 274 Q852 276 852 300 Q842 286 822 288 Q800 290 792 304 Z" fill="#121212"/>
    <circle cx="812" cy="308" r="2.6" fill="#121212"/><circle cx="834" cy="308" r="2.6" fill="#121212"/>
    <path d="M808 322 Q815 316 822 322 Q829 316 836 322 Q829 328 822 324 Q815 328 808 322 Z" fill="#121212"/>
    <path class="mouth" d="M815 330 Q822 336 829 330" stroke="#7a3b2e" stroke-width="2" fill="none" stroke-linecap="round"/>
  </g>
</g>
</svg>`;
  },
};

/* French lessons engine: scene → dialogue → cards → quiz → "À dire" (talk-back list).
   Framework and rules: reveal_app/FRENCH_LESSONS.md. Content: lesson_data.js. Scenes: lesson_scenes.js. */
'use strict';

const Lessons = (() => {
  const q = s => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const nb = s => s.replace(/ ([!?:;»])/g, ' $1').replace(/« /g, '« ');   // French spacing, never wrapped
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const db = {
    get(k, d) { try { const v = localStorage.getItem('fr.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('fr.' + k, JSON.stringify(v)); } catch { } },
  };
  const params = new URLSearchParams(location.search);
  const preview = params.has('preview') || params.has('lesson');

  const STEPS = ['La scène', 'Le dialogue', 'Les cartes', 'Le quiz', 'À dire'];
  const WHO = { serveur: 'Le serveur', vous: 'Vous' };
  const FULL = { x: 0, y: 0, w: 1000, h: 625 };
  const root = q('#lesson'), sceneBox = q('#lesson-scene'), panel = q('#lesson-panel'), foot = q('#lesson-foot');
  let L = null, step = 0, svg = null, onObj = null;

  /* ---------- Voice (browser French voice; silent when ?mute) ---------- */
  const Voice = {
    v: null,
    ok: 'speechSynthesis' in window,
    pick() {
      const vs = speechSynthesis.getVoices().filter(v => /^fr/i.test(v.lang));
      const score = v => (/fr[-_]FR/i.test(v.lang) ? 10 : 0) + (/premium|enhanced|natural|neural/i.test(v.name) ? 8 : 0)
        + (/google|amélie|amelie|audrey|aurélie|thomas|marie|denise/i.test(v.name) ? 4 : 0);
      this.v = vs.sort((a, b) => score(b) - score(a))[0] || null;
    },
    say(text, btn) {
      if (btn) { btn.classList.remove('pulse'); void btn.offsetWidth; btn.classList.add('pulse'); }
      if (SFX.muted || !this.ok) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/…/g, ''));
      if (!this.v) this.pick();
      if (this.v) u.voice = this.v;
      u.lang = 'fr-FR'; u.rate = 0.85;
      u.onstart = () => Music.duck(true);
      u.onend = u.onerror = () => Music.duck(false);
      speechSynthesis.speak(u);
    },
  };
  if (Voice.ok) { Voice.pick(); speechSynthesis.onvoiceschanged = () => Voice.pick(); }

  /* ---------- Background music: very quiet, gapless loop, ducks under the voice, can be switched off ---------- */
  const Music = {
    RMS: 0.0085,           // target loudness: a whisper under everything else (was 0.012; user asked for a little quieter)
    XFADE: 0.7,            // seconds each pass overlaps the next (the track opens with a soft swell)
    buf: {}, srcs: [], gain: null, level: 0, want: null, m: null, timer: 0,
    get src() { return this.gain; },
    on: () => db.get('music', true),
    async load(name) {
      if (this.buf[name]) return this.buf[name];
      const r = await fetch(assetUrl(`sounds/${name}.mp3`));
      const b = await SFX.ctx.decodeAudioData(await r.arrayBuffer());
      // trim the encoder silence at both ends (so the loop has no gap) and measure loudness
      let first = b.length, last = 0, sum = 0;
      for (let c = 0; c < b.numberOfChannels; c++) {
        const d = b.getChannelData(c);
        for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); sum += d[i] * d[i]; if (a > 0.002) { if (i < first) first = i; if (i > last) last = i; } }
      }
      const rms = Math.sqrt(sum / (b.length * b.numberOfChannels)) || 1;
      return (this.buf[name] = { b, start: first / b.sampleRate, end: (last + 1) / b.sampleRate, gain: Math.min(1, this.RMS / rms) });
    },
    async play(name) {
      this.want = name;
      if (!name || SFX.muted || !this.on()) return;
      SFX.init();
      if (!SFX.ctx || this.src) return;
      const m = await this.load(name).catch(() => null);
      if (!m || this.want !== name || this.src || !this.on()) return;
      const g = SFX.ctx.createGain();
      g.gain.setValueAtTime(0.0001, SFX.t);
      g.gain.exponentialRampToValueAtTime(m.gain, SFX.t + 2.5);      // gentle fade in
      g.connect(SFX.master);
      this.gain = g; this.level = m.gain; this.m = m;
      this.pass(SFX.t + 0.05);
    },
    // one pass of the track; the next is scheduled to start XFADE before this one ends, then they crossfade
    pass(when) {
      const m = this.m, X = this.XFADE, len = m.end - m.start;
      const s = SFX.ctx.createBufferSource(), e = SFX.ctx.createGain();
      s.buffer = m.b; s.connect(e); e.connect(this.gain);
      e.gain.setValueAtTime(1, when);
      e.gain.setValueAtTime(1, when + len - 0.15);     // outgoing pass stays full while the next one swells in,
      e.gain.linearRampToValueAtTime(0, when + len);   // then a tiny fade so the hard end doesn't click
      s.start(when, m.start, len);
      this.srcs.push(s);
      s.onended = () => { this.srcs = this.srcs.filter(x => x !== s); };
      const next = when + len - X;
      this.timer = setTimeout(() => { if (this.gain) this.pass(next); }, Math.max(0, (next - SFX.t - 3) * 1000));
    },
    stop() {
      this.want = null;
      clearTimeout(this.timer);
      if (!this.gain) return;
      this.gain.gain.setTargetAtTime(0.0001, SFX.t, 0.3);
      this.srcs.forEach(s => { try { s.stop(SFX.t + 1.5); } catch { } });
      this.srcs = []; this.gain = null;
    },
    duck(on) { if (this.gain) this.gain.gain.setTargetAtTime(on ? this.level * 0.3 : this.level, SFX.t, on ? 0.08 : 0.5); },
  };
  const musicBtn = q('#lesson-music');
  const showMusic = () => { musicBtn.classList.toggle('off', !Music.on()); musicBtn.setAttribute('aria-pressed', Music.on()); };
  musicBtn.onclick = () => {
    db.set('music', !Music.on()); showMusic();
    if (Music.on()) Music.play(L && L.music); else Music.stop();
  };
  // a lesson opened without a tap (dev link) can only start sound after the first touch
  root.addEventListener('pointerdown', () => { if (L && L.music && !Music.src) Music.play(L.music); });
  function sayBtn(text, label = '🔊') {
    const b = el('button', 'say', label);
    b.setAttribute('aria-label', 'Écouter');
    b.onclick = e => { e.stopPropagation(); Voice.say(text, b); };
    return b;
  }

  /* ---------- Scene: glow + zoom ---------- */
  let vb = { ...FULL }, vbRaf = 0;
  function setVB() { svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); }
  function zoomTo(t, dur = 700) {
    const from = { ...vb }, t0 = performance.now();
    cancelAnimationFrame(vbRaf);
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      for (const p of ['x', 'y', 'w', 'h']) vb[p] = from[p] + (t[p] - from[p]) * e;
      setVB();
      if (k < 1) vbRaf = requestAnimationFrame(tick);
    };
    vbRaf = requestAnimationFrame(tick);
    // if the pane is hidden rAF pauses: make sure we land anyway
    setTimeout(() => { if (vb.w !== t.w || vb.x !== t.x) { vb = { ...t }; setVB(); } }, dur + 200);
  }
  function boxFor(g) {
    const b = g.getBBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    const w = Math.min(1000, Math.max(b.width * 2.2, b.height * 2.2 * 1.6, 280)), h = w / 1.6;
    return { x: Math.max(0, Math.min(1000 - w, cx - w / 2)), y: Math.max(0, Math.min(625 - h, cy - h / 2)), w, h };
  }
  const obj = id => svg.querySelector(`.obj[data-id="${id}"]`);
  function glow(id, on) { const g = obj(id); if (g) g.classList.toggle('glow', on); }
  function clearMarks() { svg.querySelectorAll('.obj').forEach(g => g.classList.remove('glow', 'talking', 'right', 'wrong')); }

  /* ---------- Shell ---------- */
  function open(lesson, opts = {}) {
    L = lesson;
    root.classList.add('active');
    requestAnimationFrame(() => root.classList.add('shown'));
    q('#lesson-title').innerHTML = `Leçon ${L.week} · <i>${nb(L.titleFr)}</i>`;
    sceneBox.innerHTML = LESSON_SCENES[L.scene]();
    svg = sceneBox.querySelector('svg');
    svg.addEventListener('click', e => { const g = e.target.closest('.obj'); if (onObj) onObj(g ? g.dataset.id : null, g); });
    vb = { ...FULL }; setVB();
    showMusic(); musicBtn.hidden = !L.music;
    Music.play(L.music);
    tab(opts.tab || 'lesson');
  }
  function close() {
    if (Voice.ok) speechSynthesis.cancel();
    Music.stop();
    root.classList.remove('shown');
    setTimeout(() => root.classList.remove('active'), 400);
    document.dispatchEvent(new Event('lessonclosed'));
  }
  q('#lesson-close').onclick = close;
  q('#lesson-tabs').onclick = e => { const b = e.target.closest('[data-tab]'); if (b) tab(b.dataset.tab); };

  function tab(name) {
    q('#lesson-tabs').querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
    updateTabCount();
    if (name === 'sayit') { q('#lesson-steps').hidden = true; renderSayIt(); }
    else { q('#lesson-steps').hidden = false; goStep(db.get('at.' + L.week, 0)); }
  }
  function updateTabCount() { const n = pending().length; q('#sayit-count').textContent = n ? n : ''; }

  function goStep(n) {
    step = n; db.set('at.' + L.week, n);
    q('#lesson-steps').innerHTML = STEPS.map((s, i) => `<span class="${i < n ? 'done' : i === n ? 'now' : ''}" title="${s}"></span>`).join('');
    panel.innerHTML = ''; foot.innerHTML = ''; onObj = null; clearMarks(); panel.scrollTop = 0;
    [stepScene, stepDialogue, stepCards, stepQuiz, stepSayIt][n]();
  }
  function next(label = 'Continuer ›', fn = () => goStep(step + 1), enabled = true) {
    const b = el('button', 'btn', label);
    b.disabled = !enabled; b.onclick = () => fn();
    foot.append(b);
    return b;
  }
  function heading(fr, en) { panel.append(el('p', 'lead', nb(fr))); if (en) panel.append(el('p', 'en', en)); }

  /* ---------- 1. La scène: tap the glowing things ---------- */
  function stepScene() {
    zoomTo(FULL);
    const seen = new Set(), objs = L.objects;
    objs.forEach(o => glow(o.id, true));
    const btn = next('Continuer ›', undefined, false);
    const intro = () => {
      panel.innerHTML = '';
      heading('Touchez les objets qui brillent ✨', `Tap the glowing things to learn their names · <b>${seen.size}/${objs.length}</b>`);
    };
    intro();
    onObj = (id, g) => {
      const o = objs.find(o => o.id === id);
      if (!o) { zoomTo(FULL); intro(); return; }
      seen.add(id); g.classList.remove('glow'); g.classList.add('seen');
      zoomTo(boxFor(g));
      panel.innerHTML = '';
      panel.append(wordCard(o));
      const back = el('button', 'link-btn', `← Toute la scène · ${seen.size}/${objs.length}`);
      back.onclick = () => { zoomTo(FULL); intro(); };
      panel.append(back);
      Voice.say(o.fr);
      if (seen.size === objs.length) { btn.disabled = false; sceneBox.classList.add('popped'); }
    };
  }
  function wordCard(o) {
    const m = o.fr.match(/^(le|la|les|l'|un|une)\s?(.*)$/i);
    const art = m ? m[1] : '', noun = m ? m[2] : o.fr, gender = /^(la|une)$/i.test(art) ? 'f' : 'm';
    const c = el('div', `word ${gender}`);
    c.innerHTML = `<div class="fr"><span class="art">${art}</span> ${noun}</div><div class="hint">${o.hint}</div><div class="en">${o.en}</div>`;
    c.querySelector('.fr').append(sayBtn(o.fr));
    if (o.tip) c.append(el('div', 'tip', '💡 ' + o.tip));
    if (o.link) {
      const l = el('div', 'linked', `<span class="fr">${nb(o.link.fr)}</span><span class="en">${o.link.en}</span>`);
      l.prepend(sayBtn(o.link.fr));
      c.append(l);
    }
    return c;
  }

  /* ---------- 2. Le dialogue ---------- */
  function stepDialogue() {
    zoomTo(L.dialogueView || FULL);
    panel.append(el('p', 'en small', 'Tap a line to see the English.'));
    const list = el('div', 'chat'); panel.append(list);
    let i = 0;
    const btn = next('Suivant ›', () => { if (i < L.dialogue.length) addLine(); else goStep(step + 1); });
    function addLine() {
      const d = L.dialogue[i++];
      const b = el('div', `bubble ${d.who}`, `<span class="who">${WHO[d.who] || d.who}</span><span class="fr">${nb(d.fr)}</span><span class="en">${d.en}</span>${d.tip ? `<span class="tip">💡 ${d.tip}</span>` : ''}`);
      b.querySelector('.who').append(sayBtn(d.fr));
      b.onclick = () => b.classList.toggle('show-en');
      list.append(b);
      b.scrollIntoView({ behavior: 'smooth', block: 'end' });
      const waiter = obj('serveur');
      if (waiter) waiter.classList.toggle('talking', d.who === 'serveur');
      Voice.say(d.fr);
      if (i >= L.dialogue.length) btn.textContent = 'Continuer ›';
    }
    addLine();
  }

  /* ---------- 3. Les cartes (Leitner box per card) ---------- */
  function stepCards() {
    zoomTo(FULL);
    const queue = L.cards.map((c, i) => ({ c, id: `${L.week}:${i}` }));
    const box = db.get('box', {});
    const show = () => {
      panel.innerHTML = ''; foot.innerHTML = '';
      if (!queue.length) { heading('Bravo ! 🥂', 'All the cards are done.'); next(); return; }
      const { c, id } = queue[0];
      panel.append(el('p', 'en small', `${queue.length} card${queue.length > 1 ? 's' : ''} to go`));
      const card = el('div', 'flip');
      card.innerHTML = `<div class="face front"><span class="emoji">${c.emoji || ''}</span><span class="en">${c.en}</span><span class="tapme">Touchez pour retourner · tap to flip</span></div>
        <div class="face back"><span class="fr">${nb(c.fr)}</span><span class="hint">${c.hint}</span>${c.tip ? `<span class="tip">💡 ${c.tip}</span>` : ''}</div>`;
      card.querySelector('.back').prepend(sayBtn(c.fr));
      panel.append(card);
      card.onclick = () => {
        if (card.classList.contains('flipped')) return;
        card.classList.add('flipped'); Voice.say(c.fr);
        const again = el('button', 'btn ghost', '↺ Encore'), know = el('button', 'btn', '✓ Je sais');
        again.onclick = () => { box[id] = 1; db.set('box', box); queue.push(queue.shift()); show(); };
        know.onclick = () => { box[id] = Math.min(5, (box[id] || 1) + 1); db.set('box', box); queue.shift(); show(); };
        foot.append(again, know);
      };
    };
    show();
  }

  /* ---------- 4. Le quiz (with review of earlier weeks, weakest cards first) ---------- */
  function reviewQuestions(n = 2) {
    const box = db.get('box', {}), done = db.get('done', {});
    const old = LESSONS.filter(l => l.week < L.week && done[l.week] != null)
      .flatMap(l => l.cards.map((c, i) => ({ c, id: `${l.week}:${i}` })));
    if (old.length < 3) return [];
    const weakest = shuffle(old).sort((a, b) => (box[a.id] || 1) - (box[b.id] || 1)).slice(0, n);
    return weakest.map(({ c, id }) => ({
      type: 'choice', card: id, prompt: `How do you say “${c.en}”?`, en: 'Révision · from an earlier lesson',
      options: shuffle([c.fr, ...shuffle(old.filter(o => o.c !== c)).slice(0, 2).map(o => o.c.fr)]), answer: c.fr,
    }));
  }
  function stepQuiz() {
    const review = reviewQuestions(), qs = [...L.quiz];
    review.forEach((r, i) => qs.splice(1 + i * 2, 0, r));   // interleave the review questions
    let qi = 0, score = 0;
    const box = db.get('box', {});
    const flutes = () => qs.map((_, i) => `<span class="${i < qi ? (i < score ? 'full' : '') : 'todo'}">🥂</span>`).join('');
    const ask = () => {
      onObj = null; clearMarks(); zoomTo(FULL); panel.innerHTML = ''; foot.innerHTML = '';
      if (qi >= qs.length) return finish();
      const Q = qs[qi];
      panel.append(el('p', 'qnum', `Question ${qi + 1}/${qs.length}`));
      heading(Q.prompt, Q.en);
      if (Q.type === 'tap') {
        onObj = (id, g) => { if (!id) return; onObj = null; g.classList.add(id === Q.answer ? 'right' : 'wrong'); glow(Q.answer, true); answered(id === Q.answer, Q, L.objects.find(o => o.id === Q.answer).fr); };
      } else if (Q.type === 'choice') {
        const opts = el('div', 'options');
        shuffle(Q.options).forEach(o => {
          const b = el('button', 'opt', nb(o));
          b.onclick = () => {
            opts.querySelectorAll('button').forEach(x => { x.disabled = true; if (x.dataset.v === Q.answer) x.classList.add('right'); });
            if (o !== Q.answer) b.classList.add('wrong');
            answered(o === Q.answer, Q, Q.answer);
          };
          b.dataset.v = o; opts.append(b);
        });
        panel.append(opts);
      } else if (Q.type === 'order') {
        const ans = el('div', 'tiles answer'), pool = el('div', 'tiles');
        shuffle(Q.words.map((w, i) => ({ w, i }))).forEach(t => {
          const b = el('button', 'tile', t.w);
          b.onclick = () => {
            (b.parentNode === pool ? ans : pool).append(b);
            check.disabled = ans.children.length !== Q.words.length;
          };
          pool.append(b);
        });
        panel.append(ans, pool);
        const check = next('Vérifier', () => {
          const got = [...ans.children].map(b => b.textContent).join(' '), want = Q.words.join(' ');
          ans.querySelectorAll('button').forEach(b => b.disabled = true); pool.remove();
          ans.classList.add(got === want ? 'right' : 'wrong');
          foot.innerHTML = '';
          answered(got === want, Q, want);
        }, false);
      }
    };
    const answered = (ok, Q, right) => {
      score += ok ? 1 : 0;
      if (Q.card) { box[Q.card] = ok ? Math.min(5, (box[Q.card] || 1) + 1) : 1; db.set('box', box); }
      const fb = el('div', `feedback ${ok ? 'ok' : 'no'}`, ok ? '🥂 <b>Exact !</b>' : `Pas tout à fait… <b>${nb(right)}</b>`);
      fb.append(sayBtn(right));
      if (Q.why) fb.append(el('div', 'why', nb(Q.why)));
      panel.append(fb);
      fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      Voice.say(right);
      qi++;
      next(qi < qs.length ? 'Suivant ›' : 'Résultat ›', ask);
    };
    const finish = () => {
      const done = db.get('done', {}); done[L.week] = Math.max(done[L.week] || 0, score); db.set('done', done);
      heading(score === qs.length ? 'Parfait ! 🍾' : score >= qs.length - 2 ? 'Très bien !' : 'Pas mal du tout !',
        `${score} out of ${qs.length}. Anything you missed will come back in a later quiz.`);
      panel.append(el('div', 'flutes', flutes()));
      next();
    };
    ask();
  }

  /* ---------- 5. À dire: queue phrases for when she can speak ---------- */
  const pending = () => db.get('sayit', []).filter(x => !x.said);
  function stepSayIt() {
    zoomTo(FULL);
    const list = db.get('sayit', []);
    for (const s of L.sayIt) if (!list.some(x => x.fr === s.fr)) list.push({ ...s, week: L.week, said: false });
    db.set('sayit', list); updateTabCount();
    heading('À dire 🗣️', 'These phrases are now in your <b>À dire</b> list. When you\'re somewhere you can speak, open it and say them out loud. Saying them is what makes them stick.');
    const ul = el('div', 'say-preview');
    L.sayIt.forEach(s => ul.append(el('div', '', `<span class="fr">${nb(s.fr)}</span> <span class="en">${s.en}</span>`)));
    panel.append(ul);
    const later = el('button', 'btn ghost', 'Plus tard'), now = el('button', 'btn', '🗣️ Maintenant');
    later.onclick = () => celebrate(); now.onclick = () => { db.set('at.' + L.week, 0); tab('sayit'); };
    foot.append(later, now);
  }
  function celebrate() {
    db.set('at.' + L.week, 0);
    panel.innerHTML = ''; foot.innerHTML = '';
    q('#lesson-steps').innerHTML = STEPS.map(() => '<span class="done"></span>').join('');
    heading('Leçon terminée ! 🎉', `See you next week for Lesson ${L.week + 1}. Your phrases are kept in the phrasebook for the trip.`);
    const fizz = el('div', 'fizz-burst'); for (let i = 0; i < 24; i++) { const s = el('span'); s.style.left = Math.random() * 100 + '%'; s.style.animationDelay = Math.random() * 1.2 + 's'; s.style.width = s.style.height = 4 + Math.random() * 10 + 'px'; fizz.append(s); }
    panel.append(fizz);
    next('Retour au menu', close);
  }

  /* ---------- The À dire list (its own tab) ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  function renderSayIt() {
    onObj = null; clearMarks(); zoomTo(FULL);
    panel.innerHTML = ''; foot.innerHTML = '';
    const list = db.get('sayit', []);
    heading('À dire 🗣️', 'For when you can speak aloud: listen, say it, record yourself if you like, then mark it said.');
    if (!list.length) panel.append(el('p', 'en', 'Nothing here yet. Phrases arrive at the end of each lesson.'));
    const save = () => { db.set('sayit', list); updateTabCount(); };
    list.filter(x => !x.said).forEach(item => {
      const row = el('div', 'say-row', `<span class="fr">${nb(item.fr)}</span><span class="hint">${item.hint || ''}</span><span class="en">${item.en}</span><div class="ctrls"></div><div class="heard"></div>`);
      const ctrls = row.querySelector('.ctrls'), heard = row.querySelector('.heard');
      const play = el('button', 'chip', '▶ Moi'); play.hidden = true;
      const recBtn = el('button', 'chip', '🎙 M\'enregistrer');
      recBtn.onclick = () => toggleRec(recBtn, play);
      ctrls.append(sayBtn(item.fr, '🔊 Écouter'), recBtn, play);
      if (SR) { const c = el('button', 'chip', '👂 Vérifier'); c.onclick = () => checkSpeech(item.fr, c, heard); ctrls.append(c); }
      const said = el('button', 'chip gold', '✓ Dit !');
      said.onclick = () => { item.said = true; save(); row.classList.add('gone'); setTimeout(renderSayIt, 350); };
      ctrls.append(said);
      panel.append(row);
    });
    const done = list.filter(x => x.said);
    if (done.length) {
      const d = el('details', 'said-list', `<summary>Déjà dit · already said (${done.length})</summary>`);
      done.forEach(item => {
        const r = el('div', 'said-item', `<span class="fr">${nb(item.fr)}</span>`);
        const again = el('button', 'chip', '↺'); again.title = 'Put back in the list';
        again.onclick = () => { item.said = false; save(); renderSayIt(); };
        r.append(sayBtn(item.fr), again); d.append(r);
      });
      panel.append(d);
    }
    if (L) next('← Leçon', () => tab('lesson'));
  }
  async function toggleRec(btn, play) {
    if (rec && rec.state === 'recording') { rec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      rec = new MediaRecorder(stream);
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType }));
        play.hidden = false;
        play.onclick = () => { const a = new Audio(url); a.muted = SFX.muted; a.play(); };
        btn.textContent = '🎙 Encore'; btn.classList.remove('rec');
      };
      rec.start(); btn.textContent = '⏹ Stop'; btn.classList.add('rec');
      setTimeout(() => { if (rec && rec.state === 'recording') rec.stop(); }, 6000);
    } catch { btn.textContent = '🎙 No microphone'; btn.disabled = true; }
  }
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
  function similarity(target, heard) { const t = norm(target), h = new Set(norm(heard)); return t.filter(w => h.has(w)).length / t.length; }
  function checkSpeech(target, btn, out) {
    const r = new SR(); r.lang = 'fr-FR'; r.maxAlternatives = 3; r.interimResults = false;
    btn.textContent = '👂 J\'écoute…'; out.textContent = '';
    r.onresult = e => {
      const alts = [...e.results[0]].map(a => a.transcript), best = Math.max(...alts.map(a => similarity(target, a)));
      out.innerHTML = best >= .75 ? '🥂 <b>Parfait !</b>' : best >= .4 ? `Presque ! I heard “${alts[0]}”. Encore une fois ?` : `I heard “${alts[0]}”. Try once more, a little slower?`;
    };
    r.onerror = () => { out.textContent = 'Didn\'t catch that. Try again?'; };
    r.onend = () => { btn.textContent = '👂 Vérifier'; };
    r.start();
  }

  /* ---------- Menu hooks ---------- */
  function current() {
    const now = new Date();
    const open = LESSONS.filter(l => preview || new Date(l.unlock) <= now);
    return open[open.length - 1] || null;
  }
  function openFromMenu() { const l = current(); if (!l) return false; open(l); return true; }
  function menuLabel() {
    const n = pending().length, l = current();
    if (!l) return 'First lesson on Christmas Day';
    return `Leçon ${l.week}${n ? ` · ${n} à dire` : ''}`;
  }

  return { open, close, openFromMenu, menuLabel, byWeek: w => LESSONS.find(l => l.week === w), _music: Music };
})();

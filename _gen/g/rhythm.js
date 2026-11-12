/*@ {"name":"Rhythm","t1":"Rhy","t2":"thm","theme":"#08060c","bg2":"radial-gradient(ellipse at 50% 0%,#24183a 0%,#08060c 66%)","libs":["arcade.js","music.js"],
"hud":[["Pontos","pts","0"],["Combo","combo","0"],["Precisão","acc","100%"]]} @*/
/* H-LUX RHYTHM v1.0 — notas chegam ao anel central vindas de 4 direções, no tempo da música.
   Toque no quadrante da direção (ou setas / D F J K no PC) quando a nota cruza o anel.
   Avaliação: Perfeito ±45 ms, Ótimo ±90, Bom ±140; combos multiplicam a pontuação; erros drenam a energia (zerou, perdeu).
   4 faixas originais (shared/music.js), 3 dificuldades derivadas da própria composição, ajuste de latência com calibração.
   Módulos: SONGS · Chart · Game · View · UI */
const S = HX.store('rhythm');
const VW = 400, VH = 600, CX = 200, CY = 290, RING = 46, FAR = 250;
const SONGS = [
  { n: 'Primeiro Passo', bpm: 96, bars: 24, seed: 3, root: 60, scale: 'major', prog: [0, 4, 5, 3] },
  { n: 'Ouro Líquido', bpm: 112, bars: 28, seed: 17, root: 57, scale: 'minor', prog: [0, 5, 3, 4] },
  { n: 'Noite em Neon', bpm: 126, bars: 32, seed: 41, root: 62, scale: 'dorian', prog: [0, 3, 6, 4] },
  { n: 'Coroa', bpm: 140, bars: 32, seed: 77, root: 55, scale: 'minor', prog: [0, 6, 5, 4] }
];
const DIFF = [{ n: 'Fácil', gap: .42, app: 1.6, kinds: ['kick', 'snare', 'lead'] }, { n: 'Normal', gap: .2, app: 1.3, kinds: ['kick', 'snare', 'lead'] }, { n: 'Difícil', gap: .1, app: 1.05, kinds: ['kick', 'snare', 'lead'] }];
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]], DCOL = ['#e0b14a', '#3d8bff', '#e5484d', '#3ddc84'], DKEY = ['↑', '→', '↓', '←'];
const WIN = [[.045, 'Perfeito', 300, '#ffd54a'], [.09, 'Ótimo', 200, '#3ddc84'], [.14, 'Bom', 100, '#9fd2ff']];
const Chart = {
  build(song, d) {
    const D = DIFF[d], src = HXM.compose(song).notes.filter(n => D.kinds.includes(n.kind) && (d > 0 || n.beat % 1 === 0) && (d > 1 || n.kind !== 'lead' || (n.beat * 2) % 1 === 0));
    // notas simultâneas viram uma só: caixa > melodia > bumbo (assim as 4 direções aparecem)
    const pri = { snare: 3, lead: 2, kick: 1 }, merged = []; for (const n of src) { const m = merged[merged.length - 1]; if (m && Math.abs(m.t - n.t) < .01) { if (pri[n.kind] > pri[m.kind]) merged[merged.length - 1] = n; } else merged.push(n); }
    const out = []; let last = -9, li = 0; for (const n of merged) { if (n.t - last < D.gap) continue; if (n.t < 60 / song.bpm * 4) continue;
      const lane = n.kind === 'kick' ? 2 : n.kind === 'snare' ? 0 : [1, 3][Math.floor(n.p) % 2]; li++; out.push({ t: n.t, lane, hit: 0 }); last = n.t; }
    return out;
  }
};
const Game = {
  state: 'idle', si: 0, d: 1, song: null, notes: [], pts: 0, combo: 0, maxC: 0, judged: 0, accSum: 0, energy: 1, fx: [], cnt: null, flash: [0, 0, 0, 0], st: 0,
  start(si, d) {
    HX.close(); this.si = si; this.d = d; const def = SONGS[si]; this.song = HXM.song(def); this.notes = Chart.build(def, d); this.pts = 0; this.combo = 0; this.maxC = 0; this.judged = 0; this.accSum = 0; this.energy = 1; this.fx = []; this.cnt = { p: 0, g: 0, b: 0, m: 0 };
    this.state = 'play'; this.lead = 1.2; this.st = -this.lead; this.started = false; UI.hud();
  },
  off() { return (S.get('offset', 0)) / 1000; },
  now() { return this.started ? this.song.now() - this.off() : this.st; },
  step(dt) {
    for (let i = 0; i < 4; i++) this.flash[i] = Math.max(0, this.flash[i] - dt * 4); this.fx = this.fx.filter(e => (e.t -= dt) > 0);
    if (this.state !== 'play') return;
    if (!this.started) { this.st += dt; if (this.st >= 0) { this.song.start(0); this.started = true; } return; }
    const t = this.now();
    for (const n of this.notes) if (!n.hit && t - n.t > WIN[2][0]) { n.hit = -1; this.judge(null, n); }
    if (t > this.song.dur + .3) return this.end(true);
    UI.hud();
  },
  press(lane) {
    if (this.state !== 'play' || !this.started) return; this.flash[lane] = 1; const t = this.now(); let best = null, bd = 1;
    for (const n of this.notes) { if (n.hit || n.lane !== lane) continue; const d = Math.abs(n.t - t); if (d < bd) { bd = d; best = n; } if (n.t - t > .3) break; }
    if (best && bd <= WIN[2][0]) { best.hit = 1; this.judge(WIN.find(w => bd <= w[0]), best, best.t - t); } else if (best && bd < .25) { /* toque cedo demais: ignora sem punir para evitar falsos erros */ }
  },
  judge(w, n, dev) {
    this.judged++;
    if (!w) { this.combo = 0; this.cnt.m++; this.energy -= .08; this.fx.push({ s: 'Erro', c: '#e5484d', lane: n.lane, t: .5 }); HX.vibrate(15); if (this.energy <= 0) return this.end(false); return; }
    this.combo++; this.maxC = Math.max(this.maxC, this.combo); const mul = Math.min(4, 1 + Math.floor(this.combo / 20)); this.pts += w[2] * mul; this.accSum += w[2] / 300; this.energy = Math.min(1, this.energy + .015);
    this.cnt[w[1] === 'Perfeito' ? 'p' : w[1] === 'Ótimo' ? 'g' : 'b']++; this.fx.push({ s: w[1], c: w[3], lane: n.lane, t: .45, dev });
  },
  acc() { return this.judged ? this.accSum / this.judged : 1; },
  grade(a) { return a >= .95 ? 'S' : a >= .88 ? 'A' : a >= .78 ? 'B' : a >= .65 ? 'C' : 'D'; },
  end(cleared) {
    this.state = 'over'; this.song.stop(); const a = this.acc(), key = `${this.si}_${this.d}`; const rec = S.get('rec', {}); const prev = rec[key] || { pts: 0 };
    const nb = cleared && this.pts > prev.pts; if (nb) { rec[key] = { pts: this.pts, acc: +a.toFixed(4), grade: this.grade(a), combo: this.maxC }; S.set('rec', rec); }
    const cl = Object.values(rec).length; S.hub(`${cl} faixas concluídas · melhor nota ${Object.values(rec).map(r => r.grade).sort()[0] || '—'}`); HX.sfx(cleared ? 'win' : 'lose');
    HXA.menu({ title: cleared ? `Nota ${this.grade(a)}` : 'Energia esgotada', text: `${SONGS[this.si].n} · ${DIFF[this.d].n}${nb ? ' · novo recorde!' : ''}`, stats: [[this.pts, 'Pontos'], [(a * 100).toFixed(1) + '%', 'Precisão'], [this.maxC, 'Maior combo']],
      html: `<p style="font-size:13px;color:var(--muted)">Perfeito ${this.cnt.p} · Ótimo ${this.cnt.g} · Bom ${this.cnt.b} · Erro ${this.cnt.m}</p>`, primary: ['Tocar de novo', () => this.start(this.si, this.d)], buttons: [['Faixas', () => UI.home()]] });
  }
};
const St = HXA.stage(VW, VH);
const View = {
  draw() {
    const g = St.begin(), G = Game; g.fillStyle = '#0d0a14'; g.fillRect(0, 0, VW, VH); const t = G.state === 'play' || G.state === 'pause' ? G.now() : 0; const app = DIFF[G.d].app;
    const beat = G.song ? 60 / G.song.bpm : .5, ph = t > 0 ? 1 - (t / beat) % 1 : 0; g.fillStyle = `rgba(201,164,92,${.04 + ph * ph * .08})`; g.beginPath(); g.arc(CX, CY, 200, 0, 7); g.fill();
    for (let i = 0; i < 4; i++) { const [dx, dy] = DIRS[i]; g.strokeStyle = DCOL[i] + '33'; g.lineWidth = 34; g.beginPath(); g.moveTo(CX + dx * RING, CY + dy * RING); g.lineTo(CX + dx * FAR, CY + dy * FAR); g.stroke();
      g.fillStyle = DCOL[i]; g.globalAlpha = .25 + G.flash[i] * .75; g.beginPath(); g.arc(CX + dx * RING, CY + dy * RING, 19, 0, 7); g.fill(); g.globalAlpha = 1; g.fillStyle = '#fff'; g.font = '800 22px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(DKEY[i], CX + dx * RING, CY + dy * RING + 1); }
    g.strokeStyle = '#c9a45c'; g.lineWidth = 3; g.beginPath(); g.arc(CX, CY, RING, 0, 7); g.stroke();
    for (const n of G.notes) { if (n.hit) continue; const u = (n.t - t) / app; if (u > 1 || u < -.15) continue; const r = RING + (FAR - RING) * Math.max(0, u), [dx, dy] = DIRS[n.lane];
      g.fillStyle = DCOL[n.lane]; g.beginPath(); g.arc(CX + dx * r, CY + dy * r, 15, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
    for (const e of G.fx) { const [dx, dy] = DIRS[e.lane]; g.globalAlpha = Math.min(1, e.t * 3); g.fillStyle = e.c; g.font = '800 17px Manrope'; g.fillText(e.s, CX + dx * 110 + (dx ? 0 : 60), CY + dy * 110 - (.5 - e.t) * 30); g.globalAlpha = 1; }
    g.fillStyle = '#f1dca6'; g.font = '800 30px Manrope'; g.fillText(G.combo > 1 ? G.combo : '', CX, CY - 2); if (G.combo >= 20) { g.font = '700 12px Manrope'; g.fillText('×' + Math.min(4, 1 + Math.floor(G.combo / 20)), CX, CY + 22); }
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(20, VH - 26, VW - 40, 8); g.fillStyle = G.energy > .3 ? '#3ddc84' : '#e5484d'; g.fillRect(20, VH - 26, (VW - 40) * Math.max(0, G.energy), 8);
    if (G.song) { g.fillStyle = '#c9a45c'; g.fillRect(20, 14, (VW - 40) * HX.clamp(t / G.song.dur, 0, 1), 4); }
    if (G.state === 'play' && !G.started) { g.fillStyle = '#f1dca6'; g.font = '800 40px Manrope'; g.fillText(Math.ceil(-G.st / .4), CX, 80); }
    g.textBaseline = 'alphabetic';
  }
};
const UI = {
  init() {
    St.cv.addEventListener('pointerdown', e => { e.preventDefault(); if (HX.isOpen()) return; const [x, y] = St.toL(e), dx = x - CX, dy = y - CY; Game.press(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0)); });
    addEventListener('keydown', e => { if (e.repeat) return; const m = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, f: 0, j: 1, k: 2, d: 3, F: 0, J: 1, K: 2, D: 3 }[e.key]; if (m !== undefined && !HX.isOpen()) { e.preventDefault(); Game.press(m); } if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { Game.step(dt); View.draw(); });
    HX.life({ onHide: () => { if (Game.state === 'play') this.pause(); } }); this.home();
  },
  hud() { HX.$('#pts').textContent = Game.pts; HX.$('#combo').textContent = Game.combo; HX.$('#acc').textContent = (Game.acc() * 100).toFixed(1) + '%'; },
  help: ['As notas vêm de quatro direções até o anel dourado. Toque no lado correspondente da tela (cima, direita, baixo, esquerda) quando a nota encostar no anel. No PC: setas ou D F J K.', 'Perfeito (±45 ms) = 300, Ótimo (±90 ms) = 200, Bom (±140 ms) = 100. A cada 20 acertos seguidos o multiplicador sobe (até ×4).', 'Erros gastam a barra de energia verde; acertos recuperam. Se ela zerar, a música para.', 'Se as notas parecerem adiantadas ou atrasadas no seu aparelho (fones Bluetooth costumam atrasar), use "Latência" para calibrar. Todas as músicas são originais, compostas pelo próprio jogo.'],
  sel: { s: 0, d: 1 },
  home() { const rec = S.get('rec', {}); const sel = this.sel;
    HXA.menu({ title: 'Rhythm', text: 'Escolha a faixa e a dificuldade.', html: `<div class="gar" style="display:grid;gap:6px;margin:8px 0">${SONGS.map((s, i) => { const r = rec[`${i}_${sel.d}`]; return `<button class="btn${i === sel.s ? ' btn-primary' : ''}" data-s="${i}" style="display:flex;justify-content:space-between;padding:8px 12px"><span>${s.n} <small>${s.bpm} BPM</small></span><small>${r ? `${r.grade} · ${r.pts}` : '—'}</small></button>`; }).join('')}</div>
      <div class="seg" id="dsel">${DIFF.map((d, i) => `<button data-d="${i}" class="${i === sel.d ? 'on' : ''}">${d.n}</button>`).join('')}</div>`, music: true,
      primary: ['Tocar', () => { HXM.ctx(); Game.start(sel.s, sel.d); }], buttons: [['Latência', () => this.calib()]], help: this.help });
    const c = document.querySelector('.hx-card'); c.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sel.s = +b.dataset.s; this.home(); }); c.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { sel.d = +b.dataset.d; this.home(); }); },
  /* calibração: 8 cliques a 100 BPM; a média do desvio dos toques vira o ajuste */
  calib() {
    const off = S.get('offset', 0); const c = HX.overlay(`<h3>Latência</h3><p>Ajuste atual: <b id="ofv">${off} ms</b></p><input type="range" id="ofr" min="-250" max="250" step="5" value="${off}" style="width:100%;accent-color:#c9a45c"><p style="font-size:13px;color:var(--muted)">Valores positivos atrasam a avaliação (use se você costuma acertar "atrasado").</p><button class="btn" id="ctest">Calibrar: toque no ritmo dos 8 cliques</button><div id="cpad" style="height:90px;border:1px dashed var(--line);border-radius:14px;margin:8px 0;display:grid;place-items:center;color:var(--muted)">toque aqui</div><button class="btn-primary" id="cok">Pronto</button>`, { guard: false });
    const set = v => { S.set('offset', v); c.querySelector('#ofv').textContent = v + ' ms'; c.querySelector('#ofr').value = v; };
    c.querySelector('#ofr').oninput = e => set(+e.target.value);
    c.querySelector('#ctest').onclick = () => { const A = HXM.ctx(); if (!A) return HX.toast('Áudio indisponível'); const t0 = A.currentTime + .6, beat = .6, taps = []; for (let i = 0; i < 12; i++) { const o = A.createOscillator(), gn = A.createGain(); o.frequency.value = i % 4 ? 900 : 1400; gn.gain.setValueAtTime(.4, t0 + i * beat); gn.gain.exponentialRampToValueAtTime(.001, t0 + i * beat + .06); o.connect(gn); gn.connect(A.destination); o.start(t0 + i * beat); o.stop(t0 + i * beat + .08); }
      const pad = c.querySelector('#cpad'); pad.textContent = 'ouça 4 cliques e toque nos 8 seguintes'; pad.onpointerdown = e => { e.preventDefault(); const tt = A.currentTime - t0; const k = Math.round(tt / beat); if (k >= 4 && k < 12) { taps.push(tt - k * beat); pad.textContent = `${taps.length}/8`; } if (taps.length >= 8) { taps.sort((a, b) => a - b); const med = (taps[3] + taps[4]) / 2; set(Math.round(med * 1000 / 5) * 5); pad.textContent = `Calibrado: ${Math.round(med * 1000)} ms`; pad.onpointerdown = null; } }; };
    HX.on(c, '#cok', () => this.home());
  },
  pause() { if (Game.state !== 'play') return Game.state === 'pause' ? null : this.home(); const at = Game.started ? Game.song.now() : -1; Game.state = 'pause'; Game.song.stop();
    HXA.menu({ title: 'Pausa', text: `${SONGS[Game.si].n}`, music: true, primary: ['Continuar', () => { Game.state = 'play'; if (at >= 0) Game.song.start(Math.max(0, at - 1.5)); }], buttons: [['Recomeçar faixa', () => Game.start(Game.si, Game.d)], ['Faixas', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.RH = { Game, UI, S, Chart, SONGS };

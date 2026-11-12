/*@ {"name":"Guitar","t1":"Gui","t2":"tar","theme":"#0a0706","bg2":"radial-gradient(ellipse at 50% 0%,#2c1a12 0%,#0a0706 66%)","libs":["arcade.js","music.js"],
"hud":[["Pontos","pts","0"],["Sequência","streak","0"],["Multiplicador","mul","×1"]],
"css":".frets{display:flex;gap:6px;margin-top:8px;width:100%;max-width:620px;align-self:center}.frets button{flex:1;min-height:70px;border-radius:14px;border:2px solid;background:#121214;touch-action:none;user-select:none;-webkit-user-select:none;font:800 13px Manrope,sans-serif;color:#fff}.frets button.on{filter:brightness(1.8)}.frets .sp{flex:0 0 58px;border-color:#9fd2ff;color:#9fd2ff}",
"body":"<div class=\"stage\" id=\"stage\"><canvas id=\"cv\"></canvas></div><div class=\"frets\" id=\"frets\"></div>"} @*/
/* H-LUX GUITAR v1.0 — notas coloridas descem por 3 a 5 trastes; toque o traste quando a nota cruzar a linha.
   Sequências sobem o multiplicador (×1 a ×4 a cada 10 acertos). Frases estelares (notas azuladas) carregam o Poder Estelar,
   que dobra o multiplicador por 8 s. Notas longas: segure até o fim para bônus. Acordes no Difícil.
   O medidor de rock cai com erros; zerou, a música para. Músicas originais sintetizadas (shared/music.js).
   Teclado: A S D F G (ou 1–5) e espaço para o Poder Estelar. Módulos: SONGS · Chart · Game · View · UI */
const S = HX.store('guitar');
const VW = 400, VH = 560, HIT = 500, APP = 1.25;
const COLS = ['#3ddc84', '#e5484d', '#ffd54a', '#3d8bff', '#ff9a2e'], NAMES = ['Verde', 'Vermelho', 'Amarelo', 'Azul', 'Laranja'];
const SONGS = [
  { n: 'Estrada Dourada', bpm: 104, bars: 28, seed: 201, root: 52, scale: 'minor', prog: [0, 6, 5, 6] },
  { n: 'Riff do Leão', bpm: 118, bars: 32, seed: 233, root: 55, scale: 'dorian', prog: [0, 3, 0, 4] },
  { n: 'Palco Final', bpm: 134, bars: 36, seed: 271, root: 50, scale: 'minor', prog: [0, 5, 3, 4] }
];
const DIFF = [{ n: 'Fácil', lanes: 3, gap: .38, chords: false, sus: false }, { n: 'Médio', lanes: 4, gap: .22, chords: false, sus: true }, { n: 'Difícil', lanes: 5, gap: .14, chords: true, sus: true }];
const WIN = .1;
const Chart = {
  build(def, d) {
    const D = DIFF[d], src = HXM.compose(def).notes.filter(n => n.kind === 'lead' || (n.kind === 'kick' && d === 0)); const out = []; let last = -9, prevP = null, lane = Math.floor(D.lanes / 2);
    for (const n of src) { if (n.t - last < D.gap || n.t < 60 / def.bpm * 4) continue;
      if (n.kind === 'lead') { if (prevP !== null) lane = HX.clamp(lane + Math.sign(n.p - prevP) * (Math.abs(n.p - prevP) > 4 ? 2 : 1) * (n.p === prevP ? 0 : 1), 0, D.lanes - 1); prevP = n.p; } else lane = (lane + 2) % D.lanes;
      const note = { t: n.t, lanes: [lane], len: D.sus && n.len >= .75 ? n.len * 60 / def.bpm * .9 : 0, hit: 0 };
      if (D.chords && n.beat % 2 === 0 && n.kind === 'lead') note.lanes.push(lane >= D.lanes - 2 ? lane - 2 : lane + 2);
      out.push(note); last = n.t; }
    // frases estelares: grupos de 6 notas a cada ~16
    for (let i = 8; i < out.length; i += 18) for (let k = i; k < Math.min(out.length, i + 6); k++) { out[k].star = true; out[k].phrase = i; }
    return out;
  }
};
const Game = {
  state: 'idle', si: 0, d: 1, song: null, notes: [], pts: 0, streak: 0, best: 0, hits: 0, rock: .6, star: 0, starOn: 0, held: [], fx: [], pressed: [0, 0, 0, 0, 0], started: false, st: 0, lanes: 4, sustain: [],
  start(si, d) { HX.close(); this.si = si; this.d = d; this.lanes = DIFF[d].lanes; const def = SONGS[si]; this.song = HXM.song(def); this.notes = Chart.build(def, d); this.pts = 0; this.streak = 0; this.best = 0; this.hits = 0; this.rock = .6; this.star = 0; this.starOn = 0; this.fx = []; this.sustain = []; this.phraseBad = {};
    this.state = 'play'; this.started = false; this.st = -1.2; UI.frets(); UI.hud(); },
  now() { return this.started ? this.song.now() - S.get('offset', 0) / 1000 : this.st; },
  mul() { return Math.min(4, 1 + Math.floor(this.streak / 10)) * (this.starOn > 0 ? 2 : 1); },
  step(dt) {
    this.fx = this.fx.filter(e => (e.t -= dt) > 0); if (this.state !== 'play') return;
    if (!this.started) { this.st += dt; if (this.st >= 0) { this.song.start(0); this.started = true; } return; }
    const t = this.now(); if (this.starOn > 0) { this.starOn = Math.max(0, this.starOn - dt); }
    for (const n of this.notes) if (!n.hit && t - n.t > WIN) { n.hit = -1; this.miss(n); }
    for (const s of this.sustain) { if (s.done) continue; if (s.lanes.every(l => this.pressed[l])) { this.pts += Math.round(dt * 60 * this.mul()); if (t >= s.t + s.len) { s.done = true; } } else s.done = true; }
    this.sustain = this.sustain.filter(s => !s.done);
    if (t > this.song.dur + .3) return this.end(true);
    UI.hud();
  },
  press(l) {
    if (this.state !== 'play') return; this.pressed[l] = 1; if (!this.started) return; const t = this.now();
    let n = this.notes.find(n => !n.hit && Math.abs(n.t - t) <= WIN && n.lanes.includes(l)); if (!n) { this.fx.push({ l, t: .25, c: '#e5484d' }); this.rock -= .015; return; }
    // acorde: só conta quando todas as cores do acorde estão pressionadas
    if (n.lanes.every(x => this.pressed[x])) { n.hit = 1; this.hit(n, Math.abs(n.t - t)); }
  },
  release(l) { this.pressed[l] = 0; },
  hit(n, dev) { this.streak++; this.hits++; this.best = Math.max(this.best, this.streak); this.pts += 50 * n.lanes.length * this.mul(); this.rock = Math.min(1, this.rock + .02); for (const l of n.lanes) this.fx.push({ l, t: .3, c: n.star ? '#9fd2ff' : COLS[l], ok: true });
    if (n.len) this.sustain.push(n); if (n.star && !this.phraseBad[n.phrase] && !this.notes.some(o => o.phrase === n.phrase && o.hit !== 1)) { this.star = Math.min(1, this.star + .34); HX.toast('Frase estelar completa!', 900); HX.sfx('power'); } },
  miss(n) { this.streak = 0; this.rock -= .05; if (n.star) this.phraseBad[n.phrase] = true; HX.vibrate(12); if (this.rock <= 0) this.end(false); },
  activateStar() { if (this.state !== 'play' || this.star < .5 || this.starOn > 0) return; this.starOn = 8 * this.star; this.star = 0; HX.sfx('power'); HX.toast('Poder Estelar! Multiplicador dobrado', 1100); },
  end(ok) {
    if (this.state === 'over') return; this.state = 'over'; this.song.stop(); const total = this.notes.length, pct = this.hits / total, stars = !ok ? 0 : pct >= .95 ? 5 : pct >= .85 ? 4 : pct >= .7 ? 3 : pct >= .5 ? 2 : 1;
    const key = `${this.si}_${this.d}`, rec = S.get('rec', {}); const nb = ok && (!rec[key] || this.pts > rec[key].pts); if (nb) { rec[key] = { pts: this.pts, stars, pct: +pct.toFixed(3) }; S.set('rec', rec); }
    S.hub(`${Object.keys(rec).length}/9 músicas · ${Object.values(rec).reduce((a, r) => a + r.stars, 0)} estrelas`); HX.sfx(ok ? 'win' : 'lose');
    HXA.menu({ title: ok ? '★'.repeat(stars) + '☆'.repeat(5 - stars) : 'A plateia vaiou!', text: `${SONGS[this.si].n} · ${DIFF[this.d].n}${nb ? ' · novo recorde!' : ''}`, stats: [[this.pts, 'Pontos'], [Math.round(pct * 100) + '%', 'Notas'], [this.best, 'Maior sequência']], primary: ['Tocar de novo', () => this.start(this.si, this.d)], buttons: [['Músicas', () => UI.home()]] });
  }
};
const St = HXA.stage(VW, VH);
const View = {
  draw() {
    const g = St.begin(), G = Game; g.fillStyle = '#0d0907'; g.fillRect(0, 0, VW, VH); const n = G.lanes, t = G.state === 'play' || G.state === 'pause' || G.state === 'over' ? G.now() : 0;
    // braço em perspectiva
    const topW = 150, botW = 360, x0 = y => VW / 2 - (topW + (botW - topW) * (y / VH)) / 2, w = y => topW + (botW - topW) * (y / VH), lx = (l, y) => x0(y) + w(y) * (l + .5) / n;
    g.fillStyle = G.starOn > 0 ? '#14223a' : '#1c140e'; g.beginPath(); g.moveTo(x0(0), 0); g.lineTo(x0(0) + w(0), 0); g.lineTo(x0(VH) + w(VH), VH); g.lineTo(x0(VH), VH); g.fill();
    const beat = G.song ? 60 / G.song.bpm : .5; g.strokeStyle = 'rgba(201,164,92,.18)'; g.lineWidth = 2; for (let b = Math.ceil((t) / beat); b * beat < t + APP; b++) { const y = HIT - (b * beat - t) / APP * HIT; g.beginPath(); g.moveTo(x0(y), y); g.lineTo(x0(y) + w(y), y); g.stroke(); }
    for (let l = 0; l <= n; l++) { g.strokeStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(x0(0) + w(0) * l / n, 0); g.lineTo(x0(VH) + w(VH) * l / n, VH); g.stroke(); }
    for (let l = 0; l < n; l++) { g.strokeStyle = COLS[l]; g.lineWidth = 4; g.fillStyle = G.pressed[l] ? COLS[l] : '#0d0907'; g.beginPath(); g.ellipse(lx(l, HIT), HIT, w(HIT) / n * .36, 12, 0, 0, 7); g.fill(); g.stroke(); }
    for (const nt of G.notes) { if (nt.hit === 1 && !nt.len) continue; const y = HIT - (nt.t - t) / APP * HIT; if (y < -20 || y > VH + 20 && !nt.len) continue;
      for (const l of nt.lanes) { if (nt.len) { const y2 = HIT - (nt.t + nt.len - t) / APP * HIT; if (y2 > HIT) continue; g.strokeStyle = COLS[l]; g.globalAlpha = nt.hit === -1 ? .25 : .8; g.lineWidth = 8; g.beginPath(); g.moveTo(lx(l, Math.min(y, HIT)), Math.min(y, HIT)); g.lineTo(lx(l, Math.max(y2, 0)), Math.max(y2, 0)); g.stroke(); g.globalAlpha = 1; }
        if (nt.hit) continue; const s = .5 + .5 * (y / VH); g.fillStyle = nt.star ? '#cfe6ff' : COLS[l]; g.beginPath(); g.ellipse(lx(l, y), y, w(y) / n * .32, 10 * s + 2, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(lx(l, y), y - 2 * s, w(y) / n * .14, 4 * s, 0, 0, 7); g.fill(); } }
    for (const e of G.fx) { g.globalAlpha = e.t * 3; g.fillStyle = e.c; g.beginPath(); g.arc(lx(e.l, HIT), HIT - (e.ok ? 18 : 0), e.ok ? 26 * (1.3 - e.t) : 12, 0, 7); g.fill(); g.globalAlpha = 1; }
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(10, 40, 10, 200); const rk = Math.max(0, G.rock); g.fillStyle = rk > .5 ? '#3ddc84' : rk > .25 ? '#ffd54a' : '#e5484d'; g.fillRect(10, 40 + 200 * (1 - rk), 10, 200 * rk);
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(VW - 20, 40, 10, 200); g.fillStyle = '#9fd2ff'; const sv = G.starOn > 0 ? G.starOn / 8 : G.star; g.fillRect(VW - 20, 40 + 200 * (1 - sv), 10, 200 * sv);
    g.fillStyle = '#f1dca6'; g.font = '800 22px Manrope'; g.textAlign = 'center'; g.fillText('×' + G.mul(), VW / 2, 34); if (G.song) { g.fillStyle = '#c9a45c'; g.fillRect(40, 8, (VW - 80) * HX.clamp(t / G.song.dur, 0, 1), 3); }
    if (G.state === 'play' && !G.started) { g.font = '800 40px Manrope'; g.fillText(Math.ceil(-G.st / .4), VW / 2, 200); }
  }
};
const UI = {
  sel: { s: 0, d: 1 },
  init() {
    addEventListener('keydown', e => { if (e.repeat) return; const i = { a: 0, s: 1, d: 2, f: 3, g: 4, A: 0, S: 1, D: 2, F: 3, G: 4, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }[e.key]; if (i !== undefined && i < Game.lanes && !HX.isOpen()) { e.preventDefault(); Game.press(i); this.lit(i, 1); } if (e.key === ' ') { e.preventDefault(); Game.activateStar(); } if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    addEventListener('keyup', e => { const i = { a: 0, s: 1, d: 2, f: 3, g: 4, A: 0, S: 1, D: 2, F: 3, G: 4, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }[e.key]; if (i !== undefined) { Game.release(i); this.lit(i, 0); } });
    St.cv.addEventListener('pointerdown', e => { const [x, y] = St.toL(e); if (y < 260 && x > VW - 60) Game.activateStar(); });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { Game.step(dt); View.draw(); });
    HX.life({ onHide: () => { if (Game.state === 'play') this.pause(); } }); this.frets(); this.home();
  },
  frets() { const n = Game.lanes, keys = 'ASDFG'; const box = HX.$('#frets'); box.innerHTML = Array.from({ length: n }, (_, i) => `<button data-l="${i}" style="border-color:${COLS[i]};color:${COLS[i]}">${keys[i]}</button>`).join('') + '<button class="sp" id="spbtn">★</button>';
    box.querySelectorAll('[data-l]').forEach(b => { const l = +b.dataset.l; b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); Game.press(l); b.classList.add('on'); }); const up = () => { Game.release(l); b.classList.remove('on'); }; b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('contextmenu', e => e.preventDefault()); });
    HX.$('#spbtn').addEventListener('pointerdown', e => { e.preventDefault(); Game.activateStar(); }); },
  lit(i, on) { const b = HX.$(`#frets [data-l="${i}"]`); if (b) b.classList.toggle('on', !!on); },
  hud() { HX.$('#pts').textContent = Game.pts; HX.$('#streak').textContent = Game.streak; HX.$('#mul').textContent = '×' + Game.mul(); },
  help: ['Toque o botão da cor certa quando a nota cruzar o anel na base do braço. No PC: A S D F G (ou 1 a 5).', 'Acordes (Difícil): pressione as duas cores juntas. Notas longas: segure até o rastro acabar para ganhar pontos extras.', 'A cada 10 acertos seguidos o multiplicador sobe até ×4. Complete as frases de notas azuladas para encher a barra estelar (direita) e toque ★ (ou espaço) para dobrar o multiplicador por alguns segundos.', 'A barra da esquerda é o medidor de rock: erros e toques no vazio derrubam; se zerar, a música para. Fácil usa 3 cores, Médio 4 e Difícil 5. Músicas originais; a latência ajustada no Rhythm não é compartilhada — ajuste aqui se precisar.'],
  home() { const rec = S.get('rec', {}), sel = this.sel;
    HXA.menu({ title: 'Guitar', text: 'Escolha a música e a dificuldade.', html: `<div style="display:grid;gap:6px;margin:8px 0">${SONGS.map((s, i) => { const r = rec[`${i}_${sel.d}`]; return `<button class="btn${i === sel.s ? ' btn-primary' : ''}" data-s="${i}" style="display:flex;justify-content:space-between;padding:8px 12px"><span>${s.n} <small>${s.bpm} BPM</small></span><small>${r ? '★'.repeat(r.stars) + ' ' + r.pts : '—'}</small></button>`; }).join('')}</div>
      <div class="seg">${DIFF.map((d, i) => `<button data-d="${i}" class="${i === sel.d ? 'on' : ''}">${d.n}</button>`).join('')}</div>
      <label style="display:flex;gap:8px;align-items:center;justify-content:center;font-size:13px;color:var(--muted);margin-top:8px">Latência <input type="range" id="glat" min="-200" max="200" step="10" value="${S.get('offset', 0)}" style="accent-color:#c9a45c"> <b id="glv">${S.get('offset', 0)} ms</b></label>`, music: true,
      primary: ['Tocar', () => { HXM.ctx(); Game.start(sel.s, sel.d); }], help: this.help });
    const c = document.querySelector('.hx-card'); c.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sel.s = +b.dataset.s; this.home(); }); c.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { sel.d = +b.dataset.d; Game.lanes = DIFF[sel.d].lanes; this.frets(); this.home(); });
    c.querySelector('#glat').oninput = e => { S.set('offset', +e.target.value); c.querySelector('#glv').textContent = e.target.value + ' ms'; }; },
  pause() { if (Game.state !== 'play') return Game.state === 'pause' ? null : this.home(); const at = Game.started ? Game.song.now() : -1; Game.state = 'pause'; Game.song.stop(); Game.pressed = [0, 0, 0, 0, 0];
    HXA.menu({ title: 'Pausa', text: SONGS[Game.si].n, music: true, primary: ['Continuar', () => { Game.state = 'play'; if (at >= 0) Game.song.start(Math.max(0, at - 1.5)); }], buttons: [['Recomeçar', () => Game.start(Game.si, Game.d)], ['Músicas', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.GT = { Game, UI, S, Chart, SONGS };

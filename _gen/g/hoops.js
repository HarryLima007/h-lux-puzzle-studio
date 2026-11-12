/*@ {"name":"Hoops","t1":"Hoo","t2":"ps","theme":"#0a0706","bg2":"radial-gradient(ellipse at 50% 0%,#2a1a10 0%,#0a0706 66%)",
"hud":[["Pontos","pts","0"],["Tempo","tm","60"],["Sequência","streak","0"]]} @*/
/* H-LUX HOOPS v1.0 — arremessos de basquete com física: arco da bola, aro (frente e trás), tabela e rede.
   Puxe a bola para trás e solte (estilingue): o ângulo e a distância do puxão definem direção e força.
   Modos: Contra o relógio (60 s; cesta de longe vale 3, "chuá" sem tocar no aro +1), Desafio de 3 pontos
   (5 posições × 5 bolas, a última de cada rack vale 2; 70 s) e Treino. Dificuldade = quanto da trajetória é mostrada.
   Módulos: Game · View · UI */
const S = HX.store('hoops');
const VW = 400, VH = 600, FLOOR = 560, BR = 12, RIM = [298, 240], RIM2 = [346, 240], BOARD = [356, 150, 262], G0 = 980;
const MODES = { time: { n: 'Contra o relógio', t: 60 }, three: { n: 'Desafio de 3 pontos', t: 70 }, free: { n: 'Treino', t: 0 } };
const DIFF = [{ n: 'Fácil', prev: .55 }, { n: 'Normal', prev: .25 }, { n: 'Difícil', prev: 0 }];
const Game = {
  state: 'idle', mode: 'time', d: 1, pts: 0, t: 0, streak: 0, bestStreak: 0, ball: null, shooter: [120, FLOOR], made: 0, shots: 0, rack: 0, rackBall: 0, fx: [], netT: 0,
  start(mode, d) { HX.close(); this.mode = mode; this.d = d; this.pts = 0; this.t = MODES[mode].t; this.streak = 0; this.bestStreak = 0; this.made = 0; this.shots = 0; this.rack = 0; this.rackBall = 0; this.fx = []; this.newSpot(true); this.state = 'aim'; UI.hud(); },
  newSpot(first) {
    if (this.mode === 'three') this.shooter = [[50, 80, 110, 80, 50][this.rack], FLOOR];
    else this.shooter = [first ? 180 : 50 + Math.random() * 190, FLOOR];
    this.ball = { x: this.shooter[0], y: this.shooter[1] - 60, vx: 0, vy: 0, live: false, touched: false, scored: false, below: false };
  },
  dist() { return Math.round((RIM[0] + 24 - this.shooter[0]) / 30 * 10) / 10; },
  value() { if (this.mode === 'three') return this.rackBall === 4 ? 2 : 1; return this.shooter[0] < 130 ? 3 : 2; },
  shoot(vx, vy) { if (this.state !== 'aim') return; const b = this.ball; b.vx = vx; b.vy = vy; b.live = true; this.state = 'fly'; this.shots++; this.flyT = 0; HX.sfx('tap'); },
  step(dt) {
    this.fx = this.fx.filter(e => (e.t -= dt) > 0); this.netT = Math.max(0, this.netT - dt);
    if (MODES[this.mode].t && (this.state === 'aim' || this.state === 'fly')) { this.t -= dt; if (this.t <= 0) { this.t = 0; return this.end(); } }
    if (this.state !== 'fly') return; const b = this.ball; this.flyT += dt; const n = 6, h = dt / n;
    for (let i = 0; i < n; i++) { const py = b.y; b.vy += G0 * h; b.x += b.vx * h; b.y += b.vy * h;
      for (const [rx, ry] of [RIM, RIM2]) { const dx = b.x - rx, dy = b.y - ry, d = Math.hypot(dx, dy); if (d < BR + 3 && d > 0) { const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny; b.x = rx + nx * (BR + 3); b.y = ry + ny * (BR + 3); if (vn < 0) { b.vx -= 1.6 * vn * nx; b.vy -= 1.6 * vn * ny; b.touched = true; HX.sfx('hit'); } } }
      if (b.x + BR > BOARD[0] && b.y > BOARD[1] && b.y < BOARD[2] && b.vx > 0) { b.x = BOARD[0] - BR; b.vx = -b.vx * .6; b.touched = true; HX.sfx('hit'); }
      if (b.x - BR < 0) { b.x = BR; b.vx = -b.vx * .5; }
      if (b.y + BR > FLOOR) { b.y = FLOOR - BR; b.vy = -b.vy * .55; b.vx *= .8; if (Math.abs(b.vy) < 60) b.vy = 0; }
      // cesta: passa de cima para baixo pela linha do aro, entre os dois pontos
      if (!b.scored && py <= RIM[1] && b.y > RIM[1] && b.x > RIM[0] + 4 && b.x < RIM2[0] - 4 && b.vy > 0) { b.scored = true; this.make(); }
    }
    if (this.flyT > 4 || (b.y >= FLOOR - BR - 1 && Math.abs(b.vy) < 1 && Math.abs(b.vx) < 30) || b.x > VW + 40) this.after();
  },
  make() { const b = this.ball; let v = this.value(); const swish = !b.touched; if (swish && this.mode !== 'three') v++; this.pts += v; this.made++; this.streak++; this.bestStreak = Math.max(this.bestStreak, this.streak); this.netT = .5;
    if (this.mode === 'time' && this.streak >= 3) { this.t += 2; } this.fx.push({ s: (swish ? 'Chuá! ' : '') + '+' + v + (this.mode === 'time' && this.streak >= 3 ? ' · +2 s' : ''), t: 1 }); HX.sfx(swish ? 'win' : 'coin'); UI.hud(); },
  after() {
    if (this.state !== 'fly') return; if (!this.ball.scored) { this.streak = 0; this.fx.push({ s: 'Errou', t: .7, c: '#e5484d' }); }
    if (this.mode === 'three') { this.rackBall++; if (this.rackBall >= 5) { this.rackBall = 0; this.rack++; if (this.rack >= 5) return this.end(); HX.toast(`Posição ${this.rack + 1}`, 800); } }
    this.state = 'aim'; this.newSpot(false); UI.hud();
  },
  end() {
    if (this.state === 'over') return; this.state = 'over'; const key = `${this.mode}_${this.d}`; const rec = HXA.best(S, key, this.pts); HXA.best(S, 'streak', this.bestStreak);
    const st = S.get('stats', { shots: 0, made: 0 }); st.shots += this.shots; st.made += this.made; S.set('stats', st); S.hub(`${st.made} cestas · ${Math.round(st.made / Math.max(1, st.shots) * 100)}% de aproveitamento`); HX.sfx('win');
    HXA.menu({ title: rec && this.pts ? 'Novo recorde!' : 'Fim!', text: `${MODES[this.mode].n} · ${DIFF[this.d].n}`, stats: [[this.pts, 'Pontos'], [`${this.made}/${this.shots}`, 'Cestas'], [this.bestStreak, 'Maior sequência'], [S.get(key, 0), 'Recorde']], primary: ['Jogar de novo', () => this.start(this.mode, this.d)], buttons: [['Menu', () => UI.home()]] });
  }
};
const St = HXA.stage(VW, VH);
const View = {
  draw() {
    const g = St.begin(), G = Game; const bg = g.createLinearGradient(0, 0, 0, VH); bg.addColorStop(0, '#1a1210'); bg.addColorStop(1, '#2a1c14'); g.fillStyle = bg; g.fillRect(0, 0, VW, VH);
    g.fillStyle = 'rgba(201,164,92,.06)'; for (let i = 0; i < 8; i++) g.fillRect(i * 56, 40, 30, FLOOR - 120);
    g.fillStyle = '#8a5a30'; g.fillRect(0, FLOOR, VW, VH - FLOOR); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(130, FLOOR); g.lineTo(130, FLOOR + 20); g.stroke(); g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '700 10px Manrope'; g.textAlign = 'center'; g.fillText('linha de 3', 130, FLOOR + 32);
    g.fillStyle = '#555'; g.fillRect(372, BOARD[2] - 10, 8, FLOOR - BOARD[2] + 10); g.fillRect(356, 200, 20, 6);
    g.fillStyle = 'rgba(244,239,226,.9)'; g.fillRect(BOARD[0], BOARD[1], 8, BOARD[2] - BOARD[1]); g.strokeStyle = '#e5484d'; g.strokeRect(BOARD[0], BOARD[1] + 40, 8, 40);
    // rede
    const sw = G.netT > 0 ? Math.sin(G.netT * 30) * 4 : 0; g.strokeStyle = 'rgba(244,239,226,.8)'; g.lineWidth = 1.5; for (let i = 0; i <= 5; i++) { const x0 = RIM[0] + (RIM2[0] - RIM[0]) * i / 5, x1 = RIM[0] + 10 + (RIM2[0] - RIM[0] - 20) * i / 5 + sw; g.beginPath(); g.moveTo(x0, RIM[1]); g.lineTo(x1, RIM[1] + 42); g.stroke(); } for (let k = 1; k <= 3; k++) { const y = RIM[1] + k * 13, sh = k * 3.3; g.beginPath(); g.moveTo(RIM[0] + sh, y); g.lineTo(RIM2[0] - sh + sw, y); g.stroke(); }
    const b = G.ball; if (b) { if (G.state === 'aim' && UI.pull) { const [vx, vy] = UI.vel(); const pv = DIFF[G.d].prev; if (pv) { g.fillStyle = 'rgba(241,220,166,.7)'; let x = b.x, y = b.y, ux = vx, uy = vy; for (let i = 0; i < 60 * pv * 1.4; i++) { ux = ux; uy += G0 / 60; x += ux / 60; y += uy / 60; if (i % 3 === 0) { g.beginPath(); g.arc(x, y, 2.5, 0, 7); g.fill(); } } } const pw = Math.hypot(vx, vy) / 1050; g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(14, 300, 10, 200); g.fillStyle = '#e0b14a'; g.fillRect(14, 500 - 200 * pw, 10, 200 * pw); }
      g.fillStyle = '#e07a2e'; g.beginPath(); g.arc(b.x, b.y, BR, 0, 7); g.fill(); g.strokeStyle = '#3a1a08'; g.lineWidth = 1.5; g.beginPath(); g.arc(b.x, b.y, BR, 0, 7); g.moveTo(b.x - BR, b.y); g.lineTo(b.x + BR, b.y); g.moveTo(b.x, b.y - BR); g.lineTo(b.x, b.y + BR); g.stroke(); }
    g.strokeStyle = '#ff6a00'; g.lineWidth = 4; g.beginPath(); g.moveTo(RIM[0], RIM[1]); g.lineTo(RIM2[0] + 6, RIM2[1]); g.stroke();
    const [sx] = G.shooter; g.fillStyle = '#e0b14a'; g.beginPath(); g.arc(sx - 22, FLOOR - 66, 9, 0, 7); g.fill(); g.fillStyle = '#2a2a30'; g.fillRect(sx - 30, FLOOR - 56, 16, 30); g.fillRect(sx - 30, FLOOR - 26, 6, 26); g.fillRect(sx - 20, FLOOR - 26, 6, 26);
    g.fillStyle = '#f1dca6'; g.font = '700 13px Manrope'; g.textAlign = 'left'; g.fillText(`${MODES[G.mode].n} · ${G.dist()} m · vale ${G.value()}`, 12, 24);
    if (G.mode === 'three') { g.fillText(`Posição ${G.rack + 1}/5 · bola ${G.rackBall + 1}/5${G.rackBall === 4 ? ' (dourada)' : ''}`, 12, 44); }
    for (const e of G.fx) { g.globalAlpha = Math.min(1, e.t * 2); g.fillStyle = e.c || '#ffd54a'; g.font = '800 24px Manrope'; g.textAlign = 'center'; g.fillText(e.s, 250, 150 - (1 - e.t) * 30); g.globalAlpha = 1; }
  }
};
const UI = {
  pull: null, start: null,
  vel() { const [dx, dy] = this.pull, k = 5.2, vx = -dx * k, vy = -dy * k, sp = Math.hypot(vx, vy), m = Math.min(1, 1050 / sp); return [vx * m, vy * m]; },
  init() {
    St.cv.addEventListener('pointerdown', e => { e.preventDefault(); if (Game.state !== 'aim' || HX.isOpen()) return; St.cv.setPointerCapture(e.pointerId); this.start = St.toL(e); this.pull = [0, 0]; });
    St.cv.addEventListener('pointermove', e => { if (!this.start) return; const [x, y] = St.toL(e); this.pull = [x - this.start[0], y - this.start[1]]; });
    St.cv.addEventListener('pointerup', () => { if (!this.start) return; this.start = null; const p = this.pull; this.pull = null; if (p && Math.hypot(...p) > 15) { this.pull = p; const [vx, vy] = this.vel(); this.pull = null; Game.shoot(vx, vy); } });
    addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { Game.step(Math.min(dt, 1 / 30)); View.draw(); });
    HX.life({ onHide: () => { if (Game.state === 'aim' || Game.state === 'fly') this.pause(); } }); this.home();
  },
  hud() { HX.$('#pts').textContent = Game.pts; HX.$('#tm').textContent = MODES[Game.mode].t ? Math.ceil(Game.t) : '∞'; HX.$('#streak').textContent = Game.streak; },
  help: ['Toque em qualquer lugar e puxe para trás e para baixo (como um estilingue); solte para arremessar. A direção oposta ao puxão é a direção do arremesso; puxar mais longe dá mais força.', 'Contra o relógio: 60 s, posição sorteada a cada arremesso; atrás da linha vale 3, dentro vale 2; cesta sem tocar no aro ("chuá") vale +1; a partir de 3 cestas seguidas, cada uma dá +2 s.', 'Desafio de 3 pontos: 5 posições com 5 bolas cada; cada cesta vale 1 e a última bola de cada posição (dourada) vale 2 — máximo 30, em 70 s.', 'Dificuldade: Fácil mostra boa parte da trajetória, Normal mostra só o começo, Difícil não mostra nada. Treino não tem tempo.'],
  sel: { m: 'time', d: 1 },
  home() { const sel = this.sel, st = S.get('stats', { shots: 0, made: 0 });
    HXA.menu({ title: 'Hoops', text: 'Arremessos de basquete.', stats: [[S.get(`time_${sel.d}`, 0), 'Relógio'], [S.get(`three_${sel.d}`, 0), '3 pontos'], [`${Math.round(st.made / Math.max(1, st.shots) * 100)}%`, 'Aproveitamento']],
      html: `<div class="segs"><div class="segg"><small>Modo</small><div class="seg" id="sm">${Object.entries(MODES).map(([k, m]) => `<button data-v="${k}" class="${k === sel.m ? 'on' : ''}">${m.n}</button>`).join('')}</div></div><div class="segg"><small>Dificuldade</small><div class="seg" id="sd">${DIFF.map((d, i) => `<button data-v="${i}" class="${i === sel.d ? 'on' : ''}">${d.n}</button>`).join('')}</div></div></div>`,
      primary: ['Jogar', () => Game.start(sel.m, sel.d)], help: this.help });
    const c = document.querySelector('.hx-card'); c.querySelectorAll('#sm [data-v]').forEach(b => b.onclick = () => { sel.m = b.dataset.v; this.home(); }); c.querySelectorAll('#sd [data-v]').forEach(b => b.onclick = () => { sel.d = +b.dataset.v; this.home(); }); },
  pause() { if (Game.state !== 'aim' && Game.state !== 'fly') return Game.state === 'pause' ? null : this.home(); const prev = Game.state; Game.state = 'pause';
    HXA.menu({ title: 'Pausa', text: `${Game.pts} pontos`, primary: ['Continuar', () => { Game.state = prev; }], buttons: [['Recomeçar', () => Game.start(Game.mode, Game.d)], ['Menu', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.HP = { Game, UI, S };

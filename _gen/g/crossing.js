/*@ {"name":"Crossing","t1":"Cros","t2":"sing","theme":"#060a07","bg2":"radial-gradient(ellipse at 50% 0%,#14281a 0%,#060a07 66%)",
"hud":[["Distância","pts","0"],["Recorde","best","0"],["Moedas","coins","0"]]} @*/
/* H-LUX CROSSING v1.0 — atravesse ruas, rios e trilhos sem parar.
   Faixas: grama (árvores bloqueiam), estrada (carros e caminhões), rio (só pise em troncos e vitórias-régias)
   e trilho (trem anunciado por sinal vermelho). A câmera avança sozinha: ficar parado demais é fatal.
   Ambientes mudam a cada 40 faixas: Campo, Cidade, Inverno e Deserto.
   Controles: toque = avançar; deslize para os lados ou para trás. PC: setas/WASD. Módulos: ENV · Game · View · UI */
const S = HX.store('crossing');
const VW = 396, VH = 640, C = 44, COLS = 9;
const ENV = [
  { n: 'Campo', grass: ['#2f5a2c', '#34632f'], road: '#2b2b30', water: '#1d4f7a', tree: '#1f7a3a', trunk: '#6b4a2a' },
  { n: 'Cidade', grass: ['#3a3a40', '#424248'], road: '#1d1d22', water: '#1b3b5a', tree: '#5a5f6a', trunk: '#333' },
  { n: 'Inverno', grass: ['#cfd8e3', '#dbe3ec'], road: '#3a3f4a', water: '#5b8fb5', tree: '#2c5a46', trunk: '#5a4430' },
  { n: 'Deserto', grass: ['#c8a165', '#d2ab6e'], road: '#4a3a2a', water: '#2a7a8a', tree: '#5f8f4a', trunk: '#7a5a30' }
];
const CAR_C = ['#e5484d', '#3d8bff', '#ffb347', '#c86bff', '#e8e2cf', '#3ddc84'];
const Game = {
  state: 'idle', rows: {}, p: null, cam: 0, maxRow: 0, got: 0, idle: 0, deathMsg: '',
  env(r) { return ENV[((Math.floor(Math.max(0, r) / 40) % ENV.length) + ENV.length) % ENV.length]; },
  start() {
    HX.close(); this.rows = {}; this.p = { c: 4, r: 0, x: 4 * C + C / 2, hop: 0, dir: 0, ride: null }; this.cam = -1.5; this.maxRow = 0; this.got = 0; this.idle = 0;
    for (let r = -6; r < 22; r++) this.mk(r); this.state = 'play'; UI.hud();
  },
  mk(r) {
    if (this.rows[r]) return this.rows[r]; const prev = this.rows[r - 1]; const d = Math.min(1, r / 300);
    let k = 'grass'; if (r > 3) { const x = Math.random(); k = x < .36 + d * .1 ? 'road' : x < .58 + d * .08 ? 'water' : x < .66 + d * .06 ? 'rail' : 'grass'; if (prev && prev.k === 'rail' && k === 'rail') k = 'grass'; }
    const row = { r, k, objs: [], dir: Math.random() < .5 ? 1 : -1, trees: [], coin: -1 };
    if (k === 'grass') { const n = r < 1 ? 0 : Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) { const c = Math.floor(Math.random() * COLS); if (c !== 4 || r > 2) row.trees.push(c); } if (r <= 0) row.trees = r < -1 ? [0, 1, 2, 3, 5, 6, 7, 8] : [0, 8];
      // garante passagem: ao menos uma coluna livre que também esteja livre na faixa de grama anterior
      // garante passagem: depois de grama, árvores só onde a faixa anterior já tinha árvore; depois de vitórias-régias, nada sobre elas
      if (prev && prev.k === 'grass' && r > 0) row.trees = row.trees.filter(c => prev.trees.includes(c));
      if (prev && prev.lily) row.trees = row.trees.filter(c => !prev.objs.some(o => Math.round((o.x - 2) / C) === c));
      if (Math.random() < .15) { const c = Math.floor(Math.random() * COLS); if (!row.trees.includes(c)) row.coin = c; } }
    if (k === 'road') { row.sp = (50 + Math.random() * 60 + d * 80) * row.dir; const truck = Math.random() < .3, len = truck ? C * 2 : C * 1.2, gap = len + C * (2.2 + Math.random() * 2 - d); for (let x = Math.random() * gap; x < VW + gap; x += gap + Math.random() * C) row.objs.push({ x, len, c: CAR_C[Math.floor(Math.random() * 6)], truck }); row.span = VW + gap * 1.5; }
    if (k === 'water') { const lily = Math.random() < .3 && !(prev && prev.k === 'water' && prev.lily); row.lily = lily;
      if (lily) { row.sp = 0; const cs = new Set(); for (let i = 0; i < 4; i++) cs.add(Math.floor(Math.random() * COLS)); if (prev && prev.k === 'grass') { let seg = []; for (let c = 0; c <= COLS; c++) { if (c < COLS && !prev.trees.includes(c)) seg.push(c); else if (seg.length) { cs.add(seg[Math.floor(Math.random() * seg.length)]); seg = []; } } } row.objs = [...cs].map(c => ({ x: c * C + 2, len: C - 4 })); }
      else { row.sp = (40 + Math.random() * 40 + d * 40) * row.dir; const len = C * (2 + Math.floor(Math.random() * 2)), gap = C * (1.4 + Math.random() * 1.2 + d * .6); for (let x = Math.random() * gap; x < VW + gap + len; x += len + gap) row.objs.push({ x, len }); row.span = VW + gap + len * 1.5; } }
    if (k === 'rail') { row.timer = 2 + Math.random() * 4; row.train = null; row.warn = 0; }
    this.rows[r] = row; return row;
  },
  move(dc, dr) {
    if (this.state !== 'play' || this.p.hop > 0) return; const P = this.p, nc = P.c + dc, nr = P.r + dr; const tgt = this.mk(nr);
    if (nr < this.maxRow - 4) return; if (tgt.k === 'grass' && tgt.trees.includes(nc)) return; if (nc < 0 || nc >= COLS) return;
    P.c = nc; P.r = nr; P.hop = .12; P.dir = dc ? dc : dr > 0 ? 0 : 2; P.x = nc * C + C / 2; P.ride = null; this.idle = 0; HX.sfx('tap');
    if (nr > this.maxRow) { this.maxRow = nr; for (let r = nr; r < nr + 18; r++) this.mk(r); UI.hud(); if (nr % 40 === 0) HX.toast(this.env(nr).n, 1200); }
    if (tgt.coin === nc) { tgt.coin = -1; this.got++; HX.sfx('coin'); UI.hud(); }
  },
  step(dt) {
    if (this.state !== 'play') return; const P = this.p; if (P.hop > 0) P.hop = Math.max(0, P.hop - dt);
    for (const k in this.rows) { const row = this.rows[k];
      if ((row.k === 'road' || row.k === 'water') && row.sp) for (const o of row.objs) { o.x += row.sp * dt; if (row.sp > 0 && o.x > VW + C) o.x -= row.span + o.len; if (row.sp < 0 && o.x + o.len < -C) o.x += row.span + o.len; }
      if (row.k === 'rail') { if (row.train) { row.train.x += row.train.v * dt; if (row.train.x > VW + 800 || row.train.x < -1200) { row.train = null; row.timer = 3 + Math.random() * 5; } } else { row.timer -= dt; if (row.timer < 1.3) row.warn = 1; if (row.timer <= 0) { row.warn = 0; const v = (Math.random() < .5 ? 1 : -1) * 900; row.train = { x: v > 0 ? -C * 10 : VW, v, len: C * 10 }; } } } }
    // posição no mundo / colisões
    const row = this.rows[P.r]; if (P.hop === 0) {
      if (row.k === 'road') for (const o of row.objs) if (P.x + 12 > o.x && P.x - 12 < o.x + o.len) return this.die('Atropelado!');
      if (row.k === 'rail' && row.train && P.x + 12 > row.train.x && P.x - 12 < row.train.x + row.train.len) return this.die('O trem passou!');
      if (row.k === 'water') { const o = row.objs.find(o => P.x > o.x - 4 && P.x < o.x + o.len + 4); if (!o) return this.die('Caiu no rio!'); P.x += row.sp * dt; P.c = Math.floor(P.x / C); if (P.x < -10 || P.x > VW + 10) return this.die('Levado pela correnteza!'); } }
    // câmera avança sozinha; mais rápido se o jogador estiver longe à frente
    const target = P.r - 4; const sp = .35 + Math.min(.6, this.maxRow / 400) + Math.max(0, target - this.cam) * .8; this.cam += sp * dt;
    this.idle += dt; if (P.r < this.cam - 2.2) return this.die('A águia te pegou!');
    for (const k in this.rows) if (+k < this.cam - 10) delete this.rows[k];
  },
  die(msg) {
    this.state = 'over'; this.deathMsg = msg; HX.sfx('lose'); HX.vibrate(50); const rec = HXA.best(S, 'best', this.maxRow); S.set('coins', S.get('coins', 0) + this.got); const st = S.get('stats', { games: 0 }); st.games++; S.set('stats', st);
    S.hub(`Recorde ${S.get('best', 0)} faixas`); UI.hud();
    setTimeout(() => HXA.menu({ title: msg, text: `${rec && this.maxRow ? 'Novo recorde! ' : ''}Ambiente: ${this.env(this.maxRow).n}.`, stats: [[this.maxRow, 'Faixas'], [this.got, 'Moedas'], [S.get('best', 0), 'Recorde']], primary: ['Jogar de novo', () => this.start()], buttons: [['Menu', () => UI.home()]] }), 600);
  }
};
const St = HXA.stage(VW, VH);
const View = {
  draw() {
    const g = St.begin(), G = Game; g.fillStyle = '#0a0c0a'; g.fillRect(0, 0, VW, VH); if (!G.p) return;
    const baseY = VH - 150, yOf = r => baseY - (r - G.cam - 0) * C + 0; const r0 = Math.floor(G.cam) - 4, r1 = r0 + 20;
    for (let r = r0; r <= r1; r++) { const row = G.rows[r]; if (!row) continue; const y = yOf(r) + (G.cam % 1) * 0 - C, E = G.env(r);
      if (row.k === 'grass') { g.fillStyle = E.grass[r & 1]; g.fillRect(0, y, VW, C); for (const c of row.trees) { g.fillStyle = E.trunk; g.fillRect(c * C + 18, y + 26, 8, 14); g.fillStyle = E.tree; g.beginPath(); g.arc(c * C + 22, y + 20, 16, 0, 7); g.fill(); }
        if (row.coin >= 0) { g.fillStyle = '#ffd54a'; g.beginPath(); g.arc(row.coin * C + 22, y + 22, 8, 0, 7); g.fill(); g.strokeStyle = '#b8892e'; g.lineWidth = 2; g.stroke(); } }
      else if (row.k === 'road') { g.fillStyle = E.road; g.fillRect(0, y, VW, C); g.fillStyle = 'rgba(255,255,255,.25)'; for (let x = 4; x < VW; x += 36) g.fillRect(x, y + C - 2, 18, 2);
        for (const o of row.objs) { g.fillStyle = o.c; g.beginPath(); g.roundRect(o.x, y + 6, o.len, C - 12, 6); g.fill(); g.fillStyle = 'rgba(0,0,0,.35)'; const wx = row.sp > 0 ? o.x + o.len - 16 : o.x + 4; g.fillRect(wx, y + 10, 12, C - 20); g.fillStyle = '#111'; g.fillRect(o.x + 6, y + 3, 10, 4); g.fillRect(o.x + o.len - 16, y + 3, 10, 4); g.fillRect(o.x + 6, y + C - 7, 10, 4); g.fillRect(o.x + o.len - 16, y + C - 7, 10, 4); } }
      else if (row.k === 'water') { g.fillStyle = E.water; g.fillRect(0, y, VW, C); g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); for (let x = (performance.now() / 40 % 40) - 40; x < VW; x += 40) { g.moveTo(x, y + 14); g.quadraticCurveTo(x + 10, y + 10, x + 20, y + 14); } g.stroke();
        for (const o of row.objs) { if (row.lily) { g.fillStyle = '#3d9a4a'; g.beginPath(); g.arc(o.x + o.len / 2, y + C / 2, C / 2 - 5, .3, 6); g.lineTo(o.x + o.len / 2, y + C / 2); g.fill(); } else { g.fillStyle = '#7a5230'; g.beginPath(); g.roundRect(o.x, y + 8, o.len, C - 16, 8); g.fill(); g.strokeStyle = '#5a3a1c'; g.lineWidth = 2; for (let x = o.x + 14; x < o.x + o.len - 6; x += 18) { g.beginPath(); g.moveTo(x, y + 12); g.lineTo(x, y + C - 12); g.stroke(); } } } }
      else { g.fillStyle = '#3a3330'; g.fillRect(0, y, VW, C); g.fillStyle = '#6b4a2a'; for (let x = 2; x < VW; x += 16) g.fillRect(x, y + 6, 8, C - 12); g.fillStyle = '#9aa0a8'; g.fillRect(0, y + 12, VW, 3); g.fillRect(0, y + C - 15, VW, 3);
        g.fillStyle = row.warn && Math.floor(performance.now() / 200) % 2 ? '#ff3030' : '#552222'; g.beginPath(); g.arc(VW - 16, y + 8, 6, 0, 7); g.fill();
        if (row.train) { g.fillStyle = '#c9a45c'; g.fillRect(row.train.x, y + 4, row.train.len, C - 8); g.fillStyle = '#1a1408'; for (let x = row.train.x + 12; x < row.train.x + row.train.len - 20; x += 44) g.fillRect(x, y + 10, 24, 12); } } }
    const P = G.p, py = yOf(P.r) - C / 2 - Math.sin((P.hop / .12) * Math.PI) * 10; g.save(); g.translate(P.x, py);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 14, 13, 5, 0, 0, 7); g.fill(); g.fillStyle = '#f4efe2'; g.fillRect(-12, -12, 24, 24); g.fillStyle = '#e5484d'; g.fillRect(-4, -18, 8, 6); g.fillStyle = '#e0b14a'; const bx = [0, 12, 0, -16][P.dir === 0 ? 0 : P.dir === 1 ? 1 : P.dir === 2 ? 2 : 3]; g.fillRect(P.dir === -1 ? -18 : P.dir === 1 ? 10 : -4, P.dir === 2 ? 8 : P.dir === 0 ? -14 : -2, 8, 6); g.fillStyle = '#111'; g.fillRect(-7, -6, 3, 3); g.fillRect(4, -6, 3, 3); g.restore();
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, VW, 46); g.fillStyle = '#f1dca6'; g.font = '800 24px Manrope'; g.textAlign = 'left'; g.fillText(G.maxRow, 14, 32); g.font = '600 13px Manrope'; g.textAlign = 'right'; g.fillText(G.env(G.maxRow).n, VW - 14, 30);
  }
};
const UI = {
  sx: 0, sy: 0, st: 0,
  init() {
    St.cv.addEventListener('pointerdown', e => { e.preventDefault(); const [x, y] = St.toL(e); this.sx = x; this.sy = y; this.st = 1; });
    St.cv.addEventListener('pointerup', e => { if (!this.st) return; this.st = 0; if (HX.isOpen()) return; const [x, y] = St.toL(e), dx = x - this.sx, dy = y - this.sy; if (Math.hypot(dx, dy) < 22) return Game.move(0, 1);
      if (Math.abs(dx) > Math.abs(dy)) Game.move(Math.sign(dx), 0); else Game.move(0, dy < 0 ? 1 : -1); });
    addEventListener('keydown', e => { if (HX.isOpen()) return; const m = { ArrowUp: [0, 1], w: [0, 1], ' ': [0, 1], ArrowDown: [0, -1], s: [0, -1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] }[e.key]; if (m) { e.preventDefault(); Game.move(...m); } if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { Game.step(dt); View.draw(); });
    HX.life({ onHide: () => { if (Game.state === 'play') this.pause(); } }); this.home();
  },
  hud() { HX.$('#pts').textContent = Game.maxRow; HX.$('#best').textContent = S.get('best', 0); HX.$('#coins').textContent = Game.got; },
  help: ['Toque na tela para pular uma faixa para frente. Deslize para a esquerda, direita ou para baixo para os outros sentidos. No PC: setas ou WASD.', 'Estradas: desvie dos carros. Rios: pise apenas em troncos ou vitórias-régias (o tronco te carrega; não saia da tela). Trilhos: quando a luz vermelha piscar, o trem está chegando.', 'Árvores bloqueiam o caminho. Moedas ficam guardadas entre partidas.', 'A tela avança sozinha: ficar parado ou voltar demais faz a águia te pegar. O ambiente muda a cada 40 faixas.'],
  home() { HXA.menu({ title: 'Crossing', text: 'Atravesse o máximo de faixas.', stats: [[S.get('best', 0), 'Recorde'], [S.get('coins', 0), 'Moedas'], [S.get('stats', { games: 0 }).games, 'Partidas']], primary: ['Começar', () => Game.start()], help: this.help }); },
  pause() { if (Game.state !== 'play') return Game.state === 'pause' ? null : this.home(); Game.state = 'pause';
    HXA.menu({ title: 'Pausa', text: `${Game.maxRow} faixas`, primary: ['Continuar', () => { Game.state = 'play'; }], buttons: [['Recomeçar', () => Game.start()], ['Menu', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.CR = { Game, UI, S };

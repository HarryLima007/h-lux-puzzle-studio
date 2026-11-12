/*@ {"name":"Color Rush","t1":"Color ","t2":"Rush","theme":"#08070a","bg2":"radial-gradient(ellipse at 50% 0%,#221a2a 0%,#08070a 66%)",
"hud":[["Estrelas","pts","0"],["Recorde","best","0"]]} @*/
/* H-LUX COLOR RUSH v1.0 (anel duplo: o interno tem as cores espelhadas, então as duas faixas coincidem no eixo vertical) — toque para impulsionar a bola para cima. Ela só atravessa partes da MESMA cor.
   Esferas multicoloridas trocam a cor da bola. Obstáculos: anel, anel duplo, barras deslizantes e cruz giratória.
   Cada obstáculo superado vale uma estrela; a velocidade de rotação cresce com a pontuação. Módulos: Game · View · UI */
const S = HX.store('colorrush');
const VW = 400, VH = 640, BR = 9, COLS = ['#e0b14a', '#e5484d', '#3d8bff', '#3ddc84'];
const Game = {
  state: 'idle', b: null, obs: [], cam: 0, pts: 0, top: 0, parts: [], t: 0,
  start() { HX.close(); this.b = { y: 0, vy: 0, c: 0 }; this.obs = []; this.parts = []; this.cam = -VH * .6; this.pts = 0; this.top = -200; this.t = 0; for (let i = 0; i < 4; i++) this.gen(); this.state = 'ready'; UI.hud(); },
  gen() {
    const d = Math.min(1, this.pts / 40), types = ['ring', 'ring', 'bars'].concat(this.obs.length > 2 ? ['ring2', 'cross'] : []), k = types[Math.floor(Math.random() * types.length)];
    const sp = (1 + d * 1.2) * (Math.random() < .5 ? 1 : -1), o = { k, y: this.top, a: Math.random() * 6, sp, star: true, sw: true };
    if (k === 'ring') { o.R = 92; o.th = 16; o.h = 224; } else if (k === 'ring2') { o.R = 126; o.R2 = 74; o.th = 12; o.h = 292; o.sp *= .8; } else if (k === 'bars') { o.th = 18; o.h = 60; o.off = Math.random() * 400; o.sp = (60 + d * 80) * Math.sign(sp); } else { o.L = 80; o.th = 14; o.cx = VW / 2 + (Math.random() < .5 ? -1 : 1) * 64; o.h = 170; }
    o.y = this.top - o.h / 2; this.obs.push(o); this.top = o.y - o.h / 2 - (150 - d * 25);
  },
  tap() { if (this.state === 'ready') this.state = 'play'; if (this.state !== 'play') return; this.b.vy = -430; HX.sfx('tap'); },
  colorAt(o, x, y) {
    if (o.k === 'ring' || o.k === 'ring2') { for (const [R, dir] of [[o.R, 1], [o.R2, -1]]) { if (!R) continue; const dx = x - VW / 2, dy = y - o.y, d = Math.hypot(dx, dy); if (Math.abs(d - R) < o.th / 2 + BR) { let a = Math.atan2(dy, dx) - o.a * dir; a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); const j = Math.floor(a / (Math.PI / 2)); return dir > 0 ? j : (5 - j) % 4; } } return -1; }
    if (o.k === 'bars') { if (Math.abs(y - o.y) < o.th / 2 + BR) { const seg = VW / 4, u = (((x - o.off) % (VW)) + VW) % VW; return Math.floor(u / seg); } return -1; }
    if (o.k === 'cross') { for (let i = 0; i < 4; i++) { const a = o.a + i * Math.PI / 2, ex = o.cx + Math.cos(a) * o.L, ey = o.y + Math.sin(a) * o.L; const t = HX.clamp(((x - o.cx) * (ex - o.cx) + (y - o.y) * (ey - o.y)) / (o.L * o.L), 0, 1); if (Math.hypot(x - (o.cx + (ex - o.cx) * t), y - (o.y + (ey - o.y) * t)) < o.th / 2 + BR) return i; } return -1; }
  },
  step(dt) {
    this.t += dt; for (const o of this.obs) { if (o.k === 'bars') o.off += o.sp * dt; else o.a += o.sp * dt; }
    this.parts = this.parts.filter(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 600 * dt; return (q.t -= dt) > 0; });
    if (this.state !== 'play') return; const B = this.b;
    B.vy += 1250 * dt; B.y += B.vy * dt; if (B.y < this.cam + VH * .45) this.cam = B.y - VH * .45;
    if (B.y > this.cam + VH + 20) return this.die();
    for (const o of this.obs) {
      const c = this.colorAt(o, VW / 2, B.y); if (c >= 0 && c !== B.c) return this.die();
      if (o.star && Math.abs(B.y - o.y) < 18 && o.k !== 'cross' && o.k !== 'bars') { o.star = false; this.pts++; HX.sfx('coin'); UI.hud(); }
      if (o.star && (o.k === 'cross' || o.k === 'bars') && B.y < o.y - 20) { o.star = false; this.pts++; HX.sfx('coin'); UI.hud(); }
      const swy = o.y - o.h / 2 - 50; if (o.sw && Math.abs(B.y - swy) < 20) { o.sw = false; let n; do n = Math.floor(Math.random() * 4); while (n === B.c); B.c = n; HX.sfx('power'); }
    }
    this.obs = this.obs.filter(o => o.y < this.cam + VH + 300); while (this.top > this.cam - VH) this.gen();
  },
  die() {
    this.state = 'over'; HX.sfx('lose'); HX.vibrate(50); for (let i = 0; i < 24; i++) this.parts.push({ x: VW / 2, y: this.b.y, vx: (Math.random() - .5) * 400, vy: -Math.random() * 400, t: .8, c: COLS[i % 4] });
    const rec = HXA.best(S, 'best', this.pts); const st = S.get('stats', { games: 0, stars: 0 }); st.games++; st.stars += this.pts; S.set('stats', st); S.hub(`Recorde ${S.get('best', 0)} estrelas`); UI.hud();
    setTimeout(() => HXA.menu({ title: rec && this.pts ? 'Novo recorde!' : 'Cor errada!', stats: [[this.pts, 'Estrelas'], [S.get('best', 0), 'Recorde'], [st.stars, 'Total']], primary: ['Jogar de novo', () => this.start()], buttons: [['Menu', () => UI.home()]] }), 800);
  }
};
const St = HXA.stage(VW, VH);
const View = {
  star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); },
  draw() {
    const g = St.begin(), G = Game; g.fillStyle = '#121016'; g.fillRect(0, 0, VW, VH); if (!G.b) return; g.save(); g.translate(0, -G.cam);
    for (const o of G.obs) {
      if (o.k === 'ring' || o.k === 'ring2') { for (const [R, dir] of [[o.R, 1], [o.R2, -1]]) { if (!R) continue; g.lineWidth = o.th; for (let i = 0; i < 4; i++) { g.strokeStyle = COLS[dir > 0 ? i : (5 - i) % 4]; g.beginPath(); g.arc(VW / 2, o.y, R, o.a * dir + i * Math.PI / 2, o.a * dir + (i + 1) * Math.PI / 2); g.stroke(); } } }
      else if (o.k === 'bars') { const seg = VW / 4; for (let k = -1; k < 5; k++) { const x = ((o.off % VW) + VW) % VW + k * seg - VW; for (let w = 0; w < 2; w++) { g.fillStyle = COLS[((k % 4) + 4) % 4]; g.fillRect(x + w * VW, o.y - o.th / 2, seg, o.th); } } }
      else { g.lineWidth = o.th; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { const a = o.a + i * Math.PI / 2; g.strokeStyle = COLS[i]; g.beginPath(); g.moveTo(o.cx, o.y); g.lineTo(o.cx + Math.cos(a) * o.L, o.y + Math.sin(a) * o.L); g.stroke(); } g.lineCap = 'butt'; }
      if (o.star) { g.fillStyle = '#f4efe2'; View.star(g, VW / 2, o.k === 'cross' ? o.y - 75 : o.k === 'bars' ? o.y - 45 : o.y, 13); }
      if (o.sw) { const y = o.y - o.h / 2 - 50; for (let i = 0; i < 4; i++) { g.fillStyle = COLS[i]; g.beginPath(); g.moveTo(VW / 2, y); g.arc(VW / 2, y, 11, i * Math.PI / 2 + G.t * 2, (i + 1) * Math.PI / 2 + G.t * 2); g.fill(); } }
    }
    if (G.state !== 'over') { g.fillStyle = COLS[G.b.c]; g.beginPath(); g.arc(VW / 2, G.b.y, BR, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.stroke(); }
    for (const q of G.parts) { g.fillStyle = q.c; g.globalAlpha = Math.min(1, q.t * 2); g.beginPath(); g.arc(q.x, q.y, 4, 0, 7); g.fill(); } g.globalAlpha = 1;
    g.restore(); g.fillStyle = '#f4efe2'; g.font = '800 28px Manrope'; g.textAlign = 'left'; g.fillText(G.pts, 16, 40);
    if (G.state === 'ready') { g.textAlign = 'center'; g.font = '700 18px Manrope'; g.fillStyle = '#f1dca6'; g.fillText('Toque para começar', VW / 2, VH - 60); }
  }
};
const UI = {
  init() {
    St.cv.addEventListener('pointerdown', e => { e.preventDefault(); if (!HX.isOpen()) Game.tap(); });
    addEventListener('keydown', e => { if ([' ', 'ArrowUp', 'w'].includes(e.key) && !e.repeat && !HX.isOpen()) { e.preventDefault(); Game.tap(); } if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { Game.step(dt); View.draw(); });
    HX.life({ onHide: () => { if (Game.state === 'play') this.pause(); } }); this.home();
  },
  hud() { HX.$('#pts').textContent = Game.pts; HX.$('#best').textContent = S.get('best', 0); },
  help: ['Toque na tela (ou espaço no PC) para dar um impulso para cima. Sem toques, a bola cai.', 'A bola só pode atravessar a parte do obstáculo que tem a MESMA cor dela. Encostar em outra cor (ou cair para fora da tela) termina a partida.', 'Esferas de quatro cores trocam a cor da bola. Cada obstáculo superado vale uma estrela.', 'Obstáculos: anel, anel duplo (giram em sentidos opostos), barras deslizantes e cruz giratória. Tudo acelera com a pontuação.'],
  home() { HXA.menu({ title: 'Color Rush', text: 'Passe só pela sua cor.', stats: [[S.get('best', 0), 'Recorde'], [S.get('stats', { games: 0 }).games, 'Partidas']], primary: ['Começar', () => Game.start()], help: this.help }); },
  pause() { if (Game.state !== 'play' && Game.state !== 'ready') return Game.state === 'pause' ? null : this.home(); const prev = Game.state; Game.state = 'pause';
    HXA.menu({ title: 'Pausa', text: `${Game.pts} estrelas`, primary: ['Continuar', () => { Game.state = 'ready'; Game.b.vy = 0; }], buttons: [['Recomeçar', () => Game.start()], ['Menu', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.CRU = { Game, UI, S, COLS };

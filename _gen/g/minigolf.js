/*@ {"name":"Mini Golf","t1":"Mini ","t2":"Golf","theme":"#06090a","bg2":"radial-gradient(ellipse at 50% 0%,#132a1c 0%,#06090a 66%)",
"hud":[["Buraco","hole","1/9"],["Tacadas","str","0"],["Total","tot","0"]]} @*/
/* H-LUX MINI GOLF v1.0 — 9 buracos com paredes, rampas (empurram a bola), areia (freia), água (+1 tacada e volta),
   pás giratórias e para-choques. Puxe para trás a partir da bola (estilingue) e solte: direção oposta ao puxão, força pela distância.
   Par por buraco, cartão de pontuação, progressão (buraco seguinte liberado ao terminar) e recorde do percurso.
   Módulos: HOLES · Phys · Game · View · UI */
const S = HX.store('minigolf');
const VW = 400, VH = 640, BR = 7, CUP = 11;
/* cada buraco: walls = retângulos sólidos [x,y,w,h]; sand/water = áreas; slope = [x,y,w,h,ax,ay]; spin = pás [cx,cy,len,vel]; bump = [x,y,r] */
const HOLES = [
  { par: 2, tee: [200, 560], cup: [200, 110], walls: [[150, 320, 100, 18]], sand: [], water: [], slope: [], spin: [], bump: [] },
  { par: 3, tee: [100, 560], cup: [300, 110], walls: [[40, 320, 230, 22]], sand: [], water: [], slope: [], spin: [], bump: [] },
  { par: 3, tee: [200, 570], cup: [200, 90], walls: [[40, 400, 120, 18], [240, 400, 120, 18], [130, 240, 140, 18]], sand: [[60, 150, 90, 70]], water: [], slope: [], spin: [], bump: [[200, 330, 14]] },
  { par: 3, tee: [80, 570], cup: [320, 90], walls: [[150, 140, 18, 360]], sand: [], water: [[230, 300, 130, 70]], slope: [[40, 120, 110, 120, 140, 0]], spin: [], bump: [] },
  { par: 3, tee: [200, 575], cup: [200, 85], walls: [], sand: [[40, 180, 100, 60], [260, 180, 100, 60]], water: [], slope: [[40, 380, 320, 60, 0, 160]], spin: [[200, 300, 100, 2.2]], bump: [] },
  { par: 4, tee: [70, 575], cup: [70, 90], walls: [[40, 430, 230, 18], [130, 260, 230, 18]], sand: [[270, 470, 90, 70]], water: [[40, 150, 90, 70]], slope: [], spin: [], bump: [[320, 360, 14], [90, 340, 14]] },
  { par: 3, tee: [200, 575], cup: [200, 120], walls: [[40, 200, 110, 18], [250, 200, 110, 18]], sand: [], water: [[40, 300, 100, 120], [260, 300, 100, 120]], slope: [[150, 280, 100, 160, 0, -90]], spin: [[200, 470, 70, -2.6]], bump: [] },
  { par: 4, tee: [330, 575], cup: [80, 100], walls: [[200, 370, 160, 18], [40, 240, 180, 18]], sand: [[120, 70, 70, 70]], water: [[260, 140, 100, 80]], slope: [[40, 390, 150, 140, -120, 0]], spin: [[290, 290, 60, 2.8]], bump: [[120, 330, 13]] },
  { par: 4, tee: [200, 580], cup: [200, 70], walls: [[40, 470, 130, 18], [230, 470, 130, 18], [90, 330, 220, 18], [40, 190, 120, 18], [240, 190, 120, 18]], sand: [[170, 100, 60, 40]], water: [[40, 360, 50, 100], [310, 360, 50, 100]], slope: [], spin: [[200, 260, 80, -2.2]], bump: [[120, 400, 12], [280, 400, 12]] }
];
const FX0 = 40, FX1 = 360, FY0 = 40, FY1 = 600;
const inR = (x, y, r) => x > r[0] && x < r[0] + r[2] && y > r[1] && y < r[1] + r[3];
const Phys = {
  segs(H, t) { const s = [[FX0, FY0, FX1, FY0], [FX1, FY0, FX1, FY1], [FX1, FY1, FX0, FY1], [FX0, FY1, FX0, FY0]];
    for (const [x, y, w, h] of H.walls) s.push([x, y, x + w, y], [x + w, y, x + w, y + h], [x + w, y + h, x, y + h], [x, y + h, x, y]);
    for (const [cx, cy, L, v] of H.spin) { const a = t * v; s.push([cx - Math.cos(a) * L, cy - Math.sin(a) * L, cx + Math.cos(a) * L, cy + Math.sin(a) * L, 'spin', cx, cy, v]); } return s; },
  step(G, dt) {
    const b = G.ball, H = HOLES[G.hi]; G.t += dt; const segs = this.segs(H, G.t);
    for (const sl of H.slope) if (inR(b.x, b.y, sl)) { b.vx += sl[4] * dt; b.vy += sl[5] * dt; }
    const fr = H.sand.some(r => inR(b.x, b.y, r)) ? 520 : 95; const sp = Math.hypot(b.vx, b.vy); if (sp > 0) { const ns = Math.max(0, sp - fr * dt); b.vx *= ns / sp; b.vy *= ns / sp; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    for (const sg of segs) { const [x1, y1, x2, y2] = sg, dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy, u = HX.clamp(((b.x - x1) * dx + (b.y - y1) * dy) / L, 0, 1), px = x1 + dx * u, py = y1 + dy * u, d = Math.hypot(b.x - px, b.y - py);
      if (d < BR && d > 0) { const nx = (b.x - px) / d, ny = (b.y - py) / d; b.x = px + nx * BR; b.y = py + ny * BR; let wvx = 0, wvy = 0; if (sg[4] === 'spin') { const [, , , , , cx, cy, v] = sg; wvx = -(py - cy) * v; wvy = (px - cx) * v; }
        const rvx = b.vx - wvx, rvy = b.vy - wvy, vn = rvx * nx + rvy * ny; if (vn < 0) { b.vx -= 1.8 * vn * nx; b.vy -= 1.8 * vn * ny; if (-vn > 60) HX.sfx('tap'); } } }
    for (const [x, y, r] of H.bump) { const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy); if (d < r + BR) { const nx = dx / d, ny = dy / d; b.x = x + nx * (r + BR); b.y = y + ny * (r + BR); const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 2 * vn * nx; b.vy -= 2 * vn * ny; b.vx += nx * 120; b.vy += ny * 120; HX.sfx('power'); } } }
    const [cx, cy] = H.cup, dc = Math.hypot(b.x - cx, b.y - cy), sp2 = Math.hypot(b.vx, b.vy);
    if (dc < CUP - 2 && sp2 < 320) return "in"; if (dc < CUP + 2 && sp2 >= 320) { b.vx += (cx - b.x) * 4 * dt * 10; b.vy += (cy - b.y) * 4 * dt * 10; }
    if (dc < CUP * 1.8 && sp2 < 90) { b.vx += (cx - b.x) * dt * 6; b.vy += (cy - b.y) * dt * 6; }
    if (H.water.some(r => inR(b.x, b.y, r))) return 'water';
    if (sp2 < 4 && !H.slope.some(r => inR(b.x, b.y, r))) { b.vx = b.vy = 0; return 'stop'; }
    if (sp2 < 4) { const sl = H.slope.find(r => inR(b.x, b.y, r)); if (Math.hypot(sl[4], sl[5]) < 1) { b.vx = b.vy = 0; return 'stop'; } }
    return null;
  }
};
const Game = {
  state: 'idle', hi: 0, ball: null, strokes: 0, card: [], t: 0, last: null, sinkT: 0,
  startCourse() { HX.close(); this.card = []; this.load(0); },
  load(i) { HX.close(); this.hi = i; const [x, y] = HOLES[i].tee; this.ball = { x, y, vx: 0, vy: 0 }; this.last = [x, y]; this.strokes = 0; this.state = 'aim'; UI.hud(); HX.toast(`Buraco ${i + 1} · par ${HOLES[i].par}`, 1100); },
  hit(dx, dy) { if (this.state !== 'aim') return; const L = Math.min(150, Math.hypot(dx, dy)); if (L < 8) return; const p = L / 150 * 820; this.ball.vx = -dx / Math.hypot(dx, dy) * p; this.ball.vy = -dy / Math.hypot(dx, dy) * p; this.last = [this.ball.x, this.ball.y]; this.strokes++; this.state = 'roll'; HX.sfx('hit'); UI.hud(); },
  step(dt) {
    if (this.state === 'sink') { this.sinkT -= dt; if (this.sinkT <= 0) this.holeDone(); return; }
    if (this.state === 'aim') { this.t += dt; const H = HOLES[this.hi]; for (const sl of H.slope) if (inR(this.ball.x, this.ball.y, sl) && Math.hypot(sl[4], sl[5]) > 1) this.state = 'roll'; return; }
    if (this.state !== 'roll') return; let r = null; for (let i = 0; i < 8 && !r; i++) r = Phys.step(this, dt / 8);
    if (r === 'in') { this.state = 'sink'; this.sinkT = .7; HX.sfx('win'); const d = this.strokes - HOLES[this.hi].par; HX.toast(this.strokes === 1 ? 'Hole in one!' : d <= -2 ? 'Eagle!' : d === -1 ? 'Birdie!' : d === 0 ? 'Par' : d === 1 ? 'Bogey' : `+${d}`, 1300); }
    else if (r === 'water') { this.strokes++; HX.sfx('lose'); HX.toast('Água! +1 tacada', 1000); [this.ball.x, this.ball.y] = this.last; this.ball.vx = this.ball.vy = 0; this.state = 'aim'; UI.hud(); }
    else if (r === 'stop') { this.state = 'aim'; if (this.strokes >= 10) { HX.toast('Limite de 10 tacadas', 1000); this.state = 'sink'; this.sinkT = .6; } }
  },
  holeDone() {
    this.card[this.hi] = this.strokes; const bh = S.get('bestHole', {}); if (!bh[this.hi] || this.strokes < bh[this.hi]) { bh[this.hi] = this.strokes; S.set('bestHole', bh); }
    const un = S.get('unlocked', 1); if (this.hi + 2 > un) S.set('unlocked', Math.min(HOLES.length, this.hi + 2)); UI.hud();
    const all = this.card.filter(x => x !== undefined).length === HOLES.length && this.card.every(x => x);
    if (this.hi < HOLES.length - 1) { HXA.menu({ title: `Buraco ${this.hi + 1}: ${this.strokes} tacada${this.strokes > 1 ? 's' : ''}`, text: `Par ${HOLES[this.hi].par} · ${UI.rel(this.strokes - HOLES[this.hi].par)}`, html: UI.cardHTML(), primary: ['Próximo buraco', () => this.load(this.hi + 1)], buttons: [['Repetir', () => this.load(this.hi)], ['Menu', () => UI.home()]] }); }
    else { const tot = this.card.reduce((a, b) => a + (b || 0), 0), full = this.card.length === HOLES.length && this.card.every(Boolean); const par = HOLES.reduce((a, h) => a + h.par, 0); let rec = false; if (full) { const b = S.get('best', 0); if (!b || tot < b) { S.set('best', tot); rec = true; } }
      S.hub(`Melhor percurso ${S.get('best', 0) || '—'} (par ${par})`); HXA.menu({ title: full ? `Percurso: ${tot} tacadas` : 'Fim do percurso', text: full ? `${UI.rel(tot - par)} do par${rec ? ' · novo recorde!' : ''}` : 'Jogue os 9 buracos em sequência para valer como recorde.', html: UI.cardHTML(), primary: ['Jogar de novo', () => this.startCourse()], buttons: [['Menu', () => UI.home()]] }); }
  }
};
const St = HXA.stage(VW, VH);
const View = {
  draw() {
    const g = St.begin(), G = Game; g.fillStyle = '#0b100c'; g.fillRect(0, 0, VW, VH); if (!G.ball) return; const H = HOLES[G.hi];
    g.fillStyle = '#5a3a1c'; g.beginPath(); g.roundRect(FX0 - 12, FY0 - 12, FX1 - FX0 + 24, FY1 - FY0 + 24, 12); g.fill();
    const turf = g.createLinearGradient(0, FY0, 0, FY1); turf.addColorStop(0, '#2e9a52'); turf.addColorStop(1, '#23803f'); g.fillStyle = turf; g.fillRect(FX0, FY0, FX1 - FX0, FY1 - FY0);
    g.fillStyle = 'rgba(255,255,255,.04)'; for (let y = FY0; y < FY1; y += 40) g.fillRect(FX0, y, FX1 - FX0, 20);
    for (const r of H.slope) { g.fillStyle = 'rgba(201,164,92,.18)'; g.fillRect(r[0], r[1], r[2], r[3]); const a = Math.atan2(r[5], r[4]); g.strokeStyle = 'rgba(241,220,166,.5)'; g.lineWidth = 2; for (let x = r[0] + 20; x < r[0] + r[2]; x += 34) for (let y = r[1] + 20; y < r[1] + r[3]; y += 34) { const o = (G.t * 20) % 10; g.beginPath(); g.moveTo(x + Math.cos(a) * (o - 6), y + Math.sin(a) * (o - 6)); g.lineTo(x + Math.cos(a) * (o + 6), y + Math.sin(a) * (o + 6)); g.lineTo(x + Math.cos(a + 2.5) * 5 + Math.cos(a) * (o + 6), y + Math.sin(a + 2.5) * 5 + Math.sin(a) * (o + 6)); g.stroke(); } }
    for (const r of H.sand) { g.fillStyle = '#d9bf84'; g.beginPath(); g.roundRect(r[0], r[1], r[2], r[3], 14); g.fill(); }
    for (const r of H.water) { g.fillStyle = '#2a6fb0'; g.beginPath(); g.roundRect(r[0], r[1], r[2], r[3], 14); g.fill(); g.strokeStyle = 'rgba(255,255,255,.25)'; g.beginPath(); for (let x = r[0] + 10; x < r[0] + r[2] - 10; x += 20) { g.moveTo(x, r[1] + r[3] / 2 + Math.sin(G.t * 2 + x) * 3); g.lineTo(x + 10, r[1] + r[3] / 2 + Math.sin(G.t * 2 + x + 1) * 3); } g.stroke(); }
    for (const [x, y, w, h] of H.walls) { g.fillStyle = '#7a5230'; g.fillRect(x, y, w, h); g.fillStyle = '#c9a45c'; g.fillRect(x, y, w, 3); }
    for (const [x, y, r] of H.bump) { g.fillStyle = '#e5484d'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#ffd0d0'; g.beginPath(); g.arc(x, y, r * .45, 0, 7); g.fill(); }
    for (const [cx, cy, L, v] of H.spin) { const a = G.t * v; g.strokeStyle = '#e8e2cf'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - Math.cos(a) * L, cy - Math.sin(a) * L); g.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); g.stroke(); g.lineCap = 'butt'; g.fillStyle = '#c9a45c'; g.beginPath(); g.arc(cx, cy, 8, 0, 7); g.fill(); }
    const [cx, cy] = H.cup; g.fillStyle = '#0a0a0a'; g.beginPath(); g.arc(cx, cy, CUP, 0, 7); g.fill(); g.strokeStyle = '#ddd'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - 40); g.stroke(); g.fillStyle = '#e5484d'; g.beginPath(); g.moveTo(cx, cy - 40); g.lineTo(cx + 22, cy - 33); g.lineTo(cx, cy - 26); g.fill();
    const b = G.ball; if (G.state !== 'sink') { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(b.x + 2, b.y + 2, BR, 0, 7); g.fill(); g.fillStyle = '#fafafa'; g.beginPath(); g.arc(b.x, b.y, BR, 0, 7); g.fill(); }
    if (UI.pull && G.state === 'aim') { const [dx, dy] = UI.pull, L = Math.min(150, Math.hypot(dx, dy)), ux = -dx / (Math.hypot(dx, dy) || 1), uy = -dy / (Math.hypot(dx, dy) || 1); const c = L > 110 ? '#e5484d' : L > 60 ? '#ffd54a' : '#3ddc84';
      g.strokeStyle = c; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x + ux * (40 + L * 1.2), b.y + uy * (40 + L * 1.2)); g.stroke(); g.setLineDash([]); g.fillStyle = c; g.fillRect(VW - 26, 600 - L, 10, L); }
    g.fillStyle = '#f1dca6'; g.font = '700 13px Manrope'; g.textAlign = 'left'; g.fillText(`Buraco ${G.hi + 1} · par ${H.par} · tacadas ${G.strokes}`, 44, 28);
  }
};
const UI = {
  pull: null, start: null,
  init() {
    St.cv.addEventListener('pointerdown', e => { e.preventDefault(); if (Game.state !== 'aim' || HX.isOpen()) return; St.cv.setPointerCapture(e.pointerId); this.start = St.toL(e); this.pull = [0, 0]; });
    St.cv.addEventListener('pointermove', e => { if (!this.start) return; const [x, y] = St.toL(e); this.pull = [x - this.start[0], y - this.start[1]]; });
    const up = () => { if (!this.start) return; const p = this.pull; this.start = null; this.pull = null; if (p) Game.hit(p[0], p[1]); }; St.cv.addEventListener('pointerup', up); St.cv.addEventListener('pointercancel', () => { this.start = null; this.pull = null; });
    addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { Game.step(Math.min(dt, 1 / 30)); View.draw(); });
    this.home();
  },
  rel(d) { return d === 0 ? 'no par' : d < 0 ? `${-d} abaixo` : `${d} acima`; },
  cardHTML() { return `<div style="display:grid;grid-template-columns:repeat(9,1fr);gap:2px;font:700 11px Manrope,sans-serif;margin:8px 0">${HOLES.map((h, i) => `<div style="border:1px solid var(--line);border-radius:6px;padding:3px 0;text-align:center"><small style="color:var(--muted)">${i + 1}</small><br>${Game.card[i] ?? '·'}<br><small style="color:var(--muted)">p${h.par}</small></div>`).join('')}</div>`; },
  hud() { HX.$('#hole').textContent = `${Game.hi + 1}/${HOLES.length}`; HX.$('#str').textContent = Game.strokes; HX.$('#tot').textContent = Game.card.reduce((a, b) => a + (b || 0), 0) + (Game.state === 'sink' ? 0 : Game.strokes); },
  help: ['Toque em qualquer lugar e puxe para trás (como um estilingue). A linha mostra a direção da tacada; quanto mais longe você puxar, mais forte. Solte para tacar.', 'Areia freia a bola. Água custa 1 tacada e a bola volta para onde estava. Setas douradas são rampas que empurram a bola. Pás giram e podem rebater; para-choques vermelhos dão impulso.', 'Bola rápida demais passa por cima do buraco. Limite de 10 tacadas por buraco.', 'Termine um buraco para liberar o próximo. Jogando os 9 em sequência, o total vale como recorde do percurso.'],
  home() { const un = S.get('unlocked', 1), bh = S.get('bestHole', {}), par = HOLES.reduce((a, h) => a + h.par, 0);
    HXA.menu({ title: 'Mini Golf', text: `Percurso de 9 buracos · par ${par}`, stats: [[S.get('best', 0) || '—', 'Melhor percurso']], html: `<div class="levels">${HOLES.map((h, i) => `<button class="lvb${bh[i] ? ' done' : ''}" data-h="${i}" ${i >= un ? 'disabled' : ''}>${i >= un ? '🔒' : i + 1}<small style="display:block;font-size:10px">${bh[i] ? bh[i] + '/' + h.par : 'par ' + h.par}</small></button>`).join('')}</div>`,
      primary: ['Percurso completo', () => Game.startCourse()], help: this.help });
    document.querySelectorAll('.hx-card [data-h]').forEach(b => b.onclick = () => { Game.card = []; Game.load(+b.dataset.h); }); },
  pause() { if (Game.state === 'idle') return this.home(); HXA.menu({ title: 'Pausa', text: `Buraco ${Game.hi + 1}`, html: this.cardHTML(), primary: ['Continuar', () => {}], buttons: [['Recomeçar buraco', () => Game.load(Game.hi)], ['Menu', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.MG = { Game, UI, S, HOLES, Phys };

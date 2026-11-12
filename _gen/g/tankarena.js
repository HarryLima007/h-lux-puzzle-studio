/*@ {"name":"Tank Arena","t1":"Tank ","t2":"Arena","theme":"#0d0c08","bg2":"radial-gradient(ellipse at 50% 0%,#2a2616 0%,#0d0c08 66%)",
"hud":[["Arena","lv","1"],["Blindagem","hp","100"],["Inimigos","foes","0"],["Pontos","score","0"]]} @*/
/* H-LUX TANK ARENA v1.0 — combate de tanques visto de cima. Casco e torre se movem separadamente.
   Joystick esquerdo move o casco; joystick direito gira a torre e atira. Projéteis ricocheteiam nas paredes.
   12 arenas com paredes diferentes; tanques inimigos leve, pesado e artilheiro; melhoria à escolha a cada arena vencida.
   Módulos: ARENAS · Game · AI · View · UI */
const S = HX.store('tankarena');
const W = 400, H = 640, TR = 15;
const L = (x, y, w, h) => [x, y, w, h];
const ARENAS = [
  [L(150, 280, 100, 24)], [L(60, 200, 110, 22), L(230, 420, 110, 22)], [L(188, 140, 24, 140), L(188, 360, 24, 140)],
  [L(80, 160, 22, 120), L(298, 160, 22, 120), L(80, 360, 22, 120), L(298, 360, 22, 120)], [L(120, 300, 160, 22), L(189, 200, 22, 220)],
  [L(60, 140, 90, 22), L(250, 140, 90, 22), L(150, 300, 100, 22), L(60, 460, 90, 22), L(250, 460, 90, 22)],
  [L(100, 120, 22, 180), L(278, 340, 22, 180), L(160, 300, 80, 22)], [L(40, 250, 140, 22), L(220, 370, 140, 22), L(190, 120, 22, 90), L(190, 450, 22, 90)],
  [L(130, 160, 140, 22), L(130, 458, 140, 22), L(60, 290, 22, 80), L(318, 290, 22, 80)], [L(90, 200, 22, 240), L(288, 200, 22, 240), L(150, 310, 100, 22)],
  [L(60, 120, 280, 22), L(60, 500, 280, 22), L(189, 230, 22, 180)], [L(80, 180, 60, 60), L(260, 180, 60, 60), L(80, 400, 60, 60), L(260, 400, 60, 60), L(175, 295, 50, 50)]
];
const TYPES = { light: { hp: 30, sp: 95, rate: .8, dmg: 8, c: '#6fb7ff', score: 100 }, heavy: { hp: 80, sp: 50, rate: .5, dmg: 15, c: '#d6463d', score: 200 }, gunner: { hp: 45, sp: 70, rate: .9, dmg: 6, c: '#3ddc84', score: 150, spread: true } };
const Game = {
  lv: 1, state: 'idle', p: null, foes: [], bullets: [], fx: [], walls: [], score: 0, up: null,
  start(lv) {
    HX.close(); this.lv = lv; this.up = S.get('upgrades', { hp: 0, rate: 0, dmg: 0, sp: 0, bounce: 0 }); const U = this.up;
    const A = ARENAS[(lv - 1) % ARENAS.length]; this.walls = [L(0, 0, W, 10), L(0, H - 10, W, 10), L(0, 0, 10, H), L(W - 10, 0, 10, H)].concat(A);
    this.p = { x: W / 2, y: H - 60, a: -Math.PI / 2, ta: -Math.PI / 2, hp: 100 + U.hp * 25, max: 100 + U.hp * 25, cd: 0 };
    const n = 2 + Math.min(5, Math.floor(lv * .5)), kinds = ['light', 'light', 'heavy', 'gunner']; this.foes = [];
    for (let k = 0; k < n; k++) { const t = kinds[(k + lv) % (lv < 3 ? 2 : kinds.length)], T = TYPES[t], sc = 1 + Math.floor((lv - 1) / ARENAS.length) * .4; const pos = this.freeSpot(60 + (k % 4) * 90, 50 + Math.floor(k / 4) * 70);
      this.foes.push({ t, x: pos[0], y: pos[1], a: Math.PI / 2, ta: Math.PI / 2, hp: T.hp * sc, max: T.hp * sc, cd: 1.5 + Math.random() * 1.5, think: 0, mx: 0, my: 0 }); }
    this.bullets = []; this.fx = []; this.state = 'play'; HX.sfx('power'); UI.hud();
  },
  freeSpot(x, y) { for (let k = 0; k < 40; k++) { const px = HX.clamp(x + (Math.random() - .5) * 60 * (k / 8 + 1), 30, W - 30), py = HX.clamp(y + (Math.random() - .5) * 40 * (k / 8 + 1), 30, H / 2); if (!this.hitWall(px, py, TR + 4)) return [px, py]; } return [x, y]; },
  hitWall(x, y, r) { return this.walls.some(([wx, wy, ww, wh]) => x + r > wx && x - r < wx + ww && y + r > wy && y - r < wy + wh); },
  move(o, dx, dy, r) { if (!this.hitWall(o.x + dx, o.y, r)) o.x += dx; if (!this.hitWall(o.x, o.y + dy, r)) o.y += dy; for (const f of [this.p, ...this.foes]) { if (f === o || f.hp <= 0) continue; const d = Math.hypot(o.x - f.x, o.y - f.y); if (d < r * 2 && d > 0) { o.x += (o.x - f.x) / d * (r * 2 - d) * .5; o.y += (o.y - f.y) / d * (r * 2 - d) * .5; } } },
  fire(o, ang, dmg, enemy, spread) { const mk = a => this.bullets.push({ x: o.x + Math.cos(a) * 22, y: o.y + Math.sin(a) * 22, vx: Math.cos(a) * (enemy ? 250 : 340), vy: Math.sin(a) * (enemy ? 250 : 340), dmg, enemy, bounce: enemy ? 1 : 1 + this.up.bounce, life: 3 });
    if (spread) for (const k of [-.18, 0, .18]) mk(ang + k); else mk(ang); HX.sfx('shot'); },
  step(dt) {
    if (this.state !== 'play') return; const P = this.p, U = this.up;
    const mv = UI.move(); if (mv.on) { P.a = Math.atan2(mv.y, mv.x); const sp = (110 + U.sp * 15) * Math.min(1, Math.hypot(mv.x, mv.y)) * dt; this.move(P, Math.cos(P.a) * sp, Math.sin(P.a) * sp, TR); }
    const aim = UI.aim(); if (aim.on) P.ta = aim.a; P.cd -= dt; if (aim.fire && P.cd <= 0) { P.cd = .55 / (1 + U.rate * .25); this.fire(P, P.ta, 20 + U.dmg * 8, false); }
    for (const f of this.foes) if (f.hp > 0) AI.step(f, dt);
    for (const b of this.bullets) { const n = 3; for (let k = 0; k < n; k++) { b.x += b.vx * dt / n; b.y += b.vy * dt / n;
        const w = this.walls.find(([wx, wy, ww, wh]) => b.x > wx && b.x < wx + ww && b.y > wy && b.y < wy + wh);
        if (w) { if (b.bounce-- <= 0) { b.dead = true; this.spark(b.x, b.y, '#aaa'); break; } const [wx, wy, ww, wh] = w; const px = Math.min(b.x - wx, wx + ww - b.x), py = Math.min(b.y - wy, wy + wh - b.y); if (px < py) { b.vx = -b.vx; b.x += b.vx * dt / n * 2; } else { b.vy = -b.vy; b.y += b.vy * dt / n * 2; } HX.sfx('tap'); } }
      b.life -= dt; if (b.life <= 0) b.dead = true; if (b.dead) continue;
      const targets = b.enemy ? [P] : this.foes; for (const t of targets) { if (t.hp <= 0) continue; if (Math.hypot(b.x - t.x, b.y - t.y) < TR + 3) { t.hp -= b.dmg; b.dead = true; this.spark(b.x, b.y, '#ffb347'); HX.sfx('hit');
          if (t === P) HX.vibrate(25); else if (t.hp <= 0) { this.score += TYPES[t.t].score; this.boom(t.x, t.y); } break; } } }
    this.bullets = this.bullets.filter(b => !b.dead); this.fx = this.fx.filter(e => (e.t -= dt) > 0); for (const e of this.fx) { e.x += e.vx * dt; e.y += e.vy * dt; }
    if (P.hp <= 0) { this.boom(P.x, P.y); return this.lose(); }
    if (!this.foes.some(f => f.hp > 0)) return this.win();
    UI.hud();
  },
  spark(x, y, c) { for (let k = 0; k < 5; k++) { const a = Math.random() * 7; this.fx.push({ x, y, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, t: .25, c }); } },
  boom(x, y) { HX.sfx('boom'); HX.vibrate(30); for (let k = 0; k < 18; k++) { const a = Math.random() * 7, s = 40 + Math.random() * 120; this.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: .6, c: k % 2 ? '#ff8c2e' : '#f1dca6' }); } },
  win() { this.state = 'won'; this.score += 300 + Math.round(this.p.hp); HXA.best(S, 'best', this.score); if (this.lv >= S.get('unlocked', 1)) S.set('unlocked', this.lv + 1); S.set('score', this.score); S.hub(`Arena ${S.get('unlocked', 1)} liberada · ${this.score} pts`); HX.sfx('win'); setTimeout(() => UI.upgrade(), 700); },
  lose() { this.state = 'lost'; HXA.best(S, 'best', this.score); HX.sfx('lose'); setTimeout(() => HXA.menu({ title: 'Tanque destruído', text: `Arena ${this.lv}`, stats: [[this.score, 'Pontos'], [S.get('best', 0), 'Recorde']], primary: ['Tentar de novo', () => this.start(this.lv)], buttons: [['Menu', () => UI.home()]] }), 700); }
};
const AI = {
  los(a, b) { const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 8); for (let k = 1; k < n; k++) { const x = a.x + (b.x - a.x) * k / n, y = a.y + (b.y - a.y) * k / n; if (Game.hitWall(x, y, 2)) return false; } return true; },
  step(f, dt) {
    const T = TYPES[f.t], P = Game.p, d = Math.hypot(P.x - f.x, P.y - f.y), see = this.los(f, P);
    f.think -= dt; if (f.think <= 0) { f.think = .5 + Math.random() * .5; const want = f.t === 'heavy' ? 120 : f.t === 'gunner' ? 220 : 170; let a = Math.atan2(P.y - f.y, P.x - f.x); if (see && d < want) a += Math.PI; else if (see) a += (Math.random() < .5 ? 1 : -1) * 1.2;
      // escolhe a direção livre mais próxima da desejada
      for (const off of [0, .6, -.6, 1.2, -1.2, 2, -2, Math.PI]) { const aa = a + off; if (!Game.hitWall(f.x + Math.cos(aa) * 40, f.y + Math.sin(aa) * 40, TR)) { f.mx = Math.cos(aa); f.my = Math.sin(aa); break; } } }
    f.a = Math.atan2(f.my, f.mx); Game.move(f, f.mx * T.sp * dt, f.my * T.sp * dt, TR);
    // mira com antecipação simples
    const lead = d / 330, px = P.x + (UI.lastMove.x || 0) * 110 * lead * .6, py = P.y + (UI.lastMove.y || 0) * 110 * lead * .6; f.ta = Math.atan2(py - f.y, px - f.x) + (Math.random() - .5) * Math.max(.12, .45 - Game.lv * .02);
    f.cd -= dt; if (f.cd <= 0 && see && d < 420) { f.cd = 1 / T.rate * (1.3 - Math.min(.5, Game.lv * .03)); Game.fire(f, f.ta, T.dmg, true, T.spread); }
  }
};
const View = {
  tank(o, c, me) { const g = St.g; g.save(); g.translate(o.x, o.y); g.rotate(o.a); g.fillStyle = '#1b1a14'; g.fillRect(-17, -14, 34, 6); g.fillRect(-17, 8, 34, 6); g.fillStyle = c; g.fillRect(-14, -10, 28, 20); g.restore();
    g.save(); g.translate(o.x, o.y); g.rotate(o.ta); g.fillStyle = me ? '#fff6c8' : '#222'; g.fillRect(0, -3, 22, 6); g.fillStyle = me ? '#c9a45c' : c; g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill(); g.restore();
    if (!me && o.hp < o.max) { g.fillStyle = '#400'; g.fillRect(o.x - 15, o.y - 24, 30, 4); g.fillStyle = '#3ddc84'; g.fillRect(o.x - 15, o.y - 24, 30 * o.hp / o.max, 4); } },
  draw() {
    const g = St.begin(), G = Game; g.fillStyle = '#2a2a1e'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,.03)'; for (let x = 0; x < W; x += 40) for (let y = 0; y < H; y += 40) if ((x + y) / 40 % 2) g.fillRect(x, y, 40, 40);
    if (!G.p) return;
    for (const [x, y, w, h] of G.walls) { g.fillStyle = '#5a4a32'; g.fillRect(x, y, w, h); g.fillStyle = '#7a6544'; g.fillRect(x, y, w, Math.min(5, h)); }
    for (const f of G.foes) if (f.hp > 0) this.tank(f, TYPES[f.t].c);
    if (G.p.hp > 0) this.tank(G.p, '#e0b14a', true);
    for (const b of G.bullets) { g.fillStyle = b.enemy ? '#ff7a6a' : '#fff6c8'; g.beginPath(); g.arc(b.x, b.y, 3.5, 0, 7); g.fill(); }
    for (const e of G.fx) { g.globalAlpha = Math.min(1, e.t * 3); g.fillStyle = e.c; g.fillRect(e.x - 1.5, e.y - 1.5, 3, 3); } g.globalAlpha = 1;
    UI.sl.draw(g); UI.sr.draw(g);
  }
};
const St = HXA.stage(W, H);
const UI = {
  sl: null, sr: null, mouse: null, mdown: false, lastMove: { x: 0, y: 0 },
  init() {
    this.sl = HXA.stick(St, { zone: 'left', radius: 50, mouse: false }); this.sr = HXA.stick(St, { zone: 'right', radius: 50, mouse: false });
    St.cv.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') this.mouse = St.toL(e); });
    St.cv.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') { this.mdown = true; this.mouse = St.toL(e); } }); addEventListener('pointerup', e => { if (e.pointerType === 'mouse') this.mdown = false; });
    addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { Game.step(dt); View.draw(); });
    HX.life({ onHide: () => { if (Game.state === 'play') this.pause(); } }); this.home();
  },
  move() { const k = HXA.axis(); const m = k.on ? k : this.sl.active ? { x: this.sl.x, y: this.sl.y, on: Math.hypot(this.sl.x, this.sl.y) > .15 } : { x: 0, y: 0, on: false }; this.lastMove = m.on ? m : { x: 0, y: 0 }; return m; },
  aim() { if (this.sr.active && Math.hypot(this.sr.x, this.sr.y) > .2) return { a: Math.atan2(this.sr.y, this.sr.x), on: true, fire: true };
    if (this.mouse && Game.p) return { a: Math.atan2(this.mouse[1] - Game.p.y, this.mouse[0] - Game.p.x), on: true, fire: this.mdown || HXA.key(' ') };
    return { on: false, fire: HXA.key(' ') }; },
  hud() { HX.$('#lv').textContent = Game.lv; HX.$('#hp').textContent = Math.max(0, Math.round(Game.p.hp)); HX.$('#foes').textContent = Game.foes.filter(f => f.hp > 0).length; HX.$('#score').textContent = Game.score; },
  help: ['Lado esquerdo da tela: arraste para mover o tanque. Lado direito: arraste para girar a torre — enquanto o dedo estiver lá, o canhão atira. Dá para usar os dois polegares ao mesmo tempo.', 'No PC: WASD/setas movem, o mouse mira e o clique (ou espaço) atira.', 'Os projéteis ricocheteiam nas paredes: use isso para acertar atrás de obstáculos (e cuidado com os ricochetes inimigos).', 'Inimigos: leve (azul, rápido), pesado (vermelho, resistente) e artilheiro (verde, tiro triplo).', 'Destrua todos para vencer a arena e escolha uma melhoria permanente. São 12 arenas; depois elas voltam mais difíceis.'],
  home() { const u = S.get('unlocked', 1), U = S.get('upgrades', { hp: 0, rate: 0, dmg: 0, sp: 0, bounce: 0 });
    HXA.menu({ title: 'Tank Arena', text: `Melhorias: blindagem ${U.hp} · recarga ${U.rate} · dano ${U.dmg} · motor ${U.sp} · ricochete ${U.bounce}`, stats: [[u, 'Arena liberada'], [S.get('best', 0), 'Recorde']], primary: [`Jogar arena ${u}`, () => { Game.score = u > 1 ? S.get('score', 0) : 0; Game.start(u); }], buttons: [['Recomeçar campanha', () => { S.set('unlocked', 1); S.set('upgrades', { hp: 0, rate: 0, dmg: 0, sp: 0, bounce: 0 }); S.set('score', 0); Game.score = 0; Game.start(1); }]], help: this.help }); },
  upgrade() { const U = S.get('upgrades', { hp: 0, rate: 0, dmg: 0, sp: 0, bounce: 0 }); const opts = [['hp', 'Blindagem +25'], ['rate', 'Recarga mais rápida'], ['dmg', 'Dano +8'], ['sp', 'Motor mais veloz'], ['bounce', 'Ricochete extra']].filter(([k]) => k !== 'bounce' || U.bounce < 2);
    const pick = HX.shuffle(opts.slice()).slice(0, 3); const c = HX.overlay(`<h3>Arena ${Game.lv} vencida!</h3><p>${Game.score} pontos. Escolha uma melhoria:</p>${pick.map(([k, t]) => `<button class="btn" data-k="${k}">${t}</button>`).join('')}`);
    c.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { U[b.dataset.k]++; S.set('upgrades', U); HX.sfx('power'); Game.start(Game.lv + 1); }); },
  pause() { if (Game.state !== 'play') return this.home(); Game.state = 'pause'; HXA.menu({ title: 'Pausa', text: `Arena ${Game.lv}`, primary: ['Continuar', () => { Game.state = 'play'; }], buttons: [['Reiniciar arena', () => Game.start(Game.lv)], ['Menu', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.TK = { Game, AI, UI, S, ARENAS };

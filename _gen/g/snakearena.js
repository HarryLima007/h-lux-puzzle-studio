/*@ {"name":"Snake Arena","t1":"Snake ","t2":"Arena","theme":"#07070c","bg2":"radial-gradient(ellipse at 50% 0%,#1b1530 0%,#07070c 66%)",
"hud":[["Arena","lv","1"],["Tamanho","len","0"],["Posição","rank","—"],["Tempo","tm","3:00"]],
"body":"<div class=\"stage\" id=\"stage\" style=\"position:relative\"><canvas id=\"cv\"></canvas><button class=\"btn-primary\" id=\"boost\" style=\"position:absolute;right:22px;bottom:22px;width:auto;min-height:56px;padding:0 18px;border-radius:28px;opacity:.9;touch-action:none\">Turbo</button></div>"} @*/
/* H-LUX SNAKE ARENA v1.0 — cobras numa arena. Colete energia para crescer; se sua cabeça tocar o corpo de outra cobra
   ou a borda, você perde. Cobras derrotadas viram energia. Vitória: 1º lugar no fim dos 3 minutos ou tamanho-alvo.
   Módulos: Game · Bot · View · UI */
const S = HX.store('snakearena');
const VW = 400, VH = 640, WORLD = 2200, SP = 5, COLS = ['#e5484d', '#3d8bff', '#3ddc84', '#c86bff', '#ff8c2e', '#2fe0e0', '#ff6fb5', '#b8f04a', '#8a6bff', '#f2c230'];
const NAMES = ['Víbora', 'Naja', 'Jiboia', 'Coral', 'Sucuri', 'Cascavel', 'Mamba', 'Píton', 'Caninana', 'Jararaca', 'Surucucu', 'Boipeva'];
const width = len => 7 + Math.min(14, len / 40);
const Game = {
  lv: 1, state: 'idle', snakes: [], food: [], t: 0, dur: 180, goal: 0, cam: { x: 0, y: 0, z: 1 }, kills: 0,
  mk(x, y, len, c, name, bot) { const a = Math.random() * 7, s = { x, y, a, len, c, name, bot, trail: [], boostT: 0, alive: true, think: 0, ta: a };
    for (let k = 0; k < len * 2; k++) s.trail.push([x - Math.cos(a) * k * SP / 2, y - Math.sin(a) * k * SP / 2]); return s; },
  start(lv) {
    HX.close(); this.lv = lv; this.t = 0; this.kills = 0; this.goal = 260 + lv * 60; this.food = []; for (let i = 0; i < 500; i++) this.addFood();
    this.snakes = [this.mk(WORLD / 2, WORLD / 2, 20, '#e0b14a', 'Você', false)]; const n = 6 + Math.min(8, lv * 2);
    for (let i = 0; i < n; i++) this.spawnBot(i);
    this.state = 'play'; HX.sfx('power'); UI.hud();
  },
  spawnBot(i) { let x, y; for (let t = 0; t < 30; t++) { x = 150 + Math.random() * (WORLD - 300); y = 150 + Math.random() * (WORLD - 300); if (!this.me || Math.hypot(x - this.me.x, y - this.me.y) > 600) break; }
    const s = this.mk(x, y, 15 + Math.floor(Math.random() * (20 + this.lv * 12)), COLS[i % COLS.length], NAMES[i % NAMES.length], true); s.skill = .5 + Math.min(.45, this.lv * .07); this.snakes.push(s); },
  get me() { return this.snakes[0] && !this.snakes[0].bot ? this.snakes[0] : null; },
  addFood(x, y, v) { this.food.push({ x: x !== undefined ? x : 30 + Math.random() * (WORLD - 60), y: y !== undefined ? y : 30 + Math.random() * (WORLD - 60), v: v || 1, c: COLS[Math.floor(Math.random() * COLS.length)] }); },
  body(s) { if (s._bf === Game.frame && s._b) return s._b; s._bf = Game.frame; const out = s._b = [], step = Math.max(2, Math.round(width(s.len) / (SP / 2) * .7)); for (let k = 0; k < Math.min(s.trail.length, s.len * 2); k += step) out.push(s.trail[k]); return out; },
  step(dt) {
    if (this.state !== 'play') return; this.t += dt; this.frame = (this.frame || 0) + 1; const me = this.me;
    const d = UI.dir(); if (d.on) me.ta = Math.atan2(d.y, d.x); me.boost = UI.boosting();
    for (const s of this.snakes) { if (!s.alive) continue; if (s.bot) Bot.think(s, dt);
      let da = ((s.ta - s.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; const turn = 4.2 * dt * (12 / width(s.len)) ** .3; s.a += HX.clamp(da, -turn, turn);
      const boost = s.boost && s.len > 12, sp = (boost ? 260 : 140) * dt; s.x += Math.cos(s.a) * sp; s.y += Math.sin(s.a) * sp;
      if (boost) { s.boostT += dt; if (s.boostT > .18) { s.boostT = 0; s.len -= 1; const tl = s.trail[Math.min(s.trail.length - 1, s.len * 2)]; if (tl) this.addFood(tl[0], tl[1], 1); } }
      // rastro com espaçamento fixo
      const last = s.trail[0]; let dd = Math.hypot(s.x - last[0], s.y - last[1]); while (dd >= SP / 2) { const k = (SP / 2) / dd; const nx = last[0] + (s.x - last[0]) * k, ny = last[1] + (s.y - last[1]) * k; s.trail.unshift([nx, ny]); dd -= SP / 2; if (s.trail.length > s.len * 2 + 4) s.trail.length = s.len * 2 + 4; }
      if (s.trail.length > s.len * 2 + 4) s.trail.length = s.len * 2 + 4;
      const r = width(s.len); if (s.x < r || s.y < r || s.x > WORLD - r || s.y > WORLD - r) this.kill(s, null);
    }
    // comida
    for (const s of this.snakes) { if (!s.alive) continue; const r = width(s.len) + 14; for (const f of this.food) { if (f.dead) continue; const dx = f.x - s.x, dy = f.y - s.y; if (dx * dx + dy * dy < r * r) { f.dead = true; s.len += f.v; } } }
    const before = this.food.length; this.food = this.food.filter(f => !f.dead); if (this.food.length < 450) for (let k = this.food.length; k < Math.min(before, 500); k++) this.addFood();
    // colisões cabeça × corpo
    for (const s of this.snakes) { if (!s.alive) continue; const r = width(s.len) * .8; for (const o of this.snakes) { if (o === s || !o.alive) continue; const ro = width(o.len), lim = (r + ro) ** 2;
        if (Math.abs(o.x - s.x) > o.len * SP + 60 || Math.abs(o.y - s.y) > o.len * SP + 60) continue;
        for (const [bx, by] of this.body(o)) { if ((bx - s.x) ** 2 + (by - s.y) ** 2 < lim) { this.kill(s, o); break; } } if (!s.alive) break; } }
    if (!this.me || !this.me.alive) return this.end(false, 'Você bateu');
    const gone = this.snakes.filter(s => !s.alive && s.bot).length; this.snakes = this.snakes.filter(s => s.alive || !s.bot);
    for (let k = 0; k < gone; k++) setTimeout(() => this.state === 'play' && this.spawnBot(Math.floor(Math.random() * 12)), 3000);
    if (me.len >= this.goal) return this.end(true, 'Tamanho-alvo alcançado');
    if (this.t >= this.dur) return this.end(this.rank() === 1, this.rank() === 1 ? 'Você terminou em 1º' : `Você terminou em ${this.rank()}º`);
    const z = HX.clamp(1.15 - Math.log10(me.len) * .28, .45, 1); this.cam.z += (z - this.cam.z) * Math.min(1, dt * 2); this.cam.x = me.x; this.cam.y = me.y;
    UI.hud();
  },
  kill(s, by) { if (!s.alive) return; s.alive = false; for (const [x, y] of this.body(s)) if (Math.random() < .8) this.addFood(x + (Math.random() - .5) * 10, y + (Math.random() - .5) * 10, 2);
    if (by && !by.bot) { this.kills++; HX.sfx('coin'); HX.vibrate(15); } if (!s.bot) { HX.sfx('boom'); HX.vibrate(50); } },
  board() { return this.snakes.filter(s => s.alive).map(s => ({ n: s.name, l: s.len, me: !s.bot })).sort((a, b) => b.l - a.l); },
  rank() { return this.board().findIndex(x => x.me) + 1; },
  end(win, why) {
    this.state = 'over'; const len = this.me ? this.me.len : 0; HXA.best(S, 'best', len); const st = S.get('stats', { games: 0, wins: 0 }); st.games++; if (win) st.wins++; S.set('stats', st);
    if (win && this.lv >= S.get('unlocked', 1)) S.set('unlocked', this.lv + 1); S.hub(`Arena ${S.get('unlocked', 1)} liberada · recorde ${S.get('best', 0)}`); HX.sfx(win ? 'win' : 'lose');
    setTimeout(() => HXA.menu({ title: win ? 'Vitória!' : 'Fim da partida', text: why, stats: [[len, 'Tamanho'], [this.kills, 'Derrubadas'], [Math.round(this.t) + 's', 'Tempo']], primary: win ? ['Próxima arena', () => this.start(this.lv + 1)] : ['Tentar de novo', () => this.start(this.lv)], buttons: [['Menu', () => UI.home()]] }), 600);
  }
};
const Bot = {
  think(s, dt) {
    s.think -= dt; if (s.think > 0) return; s.think = .15 + Math.random() * .15;
    // perigo à frente: corpos próximos na direção atual
    const look = 70 + width(s.len) * 3; let danger = null;
    for (const o of Game.snakes) { if (o === s || !o.alive) continue; for (const [bx, by] of Game.body(o)) { const dx = bx - s.x, dy = by - s.y, d = Math.hypot(dx, dy); if (d > look) continue; const ang = Math.atan2(dy, dx), diff = Math.abs(((ang - s.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (diff < 1 && (!danger || d < danger.d)) danger = { d, ang }; } }
    const m = 160; if (s.x < m || s.y < m || s.x > WORLD - m || s.y > WORLD - m) { s.ta = Math.atan2(WORLD / 2 - s.y, WORLD / 2 - s.x); s.boost = false; return; }
    if (danger && Math.random() < s.skill + .2) { s.ta = danger.ang + (Math.random() < .5 ? 1.7 : -1.7); s.boost = false; return; }
    // caçar: tentar cortar a frente do jogador quando maior
    const me = Game.me; if (me && s.len > me.len * .8 && Math.random() < s.skill * .5 && Math.hypot(me.x - s.x, me.y - s.y) < 350) { const px = me.x + Math.cos(me.a) * 90, py = me.y + Math.sin(me.a) * 90; s.ta = Math.atan2(py - s.y, px - s.x); s.boost = s.len > 30 && Math.random() < .3; return; }
    let best = null, bv = 0; for (let k = 0; k < 30; k++) { const f = Game.food[Math.floor(Math.random() * Game.food.length)]; if (!f) break; const d = Math.hypot(f.x - s.x, f.y - s.y); const v = f.v / (d + 20); if (v > bv) { bv = v; best = f; } }
    if (best) s.ta = Math.atan2(best.y - s.y, best.x - s.x); s.boost = false;
  }
};
const View = {
  draw() {
    const g = St.begin(), G = Game, me = G.me; if (!me) return; const z = G.cam.z; g.fillStyle = '#0b0a14'; g.fillRect(0, 0, VW, VH);
    g.save(); g.translate(VW / 2, VH / 2); g.scale(z, z); g.translate(-G.cam.x, -G.cam.y);
    const x0 = G.cam.x - VW / 2 / z - 30, x1 = G.cam.x + VW / 2 / z + 30, y0 = G.cam.y - VH / 2 / z - 30, y1 = G.cam.y + VH / 2 / z + 30;
    g.fillStyle = 'rgba(201,164,92,.06)'; for (let x = Math.floor(x0 / 50) * 50; x < x1; x += 50) for (let y = Math.floor(y0 / 50) * 50; y < y1; y += 50) if ((x / 50 + y / 50) % 2 === 0) g.fillRect(x, y, 50, 50);
    g.strokeStyle = '#e5484d'; g.lineWidth = 8; g.strokeRect(0, 0, WORLD, WORLD);
    for (const f of G.food) { if (f.x < x0 || f.x > x1 || f.y < y0 || f.y > y1) continue; g.fillStyle = f.c; g.globalAlpha = .9; g.beginPath(); g.arc(f.x, f.y, f.v > 1 ? 5.5 : 3.5, 0, 7); g.fill(); } g.globalAlpha = 1;
    for (const s of G.snakes) { if (!s.alive) continue; const w = width(s.len), pts = G.body(s); g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = w * 2 + 3; g.beginPath(); pts.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
      g.strokeStyle = s.c; g.lineWidth = w * 2; g.stroke();
      g.fillStyle = s.c; g.beginPath(); g.arc(s.x, s.y, w * 1.1, 0, 7); g.fill();
      for (const sd of [-1, 1]) { const ex = s.x + Math.cos(s.a + sd * .6) * w * .6, ey = s.y + Math.sin(s.a + sd * .6) * w * .6; g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, w * .32, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(ex + Math.cos(s.a) * w * .12, ey + Math.sin(s.a) * w * .12, w * .16, 0, 7); g.fill(); }
      if (!s.bot) { g.strokeStyle = '#fff6c8'; g.lineWidth = 2; g.beginPath(); g.arc(s.x, s.y, w * 1.3, 0, 7); g.stroke(); } }
    g.restore();
    const bd = G.board().slice(0, 5); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(VW - 128, 8, 120, 18 + bd.length * 16); g.font = '700 11px Manrope'; g.textAlign = 'left';
    g.fillStyle = '#c9a45c'; g.fillText('RANKING', VW - 120, 22); bd.forEach((x, i) => { g.fillStyle = x.me ? '#fff6c8' : '#ccc'; g.fillText(`${i + 1}. ${x.n}`, VW - 120, 38 + i * 16); g.textAlign = 'right'; g.fillText(x.l, VW - 14, 38 + i * 16); g.textAlign = 'left'; });
    g.fillStyle = 'rgba(241,220,166,.6)'; g.fillText(`Meta: ${G.goal}`, 10, 22);
    // minimapa
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(8, VH - 68, 60, 60); g.fillStyle = '#e0b14a'; g.fillRect(8 + me.x / WORLD * 60 - 2, VH - 68 + me.y / WORLD * 60 - 2, 4, 4);
    UI.st.draw(g);
  }
};
const St = HXA.stage(VW, VH);
const UI = {
  st: null, mouse: null, boostBtn: false,
  init() {
    this.st = HXA.stick(St, { zone: 'any', radius: 54, mouse: false });
    St.cv.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') this.mouse = St.toL(e); });
    St.cv.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') this.mouseDown = true; }); addEventListener('pointerup', e => { if (e.pointerType === 'mouse') this.mouseDown = false; });
    const b = HX.$('#boost'); b.addEventListener('pointerdown', e => { e.preventDefault(); this.boostBtn = true; }); const off = () => this.boostBtn = false; b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    HX.$('#menu').onclick = () => this.pause();
    HXA.loop(dt => { Game.step(dt); View.draw(); });
    HX.life({ onHide: () => { if (Game.state === 'play') this.pause(); } }); this.home();
  },
  boosting() { return this.boostBtn || HXA.key(' ', 'Shift') || this.mouseDown; },
  dir() { const k = HXA.axis(); if (k.on) return k; if (this.st.active && Math.hypot(this.st.x, this.st.y) > .15) return { x: this.st.x, y: this.st.y, on: true };
    if (this.mouse) { const dx = this.mouse[0] - VW / 2, dy = this.mouse[1] - VH / 2; if (Math.hypot(dx, dy) > 10) return { x: dx, y: dy, on: true }; } return { on: false }; },
  hud() { const me = Game.me; if (!me) return; HX.$('#lv').textContent = Game.lv; HX.$('#len').textContent = me.len; HX.$('#rank').textContent = Game.rank() + 'º'; HX.$('#tm').textContent = HX.fmt(Math.max(0, Game.dur - Game.t) * 1000); },
  help: ['Arraste o dedo em qualquer lugar para apontar a direção da sua cobra dourada (no PC, o mouse ou WASD/setas).', 'Colete a energia colorida para crescer. Se a sua cabeça encostar no corpo de outra cobra ou na borda vermelha, a partida acaba.', 'Faça outras cobras baterem no seu corpo: elas viram energia para você.', 'Turbo (segure o botão, espaço ou clique do mouse) acelera, mas gasta tamanho.', 'Vença terminando os 3 minutos em 1º ou alcançando o tamanho-alvo. Cada vitória libera uma arena mais difícil.'],
  home() { const st = S.get('stats', { games: 0, wins: 0 }), u = S.get('unlocked', 1);
    HXA.menu({ title: 'Snake Arena', text: 'Cresça e faça os rivais baterem em você.', stats: [[u, 'Arena liberada'], [S.get('best', 0), 'Maior tamanho'], [`${st.wins}/${st.games}`, 'Vitórias']], primary: [`Jogar arena ${u}`, () => Game.start(u)], buttons: u > 1 ? [['Arena 1', () => Game.start(1)]] : [], help: this.help }); },
  pause() { if (Game.state !== 'play') return this.home(); Game.state = 'pause'; HXA.menu({ title: 'Pausa', text: `Arena ${Game.lv} · tamanho ${Game.me.len}`, primary: ['Continuar', () => { Game.state = 'play'; }], buttons: [['Recomeçar', () => Game.start(Game.lv)], ['Menu', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.SA = { Game, Bot, UI, S, width };

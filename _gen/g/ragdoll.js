/*@ {"name":"Ragdoll Arena","t1":"Ragdoll ","t2":"Arena","theme":"#0a0708","bg2":"radial-gradient(ellipse at 50% 0%,#2a1616 0%,#0a0708 66%)",
"hud":[["Você","hp1","100"],["Rodada","rnd","1"],["Rival","hp2","100"]],
"css":".ctl{display:flex;gap:10px;justify-content:flex-end;margin-top:8px;width:100%;max-width:620px;align-self:center}.ctl button{min-height:64px;flex:0 0 96px;border-radius:18px;border:1px solid var(--line);background:linear-gradient(#1c1c20,#121214);color:var(--gold-2);font:800 14px Manrope,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none}.ctl button.on{border-color:var(--gold);background:linear-gradient(#3a2f18,#1d170c)}.ctl .hint{flex:1;align-self:center;font-size:12px;color:var(--muted)}",
"body":"<div class=\"stage\" id=\"stage\"><canvas id=\"cv\"></canvas></div><div class=\"ctl\"><span class=\"hint\" id=\"hint\">Arraste na arena para mover</span><button id=\"bjump\">Pular</button><button id=\"batk\">Atacar</button></div>"} @*/
/* H-LUX RAGDOLL ARENA v1.0 — luta com bonecos de física (Verlet: partículas + hastes).
   Golpes valem pela velocidade real da mão/arma no impacto. Armas (taco, espada, martelo) e caixas que podem ser empurradas.
   3 arenas (Ringue, Plataformas, Abismo — cair é derrota), IA em 3 níveis, melhor de 3 rodadas.
   No PC também há modo 2 jogadores local (WASD+F+G contra setas+K+L). Sem multiplayer online.
   Módulos: WEAP · ARENAS · Body · World · AI · Game · View · UI */
const S = HX.store('ragdoll');
const VW = 400, VH = 560, GRAV = 1400;
const WEAP = { fist: { n: 'Punhos', len: 0, dmg: 1, mass: 0 }, bat: { n: 'Taco', len: 46, dmg: 1.5, mass: 1 }, sword: { n: 'Espada', len: 58, dmg: 1.8, mass: .8 }, hammer: { n: 'Martelo', len: 40, dmg: 2.4, mass: 2 } };
const ARENAS = [
  { n: 'Ringue', floor: [[0, 500, 400]], plats: [], walls: true, pit: false },
  { n: 'Plataformas', floor: [[0, 500, 400]], plats: [[40, 380, 110], [250, 380, 110], [140, 270, 120]], walls: true, pit: false },
  { n: 'Abismo', floor: [[0, 500, 150], [250, 500, 150]], plats: [[150, 360, 100]], walls: true, pit: true }
];
/* corpo Verlet: pontos com posição atual/anterior; hastes mantêm distâncias */
const World = {
  pts: [], sticks: [], arena: null,
  pt(x, y, r = 5, m = 1) { const p = { x, y, ox: x, oy: y, r, m, ground: false }; this.pts.push(p); return p; },
  stick(a, b, len) { const s = { a, b, len: len || Math.hypot(a.x - b.x, a.y - b.y) }; this.sticks.push(s); return s; },
  solids() { const A = this.arena; return A.floor.map(([x, y, w]) => [x, y, w, 60]).concat(A.plats.map(([x, y, w]) => [x, y, w, 14])); },
  step(dt) {
    for (const p of this.pts) { const vx = (p.x - p.ox) * .995, vy = (p.y - p.oy) * .995; p.ox = p.x; p.oy = p.y; p.x += vx; p.y += vy + GRAV * dt * dt; p.ground = false; }
    const sol = this.solids();
    for (let it = 0; it < 6; it++) {
      for (const s of this.sticks) { const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, d = Math.hypot(dx, dy) || 1e-3, diff = (d - s.len) / d, ma = s.a.m, mb = s.b.m, t = ma + mb; s.a.x += dx * diff * mb / t; s.a.y += dy * diff * mb / t; s.b.x -= dx * diff * ma / t; s.b.y -= dy * diff * ma / t; }
      for (const p of this.pts) { if (this.arena.walls) { if (p.x < p.r) { p.x = p.r; } if (p.x > VW - p.r) p.x = VW - p.r; } if (p.y < p.r) p.y = p.r;
        for (const [x, y, w, h] of sol) if (p.x > x && p.x < x + w && p.y + p.r > y && p.y - p.r < y + h) { const fromTop = p.oy + p.r <= y + 4; if (fromTop || p.y < y + h / 2) { p.y = y - p.r; p.ground = true; p.ox = p.x - (p.x - p.ox) * .7; } else if (h < 20) { if (p.oy - p.r >= y + h - 4) p.y = y + h + p.r; else { p.y = y - p.r; p.ground = true; } } else { p.y = y - p.r; p.ground = true; } } }
    }
  }
};
const Body = {
  make(x, dirc, col, wk) {
    const P = (dx, dy, r, m) => World.pt(x + dx * dirc, 430 + dy, r, m);
    const b = { col, dir: dirc, hp: 100, stun: 0, cd: 0, wk, hitT: 0 };
    b.head = P(0, -70, 11, 1); b.neck = P(0, -52, 4, 1); b.pel = P(0, -14, 5, 1.4); b.kL = P(-6, 10, 4, 1); b.kR = P(6, 10, 4, 1); b.fL = P(-8, 36, 5, 1.2); b.fR = P(8, 36, 5, 1.2);
    b.eF = P(12, -36, 4, .8); b.hF = P(24, -26, 6, .8); b.eB = P(-12, -36, 4, .8); b.hB = P(-22, -24, 6, .8);
    const s = (a, c, l) => World.stick(a, c, l); s(b.head, b.neck); s(b.neck, b.pel); s(b.pel, b.kL); s(b.pel, b.kR); s(b.kL, b.fL); s(b.kR, b.fR); s(b.neck, b.eF); s(b.eF, b.hF); s(b.neck, b.eB); s(b.eB, b.hB);
    s(b.head, b.pel, 56); s(b.kL, b.kR, 16);
    const W = WEAP[wk]; if (W.len) { b.tip = World.pt(b.hF.x + W.len * dirc * .6, b.hF.y - W.len * .8, 6, .5 + W.mass * .4); s(b.hF, b.tip, W.len); s(b.eF, b.tip, W.len + 14); }
    b.parts = [b.head, b.neck, b.pel, b.kL, b.kR, b.fL, b.fR, b.eF, b.hF, b.eB, b.hB].concat(b.tip ? [b.tip] : []); return b;
  },
  grounded(b) { return b.fL.ground || b.fR.ground || b.kL.ground || b.kR.ground; },
  push(p, fx, fy, dt) { p.x += fx * dt * dt; p.y += fy * dt * dt; },
  /* músculos: mantém de pé (a menos que atordoado) e aplica comandos */
  drive(b, cmd, foe, dt) {
    if (b.hp <= 0) return; const up = b.stun > 0 ? .08 : 1; b.stun = Math.max(0, b.stun - dt); b.cd = Math.max(0, b.cd - dt);
    this.push(b.head, 0, -GRAV * 1.9 * up, dt); this.push(b.neck, 0, -GRAV * .6 * up, dt); this.push(b.fL, 0, GRAV * .9 * up, dt); this.push(b.fR, 0, GRAV * .9 * up, dt);
    const cx = (b.head.x - b.pel.x); this.push(b.head, -cx * 60 * up, 0, dt); // endireita o tronco
    const midF = (b.fL.x + b.fR.x) / 2; this.push(b.pel, (midF - b.pel.x) * 30 * up, 0, dt);
    if (foe) b.dir = foe.pel.x > b.pel.x ? 1 : -1;
    // braço de trás descansando, da frente em guarda
    if (!b.atk) { this.push(b.hF, (b.neck.x + b.dir * 22 - b.hF.x) * 120 * up, (b.neck.y + 18 - b.hF.y) * 120 * up, dt); if (b.tip) this.push(b.tip, (b.hF.x + b.dir * 10 - b.tip.x) * 80 * up, (b.hF.y - 40 - b.tip.y) * 80 * up, dt); }
    this.push(b.hB, (b.neck.x - b.dir * 14 - b.hB.x) * 60 * up, (b.neck.y + 26 - b.hB.y) * 60 * up, dt);
    const g = this.grounded(b);
    if (cmd.mx && b.stun <= 0) { const f = (g ? 1500 : 500) * cmd.mx; this.push(b.pel, f, 0, dt); this.push(b.neck, f * .8, 0, dt); const ph = performance.now() / 90; this.push(b.fL, f * (Math.sin(ph) > 0 ? 1.4 : -.2), 0, dt); this.push(b.fR, f * (Math.sin(ph) > 0 ? -.2 : 1.4), 0, dt); }
    if (cmd.jump && g && b.stun <= 0) { for (const p of b.parts) { p.oy = p.y + 9.5; } HX.sfx('tap'); }
    if (cmd.atk && b.cd <= 0 && b.stun <= 0 && foe) { b.cd = .55 + WEAP[b.wk].mass * .12; b.atk = .22; b.hitDone = false; }
    if (b.atk) { b.atk = Math.max(0, b.atk - dt); const tgt = foe.head, k = b.tip ? 7000 : 6200; const dx = tgt.x - b.hF.x, dy = tgt.y - b.hF.y, d = Math.hypot(dx, dy) || 1;
      if (b.tip) { this.push(b.tip, dx / d * k * 1.3 + b.dir * 1200, dy / d * k * 1.3 - 2600 * (b.atk > .12 ? 1 : -1), dt); } this.push(b.hF, dx / d * k, dy / d * k, dt); }
  }
};
const AI = {
  cmd(b, foe, lvl, t) {
    const c = { mx: 0, jump: false, atk: false }; if (b.hp <= 0) return c; const dx = foe.pel.x - b.pel.x, dist = Math.abs(dx), reach = 46 + (b.tip ? WEAP[b.wk].len * .8 : 0);
    const A = World.arena; if (A.pit) { const onLeft = b.pel.x < 200; const edge = onLeft ? 150 - b.pel.x : b.pel.x - 250; if (edge < 30 && edge > -10 && Math.sign(dx) === (onLeft ? 1 : -1) && Math.abs(foe.pel.x - 200) > 60) { c.jump = Math.random() < .05 + lvl * .04; } }
    if (dist > reach * .8) c.mx = Math.sign(dx) * (.55 + lvl * .15); else if (dist < reach * .4) c.mx = -Math.sign(dx) * .3;
    if (A.pit && Math.abs(b.pel.x - 200) < 70 && !Body.grounded(b)) c.mx = b.pel.x < 200 ? -1 : 1;
    if (A.pit && b.pel.x > 140 && b.pel.x < 260 && b.pel.y > 460) c.jump = true;
    if (foe.head.y < b.head.y - 60 && Math.random() < .02 + lvl * .02) c.jump = true;
    if (dist < reach + 10 && Math.random() < .03 + lvl * .035) c.atk = true;
    return c;
  }
};
const Game = {
  state: 'idle', a: null, b: null, round: 1, wins: [0, 0], ai: 1, arena: 0, mode: 'ai', fx: [], msg: '', t: 0, boxes: [],
  match(arena, ai, mode) { HX.close(); this.arena = arena; this.ai = ai; this.mode = mode || 'ai'; this.round = 1; this.wins = [0, 0]; this.newRound(); },
  newRound() {
    World.pts = []; World.sticks = []; World.arena = ARENAS[this.arena]; const ws = Object.keys(WEAP); const rnd = () => ws[Math.floor(Math.random() * ws.length)];
    const wk = this.round === 1 ? 'fist' : rnd(); this.a = Body.make(this.arena === 2 ? 70 : 90, 1, '#e0b14a', wk); this.b = Body.make(this.arena === 2 ? 330 : 310, -1, '#e5484d', this.round === 1 ? 'fist' : rnd());
    this.boxes = []; const bx = this.arena === 1 ? [[180, 240]] : this.arena === 2 ? [[175, 320]] : [[180, 460], [205, 430]]; for (const [x, y] of bx) { const q = [World.pt(x, y, 4, 1.5), World.pt(x + 24, y, 4, 1.5), World.pt(x + 24, y + 24, 4, 1.5), World.pt(x, y + 24, 4, 1.5)]; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) World.stick(q[i], q[j]); this.boxes.push(q); }
    this.fx = []; this.t = 0; this.state = 'fight'; this.over = 0; HX.toast(`Rodada ${this.round} · ${WEAP[this.a.wk].n} × ${WEAP[this.b.wk].n}`, 1300); UI.hud();
  },
  hit(att, def) {
    if (att.hitDone || !att.atk && !att.tip) return; const tool = att.tip || att.hF, sp = Math.hypot(tool.x - tool.ox, tool.y - tool.oy) * 60; if (sp < 170) return;
    for (const [p, mul] of [[def.head, 1.6], [def.neck, 1], [def.pel, .8]]) { if (Math.hypot(tool.x - p.x, tool.y - p.y) < tool.r + p.r + 4) {
      const W = WEAP[att.wk], dmg = Math.round(Math.min(30, (sp - 120) / 28 * W.dmg * mul)); if (dmg <= 0) return; def.hp = Math.max(0, def.hp - dmg); att.hitDone = true; att.cd = Math.max(att.cd, .35);
      const kx = (tool.x - tool.ox) * .7, ky = (tool.y - tool.oy) * .7 - 3; for (const q of def.parts) { q.ox -= kx; q.oy -= ky; } if (dmg > 12) def.stun = .6 + dmg / 40;
      this.fx.push({ x: p.x, y: p.y, t: .4, v: dmg }); HX.sfx(dmg > 14 ? 'boom' : 'hit'); HX.vibrate(dmg > 14 ? 40 : 15); return; } }
  },
  boxHits() { for (const q of this.boxes) { const c = q[0], sp = Math.hypot(c.x - c.ox, c.y - c.oy) * 60; if (sp < 380) continue; const mx = (q[0].x + q[2].x) / 2, my = (q[0].y + q[2].y) / 2;
      for (const f of [this.a, this.b]) { if (f.boxT > 0) continue; if (Math.hypot(f.head.x - mx, f.head.y - my) < 26 || Math.hypot(f.pel.x - mx, f.pel.y - my) < 24) { const d = Math.round(sp / 60); f.hp = Math.max(0, f.hp - d); f.boxT = .5; f.stun = .5; this.fx.push({ x: mx, y: my, t: .4, v: d }); HX.sfx('hit'); } } }
    for (const f of [this.a, this.b]) if (f.boxT > 0) f.boxT -= 1 / 60;
    // corpos empurram caixas
    for (const q of this.boxes) for (const f of [this.a, this.b]) for (const p of [f.hF, f.fL, f.fR, f.pel, f.tip].filter(Boolean)) for (const c of q) { const dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy), m = c.r + p.r + 8; if (d < m && d > 0) { const k = (m - d) / d * .5; c.x += dx * k; c.y += dy * k; } } },
  step(dt) {
    if (this.state !== 'fight' && this.state !== 'ko') return; this.t += dt;
    const ca = this.state === 'fight' ? UI.cmd(1) : {}, cb = this.state === 'fight' ? (this.mode === 'ai' ? AI.cmd(this.b, this.a, this.ai, this.t) : UI.cmd(2)) : {};
    Body.drive(this.a, ca, this.b, dt); Body.drive(this.b, cb, this.a, dt); World.step(dt);
    // empurrão entre os corpos (não se atravessam)
    for (const p of this.a.parts) for (const q of this.b.parts) { const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy), m = p.r + q.r; if (d < m && d > 0) { const k = (m - d) / d * .5; p.x -= dx * k; p.y -= dy * k; q.x += dx * k; q.y += dy * k; } }
    if (this.state === 'fight') { this.hit(this.a, this.b); this.hit(this.b, this.a); this.boxHits(); }
    this.fx = this.fx.filter(e => (e.t -= dt) > 0);
    for (const f of [this.a, this.b]) if (f.head.y > VH + 40) f.hp = 0;
    if (this.state === 'fight' && this.t > 60 && this.a.hp === this.b.hp) { this.state = 'ko'; this.over = 1.6; this.round--; HX.toast('Empate — a rodada será repetida', 1300); }
    if (this.state === 'fight' && this.t > 60 && this.a.hp !== this.b.hp) { (this.a.hp < this.b.hp ? this.a : this.b).hp = 0; HX.toast('Tempo esgotado — vence quem tem mais vida', 1300); }
    if (this.state === 'fight' && (this.a.hp <= 0 || this.b.hp <= 0)) { this.state = 'ko'; this.over = 1.6; const w = this.a.hp > 0 ? 0 : this.b.hp > 0 ? 1 : (this.a.head.y < this.b.head.y ? 0 : 1); this.wins[w]++; this.lastW = w; HX.sfx(w === 0 || this.mode !== 'ai' ? 'win' : 'lose'); HX.toast(w === 0 ? (this.mode === 'ai' ? 'Nocaute! Você venceu a rodada' : 'Ponto do Jogador 1') : (this.mode === 'ai' ? 'Você foi nocauteado' : 'Ponto do Jogador 2'), 1400); }
    if (this.state === 'ko') { this.over -= dt; if (this.over <= 0) { if (this.wins[0] === 2 || this.wins[1] === 2) return this.end(); this.round++; this.newRound(); } }
    UI.hud();
  },
  end() {
    this.state = 'over'; const won = this.wins[0] === 2; const st = S.get('stats', { w: 0, l: 0 }); if (this.mode === 'ai') { if (won) st.w++; else st.l++; S.set('stats', st); if (won) { const best = S.get('beat', {}); best[this.arena] = Math.max(best[this.arena] || 0, this.ai + 1); S.set('beat', best); } }
    S.hub(`${st.w} vitórias · ${st.l} derrotas contra a IA`);
    HXA.menu({ title: this.mode === 'ai' ? (won ? 'Vitória!' : 'Derrota') : (won ? 'Jogador 1 venceu' : 'Jogador 2 venceu'), text: `${ARENAS[this.arena].n} · placar ${this.wins[0]} × ${this.wins[1]}`, primary: ['Revanche', () => this.match(this.arena, this.ai, this.mode)], buttons: [['Menu', () => UI.home()]] });
  }
};
const St = HXA.stage(VW, VH);
const View = {
  body(g, b) {
    const L = (a, c, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(c.x, c.y); g.stroke(); }; g.lineCap = 'round'; g.strokeStyle = b.hp > 0 ? b.col : '#777';
    L(b.neck, b.pel, 12); L(b.pel, b.kL, 9); L(b.kL, b.fL, 8); L(b.pel, b.kR, 9); L(b.kR, b.fR, 8); L(b.neck, b.eB, 7); L(b.eB, b.hB, 6); L(b.neck, b.eF, 7); L(b.eF, b.hF, 6);
    if (b.tip) { g.strokeStyle = b.wk === 'sword' ? '#dfe7ff' : b.wk === 'hammer' ? '#8a8f99' : '#8a5a30'; L(b.hF, b.tip, b.wk === 'sword' ? 4 : 6); if (b.wk === 'hammer') { g.fillStyle = '#5a5f6a'; g.fillRect(b.tip.x - 10, b.tip.y - 8, 20, 16); } }
    g.fillStyle = b.hp > 0 ? b.col : '#777'; g.beginPath(); g.arc(b.head.x, b.head.y, b.head.r, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(b.head.x + b.dir * 4, b.head.y - 2, 2, 0, 7); g.fill();
    if (b.stun > 0) { g.fillStyle = '#ffd54a'; g.font = '700 12px Manrope'; g.textAlign = 'center'; g.fillText('★ ★', b.head.x, b.head.y - 16); } g.lineCap = 'butt';
  },
  draw() {
    const g = St.begin(), G = Game; const sky = g.createLinearGradient(0, 0, 0, VH); sky.addColorStop(0, '#1a1214'); sky.addColorStop(1, '#2c1c1c'); g.fillStyle = sky; g.fillRect(0, 0, VW, VH); if (!G.a) return;
    g.fillStyle = 'rgba(201,164,92,.08)'; g.font = '800 64px "Cormorant Garamond",serif'; g.textAlign = 'center'; g.fillText(ARENAS[G.arena].n.toUpperCase(), VW / 2, 120);
    for (const [x, y, w, h] of World.solids()) { g.fillStyle = h > 20 ? '#2a1f18' : '#3a2c20'; g.fillRect(x, y, w, h); g.fillStyle = '#c9a45c'; g.fillRect(x, y, w, 3); }
    if (ARENAS[G.arena].pit) { g.fillStyle = 'rgba(229,72,77,.15)'; g.fillRect(150, 500, 100, 60); }
    for (const q of G.boxes) { g.fillStyle = '#7a5230'; g.beginPath(); g.moveTo(q[0].x, q[0].y); for (let i = 1; i < 4; i++) g.lineTo(q[i].x, q[i].y); g.closePath(); g.fill(); g.strokeStyle = '#3a2410'; g.lineWidth = 2; g.stroke(); }
    this.body(g, G.b); this.body(g, G.a);
    for (const e of G.fx) { g.globalAlpha = e.t * 2.5; g.fillStyle = '#fff'; g.font = '800 18px Manrope'; g.textAlign = 'center'; g.fillText('-' + e.v, e.x, e.y - 20 - (.4 - e.t) * 60); g.globalAlpha = 1; }
    for (const [f, x, al] of [[G.a, 12, 'left'], [G.b, VW - 12, 'right']]) { const w = 150; g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(al === 'left' ? x : x - w, 12, w, 10); g.fillStyle = f.col; g.fillRect(al === 'left' ? x : x - w * f.hp / 100, 12, w * f.hp / 100, 10); g.fillStyle = '#f1dca6'; g.font = '700 11px Manrope'; g.textAlign = al; g.fillText(`${WEAP[f.wk].n} · ${'●'.repeat(G.wins[f === G.a ? 0 : 1])}`, x, 36); }
    g.fillStyle = G.t > 50 ? '#e5484d' : '#f1dca6'; g.font = '800 18px Manrope'; g.textAlign = 'center'; g.fillText(Math.max(0, Math.ceil(60 - G.t)), VW / 2, 26);
    if (UI.st) UI.st.draw(g);
  }
};
const UI = {
  st: null, atk: false, jump: false,
  init() {
    this.st = HXA.stick(St, { zone: 'any', radius: 46 });
    const hold = (id, k) => { const b = HX.$('#' + id); const on = v => e => { e.preventDefault(); if (v) { this[k] = true; if (k === 'atk') this.atkL = true; } else if (k === 'atk') this.atk = false; b.classList.toggle('on', v); }; b.addEventListener('pointerdown', on(true)); b.addEventListener('pointerup', on(false)); b.addEventListener('pointerleave', on(false)); b.addEventListener('pointercancel', on(false)); };
    hold('batk', 'atk'); hold('bjump', 'jump');
    addEventListener('keydown', e => { if (e.repeat) return; if (e.key === 'p' || e.key === 'Escape') this.pause(); if (['w', 'W'].includes(e.key) || (Game.mode === 'ai' && (e.key === 'ArrowUp' || e.key === ' '))) this.jump1 = true; if (e.key === 'ArrowUp' && Game.mode === 'pvp') this.jump2 = true; });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { Game.step(Math.min(dt, 1 / 30)); View.draw(); });
    HX.life({ onHide: () => { if (Game.state === 'fight') this.pause(); } }); this.home();
  },
  cmd(n) {
    const K = (...k) => HXA.key(...k);
    if (n === 2) { const c = { mx: (K('ArrowRight') ? 1 : 0) - (K('ArrowLeft') ? 1 : 0), jump: !!this.jump2, atk: K('k', 'l', 'K', 'L') }; this.jump2 = false; return c; }
    let mx = (K('d', 'D') ? 1 : 0) - (K('a', 'A') ? 1 : 0); if (Game.mode === 'ai') mx += (K('ArrowRight') ? 1 : 0) - (K('ArrowLeft') ? 1 : 0);
    if (!mx && this.st.active && Math.abs(this.st.x) > .2) mx = this.st.x; const jumpStick = this.st.active && this.st.y < -.7;
    const c = { mx: HX.clamp(mx, -1, 1), jump: this.jump || this.jump1 || jumpStick, atk: this.atk || this.atkL || K('f', 'g', 'F', 'G', 'j', 'J') || (Game.mode === 'ai' && K('Enter')) }; this.jump = false; this.jump1 = false; this.atkL = false; return c;
  },
  hud() { HX.$('#hp1').textContent = Math.round(Game.a.hp); HX.$('#hp2').textContent = Math.round(Game.b.hp); HX.$('#rnd').textContent = `${Game.round} (${Game.wins[0]}×${Game.wins[1]})`; },
  help: ['Celular: arraste o dedo na arena para andar (puxar para cima também pula). Botões: Pular e Atacar (segure para golpes seguidos).', 'PC: A/D ou setas andam, W/espaço pula, F ou J ataca. Modo 2 jogadores no PC: Jogador 1 usa A/D, W e F/G; Jogador 2 usa setas e K/L.', 'O dano depende da velocidade da mão ou da arma no impacto; na cabeça vale mais. Golpes fortes deixam o rival tonto.', 'Rodada 1 é no punho; depois cada lutador recebe uma arma sorteada (taco, espada ou martelo). Caixas arremessadas também machucam. No Abismo, cair é nocaute. Cada rodada tem 60 s (depois disso vence quem tiver mais vida). Melhor de 3.'],
  home() { const st = S.get('stats', { w: 0, l: 0 }), beat = S.get('beat', {}); const pc = matchMedia('(pointer:fine)').matches;
    HXA.menu({ title: 'Ragdoll Arena', text: 'Escolha a arena e a dificuldade.', stats: [[st.w, 'Vitórias'], [st.l, 'Derrotas']],
      html: `<div class="segs"><div class="segg"><small>Arena</small><div class="seg" id="sa">${ARENAS.map((a, i) => `<button data-v="${i}" class="${i === (this.selA || 0) ? 'on' : ''}">${a.n}${beat[i] ? ' ✓' : ''}</button>`).join('')}</div></div><div class="segg"><small>Oponente</small><div class="seg" id="sd">${['IA fácil', 'IA média', 'IA difícil'].concat(pc ? ['2 jogadores (teclado)'] : []).map((n, i) => `<button data-v="${i}" class="${i === (this.selD ?? 1) ? 'on' : ''}">${n}</button>`).join('')}</div></div></div>`,
      primary: ['Lutar', () => { const d = this.selD ?? 1; Game.match(this.selA || 0, Math.min(2, d), d === 3 ? 'pvp' : 'ai'); HX.$('#hint').textContent = d === 3 ? 'J1: A/D W F · J2: setas ↑ K' : 'Arraste na arena para mover'; }], help: this.help });
    const c = document.querySelector('.hx-card'); c.querySelectorAll('#sa [data-v]').forEach(b => b.onclick = () => { this.selA = +b.dataset.v; c.querySelectorAll('#sa button').forEach(x => x.classList.toggle('on', x === b)); });
    c.querySelectorAll('#sd [data-v]').forEach(b => b.onclick = () => { this.selD = +b.dataset.v; c.querySelectorAll('#sd button').forEach(x => x.classList.toggle('on', x === b)); }); },
  pause() { if (Game.state !== 'fight' && Game.state !== 'ko') return Game.state === 'pause' ? null : this.home(); const prev = Game.state; Game.state = 'pause'; this.atk = false;
    HXA.menu({ title: 'Pausa', text: `Rodada ${Game.round} · ${Game.wins[0]} × ${Game.wins[1]}`, primary: ['Continuar', () => { Game.state = prev; }], buttons: [['Recomeçar luta', () => Game.match(Game.arena, Game.ai, Game.mode)], ['Menu', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.RG = { Game, UI, S, World, Body, AI };

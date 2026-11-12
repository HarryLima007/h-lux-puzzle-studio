/*@ {"name":"Pool","t1":"Po","t2":"ol","theme":"#06090a","bg2":"radial-gradient(ellipse at 50% 0%,#12261c 0%,#06090a 66%)",
"hud":[["Vez","turn","Você"],["Seu grupo","grp","—"],["Placar","score","0 × 0"]],
"css":".cue{display:flex;gap:10px;align-items:center;margin-top:8px;width:100%;max-width:620px;align-self:center}.cue input{flex:1;accent-color:#c9a45c;height:36px}.cue .btn-primary{flex:0 0 110px;min-height:52px}.cue small{color:var(--muted);width:42px;text-align:right}",
"body":"<div class=\"stage\" id=\"stage\"><canvas id=\"cv\"></canvas></div><div class=\"cue\"><small id=\"pwv\">60%</small><input type=\"range\" id=\"pw\" min=\"5\" max=\"100\" value=\"60\" aria-label=\"Força\"><button class=\"btn-primary\" id=\"shoot\">Tacar</button></div>"} @*/
/* H-LUX POOL v1.0 — sinuca bola 8 com física de colisões, tabelas e caçapas.
   Regras (padrão bola 8): mesa aberta até alguém encaçapar legalmente; lisas (1–7) × listradas (9–15).
   Falta = bola branca caçapada, não tocar em nada, tocar primeiro em bola errada (ou na 8 antes da hora),
   ou nenhuma bola tocar a tabela/cair depois do contato. Falta dá "bola na mão" ao adversário.
   Encaçapar a 8 vence só depois de limpar o grupo e sem falta; antes disso (ou com falta) perde.
   Modos: contra a IA (3 níveis) ou 2 jogadores no mesmo aparelho. Módulos: Table · Phys · Rules · AI · Game · View · UI */
const S = HX.store('pool');
const VW = 400, VH = 640, R = 9.5, X0 = 34, X1 = 366, Y0 = 44, Y1 = 596;
const POCKETS = [[X0, Y0, 18], [X1, Y0, 18], [X0, (Y0 + Y1) / 2, 15], [X1, (Y0 + Y1) / 2, 15], [X0, Y1, 18], [X1, Y1, 18]];
const BCOL = ['#f4efe2', '#e0b14a', '#3d6bff', '#e5484d', '#7b4bd6', '#ff8a2e', '#2f9a4a', '#8a2a2a', '#111', '#e0b14a', '#3d6bff', '#e5484d', '#7b4bd6', '#ff8a2e', '#2f9a4a', '#8a2a2a'];
const grpOf = n => n === 0 ? 'cue' : n === 8 ? 'eight' : n < 8 ? 'solid' : 'stripe';
const GN = { solid: 'Lisas', stripe: 'Listradas' };
const Phys = {
  step(balls, dt, ev) {
    for (const b of balls) { if (b.in) continue; b.x += b.vx * dt; b.y += b.vy * dt; const sp = Math.hypot(b.vx, b.vy); if (sp > 0) { const ns = Math.max(0, sp - 115 * dt); b.vx *= ns / sp; b.vy *= ns / sp; } if (sp < 3) b.vx = b.vy = 0; }
    for (let it = 0; it < 2; it++) for (let i = 0; i < balls.length; i++) { const a = balls[i]; if (a.in) continue; for (let j = i + 1; j < balls.length; j++) { const c = balls[j]; if (c.in) continue; const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy); if (d < 2 * R && d > 0) {
      const nx = dx / d, ny = dy / d, ov = 2 * R - d; a.x -= nx * ov / 2; a.y -= ny * ov / 2; c.x += nx * ov / 2; c.y += ny * ov / 2; const rv = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny; if (rv > 0) { const k = rv * 1.0; a.vx -= k * nx; a.vy -= k * ny; c.vx += k * nx; c.vy += k * ny; ev.hit(a, c, rv); } } } }
    for (const b of balls) { if (b.in) continue;
      for (const [px, py, pr] of POCKETS) if (Math.hypot(b.x - px, b.y - py) < pr) { b.in = true; b.vx = b.vy = 0; ev.pocket(b); break; } if (b.in) continue;
      // tabelas com "bocas" de caçapa: na boca não há tabela, e passar da linha da tabela ali é caçapa
      const MY = (Y0 + Y1) / 2, mx = b.y < Y0 + 28 || b.y > Y1 - 28 || Math.abs(b.y - MY) < 17, my = b.x < X0 + 28 || b.x > X1 - 28, sink = () => { b.in = true; b.vx = b.vy = 0; ev.pocket(b); };
      if (b.x < X0 + R) { if (mx) { if (b.x < X0 - R * .2) { sink(); continue; } } else { b.x = X0 + R; b.vx = Math.abs(b.vx) * .82; ev.rail(b); } }
      if (b.x > X1 - R) { if (mx) { if (b.x > X1 + R * .2) { sink(); continue; } } else { b.x = X1 - R; b.vx = -Math.abs(b.vx) * .82; ev.rail(b); } }
      if (b.y < Y0 + R) { if (my) { if (b.y < Y0 - R * .2) { sink(); continue; } } else { b.y = Y0 + R; b.vy = Math.abs(b.vy) * .82; ev.rail(b); } }
      if (b.y > Y1 - R) { if (my) { if (b.y > Y1 + R * .2) { sink(); continue; } } else { b.y = Y1 - R; b.vy = -Math.abs(b.vy) * .82; ev.rail(b); } }
    }
  },
  moving(balls) { return balls.some(b => !b.in && (b.vx || b.vy)); }
};
const Game = {
  state: 'idle', balls: [], turn: 0, groups: [null, null], mode: 'ai', ai: 1, shot: null, inHand: false, aim: -Math.PI / 2, power: .6, wins: [0, 0], msg: '', breakShot: true, aiT: 0,
  rack() {
    const b = [{ n: 0, x: 200, y: 470, vx: 0, vy: 0 }]; const order = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15]; let k = 0; const fx = 200, fy = 170;
    for (let row = 0; row < 5; row++) for (let i = 0; i <= row; i++) { const n = order[k++]; b.push({ n, x: fx + (i - row / 2) * (2 * R + .4) + (Math.random() - .5) * .5, y: fy - row * (2 * R * .87 + .4) + (Math.random() - .5) * .5, vx: 0, vy: 0 }); }
    const eight = b.find(x => x.n === 8), center = b.find(x => Math.abs(x.x - 200) < 1 && Math.abs(x.y - (170 - 2 * (2 * R * .87 + .3))) < 1); if (center && eight !== center) { [eight.x, center.x] = [center.x, eight.x]; [eight.y, center.y] = [center.y, eight.y]; }
    return b;
  },
  start(mode, ai) { HX.close(); this.mode = mode || this.mode; this.ai = ai ?? this.ai; this.balls = this.rack(); this.turn = 0; this.groups = [null, null]; this.inHand = false; this.breakShot = true; this.aim = -Math.PI / 2; this.state = 'aim'; this.msg = 'Sua vez: quebre o triângulo'; UI.hud(); this.maybeAI(); },
  cue() { return this.balls[0]; },
  isAI() { return this.mode === 'ai' && this.turn === 1; },
  legalTargets(p) { const g = this.groups[p]; if (!g) return this.balls.filter(b => !b.in && b.n !== 0 && b.n !== 8); const left = this.balls.filter(b => !b.in && grpOf(b.n) === g); return left.length ? left : this.balls.filter(b => b.n === 8 && !b.in); },
  shoot(angle, power) {
    if (this.state !== 'aim' || this.inHand) return; const c = this.cue(), v = 120 + power * 1150; c.vx = Math.cos(angle) * v; c.vy = Math.sin(angle) * v; this.shot = { first: null, pocketed: [], rail: false, contact: false, legal: this.legalTargets(this.turn) };
    this.state = 'roll'; HX.sfx('hit');
  },
  step(dt) {
    if (this.state === 'aim' && this.isAI()) { this.aiT -= dt; if (this.aiT <= 0) AI.play(); }
    if (this.state !== 'roll') return; const ev = {
      hit: (a, c, rv) => { if (!this.shot.first && (a.n === 0 || c.n === 0)) this.shot.first = a.n === 0 ? c : a; this.shot.contact = true; if (rv > 60) HX.sfx('tap'); },
      rail: b => { if (this.shot.contact) this.shot.rail = true; }, pocket: b => { this.shot.pocketed.push(b); HX.sfx('coin'); } };
    for (let i = 0; i < 10; i++) Phys.step(this.balls, dt / 10, ev);
    if (!Phys.moving(this.balls)) Rules.resolve();
  }
};
const Rules = {
  resolve() {
    const G = Game, s = G.shot, p = G.turn, o = 1 - p, pk = s.pocketed, cueIn = pk.some(b => b.n === 0), eightIn = pk.some(b => b.n === 8);
    const legal = s.legal, myG = G.groups[p];
    const wrongFirst = s.first && !G.breakShot && (myG ? !legal.includes(s.first) : s.first.n === 8);
    let foul = null; if (cueIn) foul = 'Bola branca caçapada'; else if (!s.first) foul = 'Nenhuma bola foi tocada'; else if (wrongFirst) foul = s.first.n === 8 ? 'Tocou primeiro na bola 8' : 'Tocou primeiro numa bola do adversário'; else if (!pk.length && !s.rail) foul = 'Nenhuma bola tocou a tabela';
    const wasBreak = G.breakShot; G.breakShot = false;
    if (eightIn) { const legalEight = legal.some(b => b.n === 8) && !!myG && !foul;
      if (wasBreak && !cueIn) { const e = G.balls.find(b => b.n === 8); e.in = false; e.x = 200; e.y = 170 - 2 * (2 * R * .87); this.spotClear(e); return this.next(p, false, 'A 8 caiu na quebra e voltou à mesa'); }
      return this.gameOver(legalEight ? p : o, legalEight ? 'encaçapou a bola 8!' : (foul ? 'bola 8 com falta' : 'bola 8 antes da hora')); }
    if (cueIn) { const c = G.cue(); c.in = false; c.vx = c.vy = 0; c.x = 200; c.y = 470; }
    // define grupos na mesa aberta: primeira bola legalmente encaçapada
    if (!myG && !foul && !wasBreak) { const f = pk.find(b => b.n !== 0 && b.n !== 8); if (f) { G.groups[p] = grpOf(f.n); G.groups[o] = G.groups[p] === 'solid' ? 'stripe' : 'solid'; HX.toast(`${p === 0 || G.mode !== 'ai' ? (G.mode === 'ai' ? 'Você' : 'Jogador ' + (p + 1)) : 'IA'}: ${GN[G.groups[p]]}`, 1300); } }
    if (foul) return this.next(o, true, 'Falta: ' + foul);
    const mine = pk.filter(b => b.n !== 0 && b.n !== 8 && (!G.groups[p] || grpOf(b.n) === G.groups[p])); if (mine.length) return this.next(p, false, ''); return this.next(o, false, '');
  },
  spotClear(b) { for (let k = 0; k < 40; k++) { if (!Game.balls.some(o => o !== b && !o.in && Math.hypot(o.x - b.x, o.y - b.y) < 2 * R)) return; b.y -= 4; } },
  next(p, hand, msg) { const G = Game; G.turn = p; G.inHand = hand; if (hand) { const c = G.cue(); c.x = 200; c.y = 470; Rules.spotClear(c); } G.state = 'aim'; G.msg = msg; if (msg) HX.toast(msg, 1500); UI.hud(); G.maybeAI(); },
  gameOver(w, why) { const G = Game; G.state = 'over'; G.wins[w]++; const youWin = G.mode === 'ai' ? w === 0 : true; const who = G.mode === 'ai' ? (w === 0 ? 'Você' : 'A IA') : `Jogador ${w + 1}`;
    if (G.mode === 'ai') { const st = S.get('stats', { w: 0, l: 0 }); if (w === 0) st.w++; else st.l++; S.set('stats', st); S.hub(`${st.w} vitórias · ${st.l} derrotas contra a IA`); }
    HX.sfx(youWin ? 'win' : 'lose'); UI.hud(); setTimeout(() => HXA.menu({ title: `${who} venceu`, text: `${who} ${why}`, stats: [[`${G.wins[0]} × ${G.wins[1]}`, 'Placar da sessão']], primary: ['Nova partida', () => G.start()], buttons: [['Menu', () => UI.home()]] }), 600); }
};
Game.maybeAI = function () { if (this.isAI() && this.state === 'aim') this.aiT = .9; };
const AI = {
  clear(x0, y0, x1, y1, ignore) { for (const b of Game.balls) { if (b.in || ignore.includes(b)) continue; const dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy, t = HX.clamp(((b.x - x0) * dx + (b.y - y0) * dy) / L, 0, 1); if (Math.hypot(b.x - (x0 + dx * t), b.y - (y0 + dy * t)) < 2 * R - .5) return false; } return true; },
  best(cx, cy) {
    const G = Game, c = G.cue(); let best = null; for (const t of G.legalTargets(G.turn)) for (const [px, py] of POCKETS) {
      const dx = px - t.x, dy = py - t.y, d = Math.hypot(dx, dy), gx = t.x - dx / d * 2 * R, gy = t.y - dy / d * 2 * R; const ax = gx - cx, ay = gy - cy, ad = Math.hypot(ax, ay); const cut = Math.acos(HX.clamp((ax * dx + ay * dy) / (ad * d), -1, 1)); if (cut > 1.25) continue;
      if (!this.clear(cx, cy, gx, gy, [c, t]) || !this.clear(t.x, t.y, px, py, [t, c])) continue; const score = cut * 2 + d / 300 + ad / 500; if (!best || score < best.score) best = { score, ang: Math.atan2(ay, ax), pow: HX.clamp((ad + d * 1.6) / 900 + .12, .25, .95), t }; }
    return best;
  },
  play() {
    const G = Game, c = G.cue(), err = [.09, .035, .012][G.ai];
    if (G.inHand) { let bp = null; for (let i = 0; i < 60; i++) { const x = X0 + 30 + Math.random() * (X1 - X0 - 60), y = Y0 + 30 + Math.random() * (Y1 - Y0 - 60); if (G.balls.some(b => !b.in && b !== c && Math.hypot(b.x - x, b.y - y) < 2 * R + 2)) continue; const s = this.best(x, y); if (s && (!bp || s.score < bp.s.score)) bp = { x, y, s }; } if (bp) { c.x = bp.x; c.y = bp.y; } G.inHand = false; }
    let s = G.breakShot ? { ang: -Math.PI / 2 + (Math.random() - .5) * .04, pow: 1 } : this.best(c.x, c.y);
    if (!s) { const ts = G.legalTargets(G.turn).sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y)); const t = ts.find(t => this.clear(c.x, c.y, t.x, t.y, [c, t])) || ts[0]; s = { ang: Math.atan2(t.y - c.y, t.x - c.x), pow: .55 }; }
    G.aim = s.ang + (Math.random() - .5) * 2 * err; G.shoot(G.aim, HX.clamp(s.pow + (Math.random() - .5) * err, .1, 1));
  }
};
const St = HXA.stage(VW, VH);
const View = {
  ball(g, b) { const c = BCOL[b.n]; g.fillStyle = b.n > 8 ? '#f4efe2' : c; g.beginPath(); g.arc(b.x, b.y, R, 0, 7); g.fill(); if (b.n > 8) { g.save(); g.beginPath(); g.arc(b.x, b.y, R, 0, 7); g.clip(); g.fillStyle = c; g.fillRect(b.x - R, b.y - R * .55, 2 * R, R * 1.1); g.restore(); }
    if (b.n) { g.fillStyle = '#f4efe2'; g.beginPath(); g.arc(b.x, b.y, R * .48, 0, 7); g.fill(); g.fillStyle = '#111'; g.font = '800 8px Manrope'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(b.n, b.x, b.y + .5); }
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(b.x - 3, b.y - 3, 2.5, 0, 7); g.fill(); },
  draw() {
    const g = St.begin(), G = Game; g.fillStyle = '#0b0d0c'; g.fillRect(0, 0, VW, VH);
    g.fillStyle = '#4a2e18'; g.beginPath(); g.roundRect(X0 - 22, Y0 - 22, X1 - X0 + 44, Y1 - Y0 + 44, 18); g.fill(); g.strokeStyle = '#c9a45c'; g.lineWidth = 2; g.stroke();
    const felt = g.createRadialGradient(200, 320, 40, 200, 320, 360); felt.addColorStop(0, '#1e7a4a'); felt.addColorStop(1, '#0f4a2c'); g.fillStyle = felt; g.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(X0, 470); g.lineTo(X1, 470); g.stroke(); g.fillStyle = 'rgba(255,255,255,.3)'; for (const [x, y] of [[200, 170], [200, 470]]) { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
    for (const [x, y, r] of POCKETS) { g.fillStyle = '#050505'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    if (!G.balls.length) return; const c = G.cue();
    if (G.state === 'aim' && !G.isAI() && !G.inHand) { const a = G.aim, dx = Math.cos(a), dy = Math.sin(a); let hit = null, ht = 1e9; for (const b of G.balls) { if (b.in || b === c) continue; const fx = b.x - c.x, fy = b.y - c.y, t = fx * dx + fy * dy; if (t <= 0) continue; const off = Math.hypot(fx - dx * t, fy - dy * t); if (off < 2 * R) { const tt = t - Math.sqrt(4 * R * R - off * off); if (tt < ht) { ht = tt; hit = b; } } }
      let L = ht; if (!hit) { L = 1e9; for (const t of [(X0 + R - c.x) / dx, (X1 - R - c.x) / dx, (Y0 + R - c.y) / dy, (Y1 - R - c.y) / dy]) if (t > 0 && t < L) L = t; }
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.setLineDash([5, 5]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(c.x + dx * L, c.y + dy * L); g.stroke(); g.setLineDash([]);
      if (hit) { const gx = c.x + dx * L, gy = c.y + dy * L; g.strokeStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(gx, gy, R, 0, 7); g.stroke(); const nx = hit.x - gx, ny = hit.y - gy, nl = Math.hypot(nx, ny); g.strokeStyle = G.legalTargets(G.turn).includes(hit) ? 'rgba(61,220,132,.8)' : 'rgba(229,72,77,.8)'; g.beginPath(); g.moveTo(hit.x, hit.y); g.lineTo(hit.x + nx / nl * 60, hit.y + ny / nl * 60); g.stroke(); }
      const back = 22 + G.power * 40; g.strokeStyle = '#c9a45c'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(c.x - dx * back, c.y - dy * back); g.lineTo(c.x - dx * (back + 160), c.y - dy * (back + 160)); g.stroke(); g.lineCap = 'butt'; }
    for (const b of G.balls) if (!b.in) this.ball(g, b);
    if (G.inHand && !G.isAI()) { g.strokeStyle = '#ffd54a'; g.lineWidth = 2; g.setLineDash([3, 3]); g.beginPath(); g.arc(c.x, c.y, R + 5, 0, 7); g.stroke(); g.setLineDash([]); g.fillStyle = '#ffd54a'; g.font = '700 12px Manrope'; g.textAlign = 'center'; g.fillText('Bola na mão: arraste a branca e confirme', 200, 26); }
    // bolas encaçapadas por grupo
    const pocketed = G.balls.filter(b => b.in && b.n); pocketed.forEach((b, i) => this.ball(g, { n: b.n, x: 16 + i * 22, y: VH - 14 }));
    if (G.isAI() && G.state === 'aim') { g.fillStyle = '#f1dca6'; g.font = '700 13px Manrope'; g.textAlign = 'center'; g.fillText('A IA está mirando…', 200, 26); }
  }
};
const UI = {
  drag: false,
  init() {
    const pw = HX.$('#pw'); pw.oninput = () => { Game.power = pw.value / 100; HX.$('#pwv').textContent = pw.value + '%'; }; Game.power = pw.value / 100;
    HX.$('#shoot').onclick = () => this.fire();
    St.cv.addEventListener('pointerdown', e => { e.preventDefault(); if (Game.state !== 'aim' || Game.isAI()) return; const [x, y] = St.toL(e), c = Game.cue(); if (Game.inHand && Math.hypot(x - c.x, y - c.y) < 40) { this.drag = 'cue'; return; } this.drag = 'aim'; this.aimAt(x, y); });
    St.cv.addEventListener('pointermove', e => { const [x, y] = St.toL(e); if (this.drag === 'cue') this.place(x, y); else if (this.drag === 'aim' || (e.pointerType === 'mouse' && Game.state === 'aim' && !Game.inHand && !Game.isAI())) this.aimAt(x, y); });
    addEventListener('pointerup', () => { if (this.drag === 'cue') { HX.toast('Mire e toque em Tacar', 900); Game.inHand = false; } this.drag = false; });
    addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.fire(); } if (e.key === 'ArrowLeft') Game.aim -= .01; if (e.key === 'ArrowRight') Game.aim += .01; if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { pw.value = +pw.value + (e.key === 'ArrowUp' ? 5 : -5); pw.oninput(); } if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { Game.step(Math.min(dt, 1 / 30)); View.draw(); });
    this.home();
  },
  aimAt(x, y) { const c = Game.cue(); if (Math.hypot(x - c.x, y - c.y) > 4) Game.aim = Math.atan2(y - c.y, x - c.x); },
  place(x, y) { const c = Game.cue(); x = HX.clamp(x, X0 + R, X1 - R); y = HX.clamp(y, Y0 + R, Y1 - R); if (Game.balls.some(b => b !== c && !b.in && Math.hypot(b.x - x, b.y - y) < 2 * R + 1)) return; c.x = x; c.y = y; },
  fire() { if (Game.state === 'aim' && !Game.isAI()) { Game.inHand = false; Game.shoot(Game.aim, Game.power); } },
  hud() { const G = Game, nm = p => G.mode === 'ai' ? (p ? 'IA' : 'Você') : 'J' + (p + 1); HX.$('#turn').textContent = nm(G.turn) + (G.inHand ? ' ✋' : ''); const g = G.groups[G.mode === 'ai' ? 0 : G.turn]; HX.$('#grp').textContent = g ? GN[g] : 'Mesa aberta'; HX.$('#score').textContent = `${G.wins[0]} × ${G.wins[1]}`; },
  help: ['Toque/arraste na mesa para mirar (a linha mostra a trajetória; verde = bola sua, vermelho = proibida). Ajuste a força na barra e toque em Tacar. No PC: mouse mira, setas ajustam, espaço taca.', 'Regras bola 8: depois da quebra, a primeira bola encaçapada legalmente define seu grupo (lisas 1–7 ou listradas 9–15). Encaçapou do seu grupo, joga de novo.', 'Faltas: branca na caçapa, não tocar em bola nenhuma, tocar primeiro em bola errada, ou nenhuma bola tocar a tabela depois do contato. O adversário ganha "bola na mão" e pode arrastar a branca para qualquer lugar.', 'Vence quem encaçapar a 8 depois de limpar o próprio grupo. Encaçapar a 8 antes, ou com falta, é derrota. Se a 8 cair na quebra, ela volta à mesa.'],
  home() { const st = S.get('stats', { w: 0, l: 0 });
    HXA.menu({ title: 'Pool', text: 'Sinuca bola 8.', stats: [[st.w, 'Vitórias'], [st.l, 'Derrotas']], html: `<div class="seg" id="lv">${['IA fácil', 'IA média', 'IA difícil'].map((n, i) => `<button data-v="${i}" class="${i === (this.lv ?? 1) ? 'on' : ''}">${n}</button>`).join('')}</div>`,
      primary: ['Jogar contra a IA', () => Game.start('ai', this.lv ?? 1)], buttons: [['2 jogadores (mesmo aparelho)', () => Game.start('pvp')]], help: this.help });
    document.querySelectorAll('#lv [data-v]').forEach(b => b.onclick = () => { this.lv = +b.dataset.v; document.querySelectorAll('#lv button').forEach(x => x.classList.toggle('on', x === b)); }); },
  pause() { if (Game.state === 'idle' || Game.state === 'over') return this.home(); HXA.menu({ title: 'Pausa', text: Game.msg || '', primary: ['Continuar', () => {}], buttons: [['Nova partida', () => Game.start()], ['Menu', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.PL = { Game, UI, S, Rules, AI, Phys };

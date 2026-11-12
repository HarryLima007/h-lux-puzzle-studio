/*@ {"name":"Bowling","t1":"Bow","t2":"ling","theme":"#0a0806","bg2":"radial-gradient(ellipse at 50% 0%,#2a1e12 0%,#0a0806 66%)",
"hud":[["Quadro","frame","1"],["Total","tot","0"],["Recorde","best","0"]],
"css":".sheet{display:grid;grid-template-columns:repeat(9,1fr) 1.4fr;gap:2px;margin-top:6px;width:100%;max-width:620px;align-self:center;font:700 11px Manrope,sans-serif}.sheet .f{border:1px solid var(--line);border-radius:6px;background:#121214;text-align:center;padding:2px 0;min-height:38px}.sheet .f.cur{border-color:var(--gold)}.sheet .r{display:flex;justify-content:flex-end;gap:3px;padding:0 4px;color:var(--muted)}.sheet .t{color:var(--gold-2);font-size:13px}.who{font:700 11px Manrope,sans-serif;color:var(--muted);text-align:left;width:100%;max-width:620px;align-self:center;margin-top:4px}",
"body":"<div class=\"stage\" id=\"stage\"><canvas id=\"cv\"></canvas></div><div class=\"who\" id=\"who1\">Você</div><div class=\"sheet\" id=\"sheet\"></div><div class=\"who\" id=\"who2\" hidden>IA</div><div class=\"sheet\" id=\"sheet2\" hidden></div>"} @*/
/* H-LUX BOWLING v1.0 — boliche de 10 pinos com física 2D (bola, pinos e colisões em cadeia) e pontuação oficial:
   strike = 10 + próximas 2 bolas; spare = 10 + próxima bola; 10º quadro com bolas bônus (máximo 300).
   Arraste a bola na base para posicioná-la e deslize para cima para lançar: a direção do deslize mira, a velocidade
   dá a força e a curva do gesto gera efeito (gancho). PC: ← → posiciona, ↑ ↓ mira, segure espaço para a força, A/D efeito.
   Modos: solo ou contra a IA. Módulos: Score · Phys · Game · View · UI */
const S = HX.store('bowling');
const VW = 400, VH = 640, LX0 = 120, LX1 = 280, BR = 12, PR = 7, FOUL = 560;
const Score = {
  /* rolls → {frames:[{rolls:[..], total|null}], total} seguindo as regras oficiais */
  calc(rolls) {
    const fr = []; let i = 0, acc = 0;
    for (let f = 0; f < 10; f++) {
      if (f < 9) { if (rolls[i] === 10) { const b = [rolls[i + 1], rolls[i + 2]]; const ok = b.every(x => x !== undefined); acc += ok ? 10 + b[0] + b[1] : 0; fr.push({ rolls: [10], total: ok ? acc : null, mark: 'X' }); i += 1; }
        else { const a = rolls[i], c = rolls[i + 1]; if (a === undefined) { fr.push({ rolls: [], total: null }); continue; } if (c === undefined) { fr.push({ rolls: [a], total: null }); i += 2; continue; }
          if (a + c === 10) { const n = rolls[i + 2]; acc += n !== undefined ? 10 + n : 0; fr.push({ rolls: [a, c], total: n !== undefined ? acc : null, mark: '/' }); } else { acc += a + c; fr.push({ rolls: [a, c], total: acc }); } i += 2; } }
      else { const r = rolls.slice(i, i + 3); const need = r[0] === 10 || r[0] + r[1] === 10 ? 3 : 2; const done = r.length >= need && r.slice(0, need).every(x => x !== undefined); if (done) acc += r.slice(0, need).reduce((a, b) => a + b, 0); fr.push({ rolls: r.slice(0, need), total: done ? acc : null, last: true }); }
    }
    return { frames: fr, total: acc };
  },
  /* em que quadro/bola estamos e quantos pinos devem estar de pé */
  state(rolls) {
    let i = 0; for (let f = 0; f < 9; f++) { if (i >= rolls.length) return { f, ball: 0, reset: true }; if (rolls[i] === 10) { i++; continue; } if (i + 1 >= rolls.length) return { f, ball: 1, reset: false }; i += 2; }
    const r = rolls.slice(i); if (r.length === 0) return { f: 9, ball: 0, reset: true }; if (r.length === 1) return { f: 9, ball: 1, reset: r[0] === 10 };
    if (r.length === 2) { if (r[0] === 10 || r[0] + r[1] === 10) return { f: 9, ball: 2, reset: r[1] === 10 || (r[0] !== 10 && r[0] + r[1] === 10) || (r[0] === 10 && r[1] === 10) }; return null; } return null;
  },
  sym(fr, k) { const r = fr.rolls; if (fr.last) { const v = r[k]; if (v === undefined) return ''; if (v === 10 && (k === 0 || r[k - 1] === 10 || (k === 2 && r[0] + r[1] === 10 && r[0] !== 10) || (k === 1 && r[0] === 10))) return 'X'; if (k > 0 && r[k - 1] !== 10 && r[k - 1] + v === 10 && !(k === 2 && r[0] + r[1] === 10 && r[0] !== 10)) return '/'; return v === 0 ? '–' : v; }
    if (fr.mark === 'X') return k === 1 ? 'X' : ''; const v = r[k]; if (v === undefined) return ''; if (k === 1 && fr.mark === '/') return '/'; return v === 0 ? '–' : v; }
};
const PINPOS = (() => { const p = [], cx = 200, y0 = 150, dx = 26, dy = 22; let k = 0; for (let row = 0; row < 4; row++) for (let i = 0; i <= row; i++) p.push([cx + (i - row / 2) * dx, y0 - row * dy, ++k]); return p; })();
const Phys = {
  step(G, dt) {
    const b = G.ball; if (b && !b.done) { b.vx += b.spin * dt; b.spin *= Math.pow(.6, dt); b.x += b.vx * dt; b.y += b.vy * dt;
      if (!b.gutter && (b.x < LX0 + BR * .5 || b.x > LX1 - BR * .5)) { b.gutter = true; b.vx = 0; b.spin = 0; b.x = b.x < 200 ? LX0 - 9 : LX1 + 9; HX.sfx('hit'); }
      if (b.y < 30) { b.done = true; } }
    for (const p of G.pins) { if (p.gone) continue; p.x += p.vx * dt; p.y += p.vy * dt; const sp = Math.hypot(p.vx, p.vy); if (sp) { const ns = Math.max(0, sp - 260 * dt); p.vx *= ns / sp; p.vy *= ns / sp; } if (sp > 40 || Math.hypot(p.x - p.x0, p.y - p.y0) > 6) p.down = true; if (p.x < LX0 - 4 || p.x > LX1 + 4 || p.y < 40) { p.down = true; p.gone = true; } }
    if (b && !b.gutter && !b.done) for (const p of G.pins) { if (p.gone) continue; const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy); if (d < BR + PR && d > 0) { const nx = dx / d, ny = dy / d, rv = (b.vx - p.vx) * nx + (b.vy - p.vy) * ny; if (rv > 0) { const m1 = 7, m2 = 1.5, j = 2 * rv / (1 / m1 + 1 / m2) * .9; b.vx -= j / m1 * nx; b.vy -= j / m1 * ny; p.vx += j / m2 * nx + (Math.random() - .5) * 30; p.vy += j / m2 * ny; HX.sfx('tap'); } p.x = b.x + nx * (BR + PR); p.y = b.y + ny * (BR + PR); } }
    for (let i = 0; i < G.pins.length; i++) for (let k = i + 1; k < G.pins.length; k++) { const a = G.pins[i], c = G.pins[k]; if (a.gone || c.gone) continue; const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy); if (d < 2 * PR && d > 0) { const nx = dx / d, ny = dy / d, rv = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny; if (rv > 0) { a.vx -= rv * nx * .95; a.vy -= rv * ny * .95; c.vx += rv * nx * .95; c.vy += rv * ny * .95; } const ov = (2 * PR - d) / 2; a.x -= nx * ov; a.y -= ny * ov; c.x += nx * ov; c.y += ny * ov; } }
  },
  settled(G) { return (!G.ball || G.ball.done) && G.pins.every(p => p.gone || Math.hypot(p.vx, p.vy) < 4); }
};
const Game = {
  state: 'idle', mode: 'solo', rolls: [[], []], cur: 0, pins: [], ball: null, pos: 200, aim: 0, t: 0, ai: 1, aiT: 0, msg: '',
  start(mode) { HX.close(); this.mode = mode || this.mode; this.rolls = [[], []]; this.cur = 0; this.setPins(true); this.newBall(); UI.sheet(); UI.hud(); },
  setPins(all) { if (all) this.pins = PINPOS.map(([x, y, n]) => ({ x, y, x0: x, y0: y, vx: 0, vy: 0, n, down: false, gone: false })); else { this.pins = this.pins.filter(p => !p.down).map(p => ({ ...p, x: p.x0, y: p.y0, vx: 0, vy: 0 })); } },
  newBall() { this.ball = null; this.pos = 200; this.aim = 0; this.state = 'ready'; if (this.isAI()) this.aiT = 1.1; },
  isAI() { return this.mode === 'ai' && this.cur === 1; },
  throw(x, angle, speed, spin) { if (this.state !== 'ready') return; this.ball = { x: HX.clamp(x, LX0 + BR, LX1 - BR), y: FOUL + 20, vx: Math.sin(angle) * speed, vy: -Math.cos(angle) * speed, spin, done: false, gutter: false }; this.standing = this.pins.filter(p => !p.down).length; this.state = 'roll'; this.t = 0; HX.sfx('shot'); },
  step(dt) {
    if (this.state === 'ready' && this.isAI()) { this.aiT -= dt; if (this.aiT <= 0) this.aiThrow(); }
    if (this.state !== 'roll') return; this.t += dt; for (let i = 0; i < 6; i++) Phys.step(this, dt / 6);
    if ((Phys.settled(this) && this.ball.done) || this.t > 9) this.finishRoll();
  },
  aiThrow() { const err = [26, 14, 6][this.ai], pocket = 200 + 8; const sp = 560 + Math.random() * 60; const x = 200 + (Math.random() - .5) * err * .6; const tgtX = pocket + (Math.random() - .5) * err * 2;
    // mira nos pinos restantes se poucos estão de pé
    const st = this.pins.filter(p => !p.down); const tx = st.length && st.length < 6 ? st.reduce((a, p) => a + p.x, 0) / st.length + (Math.random() - .5) * err : tgtX; const ang = Math.atan2(tx - x, FOUL + 20 - 150); this.throw(x, ang, sp, 0); },
  finishRoll() {
    const knocked = this.pins.filter(p => p.down).length - (10 - this.standing); const R = this.rolls[this.cur]; R.push(Math.max(0, knocked)); HX.sfx(knocked === this.standing && knocked > 0 ? 'win' : 'coin');
    const st = Score.state(R); const msg = knocked === 10 && this.standing === 10 ? 'STRIKE!' : knocked === this.standing && knocked ? 'SPARE!' : knocked === 0 ? (this.ball.gutter ? 'Canaleta' : 'Nenhum pino') : `${knocked} pino${knocked > 1 ? 's' : ''}`; this.msg = msg; HX.toast(msg, 900);
    UI.sheet(); UI.hud();
    const done = !st; if (done) { if (this.mode === 'ai' && this.cur === 0) { this.cur = 1; this.setPins(true); return setTimeout(() => this.newBall(), 800); } return setTimeout(() => this.end(), 900); }
    // troca de jogador ao fim do quadro (modo IA)
    const prevSt = Score.state(R.slice(0, -1)); const frameEnded = st.ball === 0;
    if (this.mode === 'ai' && frameEnded && this.cur === 0 && Score.state(this.rolls[1])) { this.cur = 1; this.setPins(true); }
    else if (this.mode === 'ai' && frameEnded && this.cur === 1 && Score.state(this.rolls[0])) { this.cur = 0; this.setPins(true); }
    else this.setPins(st.reset);
    this.state = 'wait'; setTimeout(() => this.newBall(), 700); UI.sheet();
  },
  end() {
    this.state = 'over'; const me = Score.calc(this.rolls[0]).total, ai = this.mode === 'ai' ? Score.calc(this.rolls[1]).total : null; const rec = HXA.best(S, 'best', me);
    const st = S.get('stats', { games: 0, strikes: 0 }); st.games++; st.strikes += this.rolls[0].filter((v, i, a) => v === 10).length; S.set('stats', st); S.hub(`Recorde ${S.get('best', 0)} · ${st.games} partidas`);
    HX.sfx(ai === null || me >= ai ? 'win' : 'lose');
    HXA.menu({ title: ai === null ? `${me} pontos` : me > ai ? 'Você venceu!' : me === ai ? 'Empate' : 'A IA venceu', text: ai === null ? (rec ? 'Novo recorde!' : `Recorde: ${S.get('best', 0)}`) : `Você ${me} × ${ai} IA`, stats: [[me, 'Seus pontos'], [S.get('best', 0), 'Recorde']], primary: ['Nova partida', () => this.start()], buttons: [['Menu', () => UI.home()]] });
  }
};
const St = HXA.stage(VW, VH);
const View = {
  draw() {
    const g = St.begin(), G = Game; g.fillStyle = '#0e0b08'; g.fillRect(0, 0, VW, VH);
    g.fillStyle = '#1b1712'; g.fillRect(LX0 - 22, 0, LX1 - LX0 + 44, VH); g.fillStyle = '#0a0806'; g.fillRect(LX0 - 18, 0, 16, VH); g.fillRect(LX1 + 2, 0, 16, VH);
    const lane = g.createLinearGradient(LX0, 0, LX1, 0); lane.addColorStop(0, '#b98a52'); lane.addColorStop(.5, '#d8aa6c'); lane.addColorStop(1, '#b98a52'); g.fillStyle = lane; g.fillRect(LX0, 0, LX1 - LX0, VH);
    g.strokeStyle = 'rgba(90,60,30,.25)'; g.lineWidth = 1; for (let x = LX0 + 8; x < LX1; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, VH); g.stroke(); }
    g.fillStyle = '#5a3a1c'; for (let i = 0; i < 7; i++) { const x = LX0 + 20 + i * 20; g.beginPath(); g.moveTo(x, 380); g.lineTo(x - 5, 392); g.lineTo(x + 5, 392); g.fill(); }
    g.strokeStyle = '#e5484d'; g.lineWidth = 2; g.beginPath(); g.moveTo(LX0, FOUL); g.lineTo(LX1, FOUL); g.stroke(); g.fillStyle = '#1a1208'; g.fillRect(LX0 - 22, 0, LX1 - LX0 + 44, 34);
    for (const p of G.pins) { if (p.gone) continue; if (p.down) { g.fillStyle = 'rgba(244,239,226,.55)'; g.beginPath(); g.ellipse(p.x, p.y, PR + 3, PR - 2, Math.atan2(p.vy, p.vx), 0, 7); g.fill(); continue; }
      g.fillStyle = '#f4efe2'; g.beginPath(); g.arc(p.x, p.y, PR, 0, 7); g.fill(); g.strokeStyle = '#e5484d'; g.lineWidth = 2; g.beginPath(); g.arc(p.x, p.y, PR - 3, 0, 7); g.stroke(); }
    const b = G.ball; const bx = b ? b.x : G.pos, by = b ? b.y : FOUL + 30;
    if (G.state === 'ready' && !G.isAI()) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([4, 6]); g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.sin(G.aim) * 420, by - Math.cos(G.aim) * 420); g.stroke(); g.setLineDash([]);
      if (UI.charge) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(LX1 + 30, 380, 14, 160); g.fillStyle = '#e0b14a'; g.fillRect(LX1 + 30, 540 - 160 * UI.charge, 14, 160 * UI.charge); } }
    if (!(b && b.done)) { g.fillStyle = '#2a2f6a'; g.beginPath(); g.arc(bx, by, BR, 0, 7); g.fill(); g.fillStyle = '#c9a45c'; g.beginPath(); g.arc(bx - 3, by - 4, 2, 0, 7); g.arc(bx + 3, by - 4, 2, 0, 7); g.arc(bx, by + 1, 2, 0, 7); g.fill(); }
    if (UI.path.length > 1) { g.strokeStyle = 'rgba(241,220,166,.6)'; g.lineWidth = 3; g.beginPath(); UI.path.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.stroke(); }
    const fr = Score.state(G.rolls[G.cur]); g.fillStyle = '#f1dca6'; g.font = '700 13px Manrope'; g.textAlign = 'left'; g.fillText(G.mode === 'ai' ? (G.cur ? 'Vez da IA' : 'Sua vez') : '', 10, 56); if (fr) { g.fillText(`Quadro ${fr.f + 1} · bola ${fr.ball + 1}`, 10, 74); }
    // mapa de pinos
    for (const [x, y, n] of PINPOS) { const p = G.pins.find(q => q.n === n); const up = p && !p.down; g.fillStyle = up ? '#f4efe2' : 'rgba(255,255,255,.15)'; g.beginPath(); g.arc(340 + (x - 200) * .5, 90 + (y - 150) * .5, 4, 0, 7); g.fill(); }
  }
};
const UI = {
  path: [], charge: 0, drag: null,
  init() {
    St.cv.addEventListener('pointerdown', e => { e.preventDefault(); if (Game.state !== 'ready' || Game.isAI() || HX.isOpen()) return; const [x, y] = St.toL(e); St.cv.setPointerCapture(e.pointerId); this.drag = { mode: y > FOUL - 10 && Math.abs(x - Game.pos) < 40 ? 'pick' : 'none', x0: x, y0: y }; this.path = [{ x, y, t: performance.now() }]; });
    St.cv.addEventListener('pointermove', e => { if (!this.drag) return; const [x, y] = St.toL(e); this.path.push({ x, y, t: performance.now() }); if (this.path.length > 40) this.path.shift();
      if (this.drag.mode === 'pick' && y > FOUL - 30 && this.drag.y0 - y < 25) Game.pos = HX.clamp(x, LX0 + BR, LX1 - BR); });
    St.cv.addEventListener('pointerup', e => { if (!this.drag) return; const P = this.path; this.drag = null; if (P.length < 3) { this.path = []; return; } const a = P[Math.max(0, P.length - 8)], z = P[P.length - 1], dy = a.y - z.y, dt = Math.max(16, z.t - a.t);
      if (dy > 40) { const dx = z.x - a.x, sp = HX.clamp(Math.hypot(dx, dy) / dt * 1000 * .55, 260, 720), ang = HX.clamp(Math.atan2(dx, dy), -.35, .35); const mid = P[Math.floor(P.length / 2)], lin = a.x + (z.x - a.x) * ((a.y - mid.y) / (a.y - z.y || 1)); const spin = HX.clamp((mid.x - lin) * -6, -260, 260); Game.throw(Game.pos, ang, sp, spin); }
      setTimeout(() => { this.path = []; }, 300); });
    addEventListener('keydown', e => { if (Game.state !== 'ready' || Game.isAI() || HX.isOpen()) { if (e.key === 'p' || e.key === 'Escape') this.pause(); return; } if (e.key === 'ArrowLeft') Game.pos = Math.max(LX0 + BR, Game.pos - 4); if (e.key === 'ArrowRight') Game.pos = Math.min(LX1 - BR, Game.pos + 4); if (e.key === 'ArrowUp') Game.aim = Math.max(-.3, Game.aim - .01); if (e.key === 'ArrowDown') Game.aim = Math.min(.3, Game.aim + .01);
      if (e.key === 'a' || e.key === 'A') this.kspin = -180; if (e.key === 'd' || e.key === 'D') this.kspin = 180; if (e.key === 's' || e.key === 'S') this.kspin = 0;
      if (e.key === ' ' && !e.repeat) { e.preventDefault(); this.chargeT = performance.now(); } if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    addEventListener('keyup', e => { if (e.key === ' ' && this.chargeT) { const c = this.charge; this.chargeT = 0; this.charge = 0; Game.throw(Game.pos, Game.aim, 260 + c * 460, this.kspin || 0); } });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { if (this.chargeT) this.charge = Math.min(1, (performance.now() - this.chargeT) / 1200); Game.step(dt); View.draw(); });
    this.home();
  },
  sheet() { const render = (el, rolls) => { const sc = Score.calc(rolls), st = Score.state(rolls); el.innerHTML = sc.frames.map((f, i) => `<div class="f${st && st.f === i ? ' cur' : ''}"><div class="r">${(f.last ? [0, 1, 2] : [0, 1]).map(k => `<span>${Score.sym(f, k)}</span>`).join('')}</div><div class="t">${f.total ?? ''}</div></div>`).join(''); };
    render(HX.$('#sheet'), Game.rolls[0]); const two = Game.mode === 'ai'; HX.$('#sheet2').hidden = !two; HX.$('#who2').hidden = !two; HX.$('#who1').textContent = two ? 'Você' : 'Placar'; if (two) render(HX.$('#sheet2'), Game.rolls[1]); },
  hud() { const st = Score.state(Game.rolls[0]); HX.$('#frame').textContent = st ? st.f + 1 : 10; HX.$('#tot').textContent = Score.calc(Game.rolls[0]).total; HX.$('#best').textContent = S.get('best', 0); },
  help: ['Arraste a bola na parte de baixo da pista para escolher a posição. Depois deslize o dedo para cima: a direção do gesto mira, a velocidade dá a força e uma curva no gesto aplica efeito (gancho).', 'PC: ← → posicionam, ↑ ↓ ajustam a mira, A/D/S escolhem efeito para a esquerda/direita/nenhum, e segure espaço para carregar a força (solte para lançar).', 'Pontuação oficial: strike (X) vale 10 + as próximas duas bolas; spare (/) vale 10 + a próxima bola. No 10º quadro, strike ou spare dão bolas extras. Máximo: 300.', 'Mirar levemente fora do pino central (o "bolso") derruba mais pinos.'],
  home() { const st = S.get('stats', { games: 0, strikes: 0 }); HXA.menu({ title: 'Bowling', text: 'Dez pinos, dez quadros.', stats: [[S.get('best', 0), 'Recorde'], [st.games, 'Partidas'], [st.strikes, 'Strikes']], primary: ['Jogar solo', () => Game.start('solo')], buttons: [['Contra a IA', () => Game.start('ai')]], help: this.help }); },
  pause() { if (Game.state === 'idle' || Game.state === 'over') return this.home(); HXA.menu({ title: 'Pausa', primary: ['Continuar', () => {}], buttons: [['Nova partida', () => Game.start()], ['Menu', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.BW = { Game, UI, S, Score };

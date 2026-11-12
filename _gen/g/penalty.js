/*@ {"name":"Penalty","t1":"Pen","t2":"alty","theme":"#060a07","bg2":"radial-gradient(ellipse at 50% 0%,#12281a 0%,#060a07 66%)",
"hud":[["Placar","score","0 × 0"],["Cobrança","kick","1/5"],["Fase","fase","Amistoso"]]} @*/
/* H-LUX PENALTY v1.0 — disputa de pênaltis alternando cobrança e defesa contra a IA.
   Cobrar: deslize do pé da bola em direção ao gol — o fim do gesto escolhe o canto, a velocidade dá a força
   (forte demais tira precisão e pode ir por cima). Defender: depois da corrida do batedor, toque no ponto do gol para pular.
   5 cobranças para cada lado; empate → morte súbita. Torneio: quartas, semifinal e final com goleiros/batedores mais difíceis.
   Módulos: TEAMS · Game · View · UI */
const S = HX.store('penalty');
const VW = 400, VH = 560, GX0 = 50, GX1 = 350, GY0 = 150, GY1 = 330, SPOT = [200, 500];
const TEAMS = [{ n: 'Leões', lvl: 0, c: '#3d8bff' }, { n: 'Falcões', lvl: 1, c: '#e5484d' }, { n: 'Dragões', lvl: 2, c: '#7b4bd6' }];
const STAGES = ['Quartas de final', 'Semifinal', 'Final'];
const Game = {
  state: 'idle', mode: 'friendly', lvl: 1, round: 0, kicks: [[], []], turn: 0, ball: null, keeper: null, kicker: 0, msg: '', t: 0, stageI: 0, fx: [],
  start(mode, lvl) { HX.close(); this.mode = mode; this.lvl = lvl; this.stageI = 0; this.match(); },
  match() { if (this.mode === 'tour') this.lvl = TEAMS[this.stageI].lvl; this.kicks = [[], []]; this.turn = 0; this.next(); UI.hud(); },
  opp() { return this.mode === 'tour' ? TEAMS[this.stageI] : { n: 'IA', c: '#e5484d' }; },
  next() {
    this.ball = { x: SPOT[0], y: SPOT[1], z: 0, tx: 0, ty: 0, t: 0, dur: 0, flying: false }; this.keeper = { x: 200, y: GY1 - 45, tx: 200, ty: GY1 - 45, t: 0, dive: false };
    this.fx = []; this.t = 0; this.state = this.turn === 0 ? 'shoot' : 'defend'; this.kicker = 0; this.msg = this.turn === 0 ? 'Sua cobrança: deslize em direção ao gol' : 'Defenda! Toque no canto para pular'; UI.hud();
    if (this.turn === 1) this.runUp = .9 + Math.random() * .5;
  },
  /* chute: alvo no plano do gol + velocidade (0..1) */
  kick(tx, ty, pow, byAI) {
    const err = (byAI ? [.10, .07, .05][this.lvl] : 0) + Math.max(0, pow - .75) * .5; tx += (Math.random() - .5) * 300 * err; ty += (Math.random() - .5) * 200 * err - (pow > .9 ? (pow - .9) * 260 : 0);
    const dur = .85 - pow * .45; Object.assign(this.ball, { tx, ty, t: 0, dur, flying: true, sx: this.ball.x, sy: this.ball.y }); this.state = 'fly'; HX.sfx('shot');
    if (!byAI) this.aiKeeper(tx, ty, dur);
  },
  aiKeeper(tx, ty, dur) { const K = this.keeper, guess = [.18, .28, .4][this.lvl]; const react = [.32, .24, .17][this.lvl];
    let dx, dy; if (Math.random() < guess) { dx = tx + (Math.random() - .5) * 60; dy = ty + (Math.random() - .5) * 40; } else { const z = Math.floor(Math.random() * 3); dx = [90, 200, 310][z]; dy = GY0 + 40 + Math.random() * 120; }
    setTimeout(() => this.dive(dx, dy), Math.max(0, (dur - react) * 1000 * Math.random() * .6)); },
  dive(x, y) { const K = this.keeper; if (K.dive) return; K.dive = true; K.tx = HX.clamp(x, GX0 + 10, GX1 - 10); K.ty = HX.clamp(y, GY0 + 15, GY1 - 20); K.t = 0; },
  step(dt) {
    this.t += dt; this.fx = this.fx.filter(e => (e.t -= dt) > 0); const K = this.keeper; if (!K) return;
    if (K.dive) { const dx = K.tx - K.x, dy = K.ty - K.y, d = Math.hypot(dx, dy), stp = Math.min(d, 600 * dt); if (d > 0) { K.x += dx / d * stp; K.y += dy / d * stp; } K.t = Math.min(1, K.t + dt / .3); }
    if (this.state === 'defend') { this.runUp -= dt; this.kicker = Math.min(1, this.t / 1.2); if (this.runUp <= 0) { const z = Math.random(); const tx = z < .4 ? 75 + Math.random() * 60 : z < .8 ? 265 + Math.random() * 60 : 150 + Math.random() * 100; const ty = GY0 + 25 + Math.random() * 140; this.kick(tx, ty, .55 + Math.random() * .35 + this.lvl * .05, true); } }
    if (this.state !== 'fly') return; const B = this.ball; B.t += dt; const u = Math.min(1, B.t / B.dur); B.x = B.sx + (B.tx - B.sx) * u; B.y = B.sy + (B.ty - B.sy) * u - Math.sin(u * Math.PI) * 30; B.z = u;
    if (u >= 1) this.resolve();
  },
  resolve() {
    const B = this.ball, K = this.keeper; const inGoal = B.tx > GX0 + 6 && B.tx < GX1 - 6 && B.ty > GY0 + 6 && B.ty < GY1; const post = !inGoal && (Math.abs(B.tx - GX0) < 8 || Math.abs(B.tx - GX1) < 8 || Math.abs(B.ty - GY0) < 8) && B.ty < GY1 + 4;
    const reach = K.dive ? 40 : 34; const saved = inGoal && Math.hypot(B.tx - K.x, B.ty - (K.y - 12)) < reach;
    const goal = inGoal && !saved; const who = this.turn; this.kicks[who].push(goal ? 1 : 0);
    this.msg = goal ? 'GOL!' : saved ? 'Defendeu!' : post ? 'Na trave!' : 'Para fora!'; this.fx.push({ s: this.msg, t: 1.2, c: goal === (who === 0) ? '#3ddc84' : '#e5484d' }); HX.sfx(goal === (who === 0) ? 'win' : 'lose'); HX.vibrate(goal ? 30 : 15);
    this.state = 'result'; UI.hud(); setTimeout(() => this.after(), 1300);
  },
  decided() { const [a, b] = this.kicks, n = Math.max(a.length, b.length), ga = a.reduce((x, y) => x + y, 0), gb = b.reduce((x, y) => x + y, 0);
    if (n <= 5 && !(a.length === 5 && b.length === 5)) { const ra = 5 - a.length, rb = 5 - b.length; if (ga > gb + rb) return 0; if (gb > ga + ra) return 1; return -1; }
    if (a.length === b.length && ga !== gb) return ga > gb ? 0 : 1; return -1; },
  after() { if (this.state !== 'result') return; const w = this.decided(); if (w >= 0) return this.matchEnd(w); this.turn = 1 - this.turn; this.next(); },
  matchEnd(w) {
    this.state = 'over'; const [a, b] = this.kicks.map(k => k.reduce((x, y) => x + y, 0)); const st = S.get('stats', { w: 0, l: 0, cups: 0 }); if (w === 0) st.w++; else st.l++;
    if (this.mode === 'tour' && w === 0 && this.stageI === 2) { st.cups++; } S.set('stats', st); S.hub(`${st.w} vitórias · ${st.cups} taças`);
    if (this.mode === 'tour' && w === 0 && this.stageI < 2) { return HXA.menu({ title: `Classificado! ${a} × ${b}`, text: `Próxima fase: ${STAGES[this.stageI + 1]} contra ${TEAMS[this.stageI + 1].n}`, primary: ['Continuar torneio', () => { HX.close(); this.stageI++; this.match(); }], buttons: [['Menu', () => UI.home()]] }); }
    HXA.menu({ title: w === 0 ? (this.mode === 'tour' ? 'CAMPEÃO! 🏆' : 'Vitória!') : 'Derrota', text: `Placar ${a} × ${b}${this.mode === 'tour' ? ' · ' + STAGES[this.stageI] : ''}`, stats: [[st.w, 'Vitórias'], [st.cups, 'Taças']], primary: ['Jogar de novo', () => this.start(this.mode, this.lvl)], buttons: [['Menu', () => UI.home()]] });
  }
};
const St = HXA.stage(VW, VH);
const View = {
  draw() {
    const g = St.begin(), G = Game; const sky = g.createLinearGradient(0, 0, 0, 200); sky.addColorStop(0, '#0c1424'); sky.addColorStop(1, '#1d2a3c'); g.fillStyle = sky; g.fillRect(0, 0, VW, 200);
    g.fillStyle = '#20202a'; g.fillRect(0, 60, VW, 110); for (let i = 0; i < 60; i++) { g.fillStyle = ['#e5484d', '#3d8bff', '#e0b14a', '#eee'][i % 4]; g.globalAlpha = .35; g.fillRect((i * 37) % VW, 70 + (i * 13) % 90, 4, 5); } g.globalAlpha = 1;
    const grass = g.createLinearGradient(0, 170, 0, VH); grass.addColorStop(0, '#2a8a4a'); grass.addColorStop(1, '#1d6a36'); g.fillStyle = grass; g.fillRect(0, 170, VW, VH - 170);
    g.fillStyle = 'rgba(255,255,255,.05)'; for (let y = 170; y < VH; y += 50) g.fillRect(0, y, VW, 25);
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(10, GY1 + 2); g.lineTo(VW - 10, GY1 + 2); g.moveTo(20, GY1 + 2); g.lineTo(0, 420); g.moveTo(VW - 20, GY1 + 2); g.lineTo(VW, 420); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(SPOT[0], SPOT[1] + 8, 6, 2, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; for (let x = GX0; x <= GX1; x += 14) { g.beginPath(); g.moveTo(x, GY0); g.lineTo(x + (x - 200) * .06, GY1); g.stroke(); } for (let y = GY0; y <= GY1; y += 14) { g.beginPath(); g.moveTo(GX0, y); g.lineTo(GX1, y); g.stroke(); }
    g.strokeStyle = '#f4efe2'; g.lineWidth = 7; g.beginPath(); g.moveTo(GX0, GY1); g.lineTo(GX0, GY0); g.lineTo(GX1, GY0); g.lineTo(GX1, GY1); g.stroke();
    const K = G.keeper; if (K) { const opp = G.opp(); const col = G.turn === 0 ? opp.c : '#e0b14a'; const ang = K.dive ? HX.clamp((K.x - 200) / 140, -1.2, 1.2) * K.t : 0; g.save(); g.translate(K.x, K.y); g.rotate(ang);
      g.fillStyle = col; g.fillRect(-14, -30, 28, 40); g.fillStyle = '#f1c27d'; g.beginPath(); g.arc(0, -40, 10, 0, 7); g.fill(); g.strokeStyle = col; g.lineWidth = 7; g.lineCap = 'round'; const up = K.dive ? 1 : .3; g.beginPath(); g.moveTo(-12, -24); g.lineTo(-30, -24 - 26 * up); g.moveTo(12, -24); g.lineTo(30, -24 - 26 * up); g.stroke(); g.fillStyle = '#ffd54a'; g.beginPath(); g.arc(-30, -24 - 26 * up, 6, 0, 7); g.arc(30, -24 - 26 * up, 6, 0, 7); g.fill();
      g.strokeStyle = '#222'; g.beginPath(); g.moveTo(-7, 10); g.lineTo(-10, 36); g.moveTo(7, 10); g.lineTo(10, 36); g.stroke(); g.lineCap = 'butt'; g.restore(); }
    if (G.state === 'defend' || G.state === 'shoot') { const k = G.state === 'defend' ? G.kicker : 0; const kx = 150 + k * 40, ky = 540 - k * 30; g.fillStyle = G.turn === 1 ? G.opp().c : '#e0b14a'; g.fillRect(kx - 10, ky - 50, 20, 34); g.fillStyle = '#f1c27d'; g.beginPath(); g.arc(kx, ky - 58, 8, 0, 7); g.fill(); }
    const B = G.ball; if (B) { const r = 13 - B.z * 7; g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(B.x, (B.flying ? SPOT[1] + (B.ty - SPOT[1]) * B.z : B.y) + r * .8 + 4, r, r * .3, 0, 0, 7); g.fill(); g.fillStyle = '#fafafa'; g.beginPath(); g.arc(B.x, B.y, r, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(B.x, B.y, r * .35, 0, 7); g.fill(); }
    if (UI.sw && G.state === 'shoot') { g.strokeStyle = 'rgba(241,220,166,.8)'; g.lineWidth = 4; g.beginPath(); UI.sw.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); }
    // placar de cobranças
    for (let s = 0; s < 2; s++) { const ks = G.kicks[s], n = Math.max(5, ks.length); for (let i = 0; i < n; i++) { g.fillStyle = ks[i] === undefined ? 'rgba(255,255,255,.15)' : ks[i] ? '#3ddc84' : '#e5484d'; g.beginPath(); g.arc(20 + i * 18, 18 + s * 20, 6, 0, 7); g.fill(); } g.fillStyle = '#f1dca6'; g.font = '700 11px Manrope'; g.textAlign = 'left'; g.fillText(s ? G.opp().n : 'Você', 24 + n * 18, 22 + s * 20); }
    g.fillStyle = '#f1dca6'; g.font = '700 14px Manrope'; g.textAlign = 'center'; if (G.state === 'shoot' || G.state === 'defend') g.fillText(G.msg, VW / 2, 135);
    for (const e of G.fx) { g.globalAlpha = Math.min(1, e.t * 2); g.fillStyle = e.c; g.font = '800 40px Manrope'; g.fillText(e.s, VW / 2, 420); g.globalAlpha = 1; }
  }
};
const UI = {
  sw: null,
  init() {
    St.cv.addEventListener('pointerdown', e => { e.preventDefault(); if (HX.isOpen()) return; const [x, y] = St.toL(e);
      if (Game.state === 'defend' || (Game.state === 'fly' && Game.turn === 1)) { Game.dive(x, y); return; }
      if (Game.state === 'shoot') { St.cv.setPointerCapture(e.pointerId); this.sw = [[x, y, performance.now()]]; } });
    St.cv.addEventListener('pointermove', e => { if (!this.sw) return; const [x, y] = St.toL(e); this.sw.push([x, y, performance.now()]); });
    St.cv.addEventListener('pointerup', () => { const s = this.sw; this.sw = null; if (!s || s.length < 2 || Game.state !== 'shoot') return; const a = s[0], z = s[s.length - 1]; const dy = a[1] - z[1]; if (dy < 40) return HX.toast('Deslize para cima, em direção ao gol', 900);
      // alvo: onde o gesto termina (projetado para a linha do gol se parar antes)
      const k = (a[1] - (GY0 + GY1) / 2) / dy, tx = z[1] > GY1 ? a[0] + (z[0] - a[0]) * Math.min(3, k) : z[0], ty = z[1] > GY1 ? GY1 - 40 : z[1];
      const dt = Math.max(30, z[2] - a[2]), pow = HX.clamp(Math.hypot(z[0] - a[0], dy) / dt / 2.2, .2, 1); Game.kick(tx, ty, pow, false); });
    addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { if (Game.state !== 'pause') Game.step(dt); View.draw(); });
    this.home();
  },
  hud() { const [a, b] = Game.kicks.map(k => k.reduce((x, y) => x + y, 0)); HX.$('#score').textContent = `${a} × ${b}`; const n = Math.max(Game.kicks[0].length, Game.kicks[1].length) + (Game.turn === 0 && Game.state === 'shoot' ? 1 : 0); HX.$('#kick').textContent = n <= 5 ? `${Math.min(5, Math.max(1, Game.kicks[Game.turn].length + 1))}/5` : 'Morte súbita'; HX.$("#fase").textContent = Game.mode === 'tour' ? STAGES[Game.stageI] : 'Amistoso'; },
  help: ['Cobrança: deslize o dedo de baixo para cima em direção ao gol. O ponto onde o gesto termina é o alvo; deslizar mais rápido chuta mais forte (o goleiro tem menos tempo), mas força demais tira a precisão e pode mandar por cima.', 'Defesa: o batedor corre e chuta. Toque no ponto do gol para onde quer pular — dá para arriscar antes do chute ou reagir durante o voo da bola.', 'São 5 cobranças para cada lado, alternadas; se empatar, morte súbita. A disputa acaba antes quando um lado não pode mais alcançar o outro.', 'Torneio: quartas, semifinal e final, cada fase com adversários melhores. No PC, use o mouse do mesmo jeito.'],
  home() { const st = S.get('stats', { w: 0, l: 0, cups: 0 });
    HXA.menu({ title: 'Penalty', text: 'Disputa de pênaltis.', stats: [[st.w, 'Vitórias'], [st.l, 'Derrotas'], [st.cups, 'Taças']], html: `<div class="seg" id="lv">${['Fácil', 'Médio', 'Difícil'].map((n, i) => `<button data-v="${i}" class="${i === (this.lv ?? 1) ? 'on' : ''}">${n}</button>`).join('')}</div>`,
      primary: ['Torneio', () => Game.start('tour', 0)], buttons: [['Amistoso', () => Game.start('friendly', this.lv ?? 1)]], help: this.help });
    document.querySelectorAll('#lv [data-v]').forEach(b => b.onclick = () => { this.lv = +b.dataset.v; document.querySelectorAll('#lv button').forEach(x => x.classList.toggle('on', x === b)); }); },
  pause() { if (Game.state === 'idle' || Game.state === 'over') return this.home(); const prev = Game.state; Game.state = 'pause'; HXA.menu({ title: 'Pausa', primary: ['Continuar', () => { Game.state = prev; if (prev === 'result') Game.after(); }], buttons: [['Recomeçar', () => Game.start(Game.mode, Game.lvl)], ['Menu', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.PN = { Game, UI, S };

/*@ {"name":"Dash","t1":"Da","t2":"sh","theme":"#07060c","bg2":"radial-gradient(ellipse at 50% 0%,#221a36 0%,#07060c 66%)","libs":["arcade.js","music.js"],
"hud":[["Fase","lvl","1"],["Progresso","prog","0%"],["Tentativas","att","1"]]} @*/
/* H-LUX DASH v1.0 — plataforma rítmica: o cubo corre sozinho no ritmo de uma trilha original.
   Toque (ou segure) para pular. Obstáculos caem nas batidas da música: pular na batida resolve.
   3 fases (120, 132 e 148 BPM), modo prática com pontos de controle, melhor % por fase.
   Música 100% original, sintetizada no aparelho (shared/music.js), com volume e opção de desligar.
   Módulos: LEVELS · Build · Game · View · UI */
const S = HX.store('dash');
const VW = 400, VH = 640, Z = .72, GY = 560, CS = 30, GRAV = 2600, JV = 760, PADV = 1060;
const LEVELS = [
  { n: 'Aurora', bpm: 120, bars: 24, seed: 11, root: 57, scale: 'minor', prog: [0, 5, 3, 4], sp: 300, hard: 0, c: '#c9a45c' },
  { n: 'Neon Dourado', bpm: 132, bars: 30, seed: 29, root: 60, scale: 'dorian', prog: [0, 3, 4, 2], sp: 330, hard: 1, c: '#3ddc84' },
  { n: 'Eclipse', bpm: 148, bars: 34, seed: 53, root: 55, scale: 'minor', prog: [0, 6, 5, 4], sp: 365, hard: 2, c: '#e5484d' }
];
/* gera a fase a partir da mesma semente da música: obstáculos ficam exatamente sobre batidas */
const Build = {
  level(L) {
    const R = HX.rng(L.seed * 7 + 3), beatT = 60 / L.bpm, ppb = L.sp * beatT, air = 2 * JV / GRAV * L.sp; const ob = [], pits = [];
    const pats = ['spike', 'spike', 'spike2', 'block', 'pit', 'pad'].concat(L.hard >= 1 ? ['spike2', 'stairs', 'pit'] : []).concat(L.hard >= 2 ? ['spike3', 'stairs', 'pad'] : []);
    let b = 8; const end = L.bars * 4 - 4;
    while (b < end - 4) {
      const x0 = b * ppb, p = pats[Math.floor(R() * pats.length)]; let used = 2;
      if (p === 'spike') ob.push({ k: 'spike', x: x0 + air / 2 - CS / 2 });
      else if (p === 'spike2') { ob.push({ k: 'spike', x: x0 + air / 2 - CS }); ob.push({ k: 'spike', x: x0 + air / 2 }); }
      else if (p === 'spike3') { [-1.5, -.5, .5].forEach(o => ob.push({ k: 'spike', x: x0 + air / 2 + o * CS })); used = 3; }
      else if (p === 'block') { const w = ppb * 2; ob.push({ k: 'block', x: x0 + air * .45, w, h: 40 }); if (L.hard && R() < .5) ob.push({ k: 'spike', x: x0 + air * .45 + w + ppb * .4 }); used = 4; }
      else if (p === 'stairs') { ob.push({ k: 'block', x: x0 + air * .45, w: ppb * 1.2, h: 40 }); ob.push({ k: 'block', x: x0 + air * .45 + ppb * 1.9, w: ppb * 1.2, h: 80 }); used = 5; }
      else if (p === 'pit') { const w = Math.min(air * .6, 70 + L.hard * 15); pits.push([x0 + air / 2 - w / 2, x0 + air / 2 + w / 2]); }
      else if (p === 'pad') { ob.push({ k: 'pad', x: x0 }); const s0 = x0 + 50, s1 = x0 + 2 * PADV / GRAV * L.sp * .8; for (let x = s0; x < s1; x += CS) ob.push({ k: 'spike', x }); used = 4; }
      b += used + (R() < .6 - L.hard * .15 ? 2 : 1);
    }
    return { ob, pits, len: L.bars * 4 * ppb, ppb, beatT };
  }
};
const Game = {
  state: 'idle', li: 0, L: null, lv: null, p: null, t: 0, att: 1, practice: false, ck: 0, song: null, parts: [], hold: false, flash: 0,
  start(li, practice) {
    HX.close(); this.li = li; this.L = LEVELS[li]; this.lv = Build.level(this.L); this.practice = !!practice; this.ck = 0; this.att = 1;
    this.song = HXM.song({ bpm: this.L.bpm, bars: this.L.bars, seed: this.L.seed, root: this.L.root, scale: this.L.scale, prog: this.L.prog }); this.spawn();
  },
  spawn() { const t0 = this.ck; this.t = t0; this.p = { x: t0 * this.L.sp, y: GY - this.groundAt(t0 * this.L.sp, true), vy: 0, rot: 0, ground: true }; this.parts = []; this.state = 'play'; this.song.start(t0); UI.hud(); },
  groundAt(x, spawn) { return 0; },
  inPit(x) { return this.lv.pits.some(([a, b]) => x + CS - 4 > a && x + 4 < b); },
  jump() { if (this.state !== 'play') return; this.hold = true; this.tryJump(); },
  tryJump() { const P = this.p; if (P.ground) { P.vy = -JV; P.ground = false; } },
  step(dt) {
    if (this.flash > 0) this.flash -= dt;
    if (this.state !== 'play') return; const P = this.p, L = this.L;
    this.t += dt; const now = this.song.now(); if (now >= 0 && Math.abs(now - this.t) > .04) this.t = now;
    const nx = this.t * L.sp; const prevB = P.y; P.x = nx;
    if (this.hold && (UI.held() || HXA.key(' ', 'ArrowUp', 'w'))) this.tryJump(); else this.hold = false;
    P.vy += GRAV * dt; P.y += P.vy * dt; P.ground = false;
    // chão
    if (!this.inPit(P.x) && P.y >= GY && prevB <= GY + 6) { P.y = GY; P.vy = 0; P.ground = true; }
    // obstáculos
    for (const o of this.lv.ob) { if (o.x > P.x + 60 || (o.x + (o.w || CS)) < P.x - 10) continue;
      if (o.k === 'spike') { if (P.x + CS - 8 > o.x + 8 && P.x + 8 < o.x + CS - 8 && P.y > GY - 20) return this.die(); }
      else if (o.k === 'pad') { if (P.x + CS > o.x && P.x < o.x + CS && P.y >= GY - 8 && !o.used) { P.vy = -PADV; P.ground = false; HX.sfx('power'); } }
      else if (o.k === 'block') { const top = GY - o.h; if (P.x + CS > o.x + 2 && P.x < o.x + o.w - 2) { if (prevB <= top + 8 && P.y >= top && P.vy >= 0) { P.y = top; P.vy = 0; P.ground = true; } else if (P.y > top + 6 && P.y - CS < GY) return this.die(); } } }
    if (P.y > GY + 260) return this.die();
    if (P.ground) P.rot = Math.round(P.rot / (Math.PI / 2)) * (Math.PI / 2); else P.rot += dt * 7.2;
    if (Math.random() < .5) this.parts.push({ x: P.x, y: P.y - 4, t: .35 }); this.parts = this.parts.filter(q => (q.t -= dt) > 0);
    if (this.practice) { const ckT = Math.floor(this.t / (this.lv.beatT * 32)) * this.lv.beatT * 32; if (ckT > this.ck && P.ground) { this.ck = ckT; HX.toast('Ponto de controle', 700); } }
    if (P.x >= this.lv.len) return this.win();
    UI.hud();
  },
  pct() { return Math.min(100, Math.floor(this.p.x / this.lv.len * 100)); },
  die() {
    this.state = 'dead'; this.song.stop(); this.flash = .35; HX.sfx('boom'); HX.vibrate(50); const pc = this.pct();
    if (!this.practice) HXA.best(S, 'best' + this.li, pc); const st = S.get('stats', { att: 0 }); st.att++; S.set('stats', st);
    for (let i = 0; i < 16; i++) this.parts.push({ x: this.p.x + 15, y: this.p.y - 15, vx: Math.cos(i) * 200, vy: Math.sin(i) * 200, t: .5 });
    setTimeout(() => { if (this.state === 'dead') { this.att++; this.spawn(); } }, 700); UI.hud(); this.hub();
  },
  win() {
    this.state = 'over'; this.song.stop(); HX.sfx('win'); if (!this.practice) { HXA.best(S, 'best' + this.li, 100); const d = S.get('done', []); if (!d.includes(this.li)) d.push(this.li); S.set('done', d); }
    this.hub(); setTimeout(() => HXA.menu({ title: this.practice ? 'Prática concluída!' : 'Fase completa!', text: `${this.L.n} em ${this.att} tentativa${this.att > 1 ? 's' : ''}.`, stats: [[this.att, 'Tentativas'], ['100%', 'Progresso']], primary: this.li < 2 && !this.practice ? ['Próxima fase', () => this.start(this.li + 1)] : ['Jogar de novo', () => this.start(this.li, this.practice)], buttons: [['Fases', () => UI.home()]] }), 500);
  },
  hub() { S.hub(`${S.get('done', []).length}/3 fases · melhor ${Math.max(...LEVELS.map((_, i) => S.get('best' + i, 0)))}%`); }
};
const St = HXA.stage(VW, VH);
const View = {
  draw() {
    const g = St.begin(), G = Game; g.fillStyle = '#0b0912'; g.fillRect(0, 0, VW, VH); if (!G.p) return; const L = G.L, P = G.p;
    const beatPh = G.state === 'play' ? (G.t / G.lv.beatT) % 1 : .9, pulse = Math.pow(1 - beatPh, 3);
    const sky = g.createLinearGradient(0, 0, 0, VH); sky.addColorStop(0, '#120d22'); sky.addColorStop(1, '#2b1d3d'); g.fillStyle = sky; g.fillRect(0, 0, VW, VH);
    g.globalAlpha = .08 + pulse * .12; g.fillStyle = L.c; g.fillRect(0, 0, VW, VH); g.globalAlpha = 1;
    g.fillStyle = 'rgba(201,164,92,.07)'; for (let i = 0; i < 9; i++) { const w = 140 + (i * 53) % 90, x = ((i * 170 - P.x * .2 * Z) % 1530 + 1530) % 1530 - 150, h = 120 + (i * 71) % 160; g.beginPath(); g.moveTo(x, VH * .78); g.lineTo(x + w / 2, VH * .78 - h - pulse * 10); g.lineTo(x + w, VH * .78); g.fill(); }
    const camX = P.x - 90; g.save(); g.scale(Z, Z); g.translate(-camX, -GY + VH / Z * .78);
    g.strokeStyle = 'rgba(201,164,92,.1)'; g.lineWidth = 2; const ppb = G.lv.ppb; for (let x = Math.floor(camX / ppb) * ppb; x < camX + VW / Z + ppb; x += ppb) { g.beginPath(); g.moveTo(x, GY - 400); g.lineTo(x, GY); g.stroke(); }
    g.fillStyle = '#1a1326'; g.fillRect(camX - 10, GY, VW / Z + 40, 400); g.fillStyle = L.c; g.fillRect(camX - 10, GY, VW / Z + 40, 4);
    g.fillStyle = '#05040a'; for (const [a, b] of G.lv.pits) if (b > camX && a < camX + VW / Z) g.fillRect(a, GY - 1, b - a, 402);
    for (const o of G.lv.ob) { if (o.x > camX + VW / Z + 40 || o.x + (o.w || CS) < camX - 40) continue;
      if (o.k === 'spike') { g.fillStyle = '#e8e2cf'; g.beginPath(); g.moveTo(o.x, GY); g.lineTo(o.x + CS / 2, GY - CS); g.lineTo(o.x + CS, GY); g.fill(); g.strokeStyle = L.c; g.lineWidth = 2; g.stroke(); }
      else if (o.k === 'block') { g.fillStyle = '#241a36'; g.fillRect(o.x, GY - o.h, o.w, o.h); g.strokeStyle = L.c; g.lineWidth = 3; g.strokeRect(o.x, GY - o.h, o.w, o.h); }
      else { g.fillStyle = '#ffd54a'; g.beginPath(); g.ellipse(o.x + CS / 2, GY - 3, CS / 2, 6 + pulse * 3, 0, Math.PI, 0); g.fill(); } }
    g.strokeStyle = '#3ddc84'; g.lineWidth = 3; g.beginPath(); g.moveTo(G.lv.len, GY - 300); g.lineTo(G.lv.len, GY); g.stroke();
    for (const q of G.parts) { g.globalAlpha = Math.min(1, q.t * 3); g.fillStyle = L.c; if (q.vx) { q.x += q.vx / 60; q.y += q.vy / 60; } g.fillRect(q.x, q.y, 6, 6); } g.globalAlpha = 1;
    if (G.state !== 'dead') { g.save(); g.translate(P.x + CS / 2, P.y - CS / 2); g.rotate(P.rot); g.fillStyle = '#e0b14a'; g.fillRect(-CS / 2, -CS / 2, CS, CS); g.strokeStyle = '#1a1408'; g.lineWidth = 3; g.strokeRect(-CS / 2 + 2, -CS / 2 + 2, CS - 4, CS - 4); g.fillStyle = '#1a1408'; g.fillRect(-7, -6, 5, 5); g.fillRect(3, -6, 5, 5); g.fillRect(-7, 4, 14, 3); g.restore(); }
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(20, 16, VW - 40, 6); g.fillStyle = L.c; g.fillRect(20, 16, (VW - 40) * G.pct() / 100, 6);
    if (G.practice) { g.fillStyle = '#3ddc84'; g.font = '700 12px Manrope'; g.textAlign = 'left'; g.fillText('PRÁTICA', 20, 40); }
    if (G.flash > 0) { g.globalAlpha = G.flash * 2; g.fillStyle = '#fff'; g.fillRect(0, 0, VW, VH); g.globalAlpha = 1; }
  }
};
const UI = {
  down: 0,
  init() {
    St.cv.addEventListener('pointerdown', e => { e.preventDefault(); this.down++; if (!HX.isOpen()) Game.jump(); });
    addEventListener('pointerup', () => { this.down = Math.max(0, this.down - 1); }); addEventListener('pointercancel', () => { this.down = 0; });
    addEventListener('keydown', e => { if ([' ', 'ArrowUp', 'w'].includes(e.key) && !e.repeat && !HX.isOpen()) { e.preventDefault(); Game.jump(); } if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { Game.step(dt); View.draw(); });
    HX.life({ onHide: () => { if (Game.state === 'play' || Game.state === 'dead') this.pause(); } }); this.home();
  },
  held() { return this.down > 0; },
  hud() { if (!Game.L) return; HX.$('#lvl').textContent = Game.li + 1; HX.$('#prog').textContent = Game.pct() + '%'; HX.$('#att').textContent = Game.att; },
  help: ['O cubo corre sozinho no ritmo da música. Toque na tela (ou espaço / seta para cima no PC) para pular. Segurando, ele pula de novo assim que toca o chão.', 'Espinhos e buracos matam; blocos podem ser usados como plataforma, mas bater de lado também mata. Almofadas amarelas lançam bem alto.', 'Os obstáculos ficam sobre as batidas: pular na batida costuma ser o momento certo.', 'Modo prática: salva pontos de controle a cada 8 compassos (não conta recorde). Complete uma fase para liberar a próxima. A música é original e pode ser ajustada ou desligada aqui.'],
  home() { const done = S.get('done', []);
    HXA.menu({ title: 'Dash', text: 'Escolha uma fase.', html: `<div class="levels">${LEVELS.map((L, i) => { const lock = i > 0 && !done.includes(i - 1); return `<button class="lvb${done.includes(i) ? ' done' : ''}" data-l="${i}" ${lock ? 'disabled' : ''} style="width:100%;margin:4px 0;display:flex;justify-content:space-between;padding:10px 14px"><span>${lock ? '🔒 ' : ''}${L.n} · ${L.bpm} BPM</span><b>${S.get('best' + i, 0)}%</b></button>`; }).join('')}</div><label style="display:flex;gap:8px;align-items:center;justify-content:center;font-size:13px;color:var(--muted)"><input type="checkbox" id="prac"> Modo prática</label>`,
      music: true, help: this.help });
    const c = document.querySelector('.hx-card'); c.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { const pr = c.querySelector('#prac').checked; HXM.ctx(); Game.start(+b.dataset.l, pr); }); },
  pause() { if (Game.state !== 'play' && Game.state !== 'dead') return Game.state === 'idle' || Game.state === 'over' ? this.home() : null; const wasDead = Game.state === 'dead'; Game.song.stop(); Game.state = 'pause';
    HXA.menu({ title: 'Pausa', text: `${Game.L.n} · ${Game.pct()}%`, music: true, primary: ['Continuar', () => { if (wasDead) { Game.att++; Game.spawn(); } else { Game.state = 'play'; Game.song.start(Game.t); } }], buttons: [['Recomeçar', () => { Game.att++; Game.spawn(); }], ['Fases', () => this.home()]] }); },
};
UI.init(); HX.sw();
window.DS = { Game, UI, S, LEVELS, Build };

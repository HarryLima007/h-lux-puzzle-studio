/*@ {"name":"Slice","t1":"Sli","t2":"ce","theme":"#0a0806","bg2":"radial-gradient(ellipse at 50% 0%,#2a1c10 0%,#0a0806 66%)",
"hud":[["Pontos","pts","0"],["Vidas","lives","3"],["Combo","combo","—"]]} @*/
/* H-LUX SLICE v1.0 — deslize o dedo para cortar as frutas lançadas; não corte as bombas.
   Modos: Clássico (3 vidas; deixar fruta cair tira vida; bomba encerra), Arcade (60 s; bomba −10; frutas especiais)
   e Zen (90 s, sem bombas). Cortar 3+ frutas num só gesto dá bônus de combo. Módulos: FRUITS · Game · View · UI */
const S = HX.store('slice');
const VW = 400, VH = 640, G0 = 520;
const FRUITS = [
  { n: 'melancia', r: 30, out: '#2f7a3a', in: '#e5484d', seed: '#111', pts: 1 }, { n: 'laranja', r: 22, out: '#ff9a2e', in: '#ffc06a', pts: 1 }, { n: 'maçã', r: 21, out: '#c8282d', in: '#f4ecd0', pts: 1 },
  { n: 'kiwi', r: 19, out: '#7a5a30', in: '#7ccf4a', seed: '#111', pts: 1 }, { n: 'limão', r: 18, out: '#e8e23a', in: '#f6f2a0', pts: 1 }, { n: 'coco', r: 24, out: '#5a3a1c', in: '#f4efe2', pts: 1 }, { n: 'uva', r: 16, out: '#7b4bd6', in: '#c8a8ff', pts: 1 }
];
const SPECIAL = { gold: { n: 'Fruta dourada', c: '#ffd54a', pts: 10 }, ice: { n: 'Congelar', c: '#9fd2ff', pts: 2 }, frenzy: { n: 'Frenesi', c: '#ff6ad5', pts: 2 }, double: { n: 'Pontos em dobro', c: '#3ddc84', pts: 2 } };
const Game = {
  state: 'idle', mode: 'classic', objs: [], halves: [], splats: [], pts: 0, lives: 3, t: 0, wave: 0, combo: 0, best: 0, fx: [], slow: 0, frenzy: 0, dbl: 0, cut: 0,
  start(mode) { HX.close(); this.mode = mode || this.mode; this.objs = []; this.halves = []; this.splats = []; this.fx = []; this.pts = 0; this.lives = 3; this.t = 0; this.wave = 1.2; this.slow = this.frenzy = this.dbl = 0; this.cut = 0; this.bestCombo = 0; this.state = 'play'; UI.hud(); },
  dur() { return this.mode === 'arcade' ? 60 : this.mode === 'zen' ? 90 : 0; },
  launch(n, bombChance) {
    for (let i = 0; i < n; i++) { const x = 60 + Math.random() * (VW - 120), vx = (VW / 2 - x) * (.4 + Math.random() * .6) + (Math.random() - .5) * 60, vy = -(620 + Math.random() * 130);
      const bomb = Math.random() < bombChance; let sp = null; if (!bomb && this.mode === 'arcade' && Math.random() < .07) sp = ['ice', 'frenzy', 'double'][Math.floor(Math.random() * 3)]; if (!bomb && !sp && Math.random() < .015) sp = 'gold';
      this.objs.push({ x, y: VH + 30, vx, vy, a: 0, va: (Math.random() - .5) * 6, bomb, sp, f: FRUITS[Math.floor(Math.random() * FRUITS.length)], delay: i * .18 }); }
  },
  step(dt) {
    if (this.state !== 'play') return; const k = this.slow > 0 ? .45 : 1; this.slow = Math.max(0, this.slow - dt); this.frenzy = Math.max(0, this.frenzy - dt); this.dbl = Math.max(0, this.dbl - dt); this.t += dt;
    const D = this.dur(); if (D && this.t >= D) return this.end('Tempo esgotado');
    this.wave -= dt; if (this.wave <= 0 && (this.objs.length < 2 || this.frenzy > 0)) { const lvl = Math.min(1, this.t / 120 + this.pts / 400); const n = this.frenzy > 0 ? 3 : 1 + Math.floor(Math.random() * (2 + lvl * 3)); const bc = this.mode === 'zen' ? 0 : .08 + lvl * .14; this.launch(n, bc); this.wave = this.frenzy > 0 ? .35 : 1.1 - lvl * .4 + Math.random() * .4; }
    for (const o of this.objs) { if (o.delay > 0) { o.delay -= dt; continue; } o.vy += G0 * dt * k; o.x += o.vx * dt * k; o.y += o.vy * dt * k; o.a += o.va * dt * k; if (o.x < 20 || o.x > VW - 20) o.vx *= -.6; }
    for (const o of this.objs) if (o.y > VH + 60 && o.vy > 0 && !o.done) { o.done = true; if (!o.bomb && this.mode === 'classic') { this.lives--; HX.sfx('hit'); this.fx.push({ k: 'x', x: o.x, y: VH - 30, t: 1 }); if (this.lives <= 0) return this.end('Frutas demais caíram'); } }
    this.objs = this.objs.filter(o => !o.done && !o.cut);
    for (const h of this.halves) { h.vy += G0 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.a += h.va * dt; } this.halves = this.halves.filter(h => h.y < VH + 80);
    this.splats = this.splats.filter(s => (s.t -= dt * .4) > 0); this.fx = this.fx.filter(e => (e.t -= dt) > 0);
    UI.hud();
  },
  /* corta tudo o que o segmento do dedo atravessa */
  swipe(x0, y0, x1, y1, speed) {
    if (this.state !== 'play' || speed < 500) return; const hits = [];
    for (const o of this.objs) { if (o.cut || o.delay > 0) continue; const r = o.bomb ? 20 : o.f.r; const dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy || 1, t = HX.clamp(((o.x - x0) * dx + (o.y - y0) * dy) / L, 0, 1); if (Math.hypot(o.x - (x0 + dx * t), o.y - (y0 + dy * t)) < r + 6) hits.push(o); }
    for (const o of hits) { o.cut = true; const ang = Math.atan2(y1 - y0, x1 - x0);
      if (o.bomb) { HX.sfx('boom'); HX.vibrate(80); this.fx.push({ k: 'boom', x: o.x, y: o.y, t: .6 }); if (this.mode === 'classic') return this.end('Você cortou uma bomba!'); this.pts = Math.max(0, this.pts - 10); this.fx.push({ k: 'txt', x: o.x, y: o.y, s: '−10', c: '#e5484d', t: .9 }); continue; }
      const sp = o.sp ? SPECIAL[o.sp] : null; let p = sp ? sp.pts : 1; if (this.dbl > 0) p *= 2; this.pts += p; this.cut++; HX.sfx('tap');
      if (o.sp === 'ice') { this.slow = 5; HX.toast('Tempo lento!', 900); } if (o.sp === 'frenzy') { this.frenzy = 4; HX.toast('Frenesi!', 900); } if (o.sp === 'double') { this.dbl = 6; HX.toast('Pontos em dobro!', 900); } if (o.sp === 'gold') HX.toast('+10 fruta dourada!', 900);
      const c = sp ? sp.c : o.f.in; this.splats.push({ x: o.x, y: o.y, r: (o.f.r || 20) * 1.6, c, t: 1 });
      for (const s of [-1, 1]) this.halves.push({ x: o.x, y: o.y, vx: o.vx * .5 + Math.cos(ang + Math.PI / 2) * s * 90, vy: o.vy * .4 + Math.sin(ang + Math.PI / 2) * s * 90 - 60, a: ang, va: s * 4, f: o.f, s, sp: o.sp }); }
    const fr = hits.filter(o => !o.bomb).length; if (fr) { UI.comboAdd(fr); }
  },
  comboEnd(n, x, y) { if (n >= 3) { const bonus = n * (this.dbl > 0 ? 2 : 1); this.pts += bonus; this.bestCombo = Math.max(this.bestCombo, n); this.fx.push({ k: 'txt', x, y, s: `Combo ×${n}  +${bonus}`, c: '#ffd54a', t: 1.1 }); HX.sfx('win'); } },
  end(msg) {
    this.state = 'over'; const key = 'best_' + this.mode, rec = HXA.best(S, key, this.pts); HXA.best(S, 'combo', this.bestCombo); const st = S.get('stats', { games: 0, cut: 0 }); st.games++; st.cut += this.cut; S.set('stats', st);
    S.hub(`Recorde ${Math.max(S.get('best_classic', 0), S.get('best_arcade', 0), S.get('best_zen', 0))} · ${st.cut} frutas cortadas`); HX.sfx(msg.includes('bomba') ? 'boom' : 'lose');
    setTimeout(() => HXA.menu({ title: rec && this.pts ? 'Novo recorde!' : msg, text: rec && this.pts ? msg : '', stats: [[this.pts, 'Pontos'], [this.cut, 'Cortes'], [this.bestCombo || '—', 'Maior combo'], [S.get(key, 0), 'Recorde']], primary: ['Jogar de novo', () => this.start()], buttons: [['Menu', () => UI.home()]] }), 900);
  }
};
const St = HXA.stage(VW, VH);
const View = {
  fruit(g, f, sp, half) {
    const r = f.r; g.fillStyle = sp ? SPECIAL[sp].c : f.out; g.beginPath(); if (half) g.arc(0, 0, r, 0, Math.PI); else g.arc(0, 0, r, 0, 7); g.fill();
    if (half) { g.fillStyle = sp ? '#fff7d0' : f.in; g.beginPath(); g.ellipse(0, 0, r * .86, r * .3, 0, 0, 7); g.fill(); if (f.seed) { g.fillStyle = f.seed; for (let i = -2; i <= 2; i++) g.fillRect(i * r * .3 - 1, -1, 2, 3); } return; }
    g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(-r * .35, -r * .35, r * .3, 0, 7); g.fill(); if (f.n === 'melancia' && !sp) { g.strokeStyle = '#1d5a28'; g.lineWidth = 3; for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(i * 10, 0, r, -1.2, 1.2); g.stroke(); } }
    if (f.n === 'maçã' || f.n === 'laranja' || f.n === 'limão') { g.fillStyle = '#3d9a4a'; g.beginPath(); g.ellipse(4, -r, 6, 3, -.5, 0, 7); g.fill(); } if (sp) { g.fillStyle = '#1a1408'; g.font = '800 14px Manrope'; g.textAlign = 'center'; g.fillText({ gold: '★', ice: '❄', frenzy: '✦', double: '×2' }[sp], 0, 5); }
  },
  draw() {
    const g = St.begin(), G = Game; const bg = g.createLinearGradient(0, 0, 0, VH); bg.addColorStop(0, '#2a1c10'); bg.addColorStop(1, '#130d08'); g.fillStyle = bg; g.fillRect(0, 0, VW, VH);
    g.strokeStyle = 'rgba(201,164,92,.07)'; g.lineWidth = 2; for (let x = 20; x < VW; x += 46) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 6, VH); g.stroke(); }
    if (G.slow > 0) { g.fillStyle = 'rgba(159,210,255,.12)'; g.fillRect(0, 0, VW, VH); }
    for (const s of G.splats) { g.globalAlpha = s.t * .6; g.fillStyle = s.c; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28, rr = s.r * (i % 2 ? .6 : 1); g.lineTo(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr); } g.fill(); } g.globalAlpha = 1;
    for (const h of G.halves) { g.save(); g.translate(h.x, h.y); g.rotate(h.a + (h.s < 0 ? Math.PI : 0)); this.fruit(g, h.f, h.sp, true); g.restore(); }
    for (const o of G.objs) { if (o.delay > 0) continue; g.save(); g.translate(o.x, o.y); g.rotate(o.a);
      if (o.bomb) { g.fillStyle = '#1b1b1f'; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.fill(); g.strokeStyle = '#e5484d'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#e5484d'; g.font = '800 16px Manrope'; g.textAlign = 'center'; g.fillText('✕', 0, 6); g.strokeStyle = '#8a6a2e'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, -16); g.quadraticCurveTo(18, -26, 24, -22); g.stroke(); g.fillStyle = Math.random() < .5 ? '#ffd54a' : '#ff6a00'; g.beginPath(); g.arc(24, -22, 4, 0, 7); g.fill(); }
      else this.fruit(g, o.f, o.sp, false); g.restore(); }
    const tr = UI.trail; if (tr.length > 1) { for (let i = 1; i < tr.length; i++) { const a = tr[i - 1], b = tr[i], age = 1 - (performance.now() - b.t) / 160; if (age <= 0) continue; g.strokeStyle = `rgba(255,244,214,${age})`; g.lineWidth = 2 + age * 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); } g.lineCap = 'butt'; }
    for (const e of G.fx) { if (e.k === 'boom') { g.globalAlpha = e.t; g.fillStyle = '#fff'; g.beginPath(); g.arc(e.x, e.y, (1 - e.t) * 220, 0, 7); g.fill(); g.globalAlpha = 1; }
      else if (e.k === 'x') { g.fillStyle = `rgba(229,72,77,${e.t})`; g.font = '800 28px Manrope'; g.textAlign = 'center'; g.fillText('✕', e.x, e.y); }
      else { g.globalAlpha = Math.min(1, e.t * 2); g.fillStyle = e.c; g.font = '800 20px Manrope'; g.textAlign = 'center'; g.fillText(e.s, HX.clamp(e.x, 90, VW - 90), e.y - (1.1 - e.t) * 40); g.globalAlpha = 1; } }
    g.fillStyle = '#f1dca6'; g.font = '800 30px Manrope'; g.textAlign = 'left'; g.fillText(G.pts, 16, 42);
    if (G.mode === 'classic') { g.textAlign = 'right'; g.font = '800 22px Manrope'; for (let i = 0; i < 3; i++) { g.fillStyle = i < 3 - G.lives ? '#e5484d' : 'rgba(255,255,255,.25)'; g.fillText('✕', VW - 16 - i * 26, 40); } }
    else { const D = G.dur(); g.textAlign = 'right'; g.font = '800 24px Manrope'; g.fillStyle = D - G.t < 10 ? '#e5484d' : '#f1dca6'; g.fillText(Math.max(0, Math.ceil(D - G.t)) + 's', VW - 16, 40); }
    if (G.dbl > 0) { g.fillStyle = '#3ddc84'; g.font = '700 13px Manrope'; g.textAlign = 'left'; g.fillText('×2', 16, 64); }
  }
};
const UI = {
  trail: [], last: null, comboN: 0, comboT: null, comboPos: [0, 0],
  init() {
    const pt = e => { const [x, y] = St.toL(e); return { x, y, t: performance.now() }; };
    St.cv.addEventListener('pointerdown', e => { e.preventDefault(); St.cv.setPointerCapture(e.pointerId); this.last = pt(e); this.trail = [this.last]; });
    St.cv.addEventListener('pointermove', e => { if (!this.last || (e.pointerType === 'mouse' && !e.buttons)) return; const p = pt(e), dt = Math.max(1, p.t - this.last.t); Game.swipe(this.last.x, this.last.y, p.x, p.y, Math.hypot(p.x - this.last.x, p.y - this.last.y) / dt * 1000); this.comboPos = [p.x, p.y]; this.last = p; this.trail.push(p); if (this.trail.length > 14) this.trail.shift(); });
    const up = () => { this.last = null; this.flushCombo(); }; St.cv.addEventListener('pointerup', up); St.cv.addEventListener('pointercancel', up);
    addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { Game.step(dt); View.draw(); });
    HX.life({ onHide: () => { if (Game.state === 'play') this.pause(); } }); this.home();
  },
  comboAdd(n) { this.comboN += n; clearTimeout(this.comboT); this.comboT = setTimeout(() => this.flushCombo(), 220); },
  flushCombo() { clearTimeout(this.comboT); if (this.comboN) Game.comboEnd(this.comboN, ...this.comboPos); this.comboN = 0; },
  hud() { HX.$('#pts').textContent = Game.pts; HX.$('#lives').textContent = Game.mode === 'classic' ? Game.lives : '—'; HX.$('#combo').textContent = Game.bestCombo ? '×' + Game.bestCombo : '—'; },
  help: ['Deslize o dedo (ou arraste com o mouse) rápido sobre as frutas para cortá-las.', 'Cortar 3 ou mais frutas num mesmo gesto dá bônus de combo.', 'Clássico: 3 vidas — cada fruta que cai sem ser cortada tira uma; cortar uma bomba encerra a partida. Arcade: 60 segundos, bombas tiram 10 pontos e há frutas especiais (❄ tempo lento, ✦ frenesi, ×2 pontos em dobro). Zen: 90 segundos sem bombas.', 'A fruta dourada ★ é rara e vale 10 pontos.'],
  home() { const st = S.get('stats', { games: 0, cut: 0 }); HXA.menu({ title: 'Slice', text: 'Escolha o modo.', stats: [[S.get('best_classic', 0), 'Clássico'], [S.get('best_arcade', 0), 'Arcade'], [S.get('best_zen', 0), 'Zen'], [S.get('combo', 0) || '—', 'Maior combo']], primary: ['Clássico', () => Game.start('classic')], buttons: [['Arcade (60 s)', () => Game.start('arcade')], ['Zen (90 s)', () => Game.start('zen')]], help: this.help }); },
  pause() { if (Game.state !== 'play') return Game.state === 'pause' ? null : this.home(); Game.state = 'pause'; this.last = null;
    HXA.menu({ title: 'Pausa', text: `${Game.pts} pontos`, primary: ['Continuar', () => { Game.state = 'play'; }], buttons: [['Recomeçar', () => Game.start()], ['Menu', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.SL = { Game, UI, S };

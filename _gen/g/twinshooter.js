/*@ {"name":"Twin Shooter","t1":"Twin ","t2":"Shooter","theme":"#06080c","bg2":"radial-gradient(ellipse at 50% 0%,#132033 0%,#06080c 66%)",
"hud":[["Onda","wave","1"],["Vida","hp","100"],["Arma","wpn","Pistola"],["Pontos","pts","0"]],
"css":"#guns{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:8px}#guns .tool{padding:6px 10px;font-size:12px;white-space:nowrap}#guns .tool[disabled]{opacity:.3}#guns .tool.on{border-color:var(--gold);color:var(--gold-2)}",
"body":"<div class=\"stage\" id=\"stage\"><canvas id=\"cv\"></canvas></div><div class=\"tools\" id=\"guns\"></div>"} @*/
/* H-LUX TWIN SHOOTER v1.0 — arena de tiro com movimento e mira independentes.
   20 ondas; chefe a cada 5. Entre ondas escolha 1 de 3 melhorias. 4 armas desbloqueáveis.
   Celular: analógico esquerdo move, direito mira e atira. PC: WASD move, mouse mira, clique (ou espaço) atira; 1-4 troca arma.
   Módulos: GUNS · FOES · Game · View · UI */
const S = HX.store('twinshooter');
const VW = 400, VH = 640, WAVES = 20;
const GUNS = {
  pistol: { n: 'Pistola', rate: .22, dmg: 14, sp: 520, spread: 0, n1: 1, c: '#f1dca6' },
  shotgun: { n: 'Escopeta', rate: .6, dmg: 10, sp: 460, spread: .32, n1: 6, c: '#ffb347', life: .45 },
  rifle: { n: 'Fuzil', rate: .09, dmg: 9, sp: 640, spread: .06, n1: 1, c: '#9fd2ff' },
  rocket: { n: 'Foguete', rate: .9, dmg: 40, sp: 330, spread: 0, n1: 1, c: '#e5484d', blast: 70 }
};
const ORDER = ['pistol', 'shotgun', 'rifle', 'rocket'];
const FOES = {
  grunt: { hp: 30, sp: 70, r: 12, dmg: 10, c: '#5f8f4a', pts: 10 },
  runner: { hp: 18, sp: 135, r: 9, dmg: 8, c: '#c86bff', pts: 15 },
  gunner: { hp: 40, sp: 45, r: 13, dmg: 9, c: '#3d8bff', pts: 25, shoot: 1.8 },
  tank: { hp: 130, sp: 40, r: 19, dmg: 20, c: '#a0522d', pts: 40 },
  boss: { hp: 1000, sp: 45, r: 34, dmg: 20, c: '#e5484d', pts: 500, shoot: 1.2 }
};
const Game = {
  state: 'idle', wave: 1, p: null, foes: [], bul: [], eb: [], fx: [], pts: 0, queue: [], qT: 0, up: null, gun: 'pistol', cd: 0,
  newRun() { this.up = { dmg: 0, rate: 0, sp: 0, hp: 0 }; this.guns = ['pistol']; this.gun = 'pistol'; this.pts = 0; this.wave = 1; this.p = { x: VW / 2, y: VH / 2, hp: 100, max: 100, inv: 0 }; this.startWave(); },
  startWave() {
    HX.close(); const w = this.wave, q = []; this.foes = []; this.bul = []; this.eb = [];
    const n = 6 + w * 3; for (let i = 0; i < n; i++) { const r = Math.random(); q.push(w < 2 ? 'grunt' : r < .4 ? 'grunt' : r < .65 ? 'runner' : r < .85 && w >= 3 ? 'gunner' : w >= 4 ? 'tank' : 'grunt'); }
    if (w % 5 === 0) q.push('boss'); this.queue = q; this.qT = .6; this.state = 'play'; HX.toast(w % 5 === 0 ? `Onda ${w} — chefe!` : `Onda ${w}`, 1100); UI.hud();
  },
  spawn(type) { const F = FOES[type], side = Math.floor(Math.random() * 4), t = Math.random(); const x = side === 0 ? t * VW : side === 1 ? VW + 20 : side === 2 ? t * VW : -20, y = side === 0 ? -20 : side === 1 ? t * VH : side === 2 ? VH + 20 : t * VH;
    const sc = 1 + (this.wave - 1) * .08 + (type === 'boss' ? (this.wave / 5 - 1) * .5 : 0); this.foes.push({ type, x, y, hp: F.hp * sc, max: F.hp * sc, cd: 1 + Math.random() * 2, hit: 0, dash: 0 }); },
  fire(a) { const G = GUNS[this.gun], dm = G.dmg * (1 + this.up.dmg * .2); for (let k = 0; k < G.n1; k++) { const s = a + (G.n1 > 1 ? (k / (G.n1 - 1) - .5) * G.spread * 2 : (Math.random() - .5) * G.spread * 2); this.bul.push({ x: this.p.x + Math.cos(a) * 14, y: this.p.y + Math.sin(a) * 14, vx: Math.cos(s) * G.sp, vy: Math.sin(s) * G.sp, dmg: dm, life: G.life || 1.4, blast: G.blast, c: G.c }); } HX.sfx('shot'); },
  boom(x, y, R, dmg) { this.fx.push({ k: 'boom', x, y, r: R, t: .3 }); for (const f of this.foes) if (Math.hypot(f.x - x, f.y - y) < R + FOES[f.type].r) { f.hp -= dmg; f.hit = .1; } HX.sfx('boom'); },
  step(dt) {
    if (this.state !== 'play') return; const P = this.p;
    if (this.queue.length) { this.qT -= dt; if (this.qT <= 0) { this.spawn(this.queue.shift()); this.qT = Math.max(.25, 1.1 - this.wave * .04); } }
    const mv = UI.move(), sp = 150 * (1 + this.up.sp * .1); if (mv.on) { P.x = HX.clamp(P.x + mv.x * sp * dt, 14, VW - 14); P.y = HX.clamp(P.y + mv.y * sp * dt, 14, VH - 14); }
    const aim = UI.aim(); if (aim.on) P.a = aim.a; this.cd -= dt; if (aim.on && aim.fire && this.cd <= 0) { this.cd = GUNS[this.gun].rate / (1 + this.up.rate * .15); this.fire(P.a); }
    if (P.inv > 0) P.inv -= dt;
    for (const f of this.foes) { const F = FOES[f.type], dx = P.x - f.x, dy = P.y - f.y, d = Math.hypot(dx, dy) || 1; let s = F.sp;
      if (F.shoot) { if (d < 200 && f.type !== 'boss') s = -F.sp * .5; f.cd -= dt; if (f.cd <= 0 && d < 420) { f.cd = F.shoot * (1 + Math.random() * .4); const a = Math.atan2(dy, dx), n = f.type === 'boss' ? 5 : 1; for (let k = 0; k < n; k++) { const b = a + (n > 1 ? (k / (n - 1) - .5) * .9 : 0); this.eb.push({ x: f.x, y: f.y, vx: Math.cos(b) * 170, vy: Math.sin(b) * 170, dmg: F.dmg, life: 3 }); } } }
      if (f.type === 'boss') { f.dash -= dt; if (f.dash < -4) f.dash = .5; if (f.dash > 0) s = 200; }
      f.x += dx / d * s * dt; f.y += dy / d * s * dt; if (f.hit > 0) f.hit -= dt; if (F.shoot) { f.x = HX.clamp(f.x, -10, VW + 10); f.y = HX.clamp(f.y, -10, VH + 10); }
      if (d < F.r + 11 && P.inv <= 0) { this.hurtP(F.dmg); } }
    for (let i = 0; i < this.foes.length; i++) for (let j = i + 1; j < this.foes.length; j++) { const a = this.foes[i], b = this.foes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy), m = FOES[a.type].r + FOES[b.type].r; if (d < m && d > 0) { const k = (m - d) / d * .5; a.x += dx * k; a.y += dy * k; b.x -= dx * k; b.y -= dy * k; } }
    for (const b of this.bul) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (b.x < -20 || b.x > VW + 20 || b.y < -20 || b.y > VH + 20) b.life = 0;
      for (const f of this.foes) { if (b.life <= 0) break; if (f.hp > 0 && Math.hypot(f.x - b.x, f.y - b.y) < FOES[f.type].r + 4) { b.life = 0; if (b.blast) this.boom(b.x, b.y, b.blast, b.dmg); else { f.hp -= b.dmg; f.hit = .08; HX.sfx('hit'); } } } }
    for (const b of this.eb) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (Math.hypot(b.x - P.x, b.y - P.y) < 13 && P.inv <= 0) { b.life = 0; this.hurtP(b.dmg); } }
    this.bul = this.bul.filter(b => b.life > 0); this.eb = this.eb.filter(b => b.life > 0); this.fx = this.fx.filter(e => (e.t -= dt) > 0);
    for (const f of this.foes) if (f.hp <= 0) { this.pts += FOES[f.type].pts; this.fx.push({ k: 'pop', x: f.x, y: f.y, r: FOES[f.type].r, c: FOES[f.type].c, t: .25 }); }
    this.foes = this.foes.filter(f => f.hp > 0);
    if (P.hp <= 0) return this.end(false);
    if (!this.queue.length && !this.foes.length) return this.clear();
    UI.hud();
  },
  hurtP(v) { this.p.hp -= v; this.p.inv = .6; HX.vibrate(25); HX.sfx('hit'); },
  clear() {
    this.state = 'between'; this.pts += 50 * this.wave; HX.sfx('win');
    if (this.wave >= WAVES) return this.end(true);
    const opts = []; const nextGun = ORDER.find(g => !this.guns.includes(g)); if (nextGun && this.wave % 3 === 0) opts.push({ k: 'gun', g: nextGun, n: `Nova arma: ${GUNS[nextGun].n}`, d: 'Troque nos botões ou nas teclas 1–4' });
    const pool = [{ k: 'dmg', n: 'Munição pesada', d: '+20% de dano' }, { k: 'rate', n: 'Gatilho rápido', d: '+15% cadência' }, { k: 'sp', n: 'Botas', d: '+10% velocidade' }, { k: 'hp', n: 'Blindagem', d: '+20 vida máxima' }, { k: 'heal', n: 'Kit médico', d: 'Recupera toda a vida' }];
    for (const o of HX.shuffle(pool)) if (opts.length < 3) opts.push(o);
    this.offer = opts; UI.between(opts);
  },
  pick(o) { const P = this.p; if (o.k === 'gun') { this.guns.push(o.g); this.gun = o.g; } else if (o.k === 'heal') P.hp = P.max; else { this.up[o.k]++; if (o.k === 'hp') { P.max += 20; P.hp += 20; } }
    P.hp = Math.min(P.max, P.hp + 15); this.wave++; this.startWave(); UI.guns(); },
  end(win) {
    this.state = 'over'; HXA.best(S, 'bestWave', win ? WAVES : this.wave); const rec = HXA.best(S, 'bestPts', this.pts); const st = S.get('stats', { runs: 0, wins: 0 }); st.runs++; if (win) st.wins++; S.set('stats', st);
    S.hub(`Recorde ${S.get('bestPts', 0)} pts · onda ${S.get('bestWave', 0)}`); HX.sfx(win ? 'win' : 'lose');
    setTimeout(() => HXA.menu({ title: win ? 'Arena conquistada!' : 'Fim de jogo', text: win ? 'Você venceu as 20 ondas.' : `Caiu na onda ${this.wave}.${rec ? ' Novo recorde!' : ''}`, stats: [[this.pts, 'Pontos'], [this.wave, 'Onda'], [S.get('bestPts', 0), 'Recorde']], primary: ['Jogar de novo', () => this.newRun()], buttons: [['Menu', () => UI.home()]] }), 600);
  }
};
const St = HXA.stage(VW, VH);
const View = {
  draw() {
    const g = St.begin(), G = Game, P = G.p; g.fillStyle = '#0c1018'; g.fillRect(0, 0, VW, VH);
    g.strokeStyle = 'rgba(201,164,92,.07)'; g.lineWidth = 1; for (let x = 0; x <= VW; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, VH); g.stroke(); } for (let y = 0; y <= VH; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(VW, y); g.stroke(); }
    g.strokeStyle = 'rgba(201,164,92,.35)'; g.lineWidth = 3; g.strokeRect(2, 2, VW - 4, VH - 4); if (!P) return;
    for (const f of G.foes) { const F = FOES[f.type]; g.fillStyle = f.hit > 0 ? '#fff' : F.c; g.beginPath(); if (f.type === 'runner') { const a = Math.atan2(P.y - f.y, P.x - f.x); g.moveTo(f.x + Math.cos(a) * F.r * 1.4, f.y + Math.sin(a) * F.r * 1.4); g.lineTo(f.x + Math.cos(a + 2.4) * F.r, f.y + Math.sin(a + 2.4) * F.r); g.lineTo(f.x + Math.cos(a - 2.4) * F.r, f.y + Math.sin(a - 2.4) * F.r); } else if (f.type === 'tank' || f.type === 'gunner') g.rect(f.x - F.r, f.y - F.r, F.r * 2, F.r * 2); else g.arc(f.x, f.y, F.r, 0, 7); g.fill();
      if (f.type === 'boss' || f.type === 'tank') { g.fillStyle = '#300'; g.fillRect(f.x - F.r, f.y - F.r - 9, F.r * 2, 4); g.fillStyle = '#e5484d'; g.fillRect(f.x - F.r, f.y - F.r - 9, F.r * 2 * f.hp / f.max, 4); } }
    for (const b of G.bul) { g.fillStyle = b.c; g.beginPath(); g.arc(b.x, b.y, b.blast ? 5 : 3, 0, 7); g.fill(); }
    g.fillStyle = '#ff5a5a'; for (const b of G.eb) { g.beginPath(); g.arc(b.x, b.y, 4, 0, 7); g.fill(); }
    for (const e of G.fx) { g.globalAlpha = e.t * 3; g.fillStyle = e.k === 'boom' ? '#ffb347' : e.c; g.beginPath(); g.arc(e.x, e.y, e.k === 'boom' ? e.r : e.r * (1 + (.25 - e.t) * 4), 0, 7); g.fill(); g.globalAlpha = 1; }
    g.save(); g.translate(P.x, P.y); g.fillStyle = P.inv > 0 && Math.floor(P.inv * 20) % 2 ? '#fff' : '#e0b14a'; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fill(); g.rotate(P.a || 0); g.fillStyle = '#1a1408'; g.fillRect(4, -3, 14, 6); g.restore();
    g.fillStyle = '#400'; g.fillRect(P.x - 16, P.y + 17, 32, 4); g.fillStyle = '#3ddc84'; g.fillRect(P.x - 16, P.y + 17, 32 * Math.max(0, P.hp) / P.max, 4);
    if (UI.mouse && G.state === 'play') { const [mx, my] = UI.mouse; g.strokeStyle = 'rgba(241,220,166,.7)'; g.lineWidth = 1.5; g.beginPath(); g.arc(mx, my, 8, 0, 7); g.moveTo(mx - 12, my); g.lineTo(mx + 12, my); g.moveTo(mx, my - 12); g.lineTo(mx, my + 12); g.stroke(); }
    UI.sl.draw(g); UI.sr.draw(g);
  }
};
const UI = {
  sl: null, sr: null, mouse: null, mdown: false,
  init() {
    this.sl = HXA.stick(St, { zone: 'left', radius: 50, mouse: false }); this.sr = HXA.stick(St, { zone: 'right', radius: 50, mouse: false });
    St.cv.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') this.mouse = St.toL(e); });
    St.cv.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') { this.mdown = true; this.mouse = St.toL(e); } }); addEventListener('pointerup', e => { if (e.pointerType === 'mouse') this.mdown = false; });
    addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'Escape') this.pause(); const i = '1234'.indexOf(e.key); if (i >= 0 && Game.guns && Game.guns.includes(ORDER[i])) { Game.gun = ORDER[i]; this.guns(); } });
    HX.$('#guns').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b && Game.guns.includes(b.dataset.g)) { Game.gun = b.dataset.g; this.guns(); } });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { Game.step(dt); View.draw(); });
    HX.life({ onHide: () => { if (Game.state === 'play') this.pause(); } }); this.home();
  },
  move() { const k = HXA.axis(); if (k.on) return k; return this.sl.active && Math.hypot(this.sl.x, this.sl.y) > .15 ? { x: this.sl.x, y: this.sl.y, on: true } : { on: false }; },
  aim() { if (this.sr.active && Math.hypot(this.sr.x, this.sr.y) > .2) return { a: Math.atan2(this.sr.y, this.sr.x), on: true, fire: true };
    if (this.mouse && Game.p) return { a: Math.atan2(this.mouse[1] - Game.p.y, this.mouse[0] - Game.p.x), on: true, fire: this.mdown || HXA.key(' ') }; return { on: false }; },
  hud() { HX.$('#wave').textContent = `${Game.wave}/${WAVES}`; HX.$('#hp').textContent = Math.max(0, Math.round(Game.p.hp)); HX.$('#wpn').textContent = GUNS[Game.gun].n; HX.$('#pts').textContent = Game.pts; },
  guns() { HX.$('#guns').innerHTML = ORDER.map((k, i) => `<button class="tool${Game.gun === k ? ' on' : ''}" data-g="${k}" ${Game.guns.includes(k) ? '' : 'disabled'}>${i + 1} · ${GUNS[k].n}</button>`).join(''); if (Game.p) this.hud(); },
  help: ['Celular: o analógico esquerdo (arraste na metade esquerda) move; o direito (metade direita) mira e atira na direção arrastada.', 'PC: WASD ou setas movem, o mouse mira e o clique (ou espaço) atira. Teclas 1 a 4 trocam de arma.', 'Sobreviva a 20 ondas. A cada 5 ondas há um chefe. Entre as ondas, escolha uma melhoria; a cada 3 ondas pode surgir uma arma nova.', 'Quadrados azuis atiram de longe; triângulos roxos são rápidos; quadrados marrons são resistentes.'],
  home() { const st = S.get('stats', { runs: 0, wins: 0 }); HXA.menu({ title: 'Twin Shooter', text: 'Mova com uma mão, mire com a outra.', stats: [[S.get('bestPts', 0), 'Recorde'], [S.get('bestWave', 0), 'Melhor onda'], [`${st.wins}/${st.runs}`, 'Vitórias']], primary: ['Começar', () => { Game.newRun(); this.guns(); }], help: this.help }); },
  between(opts) { const c = HX.overlay(`<h3>Onda ${Game.wave} vencida</h3><p>Escolha uma melhoria</p>${opts.map((o, i) => `<button class="btn" data-i="${i}" style="text-align:left;display:block;width:100%;padding:10px 14px;min-height:56px"><b>${o.n}</b><br><small style="color:var(--muted)">${o.d}</small></button>`).join('')}`);
    c.querySelectorAll('[data-i]').forEach(b => b.onclick = () => Game.pick(opts[+b.dataset.i])); },
  pause() { if (Game.state !== 'play') return Game.state === 'between' ? null : this.home(); Game.state = 'pause';
    HXA.menu({ title: 'Pausa', text: `Onda ${Game.wave} · ${Game.pts} pontos`, primary: ['Continuar', () => { Game.state = 'play'; }], buttons: [['Recomeçar', () => { Game.newRun(); this.guns(); }], ['Menu', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.TS = { Game, UI, S, GUNS, FOES };

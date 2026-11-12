/*@ {"name":"Fishing","t1":"Fish","t2":"ing","theme":"#060a0e","bg2":"radial-gradient(ellipse at 50% 0%,#12263a 0%,#060a0e 66%)",
"hud":[["Local","loc","Lago"],["Moedas","coins","0"],["Coleção","col","0/0"]],
"css":".tabs3{display:flex;gap:6px;margin-top:8px;width:100%;max-width:620px;align-self:center}.tabs3 .btn{flex:1;min-height:46px;font-size:13px}.fl{display:grid;gap:5px;margin:8px 0;max-height:52vh;overflow:auto;text-align:left}.fl .it{display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border:1px solid var(--line);border-radius:10px;font-size:13px}.fl small{color:var(--muted)}",
"body":"<div class=\"stage\" id=\"stage\"><canvas id=\"cv\"></canvas></div><div class=\"tabs3\"><button class=\"btn\" id=\"bloc\">Locais</button><button class=\"btn\" id=\"bshop\">Loja</button><button class=\"btn\" id=\"bcol\">Coleção</button><button class=\"btn\" id=\"bmis\">Missões</button></div>"} @*/
/* H-LUX FISHING v1.0 — pesca relaxante: lançar, fisgar e recolher com controle de tensão da linha.
   4 locais (Lago, Rio, Mar, Lago Congelado) com 6 espécies cada, em 5 raridades; peso aleatório por exemplar.
   Loja: vara (recolhe mais rápido), linha (aguenta mais tensão) e isca (morde mais rápido e atrai raros).
   Coleção (bestiário com recorde de peso), missões com recompensa, progresso salvo. Módulos: SPOTS · Game · View · UI */
const S = HX.store('fishing');
const VW = 400, VH = 560, WATER = 250;
const RAR = [{ n: 'Comum', c: '#c8c8c8', w: 60 }, { n: 'Incomum', c: '#3ddc84', w: 25 }, { n: 'Raro', c: '#3d8bff', w: 10 }, { n: 'Épico', c: '#c86bff', w: 4 }, { n: 'Lendário', c: '#ffd54a', w: 1 }];
const SPOTS = {
  lago: { n: 'Lago', cost: 0, sky: ['#2a4a6a', '#6a8aa0'], water: ['#1d4a5a', '#0c2430'], fish: [['Lambari', 0, .05, .3, 5, '#c0c8d0'], ['Tilápia', 0, .4, 2, 12, '#8a9aa0'], ['Carpa', 1, 1.5, 8, 30, '#c09a50'], ['Traíra', 1, .8, 4, 28, '#5a6a40'], ['Tucunaré', 2, 1, 6, 70, '#e0b030'], ['Carpa Dourada', 4, 3, 12, 400, '#ffd54a']] },
  rio: { n: 'Rio', cost: 300, sky: ['#3a5a3a', '#8aa080'], water: ['#3a5a40', '#14261a'], fish: [['Piaba', 0, .05, .2, 6, '#c0d0c0'], ['Pacu', 1, 1, 6, 30, '#6a6a7a'], ['Dourado', 2, 3, 15, 90, '#e0a020'], ['Pintado', 2, 4, 25, 110, '#a0a0a0'], ['Pirarara', 3, 10, 40, 220, '#e06030'], ['Pirarucu', 4, 30, 120, 600, '#a03020']] },
  mar: { n: 'Mar', cost: 900, sky: ['#3a6a9a', '#9ac0e0'], water: ['#1a5a8a', '#06203a'], fish: [['Sardinha', 0, .05, .2, 6, '#b0c8e0'], ['Cavala', 0, .5, 3, 14, '#5a8aa0'], ['Robalo', 1, 1, 8, 40, '#9aa0a8'], ['Garoupa', 2, 3, 30, 120, '#a06040'], ['Atum', 3, 20, 150, 300, '#3a4a8a'], ['Marlim', 4, 60, 300, 900, '#2a5aaa']] },
  gelo: { n: 'Lago Congelado', cost: 2200, sky: ['#7a8aa0', '#d0dce8'], water: ['#3a6a8a', '#10283a'], fish: [['Truta', 0, .3, 2, 16, '#c0a0a0'], ['Perca', 0, .2, 1.5, 14, '#a0b060'], ['Salmão', 1, 2, 12, 60, '#e08070'], ['Lúcio', 2, 2, 15, 120, '#6a8a5a'], ['Esturjão', 3, 20, 100, 380, '#5a5a6a'], ['Peixe de Cristal', 4, 1, 5, 1200, '#bfe8ff']] }
};
const SHOP = { rod: { n: 'Vara', d: 'recolhe mais rápido', max: 5 }, line: { n: 'Linha', d: 'aguenta mais tensão', max: 5 }, bait: { n: 'Isca', d: 'mordida rápida e mais peixes raros', max: 5 } };
const MISSIONS = [
  { id: 'm1', d: 'Pesque 5 peixes', goal: s => s.caught >= 5, r: 60 }, { id: 'm2', d: 'Pesque um peixe Incomum ou melhor', goal: s => s.bestR >= 1, r: 80 }, { id: 'm3', d: 'Pesque um peixe de 5 kg ou mais', goal: s => s.maxKg >= 5, r: 120 },
  { id: 'm4', d: 'Desbloqueie o Rio', goal: s => s.spots >= 2, r: 100 }, { id: 'm5', d: 'Pesque um peixe Raro', goal: s => s.bestR >= 2, r: 200 }, { id: 'm6', d: 'Descubra 12 espécies', goal: s => s.species >= 12, r: 300 },
  { id: 'm7', d: 'Pesque 50 peixes', goal: s => s.caught >= 50, r: 400 }, { id: 'm8', d: 'Pesque um peixe Épico', goal: s => s.bestR >= 3, r: 500 }, { id: 'm9', d: 'Desbloqueie o Lago Congelado', goal: s => s.spots >= 4, r: 400 },
  { id: 'm10', d: 'Pesque um peixe Lendário', goal: s => s.bestR >= 4, r: 1500 }, { id: 'm11', d: 'Complete a coleção (24 espécies)', goal: s => s.species >= 24, r: 3000 }
];
const Game = {
  state: 'idle', spot: 'lago', cast: 0, bob: null, fish: null, wait: 0, bite: 0, tension: 0, prog: 0, slack: 0, t: 0, msg: '', charging: false,
  up() { return Object.assign({ rod: 0, line: 0, bait: 0 }, S.get('up', {})); },
  ready() { HX.close(); this.state = 'ready'; this.bob = null; this.fish = null; this.msg = 'Segure para lançar'; UI.hud(); },
  startCast() { if (this.state !== 'ready') return; this.state = 'charge'; this.cast = 0; },
  release() { if (this.state !== 'charge') return; const d = .25 + this.cast * .75; this.bob = { x: 80 + d * 290, y: WATER + 4, dip: 0, fly: 0, sx: 70, sy: 200 }; this.state = 'fly'; HX.sfx('tap');
    const up = this.up(); this.wait = (2.5 + Math.random() * 5) * (1 - up.bait * .1); this.dist = d; },
  pickFish() { const sp = SPOTS[this.spot], up = this.up(); const boost = up.bait * .35 + this.dist * .6; const ws = RAR.map((r, i) => r.w * Math.pow(1 + boost, i)); let x = Math.random() * ws.reduce((a, b) => a + b, 0), ri = 0; for (; ri < ws.length - 1; ri++) { if ((x -= ws[ri]) < 0) break; }
    const opts = sp.fish.filter(f => f[1] === ri), f = opts.length ? opts[Math.floor(Math.random() * opts.length)] : sp.fish[0]; const kg = +(f[2] + (f[3] - f[2]) * Math.pow(Math.random(), 1.6)).toFixed(2);
    return { name: f[0], r: f[1], kg, val: Math.round(f[4] * (.6 + kg / f[3] * .8)), col: f[5], power: .35 + f[1] * .15 + kg / f[3] * .2, stam: 1 }; },
  step(dt) {
    this.t += dt; const up = this.up();
    if (this.state === 'charge') this.cast = Math.min(1, this.cast + dt / 1.2);
    if (this.state === 'fly') { const B = this.bob; B.fly = Math.min(1, B.fly + dt / .6); if (B.fly >= 1) { this.state = 'wait'; this.msg = 'Aguarde a mordida…'; } }
    if (this.state === 'wait') { this.wait -= dt; this.bob.dip = Math.sin(this.t * 2) * 1.5; if (this.wait <= 0) { this.fish = this.pickFish(); this.state = 'bite'; this.bite = .9 + up.bait * .08; this.msg = 'Fisgou? TOQUE AGORA!'; HX.vibrate(60); HX.sfx('power'); } }
    if (this.state === 'bite') { this.bite -= dt; this.bob.dip = 8 + Math.sin(this.t * 30) * 4; if (this.bite <= 0) { this.msg = 'O peixe escapou… toque para recolher'; this.state = 'miss'; HX.sfx('lose'); } }
    if (this.state === 'reel') {
      const F = this.fish, maxT = 1, pull = F.power * (.6 + .6 * Math.sin(this.t * (1.5 + F.r * .5)) ** 2) * F.stam; const hold = UI.hold;
      this.tension += ((hold ? .9 : -.7) + pull * (hold ? .7 : .25) - (up.line * .06)) * dt; this.tension = HX.clamp(this.tension, 0, 1.2);
      if (hold && this.tension < .85) { this.prog += dt * (.3 + up.rod * .06) * (1.2 - F.power * .5); F.stam = Math.max(.35, F.stam - dt * .04); }
      if (!hold) this.prog = Math.max(0, this.prog - dt * pull * .05);
      if (this.tension >= 1 + up.line * .04) { this.state = 'miss'; this.msg = 'A linha arrebentou! Toque para recomeçar'; HX.sfx('boom'); HX.vibrate(80); }
      if (this.tension <= .02) { this.slack += dt; if (this.slack > 2.2) { this.state = 'miss'; this.msg = 'Linha frouxa: o peixe soltou. Toque para recomeçar'; HX.sfx('lose'); } } else this.slack = 0;
      if (this.prog >= 1) this.catch();
    }
  },
  hook() { if (this.state === 'bite') { this.state = 'reel'; this.tension = .35; this.prog = 0; this.slack = 0; this.msg = 'Segure para recolher — mantenha a tensão longe do vermelho'; HX.sfx('hit'); } else if (this.state === 'wait') { this.msg = 'Cedo demais! O peixe se assustou'; this.wait += 2; HX.toast('Cedo demais!', 700); } else if (this.state === 'miss') this.ready(); },
  catch() {
    const F = this.fish; this.state = 'caught'; HX.sfx('win'); const col = S.get('col', {}); const key = this.spot + ':' + F.name; const prev = col[key]; const isNew = !prev; col[key] = { kg: Math.max(prev ? prev.kg : 0, F.kg), n: (prev ? prev.n : 0) + 1, r: F.r }; S.set('col', col);
    S.set('coins', S.get('coins', 0) + F.val); const st = S.get('st', { caught: 0, maxKg: 0, bestR: 0 }); st.caught++; st.maxKg = Math.max(st.maxKg, F.kg); st.bestR = Math.max(st.bestR, F.r); S.set('st', st);
    UI.hud(); UI.checkMissions(); S.hub(`${Object.keys(col).length}/24 espécies · ${st.caught} peixes`);
    HXA.menu({ title: F.name + (isNew ? ' — nova espécie!' : ''), text: `${RAR[F.r].n} · ${F.kg.toLocaleString('pt-BR')} kg${prev && F.kg > prev.kg ? ' · recorde de peso!' : ''}`, stats: [['+' + F.val, 'Moedas'], [S.get('coins', 0), 'Total']], html: `<div style="height:70px;display:grid;place-items:center"><svg width="150" height="60" viewBox="0 0 150 60"><ellipse cx="70" cy="30" rx="55" ry="20" fill="${F.col}"/><path d="M120 30 L148 10 L148 50Z" fill="${F.col}"/><circle cx="35" cy="25" r="4" fill="#111"/></svg></div>`, primary: ['Pescar de novo', () => this.ready()] });
  }
};
const St = HXA.stage(VW, VH);
const View = {
  draw() {
    const g = St.begin(), G = Game, sp = SPOTS[G.spot]; const sky = g.createLinearGradient(0, 0, 0, WATER); sky.addColorStop(0, sp.sky[0]); sky.addColorStop(1, sp.sky[1]); g.fillStyle = sky; g.fillRect(0, 0, VW, WATER);
    g.fillStyle = 'rgba(255,240,200,.8)'; g.beginPath(); g.arc(320, 60, 22, 0, 7); g.fill();
    g.fillStyle = G.spot === 'gelo' ? '#e8eef4' : G.spot === 'mar' ? '#d8c08a' : '#3a5a32'; g.beginPath(); g.moveTo(0, WATER); g.lineTo(0, WATER - 50); g.quadraticCurveTo(60, WATER - 70, 120, WATER - 30); g.lineTo(140, WATER); g.fill();
    const wg = g.createLinearGradient(0, WATER, 0, VH); wg.addColorStop(0, sp.water[0]); wg.addColorStop(1, sp.water[1]); g.fillStyle = wg; g.fillRect(0, WATER, VW, VH - WATER);
    g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const y = WATER + 14 + i * 22; g.beginPath(); for (let x = 0; x <= VW; x += 20) g.lineTo(x, y + Math.sin(x * .05 + G.t * 1.5 + i) * 2); g.stroke(); }
    for (let i = 0; i < 5; i++) { const x = (i * 97 + G.t * (12 + i * 4)) % (VW + 60) - 30, y = WATER + 70 + i * 45; g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x, y, 16 + i * 2, 6, 0, 0, 7); g.moveTo(x - 16 - i * 2, y); g.lineTo(x - 26 - i * 2, y - 6); g.lineTo(x - 26 - i * 2, y + 6); g.fill(); }
    // pescador no píer
    g.fillStyle = '#5a3a1c'; g.fillRect(0, WATER - 14, 110, 10); g.fillRect(20, WATER - 4, 6, 40); g.fillRect(90, WATER - 4, 6, 40); g.fillStyle = '#2a2a30'; g.fillRect(50, WATER - 58, 16, 44); g.fillStyle = '#f1c27d'; g.beginPath(); g.arc(58, WATER - 66, 9, 0, 7); g.fill(); g.fillStyle = '#e0b14a'; g.fillRect(46, WATER - 76, 24, 6);
    const tipX = 70 + (G.state === 'charge' ? -G.cast * 30 : 0), tipY = 120; g.strokeStyle = '#8a6a2e'; g.lineWidth = 3; g.beginPath(); g.moveTo(62, WATER - 40); g.lineTo(tipX + 40, tipY); g.stroke();
    if (G.bob) { const B = G.bob, u = B.fly, bx = 110 + (B.x - 110) * u, by = u < 1 ? tipY + (B.y - tipY) * u - Math.sin(u * Math.PI) * 80 : B.y + B.dip; g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(tipX + 40, tipY); g.quadraticCurveTo((tipX + 40 + bx) / 2, Math.max(tipY, by) + (G.state === 'reel' ? -10 * G.tension : 30), bx, by); g.stroke();
      g.fillStyle = '#e5484d'; g.beginPath(); g.arc(bx, by - 3, 5, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by - 3, 5, 0, Math.PI); g.fill();
      if (G.state === 'bite') { g.strokeStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(bx, B.y, 10 + (G.t * 40) % 20, 0, 7); g.stroke(); } }
    if (G.state === 'charge') { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(150, 40, 200, 12); g.fillStyle = '#e0b14a'; g.fillRect(150, 40, 200 * G.cast, 12); g.fillStyle = '#f1dca6'; g.font = '700 12px Manrope'; g.textAlign = 'left'; g.fillText('Distância (mais longe = peixes melhores)', 150, 34); }
    if (G.state === 'reel') { const x = 360, y0 = 300, h = 200; g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x, y0, 20, h); const lim = 1 + G.up().line * .04; g.fillStyle = 'rgba(229,72,77,.5)'; g.fillRect(x, y0, 20, h * (1 - .85 / lim)); g.fillStyle = 'rgba(61,220,132,.35)'; g.fillRect(x, y0 + h * (1 - .85 / lim), 20, h * (.85 - .2) / lim);
      const ty = y0 + h * (1 - G.tension / lim); g.fillStyle = '#fff'; g.fillRect(x - 4, ty - 3, 28, 6); g.fillStyle = '#f1dca6'; g.font = '700 11px Manrope'; g.textAlign = 'center'; g.fillText('tensão', x + 10, y0 - 6);
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(20, 520, 320, 12); g.fillStyle = '#3ddc84'; g.fillRect(20, 520, 320 * G.prog, 12); g.fillStyle = '#f1dca6'; g.textAlign = 'left'; g.fillText('Recolhendo…', 20, 512);
      const fx = 110 + (G.bob.x - 110) * (1 - G.prog), fy = WATER + 40 + Math.sin(G.t * 5) * 8; g.fillStyle = G.fish.col; g.globalAlpha = .7; g.beginPath(); g.ellipse(fx, fy, 20, 8, Math.sin(G.t * 4) * .3, 0, 7); g.fill(); g.globalAlpha = 1; }
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, VW, 28); g.fillStyle = '#f1dca6'; g.font = '700 13px Manrope'; g.textAlign = 'center'; g.fillText(G.msg, VW / 2, 19);
  }
};
const UI = {
  hold: false,
  init() {
    St.cv.addEventListener('pointerdown', e => { e.preventDefault(); if (HX.isOpen()) return; this.hold = true; if (Game.state === 'ready') Game.startCast(); else Game.hook(); });
    const up = () => { this.hold = false; if (Game.state === 'charge') Game.release(); }; addEventListener('pointerup', up); addEventListener('pointercancel', up);
    addEventListener('keydown', e => { if (e.key === ' ' && !e.repeat && !HX.isOpen()) { e.preventDefault(); this.hold = true; if (Game.state === 'ready') Game.startCast(); else Game.hook(); } if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    addEventListener('keyup', e => { if (e.key === ' ') up(); });
    HX.$('#bloc').onclick = () => this.locs(); HX.$('#bshop').onclick = () => this.shop(); HX.$('#bcol').onclick = () => this.coll(); HX.$('#bmis').onclick = () => this.missions(); HX.$('#menu').onclick = () => this.pause();
    HXA.loop(dt => { if (!HX.isOpen()) Game.step(dt); View.draw(); });
    const sel = S.get('spot', 'lago'); Game.spot = S.get('owned', ['lago']).includes(sel) ? sel : 'lago'; this.home();
  },
  hud() { HX.$('#loc').textContent = SPOTS[Game.spot].n; HX.$('#coins').textContent = S.get('coins', 0); HX.$('#col').textContent = `${Object.keys(S.get('col', {})).length}/24`; },
  stats() { const st = S.get('st', { caught: 0, maxKg: 0, bestR: 0 }); return Object.assign({}, st, { spots: S.get('owned', ['lago']).length, species: Object.keys(S.get('col', {})).length }); },
  checkMissions() { const done = S.get('mis', []), s = this.stats(); for (const m of MISSIONS) if (!done.includes(m.id) && m.goal(s)) { done.push(m.id); S.set('coins', S.get('coins', 0) + m.r); HX.toast(`Missão cumprida: ${m.d} (+${m.r})`, 2000); } S.set('mis', done); this.hud(); },
  locs() { const own = S.get('owned', ['lago']); const c = HX.overlay(`<h3>Locais de pesca</h3><p>Moedas: <b>${S.get('coins', 0)}</b></p><div class="fl">${Object.entries(SPOTS).map(([k, s]) => `<button class="btn it" data-k="${k}"><span>${Game.spot === k ? '✓ ' : ''}${s.n}</span><small>${own.includes(k) ? 'disponível' : s.cost + ' moedas'}</small></button>`).join('')}</div><button class="btn-primary" id="ok">Voltar</button>`, { guard: false });
    c.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k, s = SPOTS[k]; if (!own.includes(k)) { if (S.get('coins', 0) < s.cost) return HX.toast('Moedas insuficientes'); S.set('coins', S.get('coins', 0) - s.cost); own.push(k); S.set('owned', own); HX.sfx('coin'); this.checkMissions(); } Game.spot = k; S.set('spot', k); Game.ready(); }); HX.on(c, '#ok', () => Game.ready()); },
  shop() { const up = Game.up(); const c = HX.overlay(`<h3>Loja</h3><p>Moedas: <b>${S.get('coins', 0)}</b></p><div class="fl">${Object.entries(SHOP).map(([k, s]) => `<button class="btn it" data-k="${k}"><span>${s.n} ${'●'.repeat(up[k])}${'○'.repeat(s.max - up[k])}<br><small>${s.d}</small></span><small>${up[k] >= s.max ? 'máximo' : this.price(k, up[k]) + ' moedas'}</small></button>`).join('')}</div><button class="btn-primary" id="ok">Voltar</button>`, { guard: false });
    c.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k, u = Game.up(); if (u[k] >= SHOP[k].max) return; const p = this.price(k, u[k]); if (S.get('coins', 0) < p) return HX.toast('Moedas insuficientes'); S.set('coins', S.get('coins', 0) - p); u[k]++; S.set('up', u); HX.sfx('power'); this.hud(); this.shop(); }); HX.on(c, '#ok', () => Game.ready()); },
  price(k, lv) { return Math.round((k === 'bait' ? 120 : 100) * Math.pow(2, lv)); },
  coll() { const col = S.get('col', {}); const c = HX.overlay(`<h3>Coleção</h3><p>${Object.keys(col).length}/24 espécies</p><div class="fl">${Object.entries(SPOTS).map(([k, s]) => `<small style="margin-top:6px">${s.n}</small>` + s.fish.map(f => { const e = col[k + ':' + f[0]]; return `<div class="it"><span style="color:${e ? RAR[f[1]].c : 'var(--muted)'}">${e ? f[0] : '???'}</span><small>${RAR[f[1]].n}${e ? ` · ${e.n}× · ${e.kg.toLocaleString('pt-BR')} kg` : ''}</small></div>`; }).join('')).join('')}</div><button class="btn-primary" id="ok">Voltar</button>`, { guard: false }); HX.on(c, '#ok', () => Game.ready()); },
  missions() { const done = S.get('mis', []); const c = HX.overlay(`<h3>Missões</h3><div class="fl">${MISSIONS.map(m => `<div class="it"><span>${done.includes(m.id) ? '✓ ' : ''}${m.d}</span><small>${done.includes(m.id) ? 'concluída' : '+' + m.r}</small></div>`).join('')}</div><button class="btn-primary" id="ok">Voltar</button>`, { guard: false }); HX.on(c, '#ok', () => Game.ready()); },
  help: ['Toque e segure na tela para escolher a distância do lançamento; solte para lançar. Lançamentos mais longe atraem peixes melhores.', 'Espere a boia afundar e TOQUE logo (antes disso o peixe se assusta). Demorou demais, ele escapa.', 'Recolhendo: segure para puxar a linha. A tensão (barra à direita) sobe enquanto você segura e com a força do peixe; solte para aliviar. No vermelho a linha arrebenta; frouxa por muito tempo, o peixe solta.', 'Venda automática: cada peixe vira moedas. Use-as na Loja (vara, linha, isca) e para liberar novos locais. Complete missões e a coleção de 24 espécies.'],
  home() { const st = this.stats(); HXA.menu({ title: 'Fishing', text: `${SPOTS[Game.spot].n} · ${S.get('coins', 0)} moedas`, stats: [[st.caught, 'Peixes'], [st.species + '/24', 'Espécies'], [st.maxKg.toLocaleString('pt-BR') + ' kg', 'Maior peixe']], primary: ['Pescar', () => Game.ready()], help: this.help }); this.hud(); },
  pause() { if (Game.state === 'idle') return this.home(); HXA.menu({ title: 'Pausa', text: SPOTS[Game.spot].n, primary: ['Continuar', () => {}], buttons: [['Menu', () => this.home()]] }); }
};
UI.init(); HX.sw();
window.FS = { Game, UI, S, SPOTS };

/*@ {"name":"City","t1":"Ci","t2":"ty","theme":"#07090b","bg2":"radial-gradient(ellipse at 50% 0%,#16222a 0%,#07090b 66%)",
"hud":[["População","pop","0"],["Dinheiro","money","$ 0"],["Satisfação","hap","—"]],
"css":".tb{display:flex;gap:5px;overflow-x:auto;margin-top:6px;width:100%;max-width:620px;align-self:center;padding-bottom:2px}.tb button{flex:0 0 auto;min-width:62px;min-height:58px;border-radius:12px;border:1px solid var(--line);background:#141416;color:var(--fg);font:700 10px Manrope,sans-serif;line-height:1.15;padding:3px 4px}.tb button .i{font-size:20px;display:block}.tb button.on{border-color:var(--gold);background:#2a2214}.tb button[disabled]{opacity:.3}.cbar{display:flex;gap:6px;align-items:center;width:100%;max-width:620px;align-self:center;margin-top:6px;font:700 11px Manrope,sans-serif;color:var(--muted)}.cbar .btn{min-height:36px;padding:4px 10px;font-size:12px}.cbar span{flex:1}",
"body":"<div class=\"stage\" id=\"stage\"><canvas id=\"cv\"></canvas></div><div class=\"cbar\"><span id=\"info\">Escolha uma ferramenta e toque no mapa.</span><button class=\"btn\" id=\"btax\">Impostos</button><button class=\"btn\" id=\"bspeed\">▶ 1×</button></div><div class=\"tb\" id=\"tools\"></div>"} @*/
/* H-LUX CITY v1.0 — construa e administre uma cidade num mapa de 10×14.
   Estradas ligam tudo: prédios sem acesso a estrada não funcionam. Casas crescem (3 níveis) conforme a satisfação, que depende
   de empregos (comércio e indústria), energia, água, escolas, hospitais, segurança, parques, poluição e impostos.
   A cada mês: impostos entram, manutenção sai. Novos prédios são liberados com a população. Meta: 1.000 habitantes.
   Dívida abaixo de −$1.000 = falência. Módulos: B (prédios) · Sim · View · UI */
const S = HX.store('city');
const COLS = 10, ROWS = 14, T = 40, VW = COLS * T, VH = ROWS * T;
const B = {
  road: { n: 'Estrada', i: '🛣️', cost: 10, up: .5, c: '#3a3a40' }, house: { n: 'Casa', i: '🏠', cost: 60, up: 1, c: '#4a7a4a', unlock: 0 }, shop: { n: 'Comércio', i: '🏪', cost: 100, up: 2, c: '#3d6bff', jobs: 16, unlock: 0 },
  factory: { n: 'Indústria', i: '🏭', cost: 150, up: 3, c: '#8a6a3a', jobs: 30, poll: 3, unlock: 0 }, power: { n: 'Usina', i: '⚡', cost: 400, up: 12, c: '#e0b14a', supply: 40, poll: 2, unlock: 0 }, water: { n: 'Caixa d\'água', i: '💧', cost: 250, up: 6, c: '#3dacdc', supply: 40, unlock: 0 },
  park: { n: 'Praça', i: '🌳', cost: 80, up: 1, c: '#2f8a3a', r: 2, unlock: 0 }, school: { n: 'Escola', i: '🏫', cost: 500, up: 10, c: '#c86bff', r: 4, unlock: 60 }, clinic: { n: 'Hospital', i: '🏥', cost: 700, up: 14, c: '#e5484d', r: 4, unlock: 120 },
  police: { n: 'Polícia', i: '🚓', cost: 600, up: 12, c: '#2a4a9a', r: 4, unlock: 200 }, stadium: { n: 'Estádio', i: '🏟️', cost: 2500, up: 30, c: '#c9a45c', r: 6, unlock: 600 }, bulldoze: { n: 'Demolir', i: '🧹', cost: 5 }
};
const Sim = {
  g: null, money: 2000, month: 0, tax: 10, hap: .6, pop: 0, jobs: 0, workers: 0, msg: '', goal: false,
  newGame() { this.g = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); this.money = 2000; this.month = 0; this.tax = 10; this.hap = .6; this.goal = false; for (let r = 0; r < ROWS; r++) this.g[r][4] = { k: 'road' }; this.calc(); },
  load() { const d = S.get('save', null); if (!d) return this.newGame(); Object.assign(this, d); this.calc(); },
  save() { S.set('save', { g: this.g, money: this.money, month: this.month, tax: this.tax, hap: this.hap, goal: this.goal }); },
  at(r, c) { return r >= 0 && c >= 0 && r < ROWS && c < COLS ? this.g[r][c] : null; },
  roadAdj(r, c) { return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const x = this.at(r + a, c + b); return x && x.k === 'road'; }); },
  near(r, c, k) { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const b = this.g[y][x]; if (b && b.k === k && b.ok && Math.abs(y - r) + Math.abs(x - c) <= B[k].r) return true; } return false; },
  pollAt(r, c) { let p = 0; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const b = this.g[y][x]; if (b && B[b.k].poll && b.ok) { const d = Math.max(Math.abs(y - r), Math.abs(x - c)); if (d <= 2) p += B[b.k].poll * (3 - d) / 3; } } return p; },
  /* recalcula conexões, energia/água, empregos e satisfação de cada casa */
  calc() {
    let pw = 0, wt = 0, needP = 0, needW = 0, jobs = 0; const all = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const b = this.g[r][c]; if (!b || b.k === 'road') continue; b.conn = this.roadAdj(r, c); all.push([r, c, b]); if (!b.conn) continue; if (b.k === 'power') pw += B.power.supply; else if (b.k === 'water') wt += B.water.supply; else { needP++; needW++; } }
    // energia/água distribuídas por ordem (os primeiros ficam abastecidos)
    let ep = pw, ew = wt; for (const [r, c, b] of all) { if (b.k === 'power' || b.k === 'water') { b.ok = b.conn; b.pw = b.wt = true; continue; } b.pw = b.conn && ep-- > 0; b.wt = b.conn && ew-- > 0; b.ok = b.conn && b.pw && b.wt; if (b.ok && B[b.k].jobs) jobs += B[b.k].jobs; }
    let pop = 0; for (const [r, c, b] of all) if (b.k === 'house') pop += b.ok ? [5, 14, 32][(b.lv || 1) - 1] : 0;
    this.pop = pop; this.jobs = jobs; this.workers = Math.round(pop * .35); this.powerUse = [needP, pw]; this.waterUse = [needW, wt];
    const emp = this.workers ? Math.min(1, jobs / this.workers) : 1; let hs = 0, hn = 0;
    for (const [r, c, b] of all) { if (b.k !== 'house') continue; if (!b.ok) { b.h = 0; hn++; continue; } let h = .45 + emp * .25 - (this.tax - 8) * .025;
      if (this.near(r, c, 'park')) h += .08; if (this.near(r, c, 'school')) h += .1; if (this.near(r, c, 'clinic')) h += .1; if (this.near(r, c, 'police')) h += .08; if (this.near(r, c, 'stadium')) h += .1; h -= this.pollAt(r, c) * .07;
      if (pop > 60 && !this.near(r, c, 'school')) h -= .05; if (pop > 150 && !this.near(r, c, 'clinic')) h -= .05; if (pop > 300 && !this.near(r, c, 'police')) h -= .05;
      b.h = HX.clamp(h, 0, 1); hs += b.h; hn++; }
    this.hap = hn ? hs / hn : .6;
  },
  month_() {
    this.month++; let up = 0, inc = 0; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const b = this.g[r][c]; if (!b) continue; up += B[b.k].up; if (b.ok && b.k === 'shop') inc += 18 * this.tax / 10 * Math.min(1, this.pop / 40 + .3); if (b.ok && b.k === 'factory') inc += 24 * this.tax / 10; }
    inc += this.pop * .6 * this.tax / 10 * Math.min(1, this.jobs / Math.max(1, this.workers) + .2); this.money += Math.round(inc - up); this.lastIO = [Math.round(inc), Math.round(up)];
    // casas crescem ou encolhem conforme a satisfação
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const b = this.g[r][c]; if (!b || b.k !== 'house' || !b.ok) continue; b.lv = b.lv || 1; if (b.h > .58 && b.lv < 3 && Math.random() < .35) b.lv++; else if (b.h < .3 && b.lv > 1 && Math.random() < .3) b.lv--; }
    this.calc(); this.save(); UI.hud();
    if (this.pop >= 1000 && !this.goal) { this.goal = true; this.save(); HXA.menu({ title: 'Metrópole! 🏆', text: 'Sua cidade passou de 1.000 habitantes. Você pode continuar construindo.', primary: ['Continuar', () => HX.close()] }); }
    if (this.money < -1000) { HX.sfx('lose'); S.set('save', null); HXA.menu({ title: 'Falência', text: `A cidade quebrou no mês ${this.month}. Reduza a manutenção e equilibre impostos e empregos.`, stats: [[this.pop, 'População']], primary: ['Nova cidade', () => { this.newGame(); this.save(); HX.close(); UI.hud(); }] }); }
    else if (this.money < 0) HX.toast('Atenção: cofres no vermelho!', 1500);
    S.hub(`${this.pop} habitantes · mês ${this.month}`);
  },
  build(r, c, k) {
    const cur = this.g[r][c]; if (k === 'bulldoze') { if (!cur) return; if (this.money < B.bulldoze.cost) return HX.toast('Sem dinheiro'); this.money -= B.bulldoze.cost; this.g[r][c] = null; HX.sfx('hit'); }
    else { if (cur) return HX.toast('Espaço ocupado — use Demolir', 900); if ((B[k].unlock || 0) > this.pop) return HX.toast(`Libera com ${B[k].unlock} habitantes`); if (this.money < B[k].cost) return HX.toast('Dinheiro insuficiente'); this.money -= B[k].cost; this.g[r][c] = { k, lv: 1 }; HX.sfx('tap'); if (k !== 'road' && !this.roadAdj(r, c)) HX.toast('Sem estrada ao lado: não vai funcionar', 1200); }
    this.calc(); this.save(); UI.hud();
  }
};
const St = HXA.stage(VW, VH);
const View = {
  draw() {
    const g = St.begin(); g.fillStyle = '#23361f'; g.fillRect(0, 0, VW, VH); const G = Sim.g; if (!G) return;
    g.strokeStyle = 'rgba(255,255,255,.05)'; for (let x = 0; x <= COLS; x++) { g.beginPath(); g.moveTo(x * T, 0); g.lineTo(x * T, VH); g.stroke(); } for (let y = 0; y <= ROWS; y++) { g.beginPath(); g.moveTo(0, y * T); g.lineTo(VW, y * T); g.stroke(); }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const b = G[r][c]; if (!b) continue; const x = c * T, y = r * T, D = B[b.k];
      if (b.k === 'road') { g.fillStyle = D.c; g.fillRect(x, y, T, T); const n = [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([a, d]) => { const o = Sim.at(r + a, c + d); return o && o.k === 'road'; }); g.strokeStyle = 'rgba(241,220,166,.5)'; g.setLineDash([5, 5]); g.lineWidth = 1.5; g.beginPath(); if (n[0] || n[1]) { g.moveTo(x + T / 2, n[0] ? y : y + T / 2); g.lineTo(x + T / 2, n[1] ? y + T : y + T / 2); } if (n[2] || n[3]) { g.moveTo(n[2] ? x : x + T / 2, y + T / 2); g.lineTo(n[3] ? x + T : x + T / 2, y + T / 2); } g.stroke(); g.setLineDash([]); continue; }
      g.fillStyle = D.c; g.globalAlpha = b.ok ? 1 : .45; g.beginPath(); g.roundRect(x + 3, y + 3, T - 6, T - 6, 6); g.fill(); g.globalAlpha = 1;
      g.font = '20px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(b.k === 'house' ? ['🏠', '🏡', '🏢'][(b.lv || 1) - 1] : D.i, x + T / 2, y + T / 2 + 1);
      if (!b.ok) { g.fillStyle = '#e5484d'; g.font = '700 11px Manrope'; g.fillText(!b.conn ? '🚫' : !b.pw ? '⚡' : '💧', x + T - 9, y + 9); }
      else if (b.k === 'house') { g.fillStyle = b.h > .6 ? '#3ddc84' : b.h > .35 ? '#ffd54a' : '#e5484d'; g.beginPath(); g.arc(x + T - 7, y + 7, 3.5, 0, 7); g.fill(); } }
    if (UI.hover) { const [r, c] = UI.hover; g.strokeStyle = '#ffd54a'; g.lineWidth = 2; g.strokeRect(c * T + 1, r * T + 1, T - 2, T - 2); const D = B[UI.tool]; if (D && D.r) { g.fillStyle = 'rgba(255,213,74,.08)'; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (Math.abs(y - r) + Math.abs(x - c) <= D.r) g.fillRect(x * T, y * T, T, T); } }
    g.textBaseline = 'alphabetic';
  }
};
const UI = {
  tool: 'road', speed: 1, mT: 0, hover: null, drag: false,
  init() {
    Sim.load(); this.tools();
    const cell = e => { const [x, y] = St.toL(e); const c = Math.floor(x / T), r = Math.floor(y / T); return r >= 0 && c >= 0 && r < ROWS && c < COLS ? [r, c] : null; };
    St.cv.addEventListener('pointerdown', e => { e.preventDefault(); if (HX.isOpen()) return; St.cv.setPointerCapture(e.pointerId); const p = cell(e); if (!p) return; this.drag = true; this.last = p.join(); this.hover = p; this.apply(p); });
    St.cv.addEventListener('pointermove', e => { const p = cell(e); this.hover = p; if (this.drag && p && (this.tool === 'road' || this.tool === 'bulldoze') && p.join() !== this.last) { this.last = p.join(); this.apply(p); } });
    addEventListener('pointerup', () => { this.drag = false; });
    HX.$('#btax').onclick = () => this.taxes(); HX.$('#bspeed').onclick = () => { this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 4 : this.speed === 4 ? 0 : 1; HX.$('#bspeed').textContent = this.speed ? `▶ ${this.speed}×` : '⏸ pausa'; };
    addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { if (!HX.isOpen() && this.speed && Sim.g) { this.mT += dt * this.speed; if (this.mT >= 8) { this.mT = 0; Sim.month_(); } } View.draw(); });
    HX.life({ onHide: () => Sim.save() }); this.hud(); this.home();
  },
  apply([r, c]) { const b = Sim.g[r][c]; if (b && this.tool !== 'bulldoze') { if (b.k !== 'road') this.inspect(r, c); return; } Sim.build(r, c, this.tool); },
  inspect(r, c) { const b = Sim.g[r][c], D = B[b.k]; let t = `${D.n}: `; if (!b.conn) t += 'sem estrada'; else if (!b.pw) t += 'sem energia'; else if (!b.wt) t += 'sem água'; else if (b.k === 'house') t += `nível ${b.lv || 1}, satisfação ${Math.round(b.h * 100)}%, poluição ${Sim.pollAt(r, c).toFixed(1)}`; else t += 'funcionando' + (D.jobs ? ` · ${D.jobs} empregos` : ''); HX.$('#info').textContent = t; },
  tools() { HX.$('#tools').innerHTML = Object.entries(B).map(([k, D]) => `<button data-t="${k}" class="${k === this.tool ? 'on' : ''}" ${(D.unlock || 0) > Sim.pop ? 'disabled' : ''}><span class="i">${D.i}</span>${D.n}<br>${(D.unlock || 0) > Sim.pop ? '🔒' + D.unlock : '$' + D.cost}</button>`).join('');
    HX.$('#tools').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { this.tool = b.dataset.t; this.tools(); const D = B[this.tool]; HX.$('#info').textContent = `${D.n}: $${D.cost}${D.up ? ` · manutenção $${D.up}/mês` : ''}${D.jobs ? ` · ${D.jobs} empregos` : ''}${D.supply ? ` · abastece ${D.supply} prédios` : ''}${D.r ? ` · alcance ${D.r}` : ''}${D.poll ? ' · polui' : ''}`; }); },
  hud() { HX.$('#pop').textContent = Sim.pop; HX.$('#money').textContent = '$ ' + Sim.money; HX.$('#hap').textContent = Math.round(Sim.hap * 100) + '%'; if (this._lastPop !== Sim.pop) { this._lastPop = Sim.pop; this.tools(); } },
  taxes() { const io = Sim.lastIO || [0, 0]; const c = HX.overlay(`<h3>Prefeitura</h3><div class="kv" style="text-align:left;font-size:14px;line-height:1.7">Mês ${Sim.month} · População ${Sim.pop}<br>Empregos ${Sim.jobs} para ${Sim.workers} trabalhadores<br>Energia ${Sim.powerUse[0]}/${Sim.powerUse[1]} · Água ${Sim.waterUse[0]}/${Sim.waterUse[1]}<br>Último mês: +$${io[0]} arrecadação, −$${io[1]} manutenção</div><p>Imposto: <b id="tv">${Sim.tax}%</b></p><input type="range" id="tx" min="4" max="20" value="${Sim.tax}" style="width:100%;accent-color:#c9a45c"><p style="font-size:12px;color:var(--muted)">Impostos altos arrecadam mais, mas deixam a população insatisfeita.</p><button class="btn-primary" id="ok">Fechar</button>`, { guard: false });
    c.querySelector('#tx').oninput = e => { Sim.tax = +e.target.value; c.querySelector('#tv').textContent = Sim.tax + '%'; Sim.calc(); Sim.save(); this.hud(); }; HX.on(c, '#ok', () => HX.close()); },
  help: ['Escolha uma ferramenta na barra de baixo e toque no mapa (estradas e demolição podem ser arrastadas). Tocar num prédio existente mostra o estado dele.', 'Todo prédio precisa encostar numa estrada. Cada Usina e cada Caixa d\'água abastecem 40 prédios; sem energia ou água, o prédio para (ícone vermelho).', 'Casas crescem até prédio com boa satisfação (bolinha verde): empregos suficientes (Comércio e Indústria), praças, escolas, hospitais, polícia e impostos baixos ajudam; poluição de indústrias e usinas atrapalha.', 'A cada mês (8 s em 1×) entra a arrecadação e sai a manutenção. Meta: 1.000 habitantes. Abaixo de −$1.000 a cidade vai à falência. O botão ▶ muda a velocidade ou pausa.'],
  home() { HXA.menu({ title: 'City', text: `Mês ${Sim.month} · ${Sim.pop} habitantes`, stats: [['$' + Sim.money, 'Cofres'], [Math.round(Sim.hap * 100) + '%', 'Satisfação'], [Sim.goal ? "🏆" : "1.000", "Meta"]], primary: ['Continuar cidade', () => HX.close()], buttons: [['Nova cidade', () => { const c = HX.overlay('<h3>Começar outra cidade?</h3><p>A cidade atual será apagada.</p><button class="btn-primary" id="y">Sim</button><button class="btn" id="n" style="margin-top:6px">Cancelar</button>', { guard: false }); HX.on(c, '#y', () => { Sim.newGame(); Sim.save(); HX.close(); this.hud(); }); HX.on(c, '#n', () => this.home()); }]], help: this.help }); },
  pause() { this.home(); }
};
UI.init(); HX.sw();
window.CT = { Sim, UI, S, B };

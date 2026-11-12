/*@ {"name":"Hill Rider","t1":"Hill ","t2":"Rider","theme":"#080a07","bg2":"radial-gradient(ellipse at 50% 0%,#1d2a16 0%,#080a07 66%)",
"hud":[["Distância","dist","0 m"],["Combustível","fuel","100%"],["Moedas","coins","0"]],
"css":".pedals{width:100%;max-width:620px;box-sizing:border-box;align-self:center;display:flex;justify-content:space-between;gap:12px;margin-top:8px;padding:0 4px}.pedal{flex:1;min-height:74px;border-radius:16px;border:1px solid var(--line);background:linear-gradient(#1c1c20,#121214);color:var(--gold-2);font:800 15px Manrope,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none}.pedal.on{background:linear-gradient(#3a2f18,#1d170c);border-color:var(--gold)}.gar{display:grid;gap:6px;margin:8px 0}.gar .btn{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;min-height:46px}.gar small{color:var(--muted)}",
"body":"<div class=\"stage\" id=\"stage\"><canvas id=\"cv\"></canvas></div><div class=\"pedals\"><button class=\"pedal\" id=\"brake\">◀ Freio / ré</button><button class=\"pedal\" id=\"gas\">Acelerar ▶</button></div>"} @*/
/* H-LUX HILL RIDER v1.0 — dirija morro acima com física de suspensão, combustível e capotagem.
   Corpo rígido com duas rodas em molas; no ar, acelerar/frear gira o veículo. A cabeça do piloto não pode tocar o chão.
   Galões de combustível e moedas pelo caminho; moedas compram veículos, fases e melhorias (motor, suspensão, pneus, tanque).
   Módulos: VEH · STAGES · Terrain · Phys · Game · View · UI */
const S = HX.store('hillrider');
const VW = 400, VH = 520, PXM = 30;
const VEH = {
  jeep: { n: 'Jipe', cost: 0, a: 34, r: 15, mass: 1, eng: 620, top: 520, fuel: 1, air: 5.5, c: '#c9a45c' },
  moto: { n: 'Moto', cost: 400, a: 26, r: 14, mass: .7, eng: 700, top: 600, fuel: .8, air: 8, c: '#e5484d' },
  truck: { n: 'Caminhão', cost: 1000, a: 44, r: 18, mass: 1.6, eng: 560, top: 470, fuel: 1.6, air: 3.5, c: '#3d8bff' }
};
const STAGES = {
  campo: { n: 'Campo', cost: 0, g: 900, amp: 1, sky: ['#1b2a3a', '#3b5068'], ground: '#4a3a22', grass: '#3f7a3a', grip: 1 },
  deserto: { n: 'Deserto', cost: 600, g: 900, amp: 1.2, sky: ['#3a2a18', '#7a5a34'], ground: '#a27a44', grass: '#d2ab6e', grip: .92 },
  lua: { n: 'Lua', cost: 1500, g: 380, amp: 1.25, sky: ['#05060a', '#141826'], ground: '#5a5c66', grass: '#9aa0a8', grip: .9 }
};
const UPS = { eng: 'Motor', sus: 'Suspensão', tire: 'Pneus', tank: 'Tanque' };
const Terrain = {
  seed: 1, amp: 1,
  h(x) { const k = Math.min(1, Math.max(0, x) / 15000), A = this.amp * (28 + k * 52), s = this.seed;
    return 360 - (Math.sin(x * .004 + s) * A + Math.sin(x * .0097 + s * 2) * A * .55 + Math.sin(x * .021 + s * 3) * A * .18 * (.4 + k)) * (x < 300 ? x / 300 : 1); },
  slope(x) { return (this.h(x + 2) - this.h(x - 2)) / 4; }
};
const Phys = {
  /* corpo rígido: posição/ângulo + duas suspensões; integrado em subpassos */
  step(C, dt, input, up, st) {
    const V = C.v, cs = Math.cos(C.th), sn = Math.sin(C.th), G = st.g;
    const toW = (lx, ly) => [C.x + lx * cs - ly * sn, C.y + lx * sn + ly * cs];
    let fx = 0, fy = G * V.mass, tq = 0; C.ground = 0;
    const k = 140 * V.mass * (1 + up.sus * .12), damp = 13 * V.mass, rest = 22, maxC = 20;
    const eng = V.eng * (1 + up.eng * .14) * V.mass, grip = st.grip * (1 + up.tire * .12);
    for (const side of [-1, 1]) { const w = C.w[side < 0 ? 0 : 1]; const [ax, ay] = toW(side * V.a, 8);
      const dx = -sn, dy = cs; // eixo da suspensão (para "baixo" no chassi)
      let wx = ax + dx * rest, wy = ay + dy * rest; const gy = Terrain.h(wx); let comp = wy + V.r - gy; comp = Math.max(0, comp);
      if (comp > 0) { comp = Math.min(maxC + 6, comp); const prev = w.comp || 0; const rate = (comp - prev) / dt; w.comp = comp; C.ground++;
        const sl = Terrain.slope(wx), nl = Math.hypot(1, sl), nx = sl / nl, ny = -1 / nl, tx = 1 / nl, ty = sl / nl; // normal (para cima) e tangente
        let F = k * comp + damp * rate; if (comp > maxC) F += (comp - maxC) * k * 6; F = Math.max(0, F);
        let fxw = nx * F, fyw = ny * F;
        const vx = C.vx - C.om * (ay - C.y), vy = C.vy + C.om * (ax - C.x), vt = vx * tx + vy * ty;
        let drive = 0; if (input > 0 && C.fuel > 0) drive = eng * grip * Math.max(0, 1 - vt / (V.top * (1 + up.eng * .06))) * .72; if (input < 0 && C.fuel > 0) drive = vt > 20 ? -eng * 1.2 * grip * .5 : -eng * .45 * grip * .5 * Math.max(0, 1 + vt / 200);
        drive -= vt * .25 * V.mass; fxw += tx * drive; fyw += ty * drive;
        fx += fxw; fy += fyw; tq += (wx - C.x) * fyw - (wy - V.r * 0 - C.y) * fxw; w.x = wx; w.y = gy - V.r + Math.max(0, comp - maxC - 6) * 0; w.y = Math.min(wy, gy - V.r); w.x = wx;
      } else { w.comp = 0; w.x = wx; w.y = wy; }
      w.spin += (C.vx * cs + C.vy * sn) / V.r * dt; }
    // cantos do chassi não atravessam o chão
    for (const [lx, ly] of [[-V.a - 8, -14], [V.a + 8, -14], [-V.a - 8, 10], [V.a + 8, 10]]) { const [px, py] = toW(lx, ly), gy = Terrain.h(px); if (py > gy) { const pen = py - gy, vy = C.vy + C.om * (px - C.x); const F = pen * 900 * V.mass + Math.max(0, vy) * 40 * V.mass; fy -= F; tq += (px - C.x) * -F; C.vx *= .995; } }
    const I = V.mass * V.a * V.a * .9;
    if (!C.ground && C.fuel > 0) tq += input * V.air * I * (1 + up.tire * .05);
    C.vx += fx / V.mass * dt; C.vy += fy / V.mass * dt; C.om += tq / I * dt; C.om *= C.ground ? .985 : .998;
    C.x += C.vx * dt; C.y += C.vy * dt; C.th += C.om * dt;
    const [hx, hy] = toW(-4, -36); C.head = [hx, hy]; return hy + 7 > Terrain.h(hx);
  }
};
const Game = {
  state: 'idle', car: null, veh: 'jeep', stage: 'campo', items: [], got: 0, maxX: 0, stall: 0, input: 0, msg: '',
  start() {
    HX.close(); const st = STAGES[this.stage]; Terrain.seed = { campo: 1.3, deserto: 4.1, lua: 7.7 }[this.stage]; Terrain.amp = st.amp; const V = VEH[this.veh];
    this.car = { v: V, x: 120, y: Terrain.h(120) - 60, vx: 0, vy: 0, th: 0, om: 0, fuel: 100, w: [{ spin: 0 }, { spin: 0 }], ground: 0 }; this.items = []; this.got = 0; this.maxX = 120; this.stall = 0; this.nextItem = 400; this.nextFuel = 900;
    this.state = 'play'; this.gen(); UI.hud();
  },
  up() { const all = S.get('ups', {}); return Object.assign({ eng: 0, sus: 0, tire: 0, tank: 0 }, all[this.veh] || {}); },
  gen() { while (this.nextItem < this.car.x + 900) { const x = this.nextItem; if (x >= this.nextFuel) { this.items.push({ x, k: 'fuel' }); this.nextFuel += 1100 + x * .08; } else for (let i = 0; i < 5; i++) this.items.push({ x: x + i * 26, k: 'coin', v: x > 6000 ? 25 : x > 2500 ? 10 : 5 }); this.nextItem += 260 + Math.random() * 200; } },
  step(dt) {
    if (this.state !== 'play') return; const C = this.car, st = STAGES[this.stage], up = this.up(); this.input = UI.input();
    const n = 6; let crash = false; for (let i = 0; i < n; i++) if (Phys.step(C, dt / n, this.input, up, st)) crash = true;
    C.fuel -= dt * (1.6 + (this.input ? 1.4 : 0)) / (C.v.fuel * (1 + up.tank * .25)); if (C.fuel < 0) C.fuel = 0;
    this.maxX = Math.max(this.maxX, C.x);
    for (const it of this.items) if (!it.got && Math.abs(it.x - C.x) < 30) { const iy = Terrain.h(it.x) - (it.k === 'fuel' ? 26 : 22); if (Math.abs(iy - C.y) < 60) { it.got = true; if (it.k === 'fuel') { C.fuel = 100; HX.sfx('power'); HX.toast('Tanque cheio!', 700); } else { this.got += it.v; HX.sfx('coin'); } } }
    this.items = this.items.filter(i => i.x > C.x - 400 && !i.got); this.gen();
    if (crash) return this.end('Capotou!');
    if (C.fuel <= 0 && Math.hypot(C.vx, C.vy) < 15) { this.stall += dt; if (this.stall > 1.5) return this.end('Sem combustível'); } else this.stall = 0;
    if (C.x < 0) { C.x = 0; C.vx = Math.max(0, C.vx); }
    UI.hud();
  },
  dist() { return Math.floor((this.maxX - 120) / PXM); },
  end(msg) {
    this.state = 'over'; this.msg = msg; HX.sfx(msg === 'Capotou!' ? 'boom' : 'lose'); HX.vibrate(50); const d = this.dist(); const key = 'best_' + this.stage; const rec = HXA.best(S, key, d);
    const bonus = Math.floor(d / 10); S.set('coins', S.get('coins', 0) + this.got + bonus); const st = S.get('stats', { runs: 0, meters: 0 }); st.runs++; st.meters += d; S.set('stats', st);
    S.hub(`Recorde ${Math.max(...Object.keys(STAGES).map(k => S.get('best_' + k, 0)))} m · ${S.get('coins', 0)} moedas`);
    setTimeout(() => HXA.menu({ title: msg, text: `${STAGES[this.stage].n} · ${VEH[this.veh].n}${rec && d ? ' · novo recorde!' : ''}`, stats: [[d + ' m', 'Distância'], [this.got + bonus, 'Moedas ganhas'], [S.get(key, 0) + ' m', 'Recorde']], primary: ['De novo', () => this.start()], buttons: [['Garagem', () => UI.garage()], ['Menu', () => UI.home()]] }), 700);
  }
};
const St = HXA.stage(VW, VH);
const View = {
  draw() {
    const g = St.begin(), G = Game, C = G.car, st = STAGES[G.stage]; const sky = g.createLinearGradient(0, 0, 0, VH); sky.addColorStop(0, st.sky[0]); sky.addColorStop(1, st.sky[1]); g.fillStyle = sky; g.fillRect(0, 0, VW, VH); if (!C) return;
    const cx = C.x - VW * .35, cy = C.y - VH * .5;
    if (G.stage === 'lua') { g.fillStyle = '#e8e2cf'; for (let i = 0; i < 50; i++) g.fillRect((i * 83 - cx * .05) % VW + (i * 83 - cx * .05 < 0 ? VW : 0), (i * 47) % 300, 1.5, 1.5); g.fillStyle = '#3d8bff'; g.beginPath(); g.arc(320, 70, 22, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(0, VH); for (let x = 0; x <= VW; x += 10) g.lineTo(x, 260 + Math.sin((x + cx * .3) * .01) * 40 - (cy * .2)); g.lineTo(VW, VH); g.fill();
    g.save(); g.translate(-cx, -cy);
    g.fillStyle = st.ground; g.beginPath(); g.moveTo(cx - 10, cy + VH + 10); for (let x = cx - 10; x <= cx + VW + 10; x += 6) g.lineTo(x, Terrain.h(x)); g.lineTo(cx + VW + 10, cy + VH + 10); g.fill();
    g.strokeStyle = st.grass; g.lineWidth = 6; g.beginPath(); for (let x = cx - 10; x <= cx + VW + 10; x += 6) g.lineTo(x, Terrain.h(x) + 2); g.stroke();
    g.fillStyle = 'rgba(241,220,166,.5)'; g.font = '600 11px Manrope'; g.textAlign = 'center'; for (let m = Math.ceil((cx - 120) / PXM / 50) * 50; m * PXM + 120 < cx + VW; m += 50) { const x = m * PXM + 120; g.fillRect(x - 1, Terrain.h(x) - 40, 2, 40); g.fillText(m + ' m', x, Terrain.h(x) - 44); }
    for (const it of G.items) { const y = Terrain.h(it.x) - 22; if (it.k === 'fuel') { g.fillStyle = '#e5484d'; g.fillRect(it.x - 10, y - 14, 20, 26); g.fillStyle = '#fff'; g.font = '800 12px Manrope'; g.fillText('F', it.x, y + 4); } else { g.fillStyle = it.v > 10 ? '#dfe7ff' : it.v > 5 ? '#ffd54a' : '#c07a3a'; g.beginPath(); g.arc(it.x, y, 8, 0, 7); g.fill(); } }
    const V = C.v; for (const w of C.w) { g.save(); g.translate(w.x, w.y); g.rotate(w.spin); g.fillStyle = '#16161a'; g.beginPath(); g.arc(0, 0, V.r, 0, 7); g.fill(); g.strokeStyle = '#8a8f99'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, V.r * .55, 0, 7); g.moveTo(-V.r * .55, 0); g.lineTo(V.r * .55, 0); g.moveTo(0, -V.r * .55); g.lineTo(0, V.r * .55); g.stroke(); g.restore(); }
    g.save(); g.translate(C.x, C.y); g.rotate(C.th);
    g.strokeStyle = '#555'; g.lineWidth = 3; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * V.a, 8); g.lineTo(s * V.a, 20); g.stroke(); }
    g.fillStyle = V.c; if (G.veh === 'moto') { g.beginPath(); g.moveTo(-V.a - 6, 6); g.lineTo(V.a + 4, 0); g.lineTo(V.a - 6, -10); g.lineTo(-10, -8); g.closePath(); g.fill(); }
    else { g.beginPath(); g.roundRect(-V.a - 8, -8, V.a * 2 + 16, 20, 5); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-V.a - 8, 6, V.a * 2 + 16, 4); if (G.veh === 'truck') { g.fillStyle = V.c; g.fillRect(V.a - 18, -26, 26, 20); } }
    g.fillStyle = '#2a2a30'; g.fillRect(-10, -26, 10, 20); g.fillStyle = '#f1c27d'; g.beginPath(); g.arc(-4, -32, 7, 0, 7); g.fill(); g.fillStyle = '#e0b14a'; g.beginPath(); g.arc(-4, -34, 7, Math.PI, 0); g.fill();
    g.restore(); g.restore();
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(12, 12, 120, 10); g.fillStyle = C.fuel > 25 ? '#3ddc84' : '#e5484d'; g.fillRect(12, 12, 120 * C.fuel / 100, 10); g.strokeStyle = 'rgba(255,255,255,.3)'; g.strokeRect(12, 12, 120, 10);
    g.fillStyle = '#f1dca6'; g.font = '800 20px Manrope'; g.textAlign = 'right'; g.fillText(G.dist() + ' m', VW - 14, 30);
  }
};
const UI = {
  gas: false, brake: false,
  init() {
    const hold = (id, k) => { const b = HX.$('#' + id); const on = v => e => { e.preventDefault(); this[k] = v; b.classList.toggle('on', v); }; b.addEventListener('pointerdown', on(true)); b.addEventListener('pointerup', on(false)); b.addEventListener('pointerleave', on(false)); b.addEventListener('pointercancel', on(false)); b.addEventListener('contextmenu', e => e.preventDefault()); };
    hold('gas', 'gas'); hold('brake', 'brake');
    addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'Escape') this.pause(); });
    HX.$('#menu').onclick = () => this.pause(); HXA.loop(dt => { Game.step(dt); View.draw(); });
    HX.life({ onHide: () => { if (Game.state === 'play') this.pause(); } }); this.home();
  },
  input() { if (this.gas || HXA.key('ArrowRight', 'd', 'ArrowUp', 'w')) return 1; if (this.brake || HXA.key('ArrowLeft', 'a', 'ArrowDown', 's')) return -1; return 0; },
  hud() { const C = Game.car; HX.$('#dist').textContent = Game.dist() + ' m'; HX.$('#fuel').textContent = Math.ceil(C.fuel) + '%'; HX.$('#coins').textContent = Game.got; },
  help: ['Segure "Acelerar" para ir em frente e "Freio / ré" para frear ou dar ré. No PC: setas ← → (ou A/D).', 'No ar, acelerar gira o veículo para trás e frear gira para frente — use isso para aterrissar com as duas rodas.', 'Se a cabeça do piloto tocar o chão, você capota. O combustível acaba com o tempo; pegue os galões vermelhos (F).', 'Moedas (e 1 moeda a cada 10 m) compram veículos, fases e melhorias na Garagem.'],
  home() { const st = S.get('stats', { runs: 0, meters: 0 });
    HXA.menu({ title: 'Hill Rider', text: `${VEH[Game.veh].n} · ${STAGES[Game.stage].n}`, stats: [[S.get('coins', 0), 'Moedas'], [S.get('best_' + Game.stage, 0) + ' m', 'Recorde aqui'], [st.meters + ' m', 'Total rodado']], primary: ['Dirigir', () => Game.start()], buttons: [['Garagem', () => this.garage()]], help: this.help }); },
  garage() {
    const own = S.get('own', ['jeep', 'campo']), coins = S.get('coins', 0), up = Game.up();
    const row = (id, label, info, act) => `<button class="btn" data-a="${act}" data-id="${id}"><span>${label}</span><small>${info}</small></button>`;
    const c = HX.overlay(`<h3>Garagem</h3><p>Moedas: <b>${coins}</b></p><small>Veículo</small><div class="gar">${Object.entries(VEH).map(([k, v]) => row(k, (Game.veh === k ? '✓ ' : '') + v.n, own.includes(k) ? (Game.veh === k ? 'em uso' : 'usar') : v.cost + ' moedas', 'veh')).join('')}</div>
      <small>Fase</small><div class="gar">${Object.entries(STAGES).map(([k, v]) => row(k, (Game.stage === k ? '✓ ' : '') + v.n, own.includes(k) ? (Game.stage === k ? 'selecionada' : 'escolher') : v.cost + ' moedas', 'stage')).join('')}</div>
      <small>Melhorias do ${VEH[Game.veh].n}</small><div class="gar">${Object.entries(UPS).map(([k, n]) => row(k, `${n} ${'●'.repeat(up[k])}${'○'.repeat(5 - up[k])}`, up[k] >= 5 ? 'máximo' : (up[k] + 1) * 150 + ' moedas', 'up')).join('')}</div>
      <button class="btn-primary" id="gok">Voltar</button>`, { guard: false });
    c.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const id = b.dataset.id, a = b.dataset.a; let co = S.get('coins', 0);
      if (a === 'veh' || a === 'stage') { const cost = (a === 'veh' ? VEH : STAGES)[id].cost; if (!own.includes(id)) { if (co < cost) return HX.toast('Moedas insuficientes'); co -= cost; own.push(id); S.set('own', own); S.set('coins', co); HX.sfx('coin'); } if (a === 'veh') Game.veh = id; else Game.stage = id; S.set('sel', { veh: Game.veh, stage: Game.stage }); }
      else { const all = S.get('ups', {}); const u = Object.assign({ eng: 0, sus: 0, tire: 0, tank: 0 }, all[Game.veh] || {}); if (u[id] >= 5) return; const cost = (u[id] + 1) * 150; if (co < cost) return HX.toast('Moedas insuficientes'); u[id]++; all[Game.veh] = u; S.set('ups', all); S.set('coins', co - cost); HX.sfx('power'); }
      this.garage(); });
    HX.on(c, '#gok', () => this.home());
  },
  pause() { if (Game.state !== 'play') return Game.state === 'pause' ? null : this.home(); Game.state = 'pause'; this.gas = this.brake = false;
    HXA.menu({ title: 'Pausa', text: `${Game.dist()} m`, primary: ['Continuar', () => { Game.state = 'play'; }], buttons: [['Recomeçar', () => Game.start()], ['Menu', () => this.home()]] }); }
};
{ const sel = S.get('sel', null); if (sel) { Game.veh = sel.veh; Game.stage = sel.stage; } }
UI.init(); HX.sw();
window.HR = { Game, UI, S, Terrain, Phys, VEH, STAGES };

/* H-LUX arcade — infraestrutura comum dos jogos em canvas da 4ª leva (sem regras de jogo).
   HXA.stage(W, H, opts): canvas em unidades lógicas, ajustado à tela e à densidade de pixels.
   HXA.loop(step): laço de animação com dt limitado.  HXA.keys: teclas pressionadas.
   HXA.stick(stage, opts): joystick virtual flutuante (toque) com zona esquerda/direita/toda a tela.
   HXA.menu(opts): tela inicial/fim padronizada com recorde. */
(function () {
  'use strict';
  const A = {};
  A.keys = new Set();
  addEventListener('keydown', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; A.keys.add(k); if (k === ' ' || k.startsWith('Arrow')) { if (!document.getElementById('hx-ov')) e.preventDefault(); } });
  addEventListener('keyup', e => A.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
  addEventListener('blur', () => A.keys.clear());
  A.key = (...ks) => ks.some(k => A.keys.has(k));
  A.axis = () => { let x = 0, y = 0; if (A.key('ArrowLeft', 'a')) x--; if (A.key('ArrowRight', 'd')) x++; if (A.key('ArrowUp', 'w')) y--; if (A.key('ArrowDown', 's')) y++; const l = Math.hypot(x, y) || 1; return { x: x / l, y: y / l, on: !!(x || y) }; };

  A.stage = function (W, H, opts = {}) {
    const host = opts.host || document.getElementById('stage');
    const cv = opts.canvas || document.getElementById('cv');
    const st = { W, H, cv, g: cv.getContext('2d'), k: 1, dpr: 1, reserve: opts.reserve || 0 };
    st.fit = () => { const w = host.clientWidth - 8, h = host.clientHeight - 8 - st.reserve; st.k = Math.max(.1, Math.min(w / W, h / H)); st.dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(W * st.k * st.dpr); cv.height = Math.round(H * st.k * st.dpr); cv.style.width = W * st.k + 'px'; cv.style.height = H * st.k + 'px'; if (opts.onFit) opts.onFit(st); };
    st.begin = () => { st.g.setTransform(st.k * st.dpr, 0, 0, st.k * st.dpr, 0, 0); return st.g; };
    st.toL = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / st.k, (e.clientY - r.top) / st.k]; };
    new ResizeObserver(() => st.fit()).observe(host); st.fit();
    return st;
  };

  A.loop = function (step) { let last = performance.now(); const f = t => { const dt = Math.min(.05, Math.max(0, (t - last) / 1000)); last = t; step(dt); requestAnimationFrame(f); }; requestAnimationFrame(f); };

  // joystick virtual: aparece onde o dedo toca dentro da zona. Com mouse, segue o cursor em relação ao "centro" informado.
  A.stick = function (st, opts = {}) {
    const zone = opts.zone || 'any', R = opts.radius || 46, s = { x: 0, y: 0, active: false, id: null, ox: 0, oy: 0, px: 0, py: 0, mouse: false, tap: false };
    const inZone = e => { const r = st.cv.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width; return zone === 'any' || (zone === 'left' ? fx < .5 : fx >= .5); };
    st.cv.addEventListener('pointerdown', e => { if (s.id !== null || !inZone(e)) return; if (e.pointerType === 'mouse' && opts.mouse === false) return; try { st.cv.setPointerCapture(e.pointerId); } catch (_) {}
      s.id = e.pointerId; s.mouse = e.pointerType === 'mouse'; [s.ox, s.oy] = st.toL(e); s.px = s.ox; s.py = s.oy; s.active = true; s.t0 = performance.now(); s.x = 0; s.y = 0; if (opts.onDown) opts.onDown(s, e); });
    st.cv.addEventListener('pointermove', e => { if (e.pointerId !== s.id) return; [s.px, s.py] = st.toL(e); const dx = s.px - s.ox, dy = s.py - s.oy, d = Math.hypot(dx, dy) * st.k; const m = Math.min(1, d / R); const a = Math.atan2(dy, dx); s.x = d > 4 ? Math.cos(a) * m : 0; s.y = d > 4 ? Math.sin(a) * m : 0; });
    const up = e => { if (e.pointerId !== s.id) return; s.tap = performance.now() - s.t0 < 220 && Math.hypot(s.px - s.ox, s.py - s.oy) * st.k < 12; s.id = null; s.active = false; s.x = 0; s.y = 0; if (opts.onUp) opts.onUp(s, e); };
    st.cv.addEventListener('pointerup', up); st.cv.addEventListener('pointercancel', up);
    s.draw = g => { if (!s.active || s.mouse) return; const r = R / st.k; g.save(); g.globalAlpha = .35; g.strokeStyle = '#f1dca6'; g.lineWidth = 2; g.beginPath(); g.arc(s.ox, s.oy, r, 0, 7); g.stroke(); g.globalAlpha = .55; g.fillStyle = '#f1dca6'; g.beginPath(); g.arc(s.ox + s.x * r, s.oy + s.y * r, r * .42, 0, 7); g.fill(); g.restore(); };
    return s;
  };

  // tela inicial/fim padronizada: { title, text, best, stats:[[valor, rótulo]], primary:[rótulo, fn], buttons:[[rótulo, fn]], help:[...], guard }
  A.menu = function (o) {
    const c = HX.overlay(`<h3>${o.title}</h3>${o.text ? `<p>${o.text}</p>` : ''}${o.stats ? `<div class="kv">${o.stats.map(([v, l]) => `<div><b>${v}</b><small>${l}</small></div>`).join('')}</div>` : ''}${o.html || ''}${o.music && window.HXM ? '<div id="hxa-m"></div>' : ''}${o.primary ? '<button class="btn-primary" id="hxa-p">' + o.primary[0] + '</button>' : ''}${(o.buttons || []).map((b, i) => `<button class="btn" id="hxa-b${i}">${b[0]}</button>`).join('')}${o.help ? '<div class="row2"><button class="btn" id="hxa-h">Como jogar</button><button class="btn" id="hxa-s">Som: ' + (HX.sound() ? 'on' : 'off') + '</button></div>' : ''}`, { guard: o.guard !== undefined ? o.guard : false });
    if (o.primary) HX.on(c, '#hxa-p', () => { HX.close(); o.primary[1](); });
    (o.buttons || []).forEach((b, i) => HX.on(c, '#hxa-b' + i, () => { HX.close(); b[1](); }));
    if (o.help) { HX.on(c, '#hxa-h', () => HX.help('Como jogar', o.help, () => A.menu(o))); HX.on(c, '#hxa-s', () => { HX.sound(!HX.sound()); A.menu(o); }); }
    if (o.music && window.HXM) HXM.controls(c.querySelector('#hxa-m'), o.music === true ? null : o.music);
    return c;
  };
  // recorde simples por jogo
  A.best = (S, key, v) => { const b = S.get(key, 0); if (v > b) { S.set(key, v); return true; } return false; };
  A.rand = (a, b) => a + Math.random() * (b - a);
  A.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  window.HXA = A;
})();

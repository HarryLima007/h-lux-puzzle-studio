/* H-LUX MUSIC v1.0 — trilhas originais geradas por síntese (WebAudio), sem arquivos nem licenças de terceiros.
   Cada música é definida por andamento, tonalidade, progressão de acordes e semente; a mesma definição gera
   sempre a mesma composição e o mesmo mapa de notas (usado por Dash, Rhythm e Guitar).
   API: HXM.song(def) → { bpm, beat, dur, notes:[{t,beat,p,kind,len}], start(at?), stop(), now(), playing }
        HXM.vol() / HXM.setVol(0..1) / HXM.on() / HXM.setOn(bool) / HXM.controls(el) */
(function () {
  const KEY = 'hlux.music';
  let A = null, master = null;
  const cfg = () => { try { return Object.assign({ vol: .7, on: true }, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return { vol: .7, on: true }; } };
  const save = c => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} };
  function ctx() {
    if (!A) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; A = new C(); master = A.createGain(); master.connect(A.destination); apply(); }
    if (A.state === 'suspended') A.resume(); return A;
  }
  function apply() { if (!master) return; const c = cfg(); master.gain.value = c.on ? c.vol * .8 : 0; }
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  const SCALES = { minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10] };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  /* compõe: retorna eventos de áudio e o mapa de notas jogáveis */
  function compose(def) {
    const R = rng(def.seed || 7), bpm = def.bpm || 120, beat = 60 / bpm, bars = def.bars || 32, sc = SCALES[def.scale || 'minor'], root = def.root || 57;
    const prog = def.prog || [0, 5, 3, 4], ev = [], notes = [];
    const deg = d => root + sc[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
    // motivos de melodia: 4 padrões rítmicos (em semicolcheias) reaproveitados — dá forma de "música" e não de ruído
    const motifs = []; for (let m = 0; m < 4; m++) { const pat = []; let pos = 0; while (pos < 16) { const len = [2, 2, 4, 1, 3, 2][Math.floor(R() * 6)]; if (R() < .78) pat.push({ pos, len: Math.min(len, 16 - pos), step: Math.floor(R() * 5) - 1 }); pos += len; } motifs.push(pat); }
    const intro = def.intro || 2;
    for (let b = 0; b < bars; b++) {
      const t0 = (b * 4) * beat, ch = prog[b % prog.length], section = Math.floor(b / 8) % 4, drop = b >= intro;
      // acordes (pad)
      [0, 2, 4].forEach(k => ev.push({ t: t0, d: beat * 4, f: hz(deg(ch + k) - 12), w: 'pad', v: .07 }));
      // baixo
      for (let q = 0; q < 4; q++) if (drop || q === 0) ev.push({ t: t0 + q * beat, d: beat * .45, f: hz(deg(ch) - 24 + (q === 2 && section % 2 ? 7 : 0)), w: 'bass', v: .22 });
      // bateria
      for (let s = 0; s < 16; s++) { const t = t0 + s * beat / 4;
        if (s % 4 === 0 && drop) { ev.push({ t, w: 'kick', v: .55 }); notes.push({ t, beat: b * 4 + s / 4, kind: 'kick', p: 0 }); }
        if ((s === 4 || s === 12) && drop) { ev.push({ t, w: 'snare', v: .35 }); notes.push({ t, beat: b * 4 + s / 4, kind: 'snare', p: 1 }); }
        if (s % 2 === 0 && (drop || b >= 1)) ev.push({ t, w: 'hat', v: s % 4 ? .07 : .1 }); }
      // melodia (entra depois da introdução, descansa em algumas seções)
      if (drop && !(section === 2 && b % 2)) { const mo = motifs[(Math.floor(b / 2) + section) % 4]; let d0 = ch + 7;
        for (const n of mo) { d0 += n.step; const pitch = deg(d0); const t = t0 + n.pos * beat / 4; ev.push({ t, d: n.len * beat / 4 * .9, f: hz(pitch), w: 'lead', v: .13 }); notes.push({ t, beat: b * 4 + n.pos / 4, kind: 'lead', p: pitch, len: n.len / 4 }); } }
    }
    ev.sort((a, b) => a.t - b.t); notes.sort((a, b) => a.t - b.t);
    return { bpm, beat, dur: bars * 4 * beat, ev, notes };
  }
  function voice(e, at) {
    const t = at + e.t, g = A.createGain(); g.connect(master);
    if (e.w === 'kick') { const o = A.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + .12); g.gain.setValueAtTime(e.v, t); g.gain.exponentialRampToValueAtTime(.001, t + .25); o.connect(g); o.start(t); o.stop(t + .26); return; }
    if (e.w === 'snare' || e.w === 'hat') { const len = e.w === 'hat' ? .04 : .16, n = Math.floor(A.sampleRate * len), buf = A.createBuffer(1, n, A.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const s = A.createBufferSource(); s.buffer = buf; const f = A.createBiquadFilter(); f.type = e.w === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = e.w === 'hat' ? 7000 : 1800; s.connect(f); f.connect(g); g.gain.setValueAtTime(e.v, t); g.gain.exponentialRampToValueAtTime(.001, t + len); s.start(t); return; }
    const o = A.createOscillator(); o.type = e.w === 'bass' ? 'triangle' : e.w === 'lead' ? 'square' : 'sawtooth'; o.frequency.value = e.f;
    let out = o; if (e.w !== 'bass') { const f = A.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = e.w === 'pad' ? 900 : 2400; o.connect(f); out = f; }
    out.connect(g); const atk = e.w === 'pad' ? .2 : .01; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(e.v, t + atk); g.gain.setValueAtTime(e.v, t + Math.max(atk, e.d - .05)); g.gain.linearRampToValueAtTime(0, t + e.d); o.start(t); o.stop(t + e.d + .02);
  }
  function song(def) {
    const c = compose(def); let at = 0, idx = 0, timer = null, playing = false, wallStart = 0;
    const S = Object.assign(c, {
      start(offset = 0) { S.stop(); const a = ctx(); playing = true; wallStart = performance.now() / 1000 - offset;
        if (!a) return S; at = a.currentTime + .08 - offset; idx = c.ev.findIndex(e => e.t >= offset); if (idx < 0) idx = c.ev.length;
        const pump = () => { const horizon = a.currentTime + .25; while (idx < c.ev.length && at + c.ev[idx].t < horizon) { voice(c.ev[idx], at); idx++; } };
        pump(); timer = setInterval(pump, 60); return S; },
      stop() { playing = false; if (timer) clearInterval(timer); timer = null; },
      /* tempo da música em segundos, a partir do relógio de áudio (preciso) ou do relógio da página sem áudio */
      now() { if (!playing) return -1; return A ? A.currentTime - at : performance.now() / 1000 - wallStart; }
    });
    Object.defineProperty(S, 'playing', { get: () => playing });
    return S;
  }
  function controls(host, onChange) {
    const c = cfg(); host.innerHTML = `<div style="display:flex;align-items:center;gap:10px;justify-content:center;margin:8px 0"><label style="font-size:13px;color:var(--muted);display:flex;align-items:center;gap:6px"><input type="checkbox" id="hxm-on" ${c.on ? 'checked' : ''}> Música</label><input type="range" id="hxm-vol" min="0" max="100" value="${Math.round(c.vol * 100)}" style="flex:1;max-width:170px;accent-color:#c9a45c" aria-label="Volume da música"></div>`;
    host.querySelector('#hxm-on').onchange = e => { const k = cfg(); k.on = e.target.checked; save(k); apply(); onChange && onChange(); };
    host.querySelector('#hxm-vol').oninput = e => { const k = cfg(); k.vol = e.target.value / 100; save(k); apply(); onChange && onChange(); };
  }
  window.HXM = { song, compose, ctx, controls, vol: () => cfg().vol, on: () => cfg().on, setVol(v) { const k = cfg(); k.vol = v; save(k); apply(); }, setOn(b) { const k = cfg(); k.on = b; save(k); apply(); } };
})();

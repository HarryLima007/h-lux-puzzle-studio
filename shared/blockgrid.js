/* H-LUX blockgrid — motor de encaixe de peças sem gravidade (usado por Blockudoku e Wood Blocks).
   Cada jogo passa sua configuração: tamanho, regiões que eliminam, peças, pontuação e textos.
   O motor cuida de: regras de encaixe, eliminação, combos, fim de jogo, arrastar-e-soltar,
   salvamento e recordes (no armazenamento do próprio jogo). */
(function () {
  'use strict';
  // "##/#." → [[0,0],[1,0],[0,1]]
  function parse(str) { const out = []; str.split('/').forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') out.push([x, y]); })); return out; }
  function norm(cells) { const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1])); return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); }
  function rotations(cells) {
    const seen = new Set(), out = []; let cur = cells;
    for (let k = 0; k < 4; k++) { const n = norm(cur), key = n.join(';'); if (!seen.has(key)) { seen.add(key); out.push(n); } cur = cur.map(([x, y]) => [-y, x]); }
    return out;
  }
  // biblioteca: [{shape:'##', weight, rotate:true}] → lista de peças distintas com peso
  function library(defs) { const lib = []; defs.forEach(d => { const base = parse(d.shape), list = d.rotate === false ? [norm(base)] : rotations(base); list.forEach(cells => lib.push({ cells, w: d.weight / list.length, tone: d.tone || 0 })); }); return lib; }

  function create(cfg) {
    const N = cfg.size, S = HX.store(cfg.id), lib = library(cfg.pieces);
    const G = {
      s: null, cfg, lib, N, S,
      fresh() { return { board: new Array(N * N).fill(0), tray: this.deal(), score: 0, combo: 0, placed: 0, cleared: 0, over: false }; },
      pick() { let t = Math.random() * lib.reduce((a, p) => a + p.w, 0); for (const p of lib) { t -= p.w; if (t <= 0) return { cells: p.cells, tone: p.tone }; } return { cells: lib[0].cells, tone: lib[0].tone }; },
      deal() { return [this.pick(), this.pick(), this.pick()]; },
      fits(cells, ox, oy, board = this.s.board) { for (const [x, y] of cells) { const gx = ox + x, gy = oy + y; if (gx < 0 || gy < 0 || gx >= N || gy >= N || board[gy * N + gx]) return false; } return true; },
      anyFit(piece) { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (this.fits(piece.cells, x, y)) return true; return false; },
      // regiões completas após colocar (linhas, colunas e, se houver, quadrados)
      fullRegions(board) {
        const regs = [];
        for (let y = 0; y < N; y++) { const r = []; for (let x = 0; x < N; x++) r.push(y * N + x); if (r.every(i => board[i])) regs.push(r); }
        for (let x = 0; x < N; x++) { const c = []; for (let y = 0; y < N; y++) c.push(y * N + x); if (c.every(i => board[i])) regs.push(c); }
        if (cfg.boxes) for (let by = 0; by < N; by += cfg.boxes) for (let bx = 0; bx < N; bx += cfg.boxes) { const b = []; for (let y = 0; y < cfg.boxes; y++) for (let x = 0; x < cfg.boxes; x++) b.push((by + y) * N + bx + x); if (b.every(i => board[i])) regs.push(b); }
        return regs;
      },
      place(slot, ox, oy) {
        const s = this.s, piece = s.tray[slot]; if (!piece || !this.fits(piece.cells, ox, oy)) return null;
        const cells = piece.cells.map(([x, y]) => (oy + y) * N + ox + x);
        cells.forEach(i => s.board[i] = piece.tone + 1);
        const regs = this.fullRegions(s.board), clearSet = new Set(regs.flat());
        s.combo = regs.length ? s.combo + 1 : 0;
        const pts = cfg.score(cells.length, regs.length, s.combo); s.score += pts; s.placed++; s.cleared += regs.length;
        clearSet.forEach(i => s.board[i] = 0);
        s.tray[slot] = null;
        if (s.tray.every(p => !p)) s.tray = this.deal();
        s.over = !s.tray.some(p => p && this.anyFit(p));
        return { cells, cleared: [...clearSet], regions: regs.length, pts };
      },
      best() { return S.get('best', 0); },
      save() { const s = this.s; if (s.over) { S.del('game'); S.hub(null); return; } S.set('game', s); if (s.placed) S.hub(`Em andamento · ${s.score} pts`); },
      finish() { const s = this.s, best = this.best(), rec = s.score > best; if (rec) S.set('best', s.score); const st = S.get('stats', { games: 0, cleared: 0, bestCombo: 0 }); st.games++; st.cleared += s.cleared; S.set('stats', st); S.del('game'); S.hub(`Recorde ${Math.max(best, s.score)} pts`); return rec; }
    };
    return G;
  }

  /* ---------- Interface: tabuleiro, bandeja e arrastar ---------- */
  function mount(G, el) {
    const N = G.N, cfg = G.cfg;
    el.board.style.gridTemplateColumns = `repeat(${N}, var(--c))`;
    el.board.innerHTML = Array.from({ length: N * N }, (_, i) => { const x = i % N, y = Math.floor(i / N); const alt = cfg.boxes && ((Math.floor(x / cfg.boxes) + Math.floor(y / cfg.boxes)) % 2) ? ' alt' : ''; return `<div class="bc${alt}" data-i="${i}"></div>`; }).join('');
    const cells = [...el.board.children];
    let cs = 32, gap = 0, padL = 0;
    const V = {
      size() {
        const st = el.stage, cst = getComputedStyle(el.board);
        gap = parseFloat(cst.columnGap) || 0; padL = parseFloat(cst.paddingLeft) || 0;
        const W = st.clientWidth - 8 - padL * 2 - gap * (N - 1), Hh = st.clientHeight - 8 - padL * 2 - gap * (N - 1);
        cs = Math.floor(Math.max(18, Math.min(W / N, Hh / (N + 3.6), 58)));
        document.documentElement.style.setProperty('--c', cs + 'px');
        document.documentElement.style.setProperty('--t', Math.floor(cs * .55) + 'px');
        this.render();
      },
      render() {
        const s = G.s;
        cells.forEach((c, i) => { const v = s.board[i]; c.className = 'bc' + (cfg.boxes && ((Math.floor((i % N) / cfg.boxes) + Math.floor(Math.floor(i / N) / cfg.boxes)) % 2) ? ' alt' : '') + (v ? ' on t' + (v - 1) : ''); });
        el.tray.innerHTML = s.tray.map((p, k) => {
          if (!p) return `<div class="slot"></div>`;
          const w = Math.max(...p.cells.map(c => c[0])) + 1, h = Math.max(...p.cells.map(c => c[1])) + 1, fits = G.anyFit(p);
          return `<div class="slot"><div class="pc ${fits ? '' : 'nofit'}" data-k="${k}" style="grid-template-columns:repeat(${w},var(--t));grid-template-rows:repeat(${h},var(--t))">${p.cells.map(([x, y]) => `<i class="t${p.tone}" style="grid-column:${x + 1};grid-row:${y + 1}"></i>`).join('')}</div></div>`;
        }).join('');
        el.onRender && el.onRender();
      },
      flash(idx) { idx.forEach(i => { const c = cells[i]; c.classList.add('clr'); }); setTimeout(() => idx.forEach(i => cells[i].classList.remove('clr')), 380); }
    };
    // arrastar: a peça flutua acima do dedo para continuar visível
    let d = null;
    const clearPreview = () => cells.forEach(c => c.classList.remove('pv', 'pvx', 'pz'));
    el.tray.addEventListener('pointerdown', e => {
      const pc = e.target.closest('.pc'); if (!pc || G.s.over || el.locked()) return;
      e.preventDefault();
      const k = +pc.dataset.k, piece = G.s.tray[k], w = Math.max(...piece.cells.map(c => c[0])) + 1, h = Math.max(...piece.cells.map(c => c[1])) + 1;
      const fl = document.createElement('div'); fl.className = 'pc float'; fl.style.gridTemplateColumns = `repeat(${w},var(--c))`; fl.style.gridTemplateRows = `repeat(${h},var(--c))`;
      fl.innerHTML = piece.cells.map(([x, y]) => `<i class="t${piece.tone}" style="grid-column:${x + 1};grid-row:${y + 1}"></i>`).join('');
      document.body.appendChild(fl); pc.style.visibility = 'hidden';
      const lift = e.pointerType === 'touch' ? cs * 1.6 + h * cs / 2 : h * cs / 2;
      d = { k, piece, w, h, fl, pc, lift, id: e.pointerId, ox: -1, oy: -1, ok: false };
      try { el.tray.setPointerCapture(e.pointerId); } catch (_) {}
      move(e);
    });
    const move = e => {
      if (!d) return;
      const x = e.clientX - d.w * (cs + gap) / 2, y = e.clientY - d.lift - d.h * (cs + gap) / 2;
      d.fl.style.transform = `translate(${x}px,${y}px)`;
      const r = el.board.getBoundingClientRect(), step = cs + gap;
      const ox = Math.round((x - r.left - padL) / step), oy = Math.round((y - r.top - padL) / step);
      if (ox === d.ox && oy === d.oy) return; d.ox = ox; d.oy = oy; clearPreview();
      d.ok = G.fits(d.piece.cells, ox, oy);
      const inside = d.piece.cells.filter(([cx, cy]) => ox + cx >= 0 && oy + cy >= 0 && ox + cx < N && oy + cy < N);
      if (!inside.length) return;
      inside.forEach(([cx, cy]) => cells[(oy + cy) * N + ox + cx].classList.add(d.ok ? 'pv' : 'pvx'));
      if (d.ok) { // mostra o que vai ser eliminado
        const b = G.s.board.slice(); d.piece.cells.forEach(([cx, cy]) => b[(oy + cy) * N + ox + cx] = 1);
        G.fullRegions(b).flat().forEach(i => cells[i].classList.add('pz'));
      }
    };
    el.tray.addEventListener('pointermove', move);
    const end = () => {
      if (!d) return; const dd = d; d = null; clearPreview(); dd.fl.remove(); dd.pc.style.visibility = '';
      if (dd.ok) { const r = G.place(dd.k, dd.ox, dd.oy); if (r) el.onPlace(r); }
    };
    el.tray.addEventListener('pointerup', end); el.tray.addEventListener('pointercancel', end);
    new ResizeObserver(() => V.size()).observe(el.stage);
    return V;
  }
  window.HXBlockGrid = { create, mount, parse };
})();

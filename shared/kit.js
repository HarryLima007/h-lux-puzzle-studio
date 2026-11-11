/* H-LUX kit — utilitários compartilhados pelos jogos da 2ª leva.
   Só fornece infraestrutura (armazenamento por jogo, telas sobrepostas, aviso,
   navegação de volta, ciclo de vida, offline). Nenhuma regra de jogo fica aqui. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const H = {
    $,
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    fmt(ms) { const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); },
    rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; },
    shuffle(a, r = Math.random) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    esc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),

    // armazenamento isolado: chaves "hlux.<jogo>.*" + resumo opcional para o catálogo
    store(id) {
      const P = 'hlux.' + id + '.', mem = {};
      return {
        get(k, d) { try { const v = localStorage.getItem(P + k); return v == null ? (k in mem ? mem[k] : d) : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : d; } },
        set(k, v) { mem[k] = v; try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) {} },
        del(k) { delete mem[k]; try { localStorage.removeItem(P + k); } catch (e) {} },
        hub(line) { try { line ? localStorage.setItem('hlux.hub.' + id, JSON.stringify({ line, updated: Date.now() })) : localStorage.removeItem('hlux.hub.' + id); } catch (e) {} }
      };
    },

    // tela sobreposta; devolve o cartão. delay evita que o toque que terminou a partida acione um botão
    overlay(html, opts = {}) {
      this.close();
      const ov = document.createElement('div'); ov.className = 'hx-ov'; ov.id = 'hx-ov';
      ov.innerHTML = `<div class="hx-card">${html}</div>`;
      document.body.appendChild(ov);
      if (opts.dismiss) ov.addEventListener('click', e => { if (e.target === ov) { this.close(); opts.dismiss(); } });
      const card = ov.firstChild;
      if (opts.guard !== false) { card.style.pointerEvents = 'none'; setTimeout(() => { card.style.pointerEvents = ''; }, 320); }
      return card;
    },
    close() { const o = document.getElementById('hx-ov'); if (o) o.remove(); },
    isOpen() { return !!document.getElementById('hx-ov'); },
    on(card, sel, fn) { const el = card.querySelector(sel); if (el) el.addEventListener('click', fn); return el; },
    help(title, items, onClose) {
      const c = this.overlay(`<h3>${title}</h3><ul class="help">${items.map(i => `<li>${i}</li>`).join('')}</ul><button class="btn-primary" id="hx-ok">Entendi</button>`, { guard: false });
      this.on(c, '#hx-ok', () => { this.close(); onClose && onClose(); });
    },
    toast(t, ms = 1800) {
      let e = document.getElementById('hx-toast'); if (!e) { e = document.createElement('div'); e.id = 'hx-toast'; document.body.appendChild(e); }
      e.textContent = t; e.classList.remove('hidden'); clearTimeout(this._tt); this._tt = setTimeout(() => e.classList.add('hidden'), ms);
    },
    vibrate(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} },

    // ciclo de vida: salva ao sair do app/aba e antes de voltar ao catálogo
    life({ onHide, onShow, onLeave } = {}) {
      document.addEventListener('visibilitychange', () => { if (document.hidden) onHide && onHide(); else onShow && onShow(); });
      window.addEventListener('pagehide', () => { onHide && onHide(); });
      document.querySelectorAll('[data-platform-link]').forEach(a => a.addEventListener('click', () => { (onLeave || onHide) && (onLeave || onHide)(); }));
    },
    timer() {
      let base = 0, start = 0, id = 0;
      return {
        get ms() { return base + (start ? performance.now() - start : 0); },
        set(ms) { base = ms; if (start) start = performance.now(); },
        start(cb) { if (start) return; start = performance.now(); clearInterval(id); if (cb) id = setInterval(cb, 500); },
        stop() { if (start) base += performance.now() - start; start = 0; clearInterval(id); },
        get running() { return !!start; }
      };
    },
    sw() { try { if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {}); } catch (e) {} }
  };
  window.HX = H;
})();

// H-LUX — service worker da plataforma (offline para todos os jogos).
// Ao publicar uma nova versão, altere VERSION: o cache antigo é apagado
// automaticamente; os dados dos jogos (IndexedDB/localStorage) não são tocados.
const VERSION = 'hlux-v3.0.0-b';
const CORE = [
  './', './index.html', './games.js', './manifest.webmanifest',
  './covers/puzzle.svg', './covers/mahjong.svg', './covers/nonogram.svg', './covers/minefield.svg', './covers/2048.svg', './covers/solitaire.svg', './covers/snake.svg',
  './puzzle/', './puzzle/index.html',
  './mahjong/', './mahjong/index.html',
  './nonogram/', './nonogram/index.html', './minefield/', './minefield/index.html', './2048/', './2048/index.html',
  './solitaire/', './solitaire/index.html', './snake/', './snake/index.html',
  './shared/kit.css', './shared/kit.js', './shared/blockgrid.js',
  './blocks/', './blocks/index.html', './blockudoku/', './blockudoku/index.html', './woodblocks/', './woodblocks/index.html',
  './covers/blocks.svg', './covers/blockudoku.svg', './covers/woodblocks.svg',
  './match/', './match/index.html', './bubble/', './bubble/index.html', './merge/', './merge/index.html',
  './covers/match.svg', './covers/bubble.svg', './covers/merge.svg',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    // rede primeiro (recebe atualizações), cache quando offline
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req).then(hit => hit || caches.match(new URL('index.html', url).href)).then(hit => hit || caches.match('./index.html'))));
    return;
  }
  if (url.origin === location.origin) {
    // arquivos do site: devolve o cache e atualiza em segundo plano
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); return r; })));
  }
});

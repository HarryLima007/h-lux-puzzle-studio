// H-LUX — service worker da plataforma (offline para todos os jogos).
// Ao publicar uma nova versão, altere VERSION: o cache antigo é apagado
// automaticamente; os dados dos jogos (IndexedDB/localStorage) não são tocados.
const VERSION = 'hlux-v2.0.0';
const CORE = [
  './', './index.html', './games.js', './manifest.webmanifest',
  './covers/puzzle.svg', './covers/mahjong.svg',
  './puzzle/', './puzzle/index.html',
  './mahjong/', './mahjong/index.html',
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

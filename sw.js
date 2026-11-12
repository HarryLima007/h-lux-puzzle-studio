// H-LUX — service worker da plataforma (offline para todos os jogos).
// Ao publicar uma nova versão, altere VERSION: o cache antigo é apagado
// automaticamente; os dados dos jogos (IndexedDB/localStorage) não são tocados.
const VERSION = 'hlux-v5.1.0';
const CORE = [
  './', './index.html', './games.js', './manifest.webmanifest',
  './covers/puzzle.svg', './covers/mahjong.svg', './covers/nonogram.svg', './covers/minefield.svg', './covers/2048.svg', './covers/solitaire.svg', './covers/snake.svg',
  './puzzle/', './puzzle/index.html',
  './mahjong/', './mahjong/index.html',
  './nonogram/', './nonogram/index.html', './minefield/', './minefield/index.html', './2048/', './2048/index.html',
  './solitaire/', './solitaire/index.html', './snake/', './snake/index.html',
  './shared/kit.css', './shared/kit.js', './shared/blockgrid.js', './shared/palavras.js', './shared/arcade.js', './shared/music.js',
  './blocks/', './blocks/index.html', './blockudoku/', './blockudoku/index.html', './woodblocks/', './woodblocks/index.html',
  './covers/blocks.svg', './covers/blockudoku.svg', './covers/woodblocks.svg',
  './match/', './match/index.html', './bubble/', './bubble/index.html', './merge/', './merge/index.html',
  './arrow/', './arrow/index.html', './unblock/', './unblock/index.html', './parking/', './parking/index.html', './flow/', './flow/index.html',
  './covers/match.svg', './covers/bubble.svg', './covers/merge.svg', './covers/arrow.svg', './covers/unblock.svg', './covers/parking.svg', './covers/flow.svg',
    './chess/', './chess/index.html', './covers/chess.svg', './checkers/', './checkers/index.html', './covers/checkers.svg', './ludo/', './ludo/index.html', './covers/ludo.svg', './four/', './four/index.html', './covers/four.svg', './reversi/', './reversi/index.html', './covers/reversi.svg', './battleship/', './battleship/index.html', './covers/battleship.svg', './backgammon/', './backgammon/index.html', './covers/backgammon.svg', './mancala/', './mancala/index.html', './covers/mancala.svg', './gomoku/', './gomoku/index.html', './covers/gomoku.svg',
    './sudoku/', './sudoku/index.html', './covers/sudoku.svg', './wordsearch/', './wordsearch/index.html', './covers/wordsearch.svg', './wordmaster/', './wordmaster/index.html', './covers/wordmaster.svg', './memory/', './memory/index.html', './covers/memory.svg', './spider/', './spider/index.html', './covers/spider.svg', './crazycards/', './crazycards/index.html', './covers/crazycards.svg', './domino/', './domino/index.html', './covers/domino.svg', './dice/', './dice/index.html', './covers/dice.svg',
    './invaders/', './invaders/index.html', './covers/invaders.svg', './breakout/', './breakout/index.html', './covers/breakout.svg', './defense/', './defense/index.html', './covers/defense.svg', './pong/', './pong/index.html', './covers/pong.svg', './tictactoe/', './tictactoe/index.html', './covers/tictactoe.svg', './pinball/', './pinball/index.html', './covers/pinball.svg', './dungeon/', './dungeon/index.html', './covers/dungeon.svg', './racer/', './racer/index.html', './covers/racer.svg',
    './cells/', './cells/index.html', './covers/cells.svg', './snakearena/', './snakearena/index.html', './covers/snakearena.svg', './tankarena/', './tankarena/index.html', './covers/tankarena.svg', './survivor/', './survivor/index.html', './covers/survivor.svg', './twinshooter/', './twinshooter/index.html', './covers/twinshooter.svg',
    './flight/', './flight/index.html', './covers/flight.svg', './dash/', './dash/index.html', './covers/dash.svg', './jumper/', './jumper/index.html', './covers/jumper.svg', './crossing/', './crossing/index.html', './covers/crossing.svg', './colorrush/', './colorrush/index.html', './covers/colorrush.svg',
    './hillrider/', './hillrider/index.html', './covers/hillrider.svg', './ragdoll/', './ragdoll/index.html', './covers/ragdoll.svg', './slice/', './slice/index.html', './covers/slice.svg', './swing/', './swing/index.html', './covers/swing.svg', './rhythm/', './rhythm/index.html', './covers/rhythm.svg',
    './guitar/', './guitar/index.html', './covers/guitar.svg', './pool/', './pool/index.html', './covers/pool.svg', './bowling/', './bowling/index.html', './covers/bowling.svg', './minigolf/', './minigolf/index.html', './covers/minigolf.svg', './hoops/', './hoops/index.html', './covers/hoops.svg',
    './penalty/', './penalty/index.html', './covers/penalty.svg', './archery/', './archery/index.html', './covers/archery.svg', './fishing/', './fishing/index.html', './covers/fishing.svg', './kitchen/', './kitchen/index.html', './covers/kitchen.svg', './shoptycoon/', './shoptycoon/index.html', './covers/shoptycoon.svg',
    './city/', './city/index.html', './covers/city.svg', './escape/', './escape/index.html', './covers/escape.svg', './hidden/', './hidden/index.html', './covers/hidden.svg', './quest/', './quest/index.html', './covers/quest.svg', './quiz/', './quiz/index.html', './covers/quiz.svg',
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

# H-LUX

Plataforma de minijogos para navegador (celular e computador), instalável como app (PWA) e jogável offline.

| Jogo | Pasta | Armazenamento |
|---|---|---|
| Puzzle Studio | `puzzle/` | IndexedDB `hlux-puzzle-studio` (imagens e partidas) |
| Mahjong | `mahjong/` | localStorage `hlux.mahjong.*` |
| Nonogram | `nonogram/` | localStorage `hlux.nonogram.*` |
| Minefield | `minefield/` | localStorage `hlux.minefield.*` |
| 2048 | `2048/` | localStorage `hlux.2048.*` |
| Solitaire | `solitaire/` | localStorage `hlux.solitaire.*` |
| Snake | `snake/` | localStorage `hlux.snake.*` |
| Blocks | `blocks/` | localStorage `hlux.blocks.*` |
| Blockudoku | `blockudoku/` | localStorage `hlux.blockudoku.*` |
| Wood Blocks | `woodblocks/` | localStorage `hlux.woodblocks.*` |
| Match | `match/` | localStorage `hlux.match.*` |
| Bubble | `bubble/` | localStorage `hlux.bubble.*` |
| Merge | `merge/` | localStorage `hlux.merge.*` |
| Arrow | `arrow/` | localStorage `hlux.arrow.*` |
| Unblock | `unblock/` | localStorage `hlux.unblock.*` |
| Parking | `parking/` | localStorage `hlux.parking.*` |
| Flow | `flow/` | localStorage `hlux.flow.*` |
| Chess | `chess/` | localStorage `hlux.chess.*` |
| Checkers | `checkers/` | localStorage `hlux.checkers.*` |
| Ludo | `ludo/` | localStorage `hlux.ludo.*` |
| Four | `four/` | localStorage `hlux.four.*` |
| Reversi | `reversi/` | localStorage `hlux.reversi.*` |
| Battleship | `battleship/` | localStorage `hlux.battleship.*` |
| Backgammon | `backgammon/` | localStorage `hlux.backgammon.*` |
| Mancala | `mancala/` | localStorage `hlux.mancala.*` |
| Gomoku | `gomoku/` | localStorage `hlux.gomoku.*` |
| Sudoku | `sudoku/` | localStorage `hlux.sudoku.*` |
| Word Search | `wordsearch/` | localStorage `hlux.wordsearch.*` |
| Word Master | `wordmaster/` | localStorage `hlux.wordmaster.*` |
| Memory | `memory/` | localStorage `hlux.memory.*` |
| Spider | `spider/` | localStorage `hlux.spider.*` |
| Crazy Cards | `crazycards/` | localStorage `hlux.crazycards.*` |
| Domino | `domino/` | localStorage `hlux.domino.*` |
| Dice | `dice/` | localStorage `hlux.dice.*` |
| Invaders | `invaders/` | localStorage `hlux.invaders.*` |
| Breakout | `breakout/` | localStorage `hlux.breakout.*` |
| Defense | `defense/` | localStorage `hlux.defense.*` |
| Pong | `pong/` | localStorage `hlux.pong.*` |
| Tic Tac Toe | `tictactoe/` | localStorage `hlux.tictactoe.*` |
| Pinball | `pinball/` | localStorage `hlux.pinball.*` |
| Dungeon | `dungeon/` | localStorage `hlux.dungeon.*` |
| Racer | `racer/` | localStorage `hlux.racer.*` |

- `index.html` — página inicial e catálogo.
- `games.js` — registro dos jogos. Para adicionar um jogo: crie a pasta com o `index.html` dele e acrescente uma entrada.
- `shared/` — `kit.css`/`kit.js` (telas, salvamento isolado, som), `blockgrid.js` (Blockudoku e Wood Blocks) e `palavras.js` (vocabulário dos jogos de palavras).
- `sw.js` — modo offline. Ao publicar mudanças, altere `VERSION`.
- Cada jogo é independente; a plataforma só lê um resumo opcional em `localStorage["hlux.hub.<id>"]`.

Pontos de restauração: `backup/puzzle-v1.0.1` (antes da plataforma), `backup/v2.1-sete-jogos` (7 jogos) e `backup/v3.0-dezessete-jogos` (17 jogos).

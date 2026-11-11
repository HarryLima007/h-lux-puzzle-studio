# H-LUX

Plataforma de minijogos para navegador (celular e computador), instalável como app (PWA) e jogável offline.

| Jogo | Pasta | Armazenamento |
|---|---|---|
| Puzzle Studio | `puzzle/` | IndexedDB `hlux-puzzle-studio` (imagens e partidas) |
| Mahjong | `mahjong/` | localStorage `hlux.mahjong.*` |

- `index.html` — página inicial e catálogo.
- `games.js` — registro dos jogos. Para adicionar um jogo: crie a pasta com o `index.html` dele e acrescente uma entrada.
- `sw.js` — modo offline. Ao publicar mudanças, altere `VERSION`.
- Cada jogo é independente; a plataforma só lê um resumo opcional em `localStorage["hlux.hub.<id>"]`.

Ponto de restauração do Puzzle Studio antes da plataforma: branch `backup/puzzle-v1.0.1`.

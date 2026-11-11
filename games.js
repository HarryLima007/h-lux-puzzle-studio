/* H-LUX — registro de jogos da plataforma.
   Para adicionar um jogo: crie uma pasta com o index.html do jogo e acrescente
   uma entrada aqui. Nenhum jogo depende de outro; a plataforma só lê o resumo
   opcional que cada jogo grava em localStorage["hlux.hub.<id>"]. */
window.HLUX_GAMES = [
  {
    id: 'puzzle',
    name: 'Puzzle Studio',
    tagline: 'Quebra-cabeças com as suas fotos',
    description: 'Transforme fotos da galeria em quebra-cabeças de 12 a 1.000 peças, com encaixes gerados a cada partida.',
    path: 'puzzle/',
    cover: 'covers/puzzle.svg',
    accent: '#c9a45c',
    tags: ['Fotos', 'Relaxante', 'Offline']
  },
  {
    id: 'mahjong',
    name: 'Mahjong',
    tagline: 'Mahjong Solitaire clássico',
    description: 'Forme pares de peças livres em formações como a Tartaruga. Campanha, modo livre e quatro temas.',
    path: 'mahjong/',
    cover: 'covers/mahjong.svg',
    accent: '#2e8b62',
    tags: ['Estratégia', 'Campanha', '4 temas']
  },
  {
    id: 'nonogram',
    name: 'Nonogram',
    tagline: 'Lógica Picross com desenhos ocultos',
    description: 'Use as pistas numéricas para pintar a grade e revelar desenhos em pixel. Campanha com 16 fases e emblemas gerados no modo livre.',
    path: 'nonogram/',
    cover: 'covers/nonogram.svg',
    accent: '#7f95e0',
    tags: ['Lógica', 'Campanha', '5×5 a 20×20']
  },
  {
    id: 'minefield',
    name: 'Minefield',
    tagline: 'Campo minado clássico',
    description: 'Abra o campo sem tocar nas minas. Fácil, normal, difícil ou personalizado, com a primeira jogada sempre segura.',
    path: 'minefield/',
    cover: 'covers/minefield.svg',
    accent: '#d9a441',
    tags: ['Lógica', 'Recordes', 'Personalizado']
  },
  {
    id: '2048',
    name: '2048',
    tagline: 'Some peças até chegar ao 2048',
    description: 'Deslize para unir números iguais. Tabuleiro clássico 4×4 e variações 3×3, 5×5 e 6×6.',
    path: '2048/',
    cover: 'covers/2048.svg',
    accent: '#c9a45c',
    tags: ['Números', 'Rápido', 'Recordes']
  },
  {
    id: 'solitaire',
    name: 'Solitaire',
    tagline: 'Paciência Klondike',
    description: 'O clássico com 52 cartas, sete colunas e quatro fundações. Compra de 1 ou 3 cartas, dicas e desfazer.',
    path: 'solitaire/',
    cover: 'covers/solitaire.svg',
    accent: '#2e8b62',
    tags: ['Cartas', 'Clássico', 'Recordes']
  },
  {
    id: 'snake',
    name: 'Snake',
    tagline: 'A cobrinha clássica',
    description: 'Colete alimentos, cresça e não bata nas paredes. Três velocidades e aceleração progressiva.',
    path: 'snake/',
    cover: 'covers/snake.svg',
    accent: '#3fd68a',
    tags: ['Arcade', 'Reflexos', 'Recordes']
  },
  {
    id: 'blocks', name: 'Blocks', tagline: 'Blocos que caem',
    description: 'Gire e encaixe as peças que caem para completar linhas. A velocidade aumenta a cada nível.',
    path: 'blocks/', cover: 'covers/blocks.svg', accent: '#b98cff', tags: ['Arcade', 'Blocos', 'Recordes']
  },
  {
    id: 'blockudoku', name: 'Blockudoku', tagline: 'Blocos + Sudoku em 9×9',
    description: 'Encaixe três peças por rodada e elimine linhas, colunas e quadrados 3×3. Combos multiplicam os pontos.',
    path: 'blockudoku/', cover: 'covers/blockudoku.svg', accent: '#3a4f86', tags: ['Lógica', 'Blocos', 'Combos']
  },
  {
    id: 'woodblocks', name: 'Wood Blocks', tagline: 'Encaixe em tabuleiro de madeira',
    description: 'Peças de madeira num tabuleiro 10×10. Complete linhas e colunas e encadeie combos.',
    path: 'woodblocks/', cover: 'covers/woodblocks.svg', accent: '#b8743e', tags: ['Lógica', 'Relaxante', 'Recordes']
  },
  {
    id: 'match', name: 'Match', tagline: 'Combine 3 ou mais joias',
    description: 'Troque gemas vizinhas, crie peças especiais e cumpra os objetivos de 24 fases com jogadas limitadas.',
    path: 'match/', cover: 'covers/match.svg', accent: '#c58cff', tags: ['Combinação', 'Campanha', '24 fases']
  },
  {
    id: 'bubble', name: 'Bubble', tagline: 'Atirador de bolhas',
    description: 'Mire com precisão, junte 3 bolhas da mesma cor e derrube grupos inteiros antes que o teto desça.',
    path: 'bubble/', cover: 'covers/bubble.svg', accent: '#7fb4ff', tags: ['Arcade', 'Mira', '20 fases']
  },
  {
    id: 'merge', name: 'Merge', tagline: 'Funda joias até o Sol H-LUX',
    description: 'Solte joias num recipiente com física. Iguais se fundem e evoluem por 11 níveis até o Sol H-LUX.',
    path: 'merge/', cover: 'covers/merge.svg', accent: '#d4a3ff', tags: ['Física', 'Evolução', 'Recordes']
  },
  {
    id: 'arrow', name: 'Arrow', tagline: 'Libere as setas na ordem certa',
    description: 'Toque nas setas para tirá-las do tabuleiro. Cada uma só sai se o caminho estiver livre. 30 fases sempre solucionáveis.',
    path: 'arrow/', cover: 'covers/arrow.svg', accent: '#f1dca6', tags: ['Lógica', 'Campanha', '30 fases']
  },
  {
    id: 'unblock', name: 'Unblock', tagline: 'Desbloqueie a peça dourada',
    description: 'Deslize os blocos pelo seu eixo e abra caminho até a saída. 38 fases com solução mínima conhecida.',
    path: 'unblock/', cover: 'covers/unblock.svg', accent: '#c9a45c', tags: ['Lógica', 'Deslizar', '38 fases']
  },
  {
    id: 'parking', name: 'Parking', tagline: 'Esvazie o estacionamento',
    description: 'Cada veículo só anda para frente ou para trás. Descubra a ordem certa para tirar todos sem batidas.',
    path: 'parking/', cover: 'covers/parking.svg', accent: '#3d8bff', tags: ['Lógica', 'Trânsito', '30 fases']
  },
  {
    id: 'flow', name: 'Flow', tagline: 'Conecte as cores',
    description: 'Ligue os pares de pontos da mesma cor sem cruzar caminhos e preencha todas as casas do tabuleiro.',
    path: 'flow/', cover: 'covers/flow.svg', accent: '#3ddc84', tags: ['Lógica', 'Caminhos', '40 fases']
  },
  {
    id: 'chess', name: 'Chess', tagline: 'Xadrez clássico',
    description: 'Todas as regras oficiais: roque, en passant, promoção, xeque-mate e empates. Contra a IA ou a dois no mesmo aparelho.',
    path: 'chess/', cover: 'covers/chess.svg', accent: '#e9dcc0', tags: ['Tabuleiro', 'IA', '2 jogadores']
  },
  {
    id: 'checkers', name: 'Checkers', tagline: 'Damas',
    description: 'Damas brasileira ou americana, com captura obrigatória, promoção a dama, histórico e desfazer. Contra a IA ou a dois.',
    path: 'checkers/', cover: 'covers/checkers.svg', accent: '#c47a45', tags: ['Tabuleiro', 'IA', '2 jogadores']
  },
  {
    id: 'ludo', name: 'Ludo', tagline: 'Corrida de peças com dado',
    description: 'De 2 a 4 participantes, humanos ou IA. Saia da base, capture adversários e leve as quatro peças ao centro.',
    path: 'ludo/', cover: 'covers/ludo.svg', accent: '#f2c230', tags: ['Tabuleiro', 'Dados', 'Até 4']
  },
  {
    id: 'four', name: 'Four', tagline: 'Quatro em linha',
    description: 'Solte peças nas colunas e forme uma linha de quatro antes do adversário. IA com três níveis.',
    path: 'four/', cover: 'covers/four.svg', accent: '#e0b14a', tags: ['Estratégia', 'IA', '2 jogadores']
  },
  {
    id: 'reversi', name: 'Reversi', tagline: 'Prenda e vire as peças',
    description: 'O clássico 8×8: cerque peças adversárias para virá-las. Jogadas válidas destacadas e IA em três níveis.',
    path: 'reversi/', cover: 'covers/reversi.svg', accent: '#1c6b47', tags: ['Estratégia', 'IA', '2 jogadores']
  },
  {
    id: 'battleship', name: 'Battleship', tagline: 'Batalha naval',
    description: 'Posicione a frota à mão ou no automático e afunde os navios do adversário. Contra a IA ou a dois com tela de passagem.',
    path: 'battleship/', cover: 'covers/battleship.svg', accent: '#7fb4ff', tags: ['Estratégia', 'IA', '2 jogadores']
  },
  {
    id: 'backgammon', name: 'Backgammon', tagline: 'Gamão',
    description: 'Gamão com regras oficiais: barra, bloqueios, retirada e uso obrigatório dos dados. Pontua gamão e backgammon.',
    path: 'backgammon/', cover: 'covers/backgammon.svg', accent: '#c9a45c', tags: ['Tabuleiro', 'Dados', '2 jogadores']
  },
  {
    id: 'mancala', name: 'Mancala', tagline: 'Variante Kalah',
    description: 'Semeie as sementes, ganhe jogadas extras e capture as do adversário. Kalah com 3, 4 ou 6 sementes.',
    path: 'mancala/', cover: 'covers/mancala.svg', accent: '#d98b5f', tags: ['Estratégia', 'IA', '2 jogadores']
  },
  {
    id: 'gomoku', name: 'Gomoku', tagline: 'Cinco em linha 15×15',
    description: 'Forme cinco pedras seguidas num tabuleiro 15×15. Toque para prever e toque de novo para confirmar.',
    path: 'gomoku/', cover: 'covers/gomoku.svg', accent: '#d9b071', tags: ['Estratégia', 'IA', '2 jogadores']
  }
];

/* Categorias usadas pelos filtros do catálogo (um jogo pode estar em mais de uma). */
window.HLUX_CATS = ['Quebra-cabeças', 'Lógica', 'Tabuleiro', 'Estratégia', 'Cartas', 'Dados', 'Palavras', 'Arcade', 'Corrida', 'Aventura', '2+ jogadores'];
(function () {
  const C = {
    puzzle: ['Quebra-cabeças'], mahjong: ['Quebra-cabeças', 'Lógica'], nonogram: ['Lógica'], minefield: ['Lógica'], '2048': ['Lógica', 'Quebra-cabeças'],
    solitaire: ['Cartas'], snake: ['Arcade'], blocks: ['Arcade', 'Quebra-cabeças'], blockudoku: ['Quebra-cabeças', 'Lógica'], woodblocks: ['Quebra-cabeças', 'Lógica'],
    match: ['Quebra-cabeças'], bubble: ['Arcade'], merge: ['Arcade', 'Quebra-cabeças'], arrow: ['Lógica', 'Quebra-cabeças'], unblock: ['Lógica', 'Quebra-cabeças'],
    parking: ['Lógica', 'Quebra-cabeças'], flow: ['Lógica', 'Quebra-cabeças'],
    chess: ['Tabuleiro', 'Estratégia', '2+ jogadores'], checkers: ['Tabuleiro', 'Estratégia', '2+ jogadores'], ludo: ['Tabuleiro', 'Dados', '2+ jogadores'],
    four: ['Tabuleiro', 'Estratégia', '2+ jogadores'], reversi: ['Tabuleiro', 'Estratégia', '2+ jogadores'], battleship: ['Estratégia', '2+ jogadores'],
    backgammon: ['Tabuleiro', 'Dados', 'Estratégia', '2+ jogadores'], mancala: ['Tabuleiro', 'Estratégia', '2+ jogadores'], gomoku: ['Tabuleiro', 'Estratégia', '2+ jogadores']
  };
  window.HLUX_GAMES.forEach(g => { if (!g.cats) g.cats = C[g.id] || []; });
})();

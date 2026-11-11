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
  }
];

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
  }
];

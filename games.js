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
  },
  {
    id: 'sudoku', name: 'Sudoku', tagline: 'Lógica numérica 9×9',
    description: 'Quatro dificuldades com solução única garantida, anotações, verificação de erros, dicas e desafio diário.',
    path: 'sudoku/', cover: 'covers/sudoku.svg', accent: '#8fb4ff', tags: ['Lógica', 'Diário', 'Estatísticas']
  },
  {
    id: 'wordsearch', name: 'Word Search', tagline: 'Caça-palavras em português',
    description: '36 fases com temas, de grades 8×8 até 14×14, diagonais e palavras invertidas.',
    path: 'wordsearch/', cover: 'covers/wordsearch.svg', accent: '#5fc3a4', tags: ['Palavras', 'Temas', '36 fases']
  },
  {
    id: 'wordmaster', name: 'Word Master', tagline: 'Descubra a palavra secreta',
    description: 'Adivinhe palavras de 4 a 6 letras com pistas por cor. Temas, palavra do dia, sequência de vitórias e estatísticas.',
    path: 'wordmaster/', cover: 'covers/wordmaster.svg', accent: '#d9a73a', tags: ['Palavras', 'Diário', 'Estatísticas']
  },
  {
    id: 'memory', name: 'Memory', tagline: 'Encontre os pares',
    description: 'Campanha de 15 fases e modo livre de 6 a 18 pares, com quatro temas de cartas e recordes.',
    path: 'memory/', cover: 'covers/memory.svg', accent: '#c792ea', tags: ['Memória', 'Temas', '15 fases']
  },
  {
    id: 'spider', name: 'Spider', tagline: 'Paciência Spider',
    description: 'Monte sequências do Rei ao Ás com 1, 2 ou 4 naipes. Arrastar ou tocar, dicas, desfazer e recordes.',
    path: 'spider/', cover: 'covers/spider.svg', accent: '#2fbf71', tags: ['Cartas', 'Paciência', 'Recordes']
  },
  {
    id: 'crazycards', name: 'Crazy Cards', tagline: 'Descarte por cor e número',
    description: 'Jogo de cartas original do H-LUX com cartas especiais e coringas. Contra a IA ou com amigos no mesmo aparelho.',
    path: 'crazycards/', cover: 'covers/crazycards.svg', accent: '#e5484d', tags: ['Cartas', 'IA', 'Até 4']
  },
  {
    id: 'domino', name: 'Domino', tagline: 'Dominó duplo-seis',
    description: 'Modalidades Compra e Bloqueio, de 2 a 4 jogadores, partidas até 50, 100 ou 150 pontos.',
    path: 'domino/', cover: 'covers/domino.svg', accent: '#f1e7cf', tags: ['Peças', 'IA', 'Até 4']
  },
  {
    id: 'dice', name: 'Dice', tagline: 'Cinco dados, 13 categorias',
    description: 'Lance até três vezes, guarde os dados e escolha onde pontuar. Sozinho ou com até 3 adversários.',
    path: 'dice/', cover: 'covers/dice.svg', accent: '#e05a5a', tags: ['Dados', 'Recordes', 'Até 4']
  },
  {
    id: 'invaders', name: 'Invaders', tagline: 'Defenda o espaço',
    description: 'Ondas de naves com soldados, atiradores e mergulhadores, chefes a cada 5 ondas, bônus e recordes.',
    path: 'invaders/', cover: 'covers/invaders.svg', accent: '#f1dca6', tags: ['Arcade', 'Chefes', 'Recordes']
  },
  {
    id: 'breakout', name: 'Breakout', tagline: 'Quebre todos os blocos',
    description: '12 fases desenhadas com blocos resistentes, explosivos e indestrutíveis, quatro bônus e três vidas.',
    path: 'breakout/', cover: 'covers/breakout.svg', accent: '#e07b3a', tags: ['Arcade', 'Fases', 'Bônus']
  },
  {
    id: 'defense', name: 'Defense', tagline: 'Torres contra ondas',
    description: 'Construa e melhore quatro tipos de torre em cinco mapas, contra inimigos variados e chefes.',
    path: 'defense/', cover: 'covers/defense.svg', accent: '#3ddc84', tags: ['Estratégia', '5 mapas', 'Chefes']
  },
  {
    id: 'pong', name: 'Pong', tagline: 'O clássico das raquetes',
    description: 'Contra a IA em três níveis ou a dois no mesmo aparelho, cada um com metade da tela.',
    path: 'pong/', cover: 'covers/pong.svg', accent: '#e5484d', tags: ['Arcade', 'IA', '2 jogadores']
  },
  {
    id: 'tictactoe', name: 'Tic Tac Toe', tagline: 'Jogo da velha',
    description: 'O 3×3 clássico com IA imbatível no difícil, além das variantes 4×4 e 5×5.',
    path: 'tictactoe/', cover: 'covers/tictactoe.svg', accent: '#6fb7ff', tags: ['Tabuleiro', 'IA', '2 jogadores']
  },
  {
    id: 'pinball', name: 'Pinball', tagline: 'Mesa de fliperama',
    description: 'Bumpers, estilingues, alvos, letras L-U-X e multiplicador até 5×. Física estável e controles para toque e teclado.',
    path: 'pinball/', cover: 'covers/pinball.svg', accent: '#3d8bff', tags: ['Arcade', 'Física', 'Recordes']
  },
  {
    id: 'dungeon', name: 'Dungeon', tagline: 'Masmorra por turnos',
    description: 'Andares gerados a cada partida, inimigos com comportamentos diferentes, baús, melhorias e chefes.',
    path: 'dungeon/', cover: 'covers/dungeon.svg', accent: '#c9a45c', tags: ['Aventura', 'Roguelike', 'Recordes']
  },
  {
    id: 'racer', name: 'Racer', tagline: 'Corrida arcade',
    description: 'Seis pistas com curvas, trânsito, cones e óleo, medalhas por tempo e um modo infinito.',
    path: 'racer/', cover: 'covers/racer.svg', accent: '#e0b14a', tags: ['Corrida', 'Medalhas', 'Infinito']
  },
  {
    id: 'cells', name: 'Cells', tagline: 'Arena de células',
    description: 'Cresça comendo partículas e células menores, divida-se para atacar e domine o ranking contra a IA.',
    path: 'cells/', cover: 'covers/cells.svg', accent: '#e0b14a', tags: ['Arena', 'IA', 'Recordes']
  },
  {
    id: 'snakearena', name: 'Snake Arena', tagline: 'Cobras em arena',
    description: 'Colete energia, use o turbo e faça as cobras rivais baterem no seu corpo para crescer.',
    path: 'snakearena/', cover: 'covers/snakearena.svg', accent: '#c9a45c', tags: ['Arena', 'IA', 'Turbo']
  },
  {
    id: 'tankarena', name: 'Tank Arena', tagline: 'Combate de tanques',
    description: 'Mova o tanque e gire a torre de forma independente, ricocheteie tiros e escolha melhorias entre as arenas.',
    path: 'tankarena/', cover: 'covers/tankarena.svg', accent: '#e0b14a', tags: ['Arena', 'Melhorias', 'IA']
  },
  {
    id: 'survivor', name: 'Survivor', tagline: 'Sobreviva à horda',
    description: 'Oito minutos contra ondas de monstros: armas automáticas, níveis, melhorias e chefes.',
    path: 'survivor/', cover: 'covers/survivor.svg', accent: '#e5484d', tags: ['Ondas', 'Chefes', 'Melhorias']
  },
  {
    id: 'twinshooter', name: 'Twin Shooter', tagline: 'Tiro em arena',
    description: 'Mova com uma mão e mire com a outra: 20 ondas, 4 armas, melhorias e chefes. Mouse e teclado no PC.',
    path: 'twinshooter/', cover: 'covers/twinshooter.svg', accent: '#3d8bff', tags: ['Ondas', 'Chefes', 'Armas']
  },
  {
    id: 'flight', name: 'Flight', tagline: 'Voo entre colunas',
    description: 'Toque para bater as asas e passe pelos vãos. Três modos e medalhas.',
    path: 'flight/', cover: 'covers/flight.svg', accent: '#e0b14a', tags: ['Toque único', 'Medalhas', 'Recordes']
  },
  {
    id: 'dash', name: 'Dash', tagline: 'Plataforma rítmica',
    description: 'O cubo corre no ritmo de trilhas originais: pule na batida, use o modo prática e conquiste as três fases.',
    path: 'dash/', cover: 'covers/dash.svg', accent: '#c86bff', tags: ['Ritmo', 'Fases', 'Música original']
  },
  {
    id: 'jumper', name: 'Jumper', tagline: 'Salto vertical',
    description: 'Suba de plataforma em plataforma: molas, plataformas que quebram, monstros e foguete.',
    path: 'jumper/', cover: 'covers/jumper.svg', accent: '#e0b14a', tags: ['Infinito', 'Altura', 'Recordes']
  },
  {
    id: 'crossing', name: 'Crossing', tagline: 'Travessia',
    description: 'Atravesse estradas, rios e trilhos em quatro ambientes sem ser pego pela águia.',
    path: 'crossing/', cover: 'covers/crossing.svg', accent: '#3ddc84', tags: ['Infinito', 'Ambientes', 'Moedas']
  },
  {
    id: 'colorrush', name: 'Color Rush', tagline: 'Passe pela sua cor',
    description: 'A bola só atravessa a parte do obstáculo com a mesma cor: anéis, barras e cruzes giratórias.',
    path: 'colorrush/', cover: 'covers/colorrush.svg', accent: '#3d8bff', tags: ['Toque único', 'Cores', 'Recordes']
  },
  {
    id: 'hillrider', name: 'Hill Rider', tagline: 'Subida com física',
    description: 'Dirija morro acima com suspensão e combustível, colete moedas e melhore três veículos em três fases.',
    path: 'hillrider/', cover: 'covers/hillrider.svg', accent: '#c9a45c', tags: ['Física', 'Veículos', 'Melhorias']
  },
  {
    id: 'ragdoll', name: 'Ragdoll Arena', tagline: 'Luta com física',
    description: 'Bonecos de física, armas e caixas em três arenas contra a IA ou um amigo no teclado do PC.',
    path: 'ragdoll/', cover: 'covers/ragdoll.svg', accent: '#e5484d', tags: ['Física', 'IA', 'Local']
  },
  {
    id: 'slice', name: 'Slice', tagline: 'Corte as frutas',
    description: 'Deslize para cortar frutas, faça combos e fuja das bombas. Modos Clássico, Arcade e Zen.',
    path: 'slice/', cover: 'covers/slice.svg', accent: '#ff9a2e', tags: ['Combos', '3 modos', 'Recordes']
  },
  {
    id: 'swing', name: 'Swing', tagline: 'Balanço na corda',
    description: 'Prenda a corda, balance e solte na hora certa sobre a lava: 15 fases com ganchos móveis e espinhos.',
    path: 'swing/', cover: 'covers/swing.svg', accent: '#e0b14a', tags: ['Física', '15 fases', 'Estrelas']
  },
  {
    id: 'rhythm', name: 'Rhythm', tagline: 'Ritmo em 4 direções',
    description: 'Toque no tempo das músicas originais: precisão, combos, três dificuldades e ajuste de latência.',
    path: 'rhythm/', cover: 'covers/rhythm.svg', accent: '#c86bff', tags: ['Música original', 'Precisão', 'Latência']
  },
  {
    id: 'guitar', name: 'Guitar', tagline: 'Notas coloridas',
    description: 'Cinco trastes, acordes, notas longas, multiplicador e Poder Estelar em três músicas originais.',
    path: 'guitar/', cover: 'covers/guitar.svg', accent: '#ff9a2e', tags: ['Música original', 'Multiplicador', '3 níveis']
  },
  {
    id: 'pool', name: 'Pool', tagline: 'Sinuca bola 8',
    description: 'Física de bolas e tabelas, regras oficiais da bola 8 com faltas e bola na mão, contra a IA ou a dois.',
    path: 'pool/', cover: 'covers/pool.svg', accent: '#3ddc84', tags: ['Bola 8', 'IA', 'Local']
  },
  {
    id: 'bowling', name: 'Bowling', tagline: 'Boliche de 10 pinos',
    description: 'Posicione, mire e aplique efeito: dez quadros com pontuação oficial de strikes e spares.',
    path: 'bowling/', cover: 'covers/bowling.svg', accent: '#e0b14a', tags: ['10 quadros', 'Física', 'IA']
  },
  {
    id: 'minigolf', name: 'Mini Golf', tagline: 'Percurso de 9 buracos',
    description: 'Paredes, rampas, areia, água e pás giratórias. Conte as tacadas e bata o par.',
    path: 'minigolf/', cover: 'covers/minigolf.svg', accent: '#3ddc84', tags: ['9 buracos', 'Física', 'Par']
  },
  {
    id: 'hoops', name: 'Hoops', tagline: 'Arremessos de basquete',
    description: 'Arremesse com direção e força, acerte cestas de 3 e "chuás" contra o relógio ou no desafio de 3 pontos.',
    path: 'hoops/', cover: 'covers/hoops.svg', accent: '#e07a2e', tags: ['Tempo', '3 modos', 'Recordes']
  },
  {
    id: 'penalty', name: 'Penalty', tagline: 'Disputa de pênaltis',
    description: 'Cobre e defenda contra a IA, com morte súbita e um torneio de três fases.',
    path: 'penalty/', cover: 'covers/penalty.svg', accent: '#3ddc84', tags: ['Torneio', 'IA', 'Cobrar e defender']
  },
  {
    id: 'archery', name: 'Archery', tagline: 'Tiro com arco',
    description: 'Puxe a corda, compense o vento e acerte o centro em 12 fases com alvos móveis.',
    path: 'archery/', cover: 'covers/archery.svg', accent: '#ffd54a', tags: ['Vento', '12 fases', 'Precisão']
  },
  {
    id: 'fishing', name: 'Fishing', tagline: 'Pesca relaxante',
    description: 'Quatro locais, 24 espécies em cinco raridades, loja de equipamentos, coleção e missões.',
    path: 'fishing/', cover: 'covers/fishing.svg', accent: '#3d8bff', tags: ['Coleção', 'Missões', 'Relaxante']
  },
  {
    id: 'kitchen', name: 'Kitchen', tagline: 'Lanchonete',
    description: 'Prepare pedidos na chapa, tábua, fritadeira e forno antes que os clientes percam a paciência.',
    path: 'kitchen/', cover: 'covers/kitchen.svg', accent: '#e5484d', tags: ['Pedidos', 'Dias', 'Melhorias']
  },
  {
    id: 'shoptycoon', name: 'Shop Tycoon', tagline: 'Gestão de loja',
    description: 'Compre estoque, defina preços, contrate equipe e expanda a loja até virar magnata.',
    path: 'shoptycoon/', cover: 'covers/shoptycoon.svg', accent: '#3ddc84', tags: ['Gestão', 'Lucro', 'Expansão']
  },
  {
    id: 'city', name: 'City', tagline: 'Construa uma cidade',
    description: 'Estradas, casas, comércio, indústria, energia, água e serviços públicos: equilibre economia e satisfação.',
    path: 'city/', cover: 'covers/city.svg', accent: '#3dacdc', tags: ['Construção', 'Economia', 'Livre']
  },
  {
    id: 'escape', name: 'Escape', tagline: 'Salas de fuga',
    description: 'Três salas com objetos, inventário e enigmas lógicos. Dicas limitadas e recorde de tempo.',
    path: 'escape/', cover: 'covers/escape.svg', accent: '#c86bff', tags: ['3 salas', 'Inventário', 'Enigmas']
  },
  {
    id: 'hidden', name: 'Hidden', tagline: 'Objetos escondidos',
    description: 'Encontre oito objetos em cenários cheios, com zoom, dicas limitadas e tempo.',
    path: 'hidden/', cover: 'covers/hidden.svg', accent: '#ffd54a', tags: ['8 cenários', 'Tempo', 'Dicas']
  },
  {
    id: 'quest', name: 'Quest', tagline: 'Aventura de plataforma',
    description: 'Três áreas com segredos, gemas, inimigos e chefes; aprenda o pulo duplo e chegue ao castelo.',
    path: 'quest/', cover: 'covers/quest.svg', accent: '#3ddcc8', tags: ['Plataforma', 'Chefes', 'Segredos']
  },
  {
    id: 'quiz', name: 'Quiz', tagline: 'Conhecimentos gerais',
    description: 'Perguntas em português sobre oito temas, três dificuldades, modo com e sem tempo e sequência de acertos.',
    path: 'quiz/', cover: 'covers/quiz.svg', accent: '#e0b14a', tags: ['8 categorias', 'Com e sem tempo', 'Recordes']
  }
];

/* Categorias usadas pelos filtros do catálogo (um jogo pode estar em mais de uma). */
window.HLUX_CATS = ['Quebra-cabeças', 'Lógica', 'Tabuleiro', 'Estratégia', 'Cartas e peças', 'Dados', 'Palavras', 'Arcade', 'Corrida', 'Aventura', 'Música', 'Esportes', 'Simulação', '2+ jogadores'];
(function () {
  const C = {
    puzzle: ['Quebra-cabeças'], mahjong: ['Quebra-cabeças', 'Lógica'], nonogram: ['Lógica'], minefield: ['Lógica'], '2048': ['Lógica', 'Quebra-cabeças'],
    solitaire: ['Cartas e peças'], snake: ['Arcade'], blocks: ['Arcade', 'Quebra-cabeças'], blockudoku: ['Quebra-cabeças', 'Lógica'], woodblocks: ['Quebra-cabeças', 'Lógica'],
    match: ['Quebra-cabeças'], bubble: ['Arcade'], merge: ['Arcade', 'Quebra-cabeças'], arrow: ['Lógica', 'Quebra-cabeças'], unblock: ['Lógica', 'Quebra-cabeças'],
    parking: ['Lógica', 'Quebra-cabeças'], flow: ['Lógica', 'Quebra-cabeças'],
    chess: ['Tabuleiro', 'Estratégia', '2+ jogadores'], checkers: ['Tabuleiro', 'Estratégia', '2+ jogadores'], ludo: ['Tabuleiro', 'Dados', '2+ jogadores'],
    four: ['Tabuleiro', 'Estratégia', '2+ jogadores'], reversi: ['Tabuleiro', 'Estratégia', '2+ jogadores'], battleship: ['Estratégia', '2+ jogadores'],
    backgammon: ['Tabuleiro', 'Dados', 'Estratégia', '2+ jogadores'], mancala: ['Tabuleiro', 'Estratégia', '2+ jogadores'], gomoku: ['Tabuleiro', 'Estratégia', '2+ jogadores'],
    sudoku: ['Lógica'], wordsearch: ['Palavras'], wordmaster: ['Palavras', 'Lógica'], memory: ['Quebra-cabeças'], spider: ['Cartas e peças'],
    crazycards: ['Cartas e peças', '2+ jogadores'], domino: ['Cartas e peças', 'Tabuleiro', '2+ jogadores'], dice: ['Dados', '2+ jogadores'],
    invaders: ['Arcade'], breakout: ['Arcade'], defense: ['Estratégia'], pong: ['Arcade', '2+ jogadores'], tictactoe: ['Tabuleiro', '2+ jogadores'],
    pinball: ['Arcade'], dungeon: ['Aventura'], racer: ['Corrida', 'Arcade'],
    cells: ['Arcade'], snakearena: ['Arcade'], tankarena: ['Arcade', 'Estratégia'], survivor: ['Arcade', 'Aventura'], twinshooter: ['Arcade'],
    flight: ['Arcade'], dash: ['Arcade', 'Música'], jumper: ['Arcade'], crossing: ['Arcade'], colorrush: ['Arcade'],
    hillrider: ['Corrida', 'Arcade'], ragdoll: ['Arcade', '2+ jogadores'], slice: ['Arcade'], swing: ['Arcade'], rhythm: ['Música'],
    guitar: ['Música'], pool: ['Esportes', '2+ jogadores'], bowling: ['Esportes'], minigolf: ['Esportes', 'Quebra-cabeças'], hoops: ['Esportes'],
    penalty: ['Esportes'], archery: ['Esportes'], fishing: ['Simulação'], kitchen: ['Simulação', 'Estratégia'], shoptycoon: ['Simulação', 'Estratégia'],
    city: ['Simulação', 'Estratégia'], escape: ['Quebra-cabeças', 'Aventura'], hidden: ['Quebra-cabeças'], quest: ['Aventura'], quiz: ['Palavras']
  };
  window.HLUX_GAMES.forEach(g => { if (!g.cats) g.cats = C[g.id] || []; });
})();

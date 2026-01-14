const ACADEMY_CURRICULUM = [
  {
    id: 'basics_1',
    title: "El Tablero y las Casillas 🏁",
    description: "Conoce el campo de batalla.",
    theory: "El tablero de ajedrez tiene 64 casillas. Cada una se identifica por una letra (columna) y un número (fila). Por ejemplo, 'e4' es la casilla central donde suelen empezar las blancas.",
    puzzles: [
      { fen: "8/8/8/8/8/8/8/8 w - - 0 1", goal: "Haz clic en la casilla 'e4'.", type: "click", target: "e4" },
      { fen: "8/8/8/8/8/8/8/8 w - - 0 1", goal: "Ahora encuentra la casilla 'c7'.", type: "click", target: "c7" },
      { fen: "8/8/8/8/8/8/8/8 w - - 0 1", goal: "Haz clic en 'h1'.", type: "click", target: "h1" }
    ]
  },
  {
    id: 'pieces_rook',
    title: "La Torre 🏰",
    description: "Columnas y filas.",
    theory: "La Torre se mueve en línea recta por filas y columnas. Es muy poderosa en finales.",
    puzzles: [
      { fen: "8/8/8/8/4R3/8/8/8 w - - 0 1", goal: "Mueve la torre a e8.", type: "move", moves: ["Re8"] },
      { fen: "8/2p5/8/8/2R5/8/8/8 w - - 0 1", goal: "Captura el peón en c7.", type: "move", moves: ["Rxc7"] }
    ]
  },
  {
    id: 'pieces_bishop',
    title: "El Alfil 🏹",
    description: "El señor de las diagonales.",
    theory: "El Alfil se mueve siempre en diagonal. Nunca cambia el color de su casilla.",
    puzzles: [
      { fen: "8/8/8/8/4B3/8/8/8 w - - 0 1", goal: "Lleva el alfil a h7.", type: "move", moves: ["Bh7"] },
      { fen: "8/1p6/8/8/4B3/8/8/8 w - - 0 1", goal: "Captura el peón de b7.", type: "move", moves: ["Bxb7"] }
    ]
  },
  {
    id: 'pieces_queen',
    title: "La Dama 👑",
    description: "La pieza más poderosa.",
    theory: "La Dama combina los movimientos de la Torre y el Alfil. ¡Puede ir a cualquier lado en línea recta o diagonal!",
    puzzles: [
      { fen: "8/8/8/8/4Q3/8/8/8 w - - 0 1", goal: "Mueve la dama a a8.", type: "move", moves: ["Qa8"] },
      { fen: "8/5p2/8/8/2Q5/8/8/8 w - - 0 1", goal: "Captura el peón negro.", type: "move", moves: ["Qxf7"] }
    ]
  },
  {
    id: 'pieces_king',
    title: "El Rey 👑",
    description: "El más importante.",
    theory: "El Rey se mueve solo una casilla en cualquier dirección. Si lo pierdes, se acaba el juego.",
    puzzles: [
      { fen: "8/8/8/8/4K3/8/8/8 w - - 0 1", goal: "Mueve el rey a e5.", type: "move", moves: ["Ke5"] }
    ]
  },
  {
    id: 'pieces_knight',
    title: "El Caballo 🐴",
    description: "El saltador del tablero.",
    theory: "El Caballo se mueve en forma de 'L' y es la única pieza que puede saltar sobre otras.",
    puzzles: [
      { fen: "8/8/8/8/4N3/8/8/8 w - - 0 1", goal: "Salta a f6.", type: "move", moves: ["Nf6"] },
      { fen: "8/3p4/8/4N3/8/8/8/8 w - - 0 1", goal: "Captura el peón en d7.", type: "move", moves: ["Nxd7"] }
    ]
  },
  {
    id: 'pieces_pawn',
    title: "El Peón ♟️",
    description: "Pequeño pero valiente.",
    theory: "Avanza una casilla (o dos al principio), pero captura en diagonal. ¡Si llega al final, se convierte en Dama!",
    puzzles: [
      { fen: "8/8/8/8/4P3/8/8/8 w - - 0 1", goal: "Avanza el peón a e5.", type: "move", moves: ["e5"] },
      { fen: "8/3p4/4P3/8/8/8/8/8 w - - 0 1", goal: "Captura el peón negro.", type: "move", moves: ["exd7"] }
    ]
  },
  {
    id: 'mate_basics',
    title: "Jaque y Mate 🏆",
    description: "Ganando la batalla.",
    theory: "El Jaque es un ataque al Rey. El Jaque Mate es cuando el Rey no tiene escape.",
    puzzles: [
      { fen: "4k3/R7/4R3/8/8/8/8/4K3 w - - 0 1", goal: "Da jaque mate en una.", type: "move", moves: ["Re8#"] }
    ]
  }
];

const PLACEMENT_TEST = [
  {
    question: "¿Cómo se llama el movimiento donde el Rey y la Torre se protegen a la vez?",
    options: ["Enroque", "Coronación", "Captura al paso"],
    correct: 0,
    level: 1
  },
  {
    question: "Si tu Rey está atacado y no puede escapar ni ser defendido, ¿cómo se llama?",
    options: ["Ahogado", "Jaque Mate", "Jaque"],
    correct: 1,
    level: 2
  },
  {
    question: "¿Cuál es el valor aproximado de una Torre en puntos de material?",
    options: ["3 puntos", "5 puntos", "9 puntos"],
    correct: 2,
    level: 1
  },
  {
    question: "¿Qué significa 'gambit' en ajedrez?",
    options: ["Un sacrificio de pieza para ganar posición", "Una táctica de defensa", "Un tipo de final"],
    correct: 0,
    level: 2
  },
  {
    question: "¿En cuántos movimientos puede dar jaque mate con Rey y Reina contra Rey solo?",
    options: ["1-2 movimientos", "10 movimientos como máximo", "Infinito"],
    correct: 1,
    level: 3
  }
];

window.ACADEMY_CURRICULUM = ACADEMY_CURRICULUM;
window.PLACEMENT_TEST = PLACEMENT_TEST;

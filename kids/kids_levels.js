const KIDS_LEVELS = [
    {
        id: 1,
        name: "MUNDO 1: ¡Muévete!",
        description: "Aprende cómo se mueven los peones mágicos.",
        color: "#FFD700",
        puzzles: [
            { fen: "8/8/8/8/8/8/4P3/8 w - - 0 1", moves: ["e3", "e4"], goal: "Mueve el peón hacia adelante.", hint: "Los peones caminan de frente." },
            { fen: "8/8/8/8/8/4P3/8/8 w - - 0 1", moves: ["e4"], goal: "¡Sigue avanzando!", hint: "Un paso más hacia la corona." },
            { fen: "8/8/8/4p3/3P4/8/8/8 w - - 0 1", moves: ["dxe5"], goal: "¡Captura el peón enemigo!", hint: "Los peones capturan en diagonal." },
            { fen: "8/8/8/8/6p1/5P2/8/8 w - - 0 1", moves: ["fxg4"], goal: "¡El peón g te está mirando! ¡Cómelo!", hint: "Captura de lado (diagonal)." },
            { fen: "8/8/8/8/8/2P5/8/8 w - - 0 1", moves: ["c4"], goal: "¡Los peones pueden saltar 2 cuadros al principio!", hint: "En el primer movimiento, ¡puedes ir más rápido!" },
            { fen: "8/k7/4P3/8/8/8/8/8 w - - 0 1", moves: ["e7"], goal: "¡Casi llegas al final!", hint: "Sigue recto." },
            { fen: "2k5/3P4/8/8/8/8/8/8 w - - 0 1", moves: ["d8", "dxc8"], goal: "¡Llega a la última fila para coronar!", hint: "¡Último paso!" }
        ]
    },
    {
        id: 2,
        name: "MUNDO 2: ¡La Torre!",
        description: "¡La torre se mueve en líneas rectos!",
        color: "#90EE90",
        puzzles: [
            { fen: "8/8/8/8/4R3/8/8/8 w - - 0 1", moves: ["Re5", "Re6", "Re7", "Re8", "Re3", "Re2", "Re1", "Rf4", "Rg4", "Rh4", "Rd4", "Rc4", "Rb4", "Ra4"], goal: "Mueve la Torre a cualquier casilla.", hint: "La torre se mueve como una cruz (+)." },
            { fen: "8/2p5/8/8/2R5/8/8/8 w - - 0 1", moves: ["Rxc7"], goal: "¡Atrapa al peón negro!", hint: "Sigue la línea recta hasta el peón." },
            { fen: "8/8/8/8/2R2n2/8/8/8 w - - 0 1", moves: ["Rxf4"], goal: "¡El caballo está distraído! ¡Cómelo!", hint: "La torre puede capturar a larga distancia." },
            { fen: "2r5/8/8/8/2R5/8/8/8 w - - 0 1", moves: ["Rxc8"], goal: "¡Duelo de torres! ¡Gánalo!", hint: "Arriba del todo." }
        ]
    },
    {
        id: 3,
        name: "MUNDO 3: ¡El Alfil!",
        description: "¡El alfil corre por las diagonales!",
        color: "#fb923c",
        puzzles: [
            { fen: "8/8/8/8/4B3/8/8/8 w - - 0 1", moves: ["Bf5", "Bh7", "Bd3", "Bb1", "Bf3", "Bg2", "Bh1", "Bd5", "Bc6", "Bb7", "Ba8"], goal: "Mueve el Alfil por su color.", hint: "El alfil se mueve como una X." },
            { fen: "2q5/8/8/8/8/7B/8/8 w - - 0 1", moves: ["Bxc8"], goal: "¡Cruza todo el tablero y come la dama!", hint: "Busca la diagonal más larga." }
        ]
    },
    {
        id: 4,
        name: "MUNDO 4: ¡JaqueMate!",
        description: "¡Atrapa al Rey rival!",
        color: "#a855f7",
        puzzles: [
            { fen: "4k3/8/4R3/8/8/8/8/4K3 w - - 0 1", moves: ["Re8#"], goal: "Dá jaquemate con la torre.", hint: "Pon la torre justo delante del rey." },
            { fen: "k7/8/1Q6/8/8/8/8/4K3 w - - 0 1", moves: ["Qb7#"], goal: "¡La dama quiere dar el beso de la muerte!", hint: "Ponte al lado del rey con apoyo." }
        ]
    },
    {
        id: 5,
        name: "MUNDO 5: ¡Aperturas!",
        description: "¡Empieza la partida!",
        color: "#38bdf8",
        puzzles: [
            { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", moves: ["e4"], goal: "Ocupa el centro con tu peón de rey.", hint: "El movimiento más famoso: e4." }
        ]
    }
];

window.KIDS_LEVELS = KIDS_LEVELS;

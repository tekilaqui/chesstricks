const KIDS_LEVELS = [
    {
        id: 1,
        name: "MUNDO 1: ¡Los Peones!",
        description: "Aprende cómo caminan y capturan los soldados del ajedrez.",
        color: "#FFD700",
        puzzles: [
            { fen: "8/8/8/8/8/8/4P3/8 w - - 0 1", moves: ["e3", "e4"], goal: "Mueve el peón hacia adelante.", hint: "Los peones caminan de frente." },
            { fen: "8/8/8/8/8/4P3/8/8 w - - 0 1", moves: ["e4"], goal: "¡Sigue avanzando!", hint: "Un paso más hacia la corona." },
            { fen: "8/8/8/4p3/3P4/8/8/8 w - - 0 1", moves: ["dxe5"], goal: "¡Captura el peón enemigo!", hint: "Los peones capturan en diagonal." },
            { fen: "8/8/8/8/6p1/5P2/8/8 w - - 0 1", moves: ["fxg4"], goal: "¡El peón g te está mirando! ¡Cómelo!", hint: "Captura de lado (diagonal)." },
            { fen: "8/k7/4P3/8/8/8/8/8 w - - 0 1", moves: ["e7"], goal: "¡Casi llegas al final!", hint: "Sigue recto." },
            { fen: "2k5/3P4/8/8/8/8/8/8 w - - 0 1", moves: ["d8", "dxc8"], goal: "¡Llega a la última fila para coronar!", hint: "¡Último paso!" }
        ]
    },
    {
        id: 2,
        name: "MUNDO 2: ¡La Torre!",
        description: "La torre atraviesa el tablero en líneas rectas (+).",
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
        description: "El alfil patina por las diagonales de su color (X).",
        color: "#fb923c",
        puzzles: [
            { fen: "8/8/8/8/4B3/8/8/8 w - - 0 1", moves: ["Bf5", "Bh7", "Bd3", "Bb1", "Bf3", "Bg2", "Bh1", "Bd5", "Bc6", "Bb7", "Ba8"], goal: "Mueve el Alfil por su color.", hint: "El alfil se mueve como una X." },
            { fen: "2q5/8/8/8/8/7B/8/8 w - - 0 1", moves: ["Bxc8"], goal: "¡Cruza todo el tablero y come la dama!", hint: "Busca la diagonal." },
            { fen: "8/8/8/4b3/8/8/8/1B6 w - - 0 1", moves: ["Bxe4"], goal: "¡Atrapa al alfil enemigo!", hint: "Los alfiles también chocan en diagonal." }
        ]
    },
    {
        id: 4,
        name: "MUNDO 4: ¡La Dama!",
        description: "¡La Dama es la más poderosa! Se mueve como torre y alfil.",
        color: "#f472b6",
        puzzles: [
            { fen: "8/8/8/8/4Q3/8/8/8 w - - 0 1", moves: ["Qe5", "Qe6", "Qe7", "Qe8", "Qe3", "Qe2", "Qe1", "Qf4", "Qg4", "Qh4", "Qd4", "Qc4", "Qb4", "Qa4", "Qf5", "Qg6", "Qh7", "Qd3", "Qc2", "Qb1", "Qf3", "Qg2", "Qh1", "Qd5", "Qc6", "Qb7", "Qa8"], goal: "Mueve la Dama a donde quieras.", hint: "¡Puede ir en cualquier dirección recta o diagonal!" },
            { fen: "2r5/5p2/8/4Q3/8/8/8/8 w - - 0 1", moves: ["Qxc8", "Qxf7"], goal: "¡Atrapa a una de las piezas enemigas!", hint: "La dama ve a todos." }
        ]
    },
    {
        id: 5,
        name: "MUNDO 5: ¡El Caballo!",
        description: "El caballo salta en forma de 'L'. ¡Puede saltar sobre otros!",
        color: "#a855f7",
        puzzles: [
            { fen: "8/8/8/8/4N3/8/8/8 w - - 0 1", moves: ["Nf6", "Ng5", "Ng3", "Nf2", "Nd2", "Nc3", "Nc5", "Nd6"], goal: "Mueve el caballo dibujando una 'L'.", hint: "Dos pasos rectos y uno al lado." },
            { fen: "8/4p3/8/2N5/8/8/8/8 w - - 0 1", moves: ["Nxe6"], goal: "¡Salta y captura al peón!", hint: "Llegarás en dos pasos si miras bien (L)." }
        ]
    },
    {
        id: 6,
        name: "MUNDO 6: ¡Jaque y Mate!",
        description: "Aprende a atrapar al Rey. ¡El objetivo del juego!",
        color: "#ef4444",
        puzzles: [
            { fen: "4k3/8/4R3/8/8/8/8/4K3 w - - 0 1", moves: ["Re8#"], goal: "¡Dá jaque mate!", hint: "Pon la torre en la última fila." },
            { fen: "k7/8/1Q6/8/8/8/8/4K3 w - - 0 1", moves: ["Qb7#"], goal: "Dá el 'Beso de la Muerte' con la dama.", hint: "Ponte justo al lado del Rey." },
            { fen: "Rk6/8/K7/8/8/8/8/8 w - - 0 1", moves: ["Rb8#"], goal: "¡Atrapa al rey en el rincón!", hint: "La torre corta su salida." }
        ]
    },
    {
        id: 7,
        name: "MUNDO 7: ¡Tácticas Mágicas!",
        description: "Ataques dobles (Tenedores) y defensas.",
        color: "#10b981",
        puzzles: [
            { fen: "4k3/8/8/3N4/8/8/1r6/4K3 w - - 0 1", moves: ["Nc7+"], goal: "¡Ataque doble! Da jaque y ataca la torre.", hint: "Mueve el caballo a c7." },
            { fen: "k7/8/8/4Q3/8/8/1r2n3/4K3 w - - 0 1", moves: ["Qxb2"], goal: "¡El caballo nos ataca! ¡Cómelo!", hint: "Defiéndete capturando." }
        ]
    }
];

window.KIDS_LEVELS = KIDS_LEVELS;

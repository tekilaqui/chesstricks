/**
 * Chess School Curriculum (Inspired by lichess.org/learn)
 */
const KIDS_LEVELS = [
    // --- CATEGORY: LAS PIEZAS ---
    {
        id: 'rook',
        category: 'Piezas',
        name: "La Torre 🏰",
        description: "¡Atraviesa el tablero en línea recta!",
        color: "#3b82f6",
        theory: "La Torre es una pieza muy poderosa que se mueve en líneas rectas (como una cruz +). Puede recorrer todo el tablero de un solo golpe si el camino está despejado. Recuerda: ¡nunca puede saltar sobre otras piezas!",
        puzzles: [
            { fen: "8/8/8/8/4R3/8/8/8 w - - 0 1", goal: "Mueve la torre hasta arriba del todo (casilla e8).", moves: ["Re8"], hint: "Las torres se mueven en cruz (+)." },
            { fen: "8/2p5/8/8/2R5/8/8/8 w - - 0 1", goal: "¡Captura el peón!", moves: ["Rxc7"], hint: "Ve en línea recta hasta el peón." },
            { fen: "8/2p5/8/5p2/2R5/8/8/8 w - - 0 1", goal: "¡Atrapa ambos peones!", moves: ["Rxc7", "f5", "Rxf5"], hint: "Primero uno, luego el otro." }
        ]
    },
    {
        id: 'bishop',
        category: 'Piezas',
        name: "El Alfil ♗",
        description: "¡Patina por las diagonales!",
        color: "#fb923c",
        theory: "El Alfil es un experto en las diagonales. Se mueve como una X gigante. Un alfil que empieza en una casilla blanca siempre se quedará en las blancas, y el de casillas negras en las negras.",
        puzzles: [
            { fen: "8/8/8/8/4B3/8/8/8 w - - 0 1", goal: "Lleva el alfil a la esquina superior derecha (h7).", moves: ["Bh7"], hint: "Los alfiles se mueven en X." },
            { fen: "2p5/8/8/8/8/7B/8/8 w - - 0 1", goal: "Captura el peón lejano en c8.", moves: ["Bxc8"], hint: "Mira la diagonal larga." },
            { fen: "5p2/8/2p5/8/4B3/8/8/8 w - - 0 1", goal: "¡Atrapa los dos peones!", moves: ["Bxc6", "f5", "Bxf5"], hint: "Cambia de dirección en el camino." }
        ]
    },
    {
        id: 'queen',
        category: 'Piezas',
        name: "La Dama 👑",
        description: "¡La pieza más poderosa del juego!",
        color: "#f472b6",
        theory: "La Dama es la reina del tablero. Combina los movimientos de la Torre y el Alfil. Puede ir recto o en diagonal tantos pasos como quiera. Con ella, ¡puedes atacar desde cualquier lugar!",
        puzzles: [
            { fen: "8/8/8/8/4Q3/8/8/8 w - - 0 1", goal: "Mueve la Dama a la casilla a8.", moves: ["Qa8"], hint: "¡Se mueve como torre y alfil juntos!" },
            { fen: "2p5/5p2/8/4Q3/8/8/8/8 w - - 0 1", goal: "Atrapa las piezas enemigas.", moves: ["Qxc7", "f7", "Qxf7"], hint: "Usa tus superpoderes." }
        ]
    },
    {
        id: 'king',
        category: 'Piezas',
        name: "El Rey ♔",
        description: "¡Protégelo a toda costa! Paso a paso.",
        color: "#fbbf24",
        theory: "El Rey es la pieza más importante. Si lo atrapan, se acaba la partida. Se mueve igual que la dama pero solo un pasito cada vez. ¡Es lento pero muy valiente!",
        puzzles: [
            { fen: "8/8/8/8/4K3/8/8/8 w - - 0 1", goal: "Mueve el Rey a la casilla e5.", moves: ["Ke5"], hint: "El rey solo da un paso hacia cualquier lado." },
            { fen: "8/8/8/3p4/4K3/8/8/8 w - - 0 1", goal: "Captura el peón negro.", moves: ["Kxd5"], hint: "Poco a poco se llega lejos." }
        ]
    },
    {
        id: 'knight',
        category: 'Piezas',
        name: "El Caballo ♞",
        description: "¡Salta y sorprende en forma de 'L'!",
        color: "#a855f7",
        theory: "El Caballo es la única pieza que puede saltar sobre otras. Su movimiento es especial: dos pasos en una dirección y uno a un lado, formando una letra 'L'. ¡Donde cae, captura!",
        puzzles: [
            { fen: "8/8/8/8/4N3/8/8/8 w - - 0 1", goal: "Lleva el caballo a la casilla f6.", moves: ["Nf6"], hint: "Dos pasos rectos y uno al lado." },
            { fen: "8/3p4/8/1N6/8/8/8/8 w - - 0 1", goal: "Salta sobre el muro y captura el peón.", moves: ["Nxd7"], hint: "El caballo es el único que puede saltar." }
        ]
    },
    {
        id: 'pawn',
        category: 'Piezas',
        name: "El Peón ♙",
        description: "Pequeño pero valiente. ¡Casi puede coronar!",
        color: "#10b981",
        theory: "El Peón es el soldado. Camina de frente pero captura en diagonal. En su primer turno puede correr dando dos pasos. Si llega al final del tablero, ¡se transforma en la pieza que tú quieras!",
        puzzles: [
            { fen: "8/8/8/8/8/8/4P3/8 w - - 0 1", goal: "Avanza el peón dos pasos (e4).", moves: ["e4"], hint: "En su primer turno puede dar 2 pasos." },
            { fen: "8/8/8/4p3/3P4/8/8/8 w - - 0 1", goal: "Captura en diagonal.", moves: ["dxe5"], hint: "Los peones capturan diferente a como caminan." },
            { fen: "2r5/3P4/8/8/8/8/8/8 w - - 0 1", goal: "¡Llega al final para coronar!", moves: ["d8=Q"], hint: "¡Conviértete en Dama!" }
        ]
    },

    // --- CATEGORY: FUNDAMENTOS ---
    {
        id: 'checkmate',
        category: 'Fundamentos',
        name: "¡Jaque Mate! 🏆",
        description: "¡Aprende a atrapar al Rey!",
        color: "#ef4444",
        theory: "El Jaque Mate ocurre cuando el Rey enemigo está atacado y no tiene ninguna forma de escapar: no puede moverse, nadie puede cubrirlo y nadie puede comerse a la pieza que ataca. ¡Victoria!",
        puzzles: [
            { fen: "4k3/R7/4R3/8/8/8/8/4K3 w - - 0 1", goal: "Da el mate del pasillo con la torre.", moves: ["Re8#"], hint: "La última fila es el punto débil del Rey." },
            { fen: "k7/8/1Q6/8/8/8/8/4K3 w - - 0 1", goal: "¡Beso de la muerte!", moves: ["Qb7#"], hint: "Ponte justo delante del Rey con la Dama." },
            { fen: "Rk6/8/K7/8/8/8/8/8 w - - 0 1", goal: "Mate en el rincón.", moves: ["Rb8#"], hint: "La torre corta el camino y el Rey blanco ayuda." }
        ]
    },
    {
        id: 'protection',
        category: 'Fundamentos',
        name: "Defensa 🛡️",
        description: "¡Protege a tus amigos!",
        color: "#6366f1",
        theory: "El ajedrez es un juego de equipo. Si una de tus piezas está en peligro, puedes defenderla moviéndola a un sitio seguro, poniendo otra pieza en medio o protegiéndola con una compañera para que el rival no quiera capturarla.",
        puzzles: [
            { fen: "k7/8/8/8/8/1P6/P7/8 w - - 0 1", goal: "Protege el peón de a2 que está solo.", moves: ["b3"], hint: "Mueve el peón de b3 para que defienda en diagonal." },
            { fen: "r3k3/8/8/8/8/6B1/8/4K3 w - - 0 1", goal: "¡La torre nos mira! Escápate a f2.", moves: ["Bf2"], hint: "Cualquier movimiento que quite el alfil de la columna 'r' o lo defienda." }
        ]
    },

    // --- CATEGORY: TÁCTICAS MÁGICAS ---
    {
        id: 'fork',
        category: 'Tácticas',
        name: "Ataque Doble 🔱",
        description: "¡Ataca dos piezas a la vez!",
        color: "#ec4899",
        theory: "El ataque doble (o tenedor) es cuando una de tus piezas ataca a dos o más piezas del rival al mismo tiempo. ¡Es mágico porque el rival solo puede salvar una!",
        puzzles: [
            { fen: "4k3/8/8/3N4/8/8/1r6/4K3 w - - 0 1", goal: "Usa el caballo para atacar al Rey y la Torre.", moves: ["Nc7+"], hint: "Salta a la casilla c7." },
            { fen: "k7/8/8/8/2q5/8/PR6/K7 b - - 0 1", goal: "Con la Dama, ataca al Rey y a la Torre blanca.", moves: ["Qf1+"], hint: "Busca un jaque que también mire a la torre." }
        ]
    },
    {
        id: 'pin',
        category: 'Tácticas',
        name: "La Clavada ⚓",
        description: "¡Deja a su pieza sin poder moverse!",
        color: "#14b8a6",
        theory: "La Clavada es cuando atacas a una pieza enemiga que, si se moviera, dejaría expuesta detrás a otra pieza más valiosa (como el Rey o la Dama). ¡La pieza queda 'atrapada'!",
        puzzles: [
            { fen: "4k3/8/8/8/8/4r3/8/4R3 w - - 0 1", goal: "Clava la torre negra contra su Rey.", moves: ["Re1"], hint: "Pon tu torre en la misma columna que el rey y la torre enemiga." }
        ]
    }
];

window.KIDS_LEVELS = KIDS_LEVELS;

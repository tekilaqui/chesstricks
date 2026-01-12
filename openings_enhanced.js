// SISTEMA MEJORADO DE APERTURAS CON COMENTARIOS DE EXPERTO
const OPENINGS_ENHANCED = [
    {
        group: "Juegos Abiertos (1.e4 e5)", items: [
            {
                name: "Apertura Española (Ruy Lopez)",
                moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3"],
                comments: ["Presión clásica sobre e5.", "Desarrollo y enroque rápido.", "Las negras buscan solidez.", "Plan principal: ataque en flanco o ruptura d4."]
            },
            {
                name: "Apertura Italiana",
                moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+"],
                comments: ["Ataque directo al punto f7.", "Control del centro con c3 y d4.", "Juego táctico y abierto."]
            },
            {
                name: "Defensa Petrov",
                moves: ["e4", "e5", "Nf3", "Nf6", "Nxe5", "d6", "Nf3", "Nxe4", "d4", "d5"],
                comments: ["Defensa sólida y de contraataque.", "Evita la Ruy Lopez y la Italiana.", "Estructura simétrica y rocosa."]
            },
            {
                name: "Gambito de Rey",
                moves: ["e4", "e5", "f4", "exf4", "Nf3", "g5", "h4", "g4", "Ne5"],
                comments: ["Agresividad romántica desde la jugada 2.", "Sacrificio de peón por ataque.", "Partidas locas y muy tácticas."]
            }
        ]
    },
    {
        group: "Juegos Semi-Abiertos (1.e4 Otros)", items: [
            {
                name: "Defensa Siciliana (Najdorf)",
                moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be3", "e5", "Nb3"],
                comments: ["La respuesta más agresiva a e4.", "Lucha asimétrica por el centro.", "La variante Najdorf es la 'Rolls Royce' de las aperturas."]
            },
            {
                name: "Defensa Francesa",
                moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Be7", "e5", "Nfd7"],
                comments: ["Sólida pero pasiva al inicio.", "Contraataque en el centro con ...c5.", "Estructuras de peones bloqueadas."]
            },
            {
                name: "Defensa Caro-Kann",
                moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6"],
                comments: ["Extremadamente sólida.", "Similar a la Francesa pero el alfil de casillas blancas sale.", "Finales favorables para las negras."]
            },
            {
                name: "Defensa Escandinava",
                moves: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "d4", "Nf6"],
                comments: ["Desafío inmediato al centro.", "La dama sale pronto pero se esconde en a5.", "Esquemas sencillos de aprender."]
            },
            {
                name: "Defensa Alekhine",
                moves: ["e4", "Nf6", "e5", "Nd5", "d4", "d6", "c4", "Nb6", "f4"],
                comments: ["Provocación hipermoderna.", "Invita al blanco a avanzar peones para atacarlos.", "Arriesgada pero sorpresiva."]
            }
        ]
    },
    {
        group: "Juegos Cerrados (1.d4)", items: [
            {
                name: "Gambito de Dama Rehusado",
                moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O"],
                comments: ["Clásica lucha por el centro.", "El gambito busca desviar el peón central.", "Muy posicional y estratégica."]
            },
            {
                name: "Defensa Eslava",
                moves: ["d4", "d5", "c4", "c6", "Ni3", "Nf6", "Nc3", "dxc4", "a4"],
                comments: ["Sólida como una roca.", "Soporta el centro con peones.", "El alfil de dama no queda encerrado como en el GD Rehusado."]
            },
            {
                name: "Sistema Londres",
                moves: ["d4", "d5", "Bf4", "Nf6", "e3", "c5", "c3", "Nc6"],
                comments: ["Sistema universal y sólido.", "Desarrollo fácil y planes claros.", "Poco riesgo para las blancas."]
            }
        ]
    },
    {
        group: "Defensas Indias (1.d4 Nf6)", items: [
            {
                name: "India de Rey",
                moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5"],
                comments: ["Contraataque en el flanco de rey.", "Cede el centro para atacarlo después.", "Partidas complejas y dinámicas."]
            },
            {
                name: "India de Dama",
                moves: ["d4", "Nf6", "c4", "e6", "Nf3", "b6", "g3", "Ba6", "b3"],
                comments: ["Control de casillas centrales con piezas.", "Juego posicional y maniobrero.", "Sólida reputación."]
            },
            {
                name: "Defensa Nimzo-India",
                moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3", "O-O"],
                comments: ["Controla e4 clavando el caballo.", "Flexible y desequilibrante.", "Una de las mejores defensas contra 1.d4."]
            }
        ]
    },
    {
        group: "Trampas Típicas", items: [
            {
                name: "Mate del Pastor",
                moves: ["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6", "Qxf7#"],
                comments: ["¡Cuidado en la apertura!", "Ataque prematuro de dama.", "Error grave de las negras al no ver f7."]
            },
            {
                name: "Trampa del Arca de Noé (Ruy Lopez)",
                moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "d6", "d4", "b5", "Bb3", "Nxd4", "Nxd4", "exd4", "Qxd4", "c5", "Qd5", "Be6", "Qc6+", "Bd7", "Qd5", "c4"],
                comments: ["Trampa clásica para atrapar el alfil blanco.", "El alfil de a4 queda encerrado por los peones negros."]
            },
            {
                name: "Mate de Legal",
                moves: ["e4", "e5", "Nf3", "d6", "Bc4", "Bg4", "Nc3", "g6", "Nxe5", "Bxd1", "Bxf7+", "Ke7", "Nd5#"],
                comments: ["Sacrificio de dama espectacular.", "Aprovecha la clavada relativa.", "Jaque mate con piezas menores."]
            },
            {
                name: "Gambito Blackburne (Italiana)",
                moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nd4", "Nxe5", "Qg5", "Nxf7", "Qxg2", "Rf1", "Qxe4+", "Be2", "Nf3#"],
                comments: ["Trampa mortal en la Italiana.", "Las blancas codiciosas toman el peón e5.", "Mate ahogado con el caballo."]
            },
            {
                name: "Trampa de la Caña de Pescar (Ruy Lopez)",
                moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O", "Ng4", "h3", "h5", "hxg4", "hxg4", "Ne1", "Qh4"],
                comments: ["Sacrificio de caballo en la apertura.", "Ataque devastador por la columna h."]
            },
            {
                name: "Trampa del Elefante (Gambito Dama)",
                moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Nbd7", "cxd5", "exd5", "Nxd5", "Nxd5", "Bxd8", "Bb4+", "Qd2", "Bxd2+", "Kxd2", "Kxd8"],
                comments: ["Las blancas creen ganar un peón clavado.", "Las negras recuperan con jaque y ganan pieza."]
            }
        ]
    },
    {
        group: "Mates Típicos", items: [
            {
                name: "Mate del Pasillo",
                moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O", "Nxe4", "Re1", "Nd6", "Nxe5", "Nxb5", "Nxc6+", "Be7", "Nxe7", "Qxe7", "Rxe7+", "Kxe7"],
                comments: ["Suele ocurrir cuando el rey no tiene 'aire'.", "La torre o dama atacan la última fila."]
            },
            {
                name: "Mate de la Coz (Smothered Mate)",
                moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "d6", "Bg5", "e6", "Qd2", "Be7", "O-O-O", "O-O", "f4", "Nxd4", "Qxd4", "Qa5", "Bc4", "Bd7", "e5", "dxe5", "fxe5", "Bc6", "exf6", "Qxg5+", "Kb1", "Bxf6", "Qd3", "Rad8", "Qh3", "Rxd1+", "Rxd1", "Rd8", "Bd3", "h6", "Re1", "Qxg2", "Qe3", "Bg5", "Qxa7", "Qxh2", "a4", "Qd2", "Re2", "Qc1+", "Ka2", "Bf6", "Qa5", "Bd5+", "Nxd5", "Qxb2#"],
                comments: ["El rey está encerrado por sus propias piezas.", "Sólo el caballo puede dar este mate."]
            },
            {
                name: "Mate de Anastasia",
                moves: [],
                comments: ["Combina caballo y torre.", "El caballo controla g1 y g5 (o simétricos).", "La torre da mate en la columna h."]
            },
            {
                name: "Mate Árabe",
                moves: [],
                comments: ["Caballo y Torre colaboran en la esquina.", "Una de las formas de mate más antiguas."]
            },
            {
                name: "Mate de Bodén",
                moves: [],
                comments: ["Dos alfiles cruzados cortan al rey.", "Típico contra el enroque largo."]
            }
        ]
    }
];

// Sistema de evaluación de jugadas
const QUALITY_THRESHOLDS = {
    brilliant: 0.1,    // Mejora más de 1.0
    excellent: 0.25,   // Entre 0.9 y 0.25
    good: 0.5,         // Entre 0.25 y 0.5
    inaccuracy: 0.8,   // Entre 0.5 y 0.8
    mistake: 1.5,      // Entre 0.8 y 1.5
    blunder: 999       // Más de 1.5
};

function evaluateMoveQuality(cpLoss) {
    if (cpLoss < QUALITY_THRESHOLDS.brilliant) return 'brilliant';
    if (cpLoss < QUALITY_THRESHOLDS.excellent) return 'excellent';
    if (cpLoss < QUALITY_THRESHOLDS.good) return 'good';
    if (cpLoss < QUALITY_THRESHOLDS.inaccuracy) return 'inaccuracy';
    if (cpLoss < QUALITY_THRESHOLDS.mistake) return 'mistake';
    return 'blunder';
}
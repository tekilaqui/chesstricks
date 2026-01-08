// SISTEMA MEJORADO DE APERTURAS CON COMENTARIOS DE EXPERTO
const OPENINGS_ENHANCED = [
    {
        group: "Juegos Abiertos (1.e4 e5)", items: [
            {
                name: "Apertura Española (Ruy Lopez)",
                moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3"],
                comments: [
                    "El peón rey abre líneas para el alfil y la dama, controlando el centro.",
                    "Las negras responden simétricamente, luchando por el centro.",
                    "El caballo desarrollado ataca e5 y prepara d4.",
                    "Desarrollo natural defendiendo e5.",
                    "El alfil español presiona el caballo que defiende e5. Idea clásica de la Ruy Lopez.",
                    "Las negras preguntan al alfil: ¿te retiras o cambias?",
                    "Mantenemos la tensión retirando a a4, conservando la presión sobre c6.",
                    "Desarrollo con ataque al peón e4.",
                    "Enroque corto, poniendo el rey a salvo y activando la torre.",
                    "Desarrollo del alfil, preparando el enroque.",
                    "La torre apoya e4 y prepara el avance d4.",
                    "Ganando espacio en el flanco de dama.",
                    "El alfil se retira a b3, manteniendo presión diagonal.",
                    "Reforzando e5 y preparando Be6.",
                    "Preparando d4, el golpe central típico de la Ruy Lopez.",
                    "Las negras completan su desarrollo con seguridad.",
                    "Preparando Nbd2 y evitando clavadas con Bg4."
                ]
            },
            {
                name: "Apertura Italiana",
                moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+", "Bd2", "Bxd2+", "Nbxd2"],
                comments: [
                    "Apertura del peón rey, controlando el centro.",
                    "Respuesta simétrica de las negras.",
                    "Desarrollo del caballo atacando e5.",
                    "Defensa del peón central.",
                    "El alfil italiano apunta a f7, el punto débil de las negras.",
                    "Las negras copian el desarrollo, creando tensión.",
                    "Preparando d4, el golpe central de la Italiana.",
                    "Ataque al peón e4 con desarrollo.",
                    "¡El golpe central! Abriendo el juego.",
                    "Las negras aceptan el desafío.",
                    "Recuperando el peón con centro fuerte.",
                    "Jaque intermedio ganando tiempo.",
                    "Bloqueando el jaque con desarrollo.",
                    "Cambio de alfiles aliviando la presión.",
                    "Desarrollo con ventaja de espacio en el centro."
                ]
            },
            {
                name: "Gambito de Rey",
                moves: ["e4", "e5", "f4", "exf4", "Nf3", "g5", "Bc4", "g4", "O-O"],
                comments: [
                    "Apertura del peón rey.",
                    "Las negras aceptan el desafío central.",
                    "¡El gambito! Sacrificamos un peón por desarrollo rápido.",
                    "Las negras aceptan el gambito.",
                    "Desarrollo rápido atacando el centro.",
                    "Las negras intentan mantener el peón extra.",
                    "Apuntando a f7 con amenazas tácticas.",
                    "Avance agresivo del peón g.",
                    "¡Enroque! Activando la torre y buscando ataque."
                ]
            }
        ]
    },
    {
        group: "Juegos Semi-Abiertos (1.e4 Otros)", items: [
            {
                name: "Defensa Siciliana - Najdorf",
                moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be3", "e5", "Nb3", "Be6", "f3"],
                comments: [
                    "Las blancas abren con el peón rey.",
                    "¡La Siciliana! La defensa más combativa contra 1.e4.",
                    "Desarrollo natural del caballo.",
                    "Preparando ...Nf6 y manteniendo flexibilidad.",
                    "Golpe central, abriendo líneas.",
                    "Las negras cambian en el centro.",
                    "Recuperando con el caballo centralizado.",
                    "Desarrollo atacando e4.",
                    "Reforzando el centro.",
                    "¡La jugada Najdorf! Controlando b5 y preparando ...e5.",
                    "Desarrollo del alfil con idea de Qd2 y O-O-O.",
                    "Ganando espacio en el centro.",
                    "El caballo se retira pero mantiene presión.",
                    "Desarrollo con idea de ...Nbd7.",
                    "Preparando g4 y ataque en el flanco de rey."
                ]
            },
            {
                name: "Defensa Francesa",
                moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Be7", "e5", "Nfd7", "Bxe7", "Qxe7", "f4"],
                comments: [
                    "Peón rey al centro.",
                    "La Francesa: sólida y estratégica.",
                    "Ocupando más espacio central.",
                    "Desafiando el centro blanco.",
                    "Defendiendo e4.",
                    "Atacando e4 inmediatamente.",
                    "Clavada clásica de la Francesa.",
                    "Desarrollo rompiendo la clavada.",
                    "Ganando espacio, típico de la Francesa.",
                    "El caballo se retira pero controla e5.",
                    "Cambio de alfil malo de las negras.",
                    "Recuperando con la dama activa.",
                    "Reforzando e5 y preparando expansión."
                ]
            },
            {
                name: "Defensa Caro-Kann",
                moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6", "h4", "h6", "Nf3", "Nd7"],
                comments: [
                    "Peón rey al centro.",
                    "La Caro-Kann: sólida y confiable.",
                    "Ampliando el control central.",
                    "Desafío directo al centro.",
                    "Defendiendo e4.",
                    "Las negras cambian en el centro.",
                    "Recuperando con el caballo.",
                    "Desarrollo del alfil antes de e6, idea clave de la Caro-Kann.",
                    "Atacando el alfil.",
                    "Retroceso manteniendo el alfil activo.",
                    "Ganando espacio en el flanco de rey.",
                    "Evitando h5.",
                    "Desarrollo del caballo.",
                    "Preparando Ngf6 y completando desarrollo."
                ]
            }
        ]
    },
    {
        group: "Juegos Cerrados (1.d4 d5)", items: [
            {
                name: "Gambito de Dama Rehusado",
                moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "Nbd7", "Rc1", "c6", "Bd3"],
                comments: [
                    "Peón dama al centro, apertura clásica.",
                    "Respuesta simétrica.",
                    "¡El Gambito de Dama! Presionando d5.",
                    "Rehusando el gambito, manteniendo el centro.",
                    "Desarrollo del caballo.",
                    "Desarrollo natural.",
                    "Clavada típica del Gambito de Dama.",
                    "Rompiendo la clavada.",
                    "Preparando Bd3 y O-O.",
                    "Enroque corto, seguridad del rey.",
                    "Completando el desarrollo de piezas menores.",
                    "Desarrollo flexible del caballo.",
                    "Activando la torre en la columna c.",
                    "Reforzando d5.",
                    "Desarrollo del alfil con ideas de ataque."
                ]
            },
            {
                name: "Sistema Londres",
                moves: ["d4", "d5", "Bf4", "Nf6", "e3", "c5", "c3", "Nc6", "Nf3", "Qb6", "Qb3"],
                comments: [
                    "Peón dama al centro.",
                    "Respuesta simétrica.",
                    "El Sistema Londres: desarrollo del alfil antes de e3.",
                    "Desarrollo del caballo.",
                    "Preparando Bd3.",
                    "Contraataque en el centro.",
                    "Reforzando d4.",
                    "Desarrollo del caballo.",
                    "Desarrollo natural.",
                    "Presión sobre b2 y d4.",
                    "Defendiendo b2 y ofreciendo cambio de damas."
                ]
            }
        ]
    },
    {
        group: "Defensas Indias (1.d4 Nf6)", items: [
            {
                name: "India de Rey - Clásica",
                moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5", "O-O", "Nc6", "d5", "Ne7"],
                comments: [
                    "Peón dama al centro.",
                    "Desarrollo del caballo, preparando fianchetto.",
                    "Ganando espacio en el centro.",
                    "Fianchetto del alfil de rey.",
                    "Desarrollo del caballo.",
                    "El alfil indio en su diagonal larga.",
                    "Centro amplio de las blancas.",
                    "Preparando ...e5.",
                    "Desarrollo del caballo.",
                    "Enroque corto.",
                    "Desarrollo modesto pero sólido.",
                    "¡Contraataque central! Típico de la India de Rey.",
                    "Enroque blanco.",
                    "Desarrollo del caballo.",
                    "Cerrando el centro.",
                    "El caballo busca f5 o g6."
                ]
            },
            {
                name: "Defensa Nimzo-India",
                moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3", "O-O", "Bd3", "d5", "Nf3", "c5", "O-O"],
                comments: [
                    "Peón dama al centro.",
                    "Desarrollo del caballo.",
                    "Ganando espacio.",
                    "Preparando ...Bb4.",
                    "Desarrollo del caballo.",
                    "¡La Nimzo-India! Clavada estratégica.",
                    "Desarrollo sólido.",
                    "Enroque corto.",
                    "Desarrollo del alfil.",
                    "Golpe central.",
                    "Desarrollo del caballo.",
                    "Contraataque en el flanco de dama.",
                    "Enroque completando desarrollo."
                ]
            }
        ]
    }
];

// --- PASSWORD TOGGLE ---
$('#btn-show-pass').off('click').on('click', function () {
    const input = $('#auth-pass');
    const type = input.attr('type') === 'password' ? 'text' : 'password';
    input.attr('type', type);
    $(this).text(type === 'password' ? '👁️' : '🔒');
});

const OPENINGS_DATA = [
    {
        group: "Juegos Abiertos (1.e4 e5)", items: [
            { name: "Apertura Española (Ruy Lopez)", m: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O"] },
            { name: "Apertura Italiana", m: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4"] },
            { name: "Defensa De los Dos Caballos", m: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "d3", "Bc5"] },
            { name: "Apertura Escocesa", m: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4"] },
            { name: "Gambito de Rey", m: ["e4", "e5", "f4", "exf4", "Nf3", "d6", "d4"] },
            { name: "Defensa Philidor", m: ["e4", "e5", "Nf3", "d6", "d4", "exd4", "Nxd4"] },
            { name: "Defensa Petrov", m: ["e4", "e5", "Nf3", "Nf6", "Nxe5", "d6", "Nf3", "Nxe4"] }
        ]
    },
    {
        group: "Juegos Semi-Abiertos (1.e4 Otros)", items: [
            { name: "Defensa Siciliana", m: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3"] },
            { name: "Siciliana Najdorf", m: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be3", "e5"] },
            { name: "Siciliana Dragón", m: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6", "Be3", "Bg7", "f3"] },
            { name: "Defensa Francesa", m: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Be7"] },
            { name: "Defensa Caro-Kann", m: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5"] },
            { name: "Defensa Escandinava", m: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "d4"] },
            { name: "Defensa Alekhine", m: ["e4", "Nf6", "e5", "Nd5", "d4", "d6", "c4", "Nb6"] }
        ]
    },
    {
        group: "Juegos Cerrados (1.d4 d5)", items: [
            { name: "Gambito de Dama", m: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7"] },
            { name: "Gambito de Dama Aceptado", m: ["d4", "d5", "c4", "dxc4", "Nf3", "Nf6", "e3"] },
            { name: "Gambito de Dama Rehusado", m: ["d4", "d5", "c4", "e6"] },
            { name: "Defensa Eslava", m: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "e6"] },
            { name: "Sistema Londres", m: ["d4", "d5", "Bf4", "Nf6", "e3", "c5", "c3"] }
        ]
    },
    {
        group: "Defensas Indias (1.d4 Nf6)", items: [
            { name: "India de Rey", m: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O"] },
            { name: "India de Dama", m: ["d4", "Nf6", "c4", "e6", "Nf3", "b6", "g3", "Ba6"] },
            { name: "Defensa Nimzo-India", m: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3", "O-O"] },
            { name: "Defensa Grunfeld", m: ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5", "Nxd5", "e4", "Nxd3"] }
        ]
    },
    {
        group: "Flanco y Otros", items: [
            { name: "Apertura Inglesa", m: ["c4"] },
            { name: "Apertura Reti", m: ["Nf3"] },
            { name: "Apertura Bird", m: ["f4"] },
            { name: "Apertura Larsen", m: ["b3"] },
            { name: "Mate del Pastor (Trampa)", m: ["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6", "Qxf7#"] }
        ]
    }
];

// Use enhanced openings if available, otherwise fall back to basic
const ACTIVE_OPENINGS = (typeof OPENINGS_ENHANCED !== 'undefined') ? OPENINGS_ENHANCED : OPENINGS_DATA;

// Store current opening info for expert comments
var currentOpeningName = null;
var currentOpeningComments = [];

const OPENING_TAG_MAP = {
    'Apertura Española (Ruy Lopez)': 'Ruy_Lopez',
    'Apertura Italiana': 'Italian_Game',
    'Defensa De los Dos Caballos': 'Two_Knights_Defense',
    'Apertura Escocesa': 'Scotch_Game',
    'Gambito de Rey': 'Kings_Gambit',
    'Defensa Philidor': 'Philidor_Defense',
    'Defensa Petrov': 'Petrov_Defense',
    'Defensa Siciliana': 'Sicilian_Defense',
    'Siciliana Najdorf': 'Sicilian_Defense_Najdorf_Variation',
    'Siciliana Dragón': 'Sicilian_Defense_Dragon_Variation',
    'Defensa Francesa': 'French_Defense',
    'Defensa Caro-Kann': 'Caro-Kann_Defense',
    'Defensa Escandinava': 'Scandinavian_Defense',
    'Defensa Alekhine': 'Alekhine_Defense',
    'Gambito de Dama': 'Queens_Gambit',
    'Gambito de Dama Aceptado': 'Queens_Gambit_Accepted',
    'Gambito de Dama Rehusado': 'Queens_Gambit_Declined',
    'Defensa Eslava': 'Slav_Defense',
    'Sistema Londres': 'London_System',
    'India de Rey': 'Kings_Indian_Defense',
    'India de Dama': 'Queens_Indian_Defense',
    'Defensa Nimzo-India': 'Nimzo-Indian_Defense',
    'Defensa Grunfeld': 'Grunfeld_Defense',
    'Apertura Inglesa': 'English_Opening',
    'Apertura Reti': 'Reti_Opening',
    'Apertura Bird': 'Bird_Opening',
    'Apertura Larsen': 'Larsen_Opening'
};

var game = new Chess();
var board = null;

// Auto-detect server URL
var socketUrl = (window.location.protocol === 'file:')
    ? 'http://localhost:3000'
    : window.location.origin;

var storedToken = localStorage.getItem('chess_token');
var socket = null;
try {
    if (typeof io !== 'undefined') {
        socket = io(socketUrl, {
            auth: { token: storedToken },
            transports: ['websocket', 'polling']
        });
    } else {
        console.warn("Socket.io not loaded. Offline mode forced.");
        // Dummy socket to prevent crashes
        socket = {
            on: function () { },
            emit: function () { },
            connected: false
        };
    }
} catch (e) { console.error(e); }

socket.on('connect', () => {
    console.log("✅ Conectado para sincronización de progreso");
});

socket.on('connect_error', (err) => {
    console.warn("⚠️ Sin conexión al servidor. Modo local activo.");
});

const openAuth = () => {
    console.log("Opening auth modal...");
    $('#auth-modal').css('display', 'flex');
    $('#side-drawer').removeClass('open');
    $('#side-drawer-overlay').fadeOut();
};

const showToast = (msg, icon = '✅') => {
    const toast = $(`<div class="toast"><span>${icon}</span> <span>${msg}</span></div>`);
    $('#toast-container').append(toast);
    setTimeout(() => toast.remove(), 3200);
};

var gameId = null;
var currentMode = 'local'; // Default mode
var selectedSq = null;
var hintsActive = false; // Unified hints toggle
var isJ = false;
var lastEv = 0; // Legacy var, prefer window.lastEval
window.lastEval = undefined;
window.currentEval = undefined;
var stockfish = null;
var aiThinking = false;
var myColor = 'w';
var userEloBullet = 500;
var userEloBlitz = 500;
var userEloRapid = 500;
var userEloDaily = 500;
var opponentElo = 500;

// TIMER VARIABLES
var whiteTime = 600; // default 10m
var blackTime = 600;
var clockInterval = null;
var gameStarted = false;

// PUZZLE TIMER
var puzSeconds = 0;
var puzTimerInterval = null;

var currentPuzzle = null;
var puzzleStep = 0;
// SISTEMA ELO & AUTH
var userElo = parseInt(localStorage.getItem('chess_user_elo')) || 500;
var userPuzzleElo = parseInt(localStorage.getItem('chess_puz_elo')) || 500;
var userName = localStorage.getItem('chess_username') || "Invitado";
var isAuth = localStorage.getItem('chess_is_auth') === 'true';

// SOUND SYSTEM
var soundOn = localStorage.getItem('chess_sound') !== 'false';
const sounds = {
    move: new Audio('https://github.com/lichess-org/lila/raw/master/public/sound/standard/Move.mp3'),
    capture: new Audio('https://github.com/lichess-org/lila/raw/master/public/sound/standard/Capture.mp3'),
    check: new Audio('https://github.com/lichess-org/lila/raw/master/public/sound/standard/Check.mp3'),
    end: new Audio('https://github.com/lichess-org/lila/raw/master/public/sound/standard/GenericNotify.mp3'),
    error: new Audio('https://github.com/lichess-org/lila/raw/master/public/sound/standard/Error.mp3')
};

function playSnd(s) {
    if (soundOn && sounds[s]) {
        sounds[s].currentTime = 0;
        sounds[s].play().catch(e => { });
    }
}
var historyPositions = ['start'];
var currentHistoryIndex = 0;
var moveHistory = []; // Logic for analysis {fen, move, cp, diff, quality}
var analysisActive = false;

// MULTI-LANGUAGE SUPPORT
var currentLang = localStorage.getItem('chess_lang') || 'es';
const LANGS = {
    es: {
        mate: "JAQUE MATE", win: "¡HAS GANADO!", lose: "HAS PERDIDO", draw: "TABLAS",
        resign: "¿Estás seguro de que quieres rendirte?", abort: "¿Abortar partida? No perderás ELO.",
        guest: "Invitado", login: "INICIAR SESIÓN", logout: "CERRAR SESIÓN",
        puz_done: "¡EXCELENTE!", puz_hint: "Analiza bien la posición...",
        best_move: "Mejor jugada", level: "Nivel", diff: "Dificultad", theme: "Temas",
        brilliant: "¡ESPECTACULAR!", great: "¡Muy buena!", best: "Mejor jugada",
        good: "Buena", inaccuracy: "Imprecisión", mistake: "Error", blunder: "ERROR GRAVE",
        privacy: "🔒 Tus datos se gestionan de forma segura.",
        logout_auth: "CERRAR SESIÓN"
    },
    en: {
        mate: "CHECKMATE", win: "YOU WON!", lose: "YOU LOST", draw: "DRAW",
        resign: "Are you sure you want to resign?", abort: "Abort game? You won't lose ELO.",
        guest: "Guest", login: "LOGIN", logout: "LOGOUT",
        puz_done: "EXCELLENT!", puz_hint: "Analyze the position carefully...",
        best_move: "Best move", level: "Level", diff: "Difficulty", theme: "Themes",
        brilliant: "BRILLIANT!", great: "Great find!", best: "Best move",
        good: "Good", inaccuracy: "Inaccuracy", mistake: "Mistake", blunder: "BLUNDER",
        privacy: "🔒 Your data is managed securely.",
        logout_auth: "SIGN OUT"
    }
};

function detectOpening() {
    const history = game.history();
    if (history.length === 0) return { name: "", moveCount: 0, comments: [] };
    const movesStr = history.join(' ');
    let foundName = "";
    let foundMoveCount = 0;
    let foundComments = [];

    ACTIVE_OPENINGS.forEach(group => {
        group.items.forEach(item => {
            const moves = item.moves || item.m || [];
            const entryStr = moves.join(' ');
            // If the theoretical line includes/starts with our current moves
            if (entryStr.startsWith(movesStr)) {
                if (moves.length > foundMoveCount) {
                    foundName = item.name;
                    foundMoveCount = moves.length;
                    foundComments = item.comments || [];
                }
            } else if (movesStr.startsWith(entryStr)) { // We passed the line
                if (moves.length > foundMoveCount) {
                    foundName = item.name;
                    foundMoveCount = moves.length;
                    foundComments = item.comments || [];
                }
            }
        });
    });

    const result = { name: foundName, moveCount: foundMoveCount, comments: foundComments };
    if (foundName && foundMoveCount >= 4) {
        let practiced = JSON.parse(localStorage.getItem('chess_practiced_openings') || '[]');
        if (!practiced.includes(foundName)) {
            practiced.push(foundName);
            localStorage.setItem('chess_practiced_openings', JSON.stringify(practiced));
            if (window.updateStudyStats) updateStudyStats();
        }
    }
    return result;
}

function findTheoreticalNextMove() {
    const history = game.history();
    const historyStr = history.join(' ');
    const candidates = [];

    ACTIVE_OPENINGS.forEach(group => {
        group.items.forEach(item => {
            const moves = item.moves || item.m || [];
            const entryStr = moves.join(' ');
            if (entryStr.startsWith(historyStr) && moves.length > history.length) {
                candidates.push({
                    move: moves[history.length],
                    name: item.name,
                    comments: item.comments || []
                });
            }
        });
    });

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
}

window.resetGamePosition = function () {
    game.reset();
    board.start();
    aiPracticeIndex = 0;
    studyIndex = 0;
    historyPositions = ['start'];
    currentHistoryIndex = 0;
    updateUI(true);
    showToast("Posición inicial restaurada", "🧹");
    if (currentMode === 'study') $('#study-controls').fadeOut();
};

function getAiElo() {
    const diff = parseInt($('#diff-sel').val()) || 5;
    return 600 + (diff * 100);
}

function getQualityMsg(diff, isMate, isBookMove = false) {
    const t = LANGS[currentLang];
    if (isBookMove) return { text: "📖 " + (t.book || "Teoría / Libro"), class: 'quality-book', symbol: '📖' };
    if (isMate) return { text: "!! " + t.mate, class: 'quality-excellent', symbol: '!!' };

    // Safety check for null/undefined diff
    if (diff === null || diff === undefined) diff = 0;

    if (diff < 0.1) return { text: "!! " + (t.brilliant || "Jugada Maestra"), class: 'quality-excellent', symbol: '!!' };
    if (diff < 0.25) return { text: "! " + t.best, class: 'quality-excellent', symbol: '!' };
    if (diff < 0.5) return { text: "⭐ " + (t.great || "Muy buena"), class: 'quality-excellent', symbol: '⭐' };
    if (diff < 0.8) return { text: t.good, class: 'quality-excellent', symbol: '' };
    if (diff < 1.4) return { text: "?! " + t.inaccuracy, class: 'quality-dubious', symbol: '?!' };
    if (diff < 2.5) return { text: "? " + t.mistake, class: 'quality-dubious', symbol: '?' };
    return { text: "?? " + t.blunder, class: 'quality-blunder', symbol: '??' };
}

function setLanguage(l) {
    currentLang = l;
    localStorage.setItem('chess_lang', l);
    const t = LANGS[l];
    $('#auth-title').text(t.login);
    if (!isAuth) {
        $('#my-name-display').text(t.guest);
        $('#drawer-user-name').text(t.guest);
    }
    $('#lbl-user').text(l === 'es' ? "👤 USUARIO" : "👤 USER");
    $('#lbl-appearance').text(l === 'es' ? "🎨 APARIENCIA" : "🎨 APPEARANCE");
    $('#lbl-board').text(l === 'es' ? "Tablero" : "Board");
    $('#lbl-pieces').text(l === 'es' ? "Piezas" : "Pieces");
    $('#lbl-lang').text(l === 'es' ? "🌐 IDIOMA" : "🌐 LANGUAGE");
    $('#btn-flip').text(l === 'es' ? "GIRAR TABLERO" : "FLIP BOARD");
    $('#btn-abort').text(l === 'es' ? "ABORTAR" : "ABORT");
    $('#btn-resign-ai, #btn-resign-local').text(l === 'es' ? "RENDIRSE" : "RESIGN");
    $('#btn-start-ai').text(l === 'es' ? "EMPEZAR PARTIDA" : "START GAME");
    $('#auth-privacy').text(t.privacy);
    if (isAuth) $('#btn-logout-drawer').text(t.logout_auth);

    // Dynamic text updates for current game/analysis if active
    if (window.updateUI) updateUI();
}

function formatTime(s) {
    if (isNaN(s) || s === null) return "00:00";
    if (s < 0) s = 0;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
        return h + ":" + (m < 10 ? "0" : "") + m + ":" + (sec < 10 ? "0" : "") + sec;
    }
    return (m < 10 ? "0" : "") + m + ":" + (sec < 10 ? "0" : "") + sec;
}

function stopClock() {
    clearInterval(clockInterval);
    clockInterval = null;
    $('.timer-box').removeClass('active');
}

function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    gameStarted = true;
    clockInterval = setInterval(() => {
        if (game.turn() === 'w') {
            whiteTime--;
            $('#my-timer').text(formatTime(whiteTime));
            if (whiteTime <= 30) $('#my-timer').addClass('low-time');
            if (whiteTime <= 0) endGameByTime('w');
        } else {
            blackTime--;
            $('#opp-timer').text(formatTime(blackTime));
            if (blackTime <= 30) $('#opp-timer').addClass('low-time');
            if (blackTime <= 0) endGameByTime('b');
        }
        updateTimerVisuals();
    }, 1000);
}

function updateTimerVisuals() {
    $('.timer-box').removeClass('active');
    if (game.turn() === 'w') $('#my-timer').addClass('active');
    else $('#opp-timer').addClass('active');
}

function endGameByTime(loser) {
    stopClock();
    const winner = loser === 'w' ? 'Negras' : 'Blancas';
    alert(`¡TIEMPO AGOTADO! Ganan las ${winner} `);
    checkGameOver(); // handles elo
}

function getAiElo() {
    const lvl = parseInt($('#diff-sel').val()) || 10;
    // Map levels to approximate ELO
    if (lvl <= 5) return 500 + (lvl - 1) * 150;
    if (lvl <= 10) return 1100 + (lvl - 5) * 120;
    if (lvl <= 15) return 1700 + (lvl - 10) * 80;
    return 2100 + (lvl - 15) * 80;
}

function updateElo(opponentElo, result, isPuzzle = false) {
    const k = 32;
    const currentElo = isPuzzle ? userPuzzleElo : userElo;
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
    const newElo = Math.round(currentElo + k * (result - expectedScore));

    if (isPuzzle) {
        userPuzzleElo = Math.max(100, newElo);
        localStorage.setItem('chess_puz_elo', userPuzzleElo);
        $('#header-elo-puz, #puz-elo-display').text(userPuzzleElo + (isPuzzle ? "🧩" : ""));
    } else {
        userElo = Math.max(100, newElo);
        localStorage.setItem('chess_user_elo', userElo);
        $('#header-elo').text(userElo + " ELO");
    }

    $('#coach-txt').append(`<br><b style="color:var(--accent)">${isPuzzle ? 'Puzzle ELO' : 'Nivel'}: ${newElo}</b>`);

    // Sync with Server (Simplified)
    if (isAuth && socket && socket.connected) {
        socket.emit('update_elo', {
            user: userName,
            elo: userElo,
            puzElo: userPuzzleElo
        });
    }

    // Update Study Stats
    updateStudyStats();
}

function updateStudyStats() {
    const solved = JSON.parse(localStorage.getItem('chess_solved_puzzles') || '[]');
    $('#stat-puz-count').text(solved.length);

    const practiced = JSON.parse(localStorage.getItem('chess_practiced_openings') || '[]');
    $('#stat-openings-count').text(practiced.length);

    // Header elos
    $('#header-elo-puz').text(`🧩 Puzzles: ${userPuzzleElo}`);
    $('#header-elo').text(`📊 Nivel: ${userElo}`);
}

var solvedPuzzles = JSON.parse(localStorage.getItem('chess_solved_puzzles') || '[]');


// Initial Load or Fallback
var localPuzzles = (typeof LOCAL_PUZZLES_DB !== 'undefined') ? LOCAL_PUZZLES_DB : [];

var drillCategory = null;

async function loadRandomPuzzle(retryCount = 0, forcedCat = null) {
    if (forcedCat) drillCategory = forcedCat;
    const cat = drillCategory || $('#puz-cat-sel').val();
    const themesPool = ['fork', 'pin', 'skewer', 'sacrifice', 'mate', 'mateIn2', 'mateIn1', 'advantage', 'crushing', 'opening', 'middlegame', 'endgame', 'long', 'short'];

    if (retryCount === 0) {
        clearInterval(puzTimerInterval);
        puzSeconds = 0;
        $('#puz-timer').text("00:00").css('color', 'var(--accent)');
        puzTimerInterval = setInterval(() => {
            puzSeconds++;
            $('#puz-timer').text(formatTime(puzSeconds));
        }, 1000);
    }

    if (retryCount > 6) {
        $('#puz-desc').html("<b style='color:#ef4444'>❌ Error:</b> No se pudieron cargar puzzles. Revisa tu conexión. <button class='btn-tool' onclick='loadRandomPuzzle()'>Reintentar</button>");
        clearInterval(puzTimerInterval);
        return;
    }

    $('#puz-desc').html("<span style='color:var(--accent)'>🧩 Cargando reto...</span>");

    try {
        let p = null;

        // 1. Usar base de datos local (JS variable)
        if (localPuzzles && localPuzzles.length > 0) {
            let candidates = localPuzzles.filter(x => !solvedPuzzles.includes(x.PuzzleId));

            if (candidates.length > 0) {
                if (cat !== 'all' && cat !== 'mixed') {
                    const match = candidates.filter(x =>
                        (x.Themes || "").toLowerCase().includes(cat.toLowerCase()) ||
                        (x.OpeningTags || "").toLowerCase().includes(cat.toLowerCase())
                    );
                    if (match.length > 0) candidates = match;
                }
                p = candidates[Math.floor(Math.random() * candidates.length)];
            }
        }

        // 2. Si no hay local, intentar API
        if (!p) {
            // Si fallamos localmente y vamos a API, quizás es porque gastamos todos o no cargó el archivo JS.
            // ... fetch API code keeps executing ...
            const baseR = 600 + (retryCount * 200);
            const r = baseR + Math.floor(Math.random() * 1000);
            let theme = cat;
            if (cat === 'all' || retryCount > 0) {
                theme = themesPool[Math.floor(Math.random() * themesPool.length)];
            }

            const url = `https://chess-puzzles-api.vercel.app/puzzles?themes=${theme}&min_rating=${r}&max_rating=${r + 500}&limit=50&_t=${Date.now()}`;
            console.log("Fetching API:", url);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error("API response error");
            const data = await response.json();

            if (data && data.length > 0) {
                const fresh = data.filter(x => !solvedPuzzles.includes(x.PuzzleId));
                p = fresh.length > 0 ? fresh[Math.floor(Math.random() * fresh.length)] : data[0];
            } else {
                console.warn("API returned empty list, retrying...");
                return loadRandomPuzzle(retryCount + 1);
            }
        }

        if (!p) {
            console.log("No puzzle found in this attempt, retrying...");
            return loadRandomPuzzle(retryCount + 1);
        }

        // 3. Configurar el puzzle seleccionado
        currentPuzzle = {
            id: p.PuzzleId,
            fen: p.FEN,
            sol: p.Moves.split(' '),
            rating: p.Rating,
            themes: p.Themes || ""
        };

        puzzleStep = 0;
        // Fix: Clean board before loading
        game.reset();
        game.load(currentPuzzle.fen);

        // Aplicar el primer movimiento (oponente)
        const firstMove = currentPuzzle.sol[0];
        const m = game.move({
            from: firstMove.substring(0, 2),
            to: firstMove.substring(2, 4),
            promotion: firstMove.length > 4 ? firstMove[4] : 'q'
        });

        if (!m) throw new Error("Movimiento de puzzle inválido: " + firstMove);

        puzzleStep = 1;
        board.position(game.fen());
        board.orientation(game.turn() === 'w' ? 'white' : 'black');

        $('#puz-desc').html(`
                    <div style="color:var(--accent); font-weight:bold; margin-bottom:4px;">Tu turno (${currentPuzzle.rating})</div>
                    <div style="color:#3b82f6; font-size:0.6rem; text-transform:uppercase; font-weight:800;">${(currentPuzzle.themes || "").split(',').slice(0, 2).join(', ')}</div>
                `);

        updateUI();

    } catch (err) {
        console.error("🚨 Error cargando puzzle:", err);
        loadRandomPuzzle(retryCount + 1);
    }
}

// --- STOCKFISH INITIALIZATION ---
try {
    console.log("♟️ Iniciando Stockfish 17 NNUE...");
    // Usar versión lite multithread para balance entre potencia y compatibilidad móvil
    stockfish = new Worker('https://unpkg.com/stockfish@17.1.0/stockfish-nnue-17.1-lite-multithread.js');
    stockfish.postMessage('uci');
    stockfish.postMessage('ucinewgame');
    stockfish.postMessage('isready');

    const threads = Math.max(1, (navigator.hardwareConcurrency || 4) - 1);
    stockfish.postMessage('setoption name Threads value ' + threads);
    stockfish.postMessage('setoption name Hash value 256');
    stockfish.postMessage('setoption name Skill Level value 20');
    console.log(`🚀 Motor configurado: ${threads} hilos, 256MB Hash, NNUE activo`);

    stockfish.onerror = (e) => {
        console.error("Worker Error:", e);
        aiThinking = false;
    };

    stockfish.onmessage = function (e) {
        var l = e.data;

        // Parsear NPS (Velocidad)
        if (l.includes('nps')) {
            const m = l.match(/nps (\d+)/);
            if (m) {
                const nps = parseInt(m[1]);
                const txt = nps > 1000000 ? (nps / 1000000).toFixed(1) + 'M' : (nps / 1000).toFixed(0) + 'k';
                $('#engine-nps').text(txt + ' nps');
            }
        }

        if (l === 'uciok') console.log("✅ Stockfish UCI OK");
        if (l === 'readyok') console.log("✅ Stockfish Ready");

        // EVALUATION BAR
        if (l.includes('score cp')) {
            var match = l.match(/score cp (-?\d+)/);
            if (!match) return;
            var cp = parseInt(match[1]) / 100;
            var ev = (game.turn() === 'w' ? cp : -cp);
            var h = Math.max(0, Math.min(100, 50 + (ev * 15)));

            if (!analysisActive) $('#eval-fill-master').css('height', h + '%');

            var pvFull = l.split(' pv ')[1] ? l.split(' pv ')[1].split(' ') : [];
            if (pvFull.length > 0) {
                var bestMoveLAN = pvFull[0];
                if (hintsActive || analysisActive) {
                    $('#best-move-display').html("💡 Sugerencia: <b style='color:white'>" + lanToSan(bestMoveLAN) + "</b>").show();
                    drawBestMoveArrow(bestMoveLAN);
                    $('.square-55d63').removeClass('highlight-hint');
                    $('[data-square="' + bestMoveLAN.substring(0, 2) + '"]').addClass('highlight-hint');
                    $('[data-square="' + bestMoveLAN.substring(2, 4) + '"]').addClass('highlight-hint');

                    // Multi-arrow support for Top 3
                    if (window.pvList && hintsActive) {
                        drawBestMoveArrow(null); // Clear first
                        window.pvList.slice(0, 3).forEach((p, idx) => {
                            const color = idx === 0 ? 'green' : (idx === 1 ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255,255,255,0.3)');
                            drawBestMoveArrow(p.moveLAN, color, false);
                        });
                    }
                } else {
                    drawBestMoveArrow(null);
                    $('.square-55d63').removeClass('highlight-hint');
                    $('#best-move-display').hide();
                }

                if (currentMode === 'ai' || isJ || analysisActive || hintsActive || currentMode === 'study') {
                    const fullHistory = game.history({ verbose: true });
                    const lastMove = fullHistory.length > 0 ? fullHistory[fullHistory.length - 1] : null;

                    var diffVal = 0;
                    if (window.lastEval !== undefined) {
                        const gameTurn = game.turn();
                        const prevE = window.lastEval;
                        const currE = ev;
                        if (gameTurn === 'w') diffVal = currE - prevE;
                        else diffVal = prevE - currE;
                    }

                    const evalMag = Math.abs(diffVal);
                    const isBook = isBookMove(lastMove ? lastMove.san : '');
                    var q = getQualityMsg(evalMag, l.includes('mate'), isBook);
                    var acc = isBook ? 100 : Math.max(0, Math.min(100, 100 - (evalMag * 20)));

                    let explanation = '';
                    let tacticalInfo = '';
                    const isOpening = fullHistory.length <= 15;
                    const isEndgame = game.board().flat().filter(p => p && p.type !== 'p').length <= 8;

                    function getStrategicAdvice() {
                        if (isOpening) {
                            const advices = [
                                "🎯 Intenta sacar tus piezas menores (caballos y alfiles) antes que la dama.",
                                "🏰 El enroque temprano es clave para proteger a tu rey.",
                                "🥊 Controla el centro con tus peones para ganar espacio.",
                                "🛡️ ¡Cuidado con dejar piezas sin defensa! Revisa cada casilla."
                            ];
                            return advices[Math.floor(Math.random() * advices.length)];
                        }
                        if (isEndgame) {
                            const advices = [
                                "👑 En el final, el rey es una pieza de ataque. ¡Sácalo al centro!",
                                "♟️ Los peones pasados son oro puro. Intenta promocionarlos.",
                                "🔛 Busca la actividad de tus piezas más que el material.",
                                "🛑 Evita que sus peones avancen bloqueándolos con tu rey."
                            ];
                            return advices[Math.floor(Math.random() * advices.length)];
                        }
                        return "🧩 Busca debilidades tácticas o mejora la posición de tu peor pieza. ¿Hay algún salto de caballo molesto?";
                    }

                    let openingName = '';
                    let openingComment = '';
                    if (isOpening && fullHistory.length >= 2) {
                        const detected = detectOpening();
                        if (detected.name) openingName = '🎯 ' + detected.name;

                        // Lichess API integration (every 4 moves to optimize)
                        if (fullHistory.length % 4 === 0) {
                            fetchOpeningFromLichess().then(name => {
                                if (name) {
                                    openingName = '🌍 ' + name;
                                    $('#coach-opening-name').text(openingName); // Update specific UI element if exists
                                }
                            });
                        }
                        // Check if our history matches the detected line length correctly
                        if (isBook && detected.comments) {
                            // Try to find comment for this specific move index
                            // History length is 1-based, so for move 1 (e4), length is 1. Comment is at index 0.
                            const moveIdx = fullHistory.length - 1;
                            if (detected.comments[moveIdx]) {
                                openingComment = detected.comments[moveIdx];
                            }
                        }
                    }

                    if (isBook) {
                        explanation = `<div style="color:var(--accent); font-weight:bold;">📖 JUGADA DE TEORÍA:</div><div style="margin-top:5px; font-style:italic;">"${openingComment || ('Esta es una línea clásica bien estudiada que busca el equilibrio.')}".</div>`;
                        $('#book-move-indicator').fadeIn();
                        if (currentMode === 'maestro' || currentMode === 'ai') $('#coach-txt').show();
                    } else {
                        $('#book-move-indicator').fadeOut();
                        const san = lastMove ? lastMove.san : '';
                        if (diffVal > 2.0) {
                            explanation = `<div style="color:#ef4444; font-weight:bold;">⚠️ ¡Cuidado con ${san}!</div> Ese movimiento deja escapar una gran ventaja. El Maestro sugiere ${window.pvList && window.pvList[0] ? window.pvList[0].move : 'otra ruta más sólida'}.`;
                            drawBestMoveArrow(bestMoveLAN, 'red');
                        } else if (diffVal > 0.8) {
                            explanation = `<div style="color:#f59e0b; font-weight:bold;">🤔 Una jugada dudosa...</div> ${san} no parece ser lo más preciso ahora. Había mejores formas de mejorar la posición.`;
                            drawBestMoveArrow(bestMoveLAN, 'orange');
                        } else if (diffVal < -0.5) {
                            explanation = `<div style="color:#22c55e; font-weight:bold;">✨ ¡Excelente jugada!</div> Con ${san} demuestras mucha visión. Estás presionando los puntos débiles del rival.`;
                            drawBestMoveArrow(bestMoveLAN, 'green');
                        } else {
                            explanation = `<div style="color:var(--text-main);">${getStrategicAdvice()}</div>`;
                            drawBestMoveArrow(bestMoveLAN, 'blue');
                        }
                    }

                    if (lastMove) {
                        if (game.in_check()) tacticalInfo += '⚔️ ¡Jaque! ';
                        if (lastMove.captured) tacticalInfo += `📍 Captura de ${lastMove.captured.toUpperCase()}. `;
                    }

                    let moveQuality = `<div class="${q.class}" style="font-size:1.1rem; margin-bottom:5px;">${q.text}</div>`;
                    let precisionMsg = `<div style="font-size:0.7rem; color:var(--text-muted);">Precisión: ${acc.toFixed(0)}%</div>`;
                    let openingMsg = openingName ? `<div style="color:var(--accent); font-size:0.75rem; margin-bottom:10px; font-weight:800; background:rgba(139,92,246,0.1); padding:5px 10px; border-radius:6px; border-left:3px solid var(--accent);">${openingName}</div>` : '';

                    if (pvFull.length > 2) {
                        tacticalInfo += `<br>Línea recomendada: ${pvFull.slice(0, 3).map(m => lanToSan(m)).join(' ')}...`;
                    }

                    // MULTI-PV Support: If we have multiple best moves, show them
                    let multiPvHtml = "";
                    if (window.pvList && window.pvList.length > 1 && hintsActive) {
                        multiPvHtml = `<div style="margin-top:12px; border-top:1px solid rgba(255,255,255,0.05); padding-top:10px;">
                            <div style="font-size:0.6rem; color:var(--accent); margin-bottom:8px; font-weight:800; letter-spacing:1px; text-transform:uppercase;">Mejores Continuaciones:</div>
                            ${window.pvList.slice(0, 3).map((p, idx) => `
                                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; margin-bottom:5px; background:rgba(255,255,255,0.04); padding:6px 10px; border-radius:6px;">
                                    <span>${idx === 0 ? '⭐' : '🔹'} <b style="color:var(--accent)">${p.move}</b></span>
                                    <div style="display:flex; flex-direction:column; align-items:flex-end;">
                                        <span style="font-weight:700; color:${p.eval >= 0 ? '#22c55e' : '#ef4444'};">${p.eval > 0 ? '+' : ''}${p.eval.toFixed(1)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>`;
                    }

                    $('#coach-txt').html(`
                        ${openingMsg}
                        ${moveQuality}
                        <div style="display:flex; gap:10px; margin-bottom:8px;">
                            <div style="font-size:0.65rem; color:var(--text-muted);">Eval: <b style="color:var(--text-main)">${ev > 0 ? '+' : ''}${ev.toFixed(1)}</b></div>
                            ${precisionMsg}
                        </div>
                        <div style="font-size:0.78rem; line-height:1.5; color:var(--text-main); background:rgba(255,255,255,0.03); padding:12px; border-radius:10px;">
                            ${explanation}
                            <div style="margin-top:10px; text-align:right;">
                                <button class="btn-tool" style="font-size:0.6rem; padding:4px 8px;" onclick="explainTactics()">💡 Explicar táctica</button>
                            </div>
                        </div>
                        ${multiPvHtml}
                        <div style="font-size:0.7rem; color:#3b82f6; margin-top:10px; font-weight:600; background:rgba(59,130,246,0.05); padding:5px; border-radius:4px;">${tacticalInfo}</div>
                    `);
                    isJ = false;
                }
            }
        }
        window.currentEval = ev;

        // Catch individual PVs for multi-PV display
        if (l.includes('multipv')) {
            const mv = l.match(/multipv (\d+)/);
            const pvIdx = mv ? parseInt(mv[1]) : 1;
            const scoreMatch = l.match(/score cp (-?\d+)/);
            const pvMoves = l.split(' pv ')[1];
            if (scoreMatch && pvMoves) {
                const move = pvMoves.split(' ')[0];
                const score = parseInt(scoreMatch[1]) / 100 * (game.turn() === 'w' ? 1 : -1);

                if (!window.pvList || pvIdx === 1) window.pvList = [];
                window.pvList[pvIdx - 1] = { move: lanToSan(move), moveLAN: move, eval: score };
            }
        }

        function lanToSan(lan) {
            if (!lan) return "";
            const from = lan.substring(0, 2);
            const to = lan.substring(2, 4);
            const promo = lan.length > 4 ? lan[4] : '';
            const temp = new Chess(game.fen());
            const m = temp.move({ from, to, promotion: promo });
            return m ? m.san : lan;
        }

        if (l.startsWith('bestmove') && (currentMode === 'ai' || currentMode === 'maestro') && game.turn() !== myColor) {
            console.log(`📨 Stockfish respondió: ${l}`);

            // BLOQUEO ABSOLUTO: Si hay una línea teórica activa, ignorar por completo al motor
            if (aiPracticeLine && aiPracticeIndex < aiPracticeLine.length) {
                console.log("🛑 Motor bloqueado: Siguiendo teoría.");
                return;
            }

            var bestMove = l.split(' ')[1];
            console.log(`🎲 Mejor jugada de Stockfish: ${bestMove}`);

            // Use the correct selector based on mode
            const diffSel = (currentMode === 'maestro') ? '#maestro-diff-sel' : '#diff-sel';
            const diffLvl = parseInt($(diffSel).val()) || 10;
            let blunderChance = 0;
            if (diffLvl === 1) blunderChance = 0.5;
            else if (diffLvl === 3) blunderChance = 0.35;
            else if (diffLvl === 5) blunderChance = 0.20;

            if (Math.random() < blunderChance) {
                const legalMoves = game.moves({ verbose: true });
                if (legalMoves.length > 0) {
                    const randomM = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                    bestMove = randomM.from + randomM.to + (randomM.promotion || '');
                    console.log(`🎭 Introduciendo error intencional (dificultad ${diffLvl}): ${bestMove}`);
                }
            }

            console.log(`♟️ Ejecutando movimiento: ${bestMove}`);
            game.move({ from: bestMove.substring(0, 2), to: bestMove.substring(2, 4), promotion: 'q' });
            board.position(game.fen());
            console.log("🔓 aiThinking = false (Stockfish completado)");
            aiThinking = false; // Liberar bloqueo
            updateUI(true);
            checkGameOver();
        }
    };
} catch (e) {
    console.error("❌ Error en Stockfish:", e);
}

function makeAIMove() {
    if (game.game_over()) {
        console.log("⏹️ Juego terminado, IA no mueve");
        return;
    }

    if (aiThinking) {
        console.log("⏳ IA ya está pensando, evitando llamada duplicada");
        return;
    }

    aiThinking = true;
    console.log("🔒 aiThinking = true");

    // Timeout de seguridad: si después de 15 segundos no se ha movido, desbloquear
    const safetyTimeout = setTimeout(() => {
        if (aiThinking) {
            console.error("⚠️ Timeout de seguridad: desbloqueando IA");
            aiThinking = false;
        }
    }, 15000);

    const sideThatMoves = game.turn();
    if (sideThatMoves === myColor) {
        console.log("❌ Es turno del jugador, no de la IA");
        aiThinking = false;
        clearTimeout(safetyTimeout);
        return;
    }

    console.log(`🤖 Maestro pensando... (Turno: ${sideThatMoves}, Modo: ${currentMode}, myColor: ${myColor}, PrácticaIdx: ${aiPracticeIndex})`);

    let moveToPlay = null;
    let commentToPlay = "";

    // 1. Línea específica de entrenamiento
    if (aiPracticeLine && Array.isArray(aiPracticeLine) && aiPracticeIndex < aiPracticeLine.length) {
        const history = game.history();
        if (aiPracticeIndex !== history.length) aiPracticeIndex = history.length;

        if (aiPracticeIndex < aiPracticeLine.length) {
            moveToPlay = aiPracticeLine[aiPracticeIndex].trim();
            commentToPlay = (currentOpeningComments && currentOpeningComments[aiPracticeIndex]) || "";
            console.log(`📖 Usando línea de práctica: ${moveToPlay}`);
        }
    }

    // 2. Si no hay línea activa, buscar en la base de datos general (Fase Apertura)
    if (!moveToPlay && (currentMode === 'maestro' || currentMode === 'ai') && game.history().length < 15) {
        console.log("🔍 Buscando en base de datos de aperturas...");
        const theory = findTheoreticalNextMove();
        if (theory) {
            moveToPlay = theory.move;
            commentToPlay = theory.comments[game.history().length] || "Jugada de libro según la base de datos.";
            currentOpeningName = theory.name;
            console.log(`🌍 Encontrada en BD: ${moveToPlay} (${theory.name})`);
        } else {
            console.log("❌ No se encontró jugada teórica en BD");
        }
    }

    if (moveToPlay) {
        console.log(`✅ IA jugando teoría: ${moveToPlay}`);
        if (stockfish) stockfish.postMessage('stop');

        setTimeout(() => {
            // Verificar que sigue siendo turno de la IA antes de mover
            if (game.turn() === myColor) {
                console.log("❌ Ya no es turno de la IA, cancelando");
                aiThinking = false;
                clearTimeout(safetyTimeout);
                return;
            }

            // Intento 1: Normalización agresiva
            let cleanMove = moveToPlay.replace(/[+#x=?!]/g, '').trim();

            // Opción A: Intentar mover directamente SAN
            let m = game.move(cleanMove);

            // Opción B: Si falla, buscar en movimientos legales coincidencias flexibles
            if (!m) {
                const legalMoves = game.moves({ verbose: true });
                // 1. Coincidencia exacta de SAN limpio
                let match = legalMoves.find(lm => lm.san.replace(/[+#x=?!]/g, '') === cleanMove);

                // 2. Coincidencia por casilla destino y pieza (si es PGN corto tipo 'Nf3')
                if (!match && cleanMove.length === 3) { // Pieza + Destino (ej: Nf3)
                    const p = cleanMove[0];
                    const dest = cleanMove.substring(1);
                    match = legalMoves.find(lm => lm.to === dest && lm.piece.toUpperCase() === p);
                }

                // 3. Coincidencia por peón (ej: 'e4')
                if (!match && cleanMove.length === 2) {
                    match = legalMoves.find(lm => lm.to === cleanMove && lm.piece === 'p');
                }

                // 4. LAN Fallback (e2e4)
                if (!match && cleanMove.length >= 4) {
                    const from = cleanMove.substring(0, 2);
                    const to = cleanMove.substring(2, 4);
                    match = legalMoves.find(lm => lm.from === from && lm.to === to);
                }

                if (match) {
                    m = game.move(match.san);
                }
            }

            if (m) {
                board.position(game.fen());
                aiPracticeIndex++;
                updateUI(true);
                checkGameOver();
                $('#book-move-indicator').fadeIn();

                let comm = commentToPlay || (currentOpeningComments && currentOpeningComments[aiPracticeIndex - 1])
                    || "Esta jugada sigue la teoría establecida para esta apertura.";

                $('#coach-txt').html(`
                        <div style="color:var(--accent); font-size:0.7rem; font-weight:800; text-transform:uppercase; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; margin-bottom:10px;">
                            📖 APERTURA: ${currentOpeningName || 'Teoría'}
                        </div>
                        <div class="quality-book" style="color:var(--accent); font-weight:800; font-size:1.1rem; margin-bottom:5px;">MAESTRO IA: ${m.san}</div>
                        <div style="font-size:0.8rem; line-height:1.4; color:var(--text-main); background:rgba(255,255,255,0.03); padding:10px; border-radius:8px;">
                            ${comm}
                        </div>
                    `);
                console.log("🔓 aiThinking = false (jugada teórica exitosa)");
                aiThinking = false;
                clearTimeout(safetyTimeout);
            } else {
                console.error("❌ Error al realizar jugada de teoría:", moveToPlay);
                aiPracticeLine = null;
                aiThinking = false;
                clearTimeout(safetyTimeout);
                makeAIMove(); // Deja que Stockfish decida ahora
            }
        }, 1000); // 1s de "reflexión" para el maestro
        return;
    }

    // --- MODO MOTOR ESTÁNDAR (STOCKFISH) ---
    console.log("🎯 No hay jugada teórica, usando Stockfish...");
    if (!stockfish) {
        console.error("❌ Stockfish no está inicializado!");
        aiThinking = false;
        clearTimeout(safetyTimeout);
        return;
    }

    // Use the correct selector based on mode
    const diffSel = (currentMode === 'maestro') ? '#maestro-diff-sel' : '#diff-sel';
    const diff = parseInt($(diffSel).val()) || 10;

    console.log(`⚙️ Enviando posición a Stockfish (depth: ${Math.max(diff, 18)})`);
    stockfish.postMessage('stop');
    stockfish.postMessage('setoption name MultiPV value 3');
    stockfish.postMessage('position fen ' + game.fen());
    stockfish.postMessage('go depth ' + Math.max(diff, 18) + ' movetime 10000');

    // El timeout de seguridad se limpiará cuando Stockfish responda con bestmove
}

function checkGameOver() {
    if (game.game_over()) {
        let result = 0.5;
        let reasonKey = 'draw';

        if (game.in_checkmate()) {
            result = (game.turn() !== myColor) ? 1 : 0;
            reasonKey = result === 1 ? 'win' : 'lose';
            $('#overlay-msg').text(LANGS[currentLang][reasonKey]);
            $('#game-overlay').css('display', 'flex').hide().fadeIn();
            playSnd('end');
        } else {
            if (game.in_threefold_repetition()) reasonKey = 'draw';
            else if (game.in_stalemate()) reasonKey = 'draw';
            else if (game.insufficient_material()) reasonKey = 'draw';
            else reasonKey = 'draw';

            $('#overlay-msg').text(LANGS[currentLang][reasonKey]);
            $('#game-overlay').css('display', 'flex').hide().fadeIn();
            playSnd('end');
        }

        stopClock();
        saveToHistory(result);

        if (currentMode === 'ai' || currentMode === 'maestro') {
            updateElo(getAiElo(), result);
        } else if (currentMode === 'local') {
            updateElo(opponentElo, result);
        }

        // Alert with specific message
        const msgText = LANGS[currentLang][reasonKey] || LANGS[currentLang].draw;
        // Timeout to let the overlay render first
        setTimeout(() => {
            if (confirm("Fin de la partida: " + msgText + ". ¿Quieres analizar la partida?")) {
                analyzeFullGame();
            }
        }, 500);
    }
}

function saveToHistory(res) {
    const hist = JSON.parse(localStorage.getItem('chess_game_history') || '[]');
    const gameData = {
        date: new Date().toLocaleString(),
        opp: $('#opp-name').text(),
        me: userName,
        res: res,
        moves: historyPositions, // Guardamos los FENs para navegar
        pgn: game.pgn(),
        mode: currentMode
    };
    hist.unshift(gameData);
    localStorage.setItem('chess_game_history', JSON.stringify(hist.slice(0, 20))); // Top 20
}

function resignGame() {
    if (confirm(LANGS[currentLang].resign)) {
        stopClock();
        if (currentMode === 'ai') updateElo(getAiElo(), 0);
        if (currentMode === 'local' && gameId) {
            socket.emit('resign_game', { gameId: gameId, user: userName });
            updateElo(800, 0);
        }
        game.reset(); board.start(); updateUI();
        alert(LANGS[currentLang].lose);
    }
}

function abortGame() {
    if (confirm(LANGS[currentLang].abort)) {
        stopClock();
        if (currentMode === 'local' && gameId) {
            socket.emit('abort_online_game', { gameId: gameId });
        }
        game.reset(); board.start(); updateUI();
    }
}

function updateHistory() {
    historyPositions.push(game.fen());
    currentHistoryIndex = historyPositions.length - 1;
}

function navigateHistory(dir) {
    if (dir === 'first') currentHistoryIndex = 0;
    else if (dir === 'last') currentHistoryIndex = historyPositions.length - 1;
    else if (dir === 'prev') currentHistoryIndex = Math.max(0, currentHistoryIndex - 1);
    else if (dir === 'next') currentHistoryIndex = Math.min(historyPositions.length - 1, currentHistoryIndex + 1);

    board.position(historyPositions[currentHistoryIndex]);

    // Load position into game for analysis
    game.load(historyPositions[currentHistoryIndex]);

    // Trigger Stockfish analysis for this position
    if (stockfish && currentHistoryIndex > 0) {
        // Store previous position's eval
        if (currentHistoryIndex > 1) {
            const prevGame = new Chess(historyPositions[currentHistoryIndex - 1]);
            // We'll analyze both positions to compare
        }

        // Set flag to analyze this move
        isJ = true;

        // Analyze current position
        stockfish.postMessage('stop');
        stockfish.postMessage('position fen ' + game.fen());
        stockfish.postMessage('go depth 22 movetime 5000');

        $('#coach-txt').html('<div style="color:var(--accent);">Analizando jugada...</div>');
    } else if (currentHistoryIndex === 0) {
        $('#coach-txt').html('<div style="font-size:0.7rem; color:var(--text-muted);">Posición inicial. Navega con las flechas para ver el análisis.</div>');
    }
}

function updateMaterial() {
    const val = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    let w = 0, b = 0;
    game.board().forEach(row => {
        row.forEach(p => {
            if (p) {
                if (p.color === 'w') w += val[p.type]; else b += val[p.type];
            }
        });
    });
    const diff = w - b;
    let barW = 50 + (diff * 5); // 5% per point
    barW = Math.max(5, Math.min(95, barW));

    // Only update main material bar if not using stockfish analysis bar overriding it
    if (!stockfish) {
        $('#eval-fill-master').css('height', barW + '%');
    }

    let txt = diff === 0 ? "Igualdad" : (diff > 0 ? `+${diff} Blancas` : `+${Math.abs(diff)} Negras`);
    $('#material-display').text(txt).css('color', diff > 0 ? '#fff' : (diff < 0 ? '#aaa' : '#888'));
}

function updateUI(moved = false) {
    $('.square-55d63').removeClass('highlight-selected highlight-hint');
    $('.legal-dot').remove();

    updateMaterial();

    if (moved) {
        // Sound logic
        if (game.in_check()) playSnd('check');
        else {
            const history = game.history({ verbose: true });
            if (history.length > 0 && history[history.length - 1].flags.includes('c')) playSnd('capture');
            else playSnd('move');
        }

        updateHistory();
        if (!gameStarted && currentMode !== 'exercises' && currentMode !== 'study') startClock();
        if (currentMode !== 'exercises' && currentMode !== 'study') updateTimerVisuals();

        // SAVE LAST EVAL BEFORE NEW ANALYSIS
        if (window.currentEval !== undefined) {
            window.lastEval = window.currentEval;
        }
        if (stockfish && currentMode !== 'local' && (currentMode === 'ai' || currentMode === 'maestro' || hintsActive || currentMode === 'study')) {
            if ((currentMode === 'ai' || currentMode === 'maestro') && game.turn() !== myColor) {
                makeAIMove();
            } else {
                stockfish.postMessage('stop');
                stockfish.postMessage('setoption name MultiPV value 3'); // Show top 3 moves
                stockfish.postMessage('position fen ' + game.fen());
                stockfish.postMessage('go depth 20 movetime 5000');
            }
        }
    } else {
        // Even if not moved, if we are in study mode and just entered, start analysis
        if (stockfish && (currentMode === 'study' || currentMode === 'ai' || currentMode === 'maestro')) {
            stockfish.postMessage('stop');
            stockfish.postMessage('setoption name MultiPV value 3');
            stockfish.postMessage('position fen ' + game.fen());
            stockfish.postMessage('go depth 20 movetime 5000');
        }
    }
}

function getPieceTheme(piece) {
    try {
        const theme = localStorage.getItem('chess_piece_theme') || 'wikipedia';

        // Lichess standard SVG themes
        const svgThemes = ['alpha', 'uscf', 'companion', 'merida', 'cbetta', 'pixel'];
        if (svgThemes.includes(theme)) {
            return 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/' + theme + '/' + piece + '.svg';
        }

        // Default Wikipedia (PNG)
        return 'https://raw.githubusercontent.com/oakmac/chessboardjs/master/website/img/chesspieces/wikipedia/' + piece + '.png';
    } catch (e) {
        return 'https://raw.githubusercontent.com/oakmac/chessboardjs/master/website/img/chesspieces/wikipedia/' + piece + '.png';
    }
}

function onSnapEnd() {
    board.position(game.fen());
}

function onDrop(source, target) {
    // Validar que solo puedas mover tus propias piezas en modos competitivos
    if (currentMode === 'local' || currentMode === 'ai' || currentMode === 'maestro') {
        const piece = game.get(source);
        if (!piece) return 'snapback';

        // En modo AI o Maestro, solo puedes mover cuando es tu turno
        if ((currentMode === 'ai' || currentMode === 'maestro') && game.turn() !== myColor) {
            console.warn("🚫 No es tu turno");
            return 'snapback';
        }
    }

    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    // Práctica de Apertura: Verificar si el movimiento es teórico (Jugador o Intervención)
    if ((currentMode === 'ai' || currentMode === 'maestro') && aiPracticeLine) {
        let expected = aiPracticeLine[aiPracticeIndex];

        // Normalizar comparaciones (ignorando '+' de jaque o '#' de mate en la teoría si no están)
        const moveSan = move.san.replace(/[+#]/g, '');
        const expectedSan = expected.replace(/[+#]/g, '');
        const isMatch = (moveSan === expectedSan || (move.from + move.to) === expected);

        console.log(`🕵️ Verificando movimiento: Jugador: ${move.san}, Esperado: ${expected}, Coincide: ${isMatch}`);

        if (isMatch) {
            // Sincronizar índice por si acaso
            aiPracticeIndex = game.history().length;
            $('#book-move-indicator').fadeIn();

            let comm = (currentOpeningComments && currentOpeningComments[aiPracticeIndex - 1])
                ? currentOpeningComments[aiPracticeIndex - 1]
                : "¡Muy bien! Estás siguiendo la teoría.";

            showToast("¡Teórico!: " + move.san, "📖");
            $('#coach-txt').html(`
                    <div style="color:var(--accent); font-size:0.7rem; font-weight:800; text-transform:uppercase; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; margin-bottom:10px;">
                        📖 ENTRENANDO: ${currentOpeningName || 'Teoría'}
                    </div>
                    <div class="quality-book" style="color:var(--accent); font-weight:800; font-size:1.1rem; margin-bottom:5px;">JUGADA DE LIBRO: ${move.san}</div>
                    <div style="font-size:0.8rem; line-height:1.4; color:var(--text-main); background:rgba(255,255,255,0.03); padding:10px; border-radius:8px;">
                        ${comm}
                    </div>
                `);
        } else {
            // El jugador se desvió - MODO ESTRICTO: Deshacer y obligar a jugar la teoría
            console.warn("⚠️ Desviación teórica detectada. Esperaba:", expected, "Moviste:", move.san);
            showToast("⚠️ INCORRECTO. Sigue la teoría: " + expected, "❌");
            $('#coach-txt').html(`<div style='color:#ef4444; font-weight:800;'>❌ MOVIMIENTO INCORRECTO</div><div style='font-size:0.75rem;'>En este modo debes seguir la línea teórica exacta.<br>La jugada correcta es: <b>${expected}</b></div>`);

            game.undo(); // Deshacer el movimiento en la lógica interna
            return 'snapback'; // Revertir visualmente en el tablero
        }
    }

    // Borrar flechas al mover
    drawBestMoveArrow(null);
    $('.square-55d63').removeClass('highlight-hint');

    if (currentMode === 'local') {
        socket.emit('move', { move: move.san, gameId: gameId, fen: game.fen() });

        setTimeout(() => {
            socket.emit('get_my_games');
            setTimeout(() => {
                const nextTurn = [...$('.active-game-item')].find(el => $(el).find('b').length > 0 && !$(el).attr('onclick').includes(gameId));
                if (nextTurn) {
                    showToast("Siguiente turno...", "♟️");
                    nextTurn.click();
                }
            }, 600);
        }, 500);
    }

    updateUI(true);
    checkGameOver();
}

function onSquareClick(sq) {
    console.log(`🖱️ Click en casilla: ${sq}`);
    showMoveTooltip(sq); // Show technical insight if available
    if (selectedSq) {
        console.log(`📍 Casilla previamente seleccionada: ${selectedSq}`);
        if (selectedSq === sq) {
            console.log("❌ Deseleccionando casilla");
            selectedSq = null;
            updateUI();
            return;
        }

        if (currentMode === 'exercises') {
            const tempGame = new Chess(game.fen());
            const move = tempGame.move({ from: selectedSq, to: sq, promotion: 'q' });

            if (move) {
                const expectedMove = currentPuzzle.sol[puzzleStep];
                const playerMove = move.from + move.to + (move.promotion || "");

                if (playerMove === expectedMove) {
                    game.move(move);
                    board.position(game.fen());
                    puzzleStep++;

                    if (puzzleStep >= currentPuzzle.sol.length) {
                        clearInterval(puzTimerInterval);
                        $('#coach-txt').html(`<b style='color:var(--success)'>¡EXCELENTE! Puzzle resuelto en ${formatTime(puzSeconds)}.</b>`);
                        playSnd('end');
                        if (currentPuzzle.id && !solvedPuzzles.includes(currentPuzzle.id)) {
                            solvedPuzzles.push(currentPuzzle.id);
                            localStorage.setItem('chess_solved_puzzles', JSON.stringify(solvedPuzzles.slice(-1000)));
                        }
                        updateElo(currentPuzzle.rating, 1, true);
                        setTimeout(loadRandomPuzzle, 2000);
                    } else {
                        // Mover la pieza de la IA en el puzzle
                        setTimeout(() => {
                            const nextMove = currentPuzzle.sol[puzzleStep];
                            const m = game.move({
                                from: nextMove.substring(0, 2),
                                to: nextMove.substring(2, 4),
                                promotion: nextMove.length > 4 ? nextMove[4] : 'q'
                            });
                            board.position(game.fen());
                            puzzleStep++;
                            // IA sound
                            if (m.flags.includes('c')) playSnd('capture'); else playSnd('move');
                        }, 500);
                    }
                } else {
                    $('#coach-txt').html("<b style='color:var(--trap-color)'>¡MOVIMIENTO INCORRECTO!</b>");
                    playSnd('error');
                    updateElo(currentPuzzle.rating, 0, true);
                    setTimeout(() => {
                        game.load(currentPuzzle.fen);
                        // Re-aplicar el primer movimiento del oponente
                        const firstMove = currentPuzzle.sol[0];
                        game.move({
                            from: firstMove.substring(0, 2),
                            to: firstMove.substring(2, 4),
                            promotion: firstMove.length > 4 ? firstMove[4] : 'q'
                        });
                        board.position(game.fen());
                        puzzleStep = 1;
                        updateUI();
                    }, 1000);
                }
            }
            selectedSq = null;
            updateUI();
            return;
        }

        var move = game.move({ from: selectedSq, to: sq, promotion: 'q' });
        if (move) {
            console.log(`✅ Movimiento ejecutado por clic: ${move.san} (${selectedSq} → ${sq})`);
            board.position(game.fen());
            selectedSq = null;

            // Práctica de Apertura: Verificar si el movimiento es teórico (Jugador o Intervención)
            if ((currentMode === 'ai' || currentMode === 'maestro') && aiPracticeLine) {
                let expected = aiPracticeLine[aiPracticeIndex];
                const moveSan = move.san.replace(/[+#]/g, '');
                const expectedSan = expected.replace(/[+#]/g, '');
                const isMatch = (moveSan === expectedSan || (move.from + move.to) === expected);

                if (isMatch) {
                    aiPracticeIndex = game.history().length;
                    $('#book-move-indicator').fadeIn();

                    let comm = (currentOpeningComments && currentOpeningComments[aiPracticeIndex - 1])
                        ? currentOpeningComments[aiPracticeIndex - 1]
                        : "¡Correcto!";

                    showToast("¡Teórico!: " + move.san, "📖");
                    $('#coach-txt').html(`
                        <div style="color:var(--accent); font-size:0.7rem; font-weight:800; text-transform:uppercase; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; margin-bottom:10px;">
                            📖 APERTURA: ${currentOpeningName || 'Teoría'}
                        </div>
                        <div class="quality-book" style="color:var(--accent); font-weight:800; font-size:1.1rem; margin-bottom:5px;">JUGADA DE LIBRO: ${move.san}</div>
                        <div style="font-size:0.8rem; line-height:1.4; color:var(--text-main); background:rgba(255,255,255,0.03); padding:10px; border-radius:8px;">
                            ${comm}
                        </div>
                    `);
                } else {
                    aiPracticeLine = null;
                    $('#book-move-indicator').fadeOut();
                    showToast("Te has desviado de la línea. ¡Cuidado!", "⚠️");
                    $('#coach-txt').html("<div style='color:#f59e0b; font-weight:800;'>⚠️ DESVIACIÓN DETECTADA</div><div style='font-size:0.7rem;'>Has salido de la teoría. El Maestro ahora jugará con toda su fuerza táctica.</div>");
                }
            }

            if (currentMode === 'local') {
                // Online sync removed.
                console.log("Move made in local mode");
            }

            console.log("📞 Llamando a updateUI(true) y makeAIMove()...");
            updateUI(true);
            setTimeout(makeAIMove, 250); // Asegurar que la IA reaccione al click
            checkGameOver();
            return;
        } else {
            console.log(`❌ Movimiento inválido: ${selectedSq} → ${sq}`);
        }
    }
    var piece = game.get(sq);
    if (piece && piece.color === game.turn()) {
        selectedSq = sq;
        updateUI();
        $('[data-square="' + sq + '"]').addClass('highlight-selected');
        game.moves({ square: sq, verbose: true }).forEach(m => {
            $('[data-square="' + m.to + '"]').append('<div class="legal-dot"></div>');
        });
    }
}

$(document).ready(() => {
    function populateOp(targetId) {
        const $sel = $(targetId);
        if (!$sel.length) return;
        $sel.empty().append('<option value="">-- Seleccionar --</option>');
        ACTIVE_OPENINGS.forEach((group, gIdx) => {
            const $group = $(`<optgroup label="${group.group}"></optgroup>`);
            group.items.forEach((item, iIdx) => {
                $group.append(`<option value="${gIdx}-${iIdx}">${item.name}</option>`);
            });
            $sel.append($group);
        });
    }

    populateOp('#opening-sel');
    populateOp('#maestro-opening-sel');
    populateOp('#ai-opening-practice');

    board = Chessboard('myBoard', {
        draggable: true,
        position: 'start',
        pieceTheme: getPieceTheme,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        onClick: onSquareClick
    });

    console.log("✅ Tablero inicializado con onClick, onDrop y onSnapEnd");

    // Update stats on load
    updateStudyStats();

    // Population now handled globally at line 2495

    // Tab Handlers
    $('.tab-btn').click(function () {
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        const tab = $(this).data('tab');
        $('.tab-content').removeClass('active');
        $('#' + tab).addClass('active');
        if (tab === 'tab-ranking') socket.emit('get_leaderboard');
        if (tab === 'tab-history') renderHistory();
    });

    // Mode Pill Handlers
    $('.mode-pill').click(function () {
        $('.mode-pill').removeClass('active'); $(this).addClass('active');
        currentMode = $(this).data('mode');
        $('.mode-section').removeClass('active');
        $('#sec-' + currentMode).addClass('active');
        stopClock(); gameStarted = false;
        if (currentMode === 'exercises') loadRandomPuzzle();
        else {
            game.reset(); board.start(); updateUI();
            historyPositions = ['start']; currentHistoryIndex = 0;
            resetTimers();
        }
    });

    // Online creation removed.
    $('#hamburger-menu').click(() => { $('#side-drawer').addClass('open'); $('#side-drawer-overlay').fadeIn(); });
    $('#side-drawer-overlay').click(() => { $('#side-drawer').removeClass('open'); $('#side-drawer-overlay').fadeOut(); });

    // Side Drawer & Submenus
    $('#btn-toggle-openings').off('click').on('click', function () {
        console.log("Toggle openings container");
        $('#opening-sel-container').stop().slideToggle(); // Add stop() to prevent animation buildup
    });

    // OPEN OPENINGS BY DEFAULT ON LOAD (User Request)
    setTimeout(() => {
        $('#opening-sel-container').slideDown();
    }, 500);

    $('#hamburger-menu').off('click').click(() => { $('#side-drawer').addClass('open'); $('#side-drawer-overlay').fadeIn(); });
    $('#side-drawer-overlay').off('click').click(() => { $('#side-drawer').removeClass('open'); $('#side-drawer-overlay').fadeOut(); });

    // Flip Handler
    $('#btn-flip, #btn-flip-mobile, #btn-flip-board, #btn-flip-small').off('click').on('click', function () {
        if (typeof board !== 'undefined' && board.flip) {
            board.flip();
            showToast("Tablero girado", "🔄");
        }
    });

    $('#btn-resign-local, #btn-resign-local-pc, #btn-resign-ai, .btn-action.resign').off('click').click(resignGame);
    $('.btn-action.menu, #btn-back-menu-pc, #btn-back-menu-sidebar').off('click').click(goBackToMenu);
    $('#btn-hint-mobile-bar').off('click').click(function () { toggleHints(this); });
    $('#btn-drills-mobile-bar').off('click').click(function () { startOpeningDrillsManual(); });
    $('#btn-openings-study').off('click').click(function () {
        exitGameView();
        showSubMenu('estudio');
    });

    // --- NAVIGATION HANDLERS ---
    $('#btn-nav-first').click(() => (currentMode === 'study') ? resetGamePosition() : navigateHistory('first'));
    $('#btn-nav-prev').click(() => (currentMode === 'study' && studyIndex > 0) ? (game.undo(), board.position(game.fen()), studyIndex--, updateUI()) : navigateHistory('prev'));
    $('#btn-nav-next').click(() => {
        if (currentMode === 'study' && studyMoves && studyIndex < studyMoves.length) {
            game.move(studyMoves[studyIndex]);
            board.position(game.fen());
            studyIndex++;
            updateUI(true);
        } else navigateHistory('next');
    });
    $('#btn-nav-last').click(() => navigateHistory('last'));

    // --- APPEARANCE HANDLERS ---
    $('#board-theme-sel').off('change').change(function () {
        const theme = $(this).val();
        localStorage.setItem('chess_board_theme', theme);

        $('body').removeClass((index, className) => (className.match(/\btheme-\S+/g) || []).join(' '));
        $('body').addClass('theme-' + theme);

        let colors = { light: '#F5F7FA', dark: '#1A2332' }; // Default neutral

        if (theme === 'classic') colors = { light: '#F0E6D2', dark: '#706B5D' };
        if (theme === 'neon') colors = { light: '#1A2332', dark: '#22D3EE' };
        if (theme === 'forest') colors = { light: '#EAEEF3', dark: '#16A34A' };
        if (theme === 'slate') colors = { light: '#2D3748', dark: '#1A202C' };
        if (theme === 'wood') colors = { light: '#fdf5e6', dark: '#8B4513' };

        document.documentElement.style.setProperty('--tile-light', colors.light);
        document.documentElement.style.setProperty('--tile-dark', colors.dark);

        // Refuerzo coordinadas
        $('.notation-322f9').css('color', theme === 'neon' ? '#22D3EE' : 'inherit');

        if (board) board.resize();
        showToast("Tablero: " + theme.toUpperCase(), "🎨");
    });

    $('#app-theme-sel').off('change').change(function () {
        const theme = $(this).val();
        localStorage.setItem('chess_app_theme', theme);
        if (theme === 'light') $('body').addClass('light-theme');
        else $('body').removeClass('light-theme');
    });

    $('#piece-theme-sel').off('change').change(function () {
        const theme = $(this).val();
        localStorage.setItem('chess_piece_theme', theme);
        if (board) {
            const currentPos = board.position();
            const currentOri = board.orientation();

            // Re-inicialización robusta manteniendo callbacks
            board = Chessboard('myBoard', {
                draggable: true,
                position: currentPos,
                orientation: currentOri,
                pieceTheme: getPieceTheme,
                onDrop: onDrop,
                onSnapEnd: onSnapEnd,
                onClick: onSquareClick
            });
            $('#board-theme-sel').trigger('change');
            showToast("Piezas: " + theme.toUpperCase(), "♟️");
        }
    });

    $('#lang-sel').off('change').change(function () {
        setLanguage($(this).val());
    });

    // --- INITIAL LOAD ---
    const savedAppTheme = localStorage.getItem('chess_app_theme') || 'dark';
    $('#app-theme-sel').val(savedAppTheme).trigger('change');

    const savedLang = localStorage.getItem('chess_lang') || 'es';
    $('#lang-sel').val(savedLang).trigger('change');

    const savedBT = localStorage.getItem('chess_board_theme') || 'classic';
    $('#board-theme-sel').val(savedBT).trigger('change');

    const savedPT = localStorage.getItem('chess_piece_theme') || 'wikipedia';
    $('#piece-theme-sel').val(savedPT).trigger('change');

    // Events & Interaction
    $(document).on('mousedown touchstart', '.square-55d63', function () {
        onSquareClick($(this).data('square'));
    });

    $('#btn-reset-board-pc, #btn-reset-ai, #btn-reset-puz').off('click').on('click', resetGamePosition);

    // Initial Resize
    setTimeout(() => { if (board) board.resize(); }, 500);
    setTimeout(() => { if (board) { board.resize(); updateUI(); } }, 1500);

    $('.tab-btn').on('click', function () {
        setTimeout(() => { if (board) board.resize(); }, 150);
    });

}); // END READY


function renderHistory() {
    const list = $('#history-list');
    const hist = JSON.parse(localStorage.getItem('chess_game_history') || '[]');
    list.empty();
    if (hist.length === 0) list.append('<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.7rem;">No hay partidas grabadas.</div>');

    hist.forEach((g, i) => {
        let resClass = "res-draw";
        let resTxt = "1/2-1/2";
        if (g.res === 1) { resClass = "res-win"; resTxt = "GANADA"; }
        if (g.res === 0) { resClass = "res-lose"; resTxt = "PERDIDA"; }

        const item = $(`
                        <div class="history-item" onclick="viewHistoryGame(${i})">
                            <div class="hist-date">${g.date} • ${g.mode.toUpperCase()}</div>
                            <div class="hist-main">
                                <div class="hist-players">${g.me} vs ${g.opp}</div>
                                <div class="hist-result ${resClass}">${resTxt}</div>
                            </div>
                        </div>
                    `);
        list.append(item);
    });
}

window.viewHistoryGame = (index) => {
    const hist = JSON.parse(localStorage.getItem('chess_game_history') || '[]');
    const g = hist[index];
    if (!g) return;

    // Change to study mode
    $('.mode-pill').removeClass('active');
    $('[data-mode="study"]').addClass('active');
    currentMode = 'study';
    $('.mode-section').removeClass('active');
    $('#sec-study').addClass('active');

    // Load game
    historyPositions = g.moves;
    currentHistoryIndex = 0;
    game.load(historyPositions[0]);
    board.position(game.fen());

    // Show tab play
    $('.tab-btn').removeClass('active');
    $('.tab-btn[data-tab="tab-play"]').addClass('active');
    $('.tab-content').removeClass('active');
    $('#tab-play').addClass('active');

    alert("Partida cargada. Usa las flechas para navegar y el botón ANALIZAR para recibir consejos.");
    updateUI();
};

socket.on('leaderboard_data', (data) => {
    const list = $('#global-ranking');
    list.empty();
    data.forEach((p, i) => {
        let rankClass = "";
        if (i === 0) rankClass = "rank-top1";
        else if (i === 1) rankClass = "rank-top2";
        else if (i === 2) rankClass = "rank-top3";

        const item = `
                        <div class="ranking-item">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div class="rank-num ${rankClass}">${i + 1}</div>
                                <span style="font-weight:700;">${p.user}</span>
                            </div>
                            <b style="color:var(--accent);">${p.elo} ELO</b>
                        </div>
                    `;
        list.append(item);
    });
});



socket.on('lobby_update', (challenges) => {
    $('#challenges-list').empty();
    if (challenges.length === 0) {
        $('#challenges-list').html('<div style="font-size:0.65rem; color:var(--text-muted); text-align:center; padding:10px;">Buscando retos...</div>');
    } else {
        const currentU = localStorage.getItem('chess_username') || userName;
        const othersChallenges = challenges.filter(c => c.user !== currentU);

        if (othersChallenges.length === 0) {
            $('#challenges-list').html('<div style="font-size:0.65rem; color:var(--text-muted); text-align:center; padding:10px;">No hay otros retos activos.</div>');
        } else {
            othersChallenges.forEach(data => {
                const html = `
                                <div class="challenge-item" onclick="joinGame('${data.id}', '${data.user}', '${data.time}')" 
                                     style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:rgba(255,255,255,0.05); margin-bottom:5px; border-radius:6px; cursor:pointer; font-size:0.7rem;">
                                    <span>👤 ${data.user} (${data.elo})</span>
                                    <span style="color:var(--accent)">${data.time} min ⚔️</span>
                                </div>
                            `;
                $('#challenges-list').append(html);
            });
        }
    }
});

socket.on('new_challenge', (data) => {
    const currentMe = localStorage.getItem('chess_username') || userName;
    if (data.user === currentMe) return; // Don't show my own challenge

    if ($('#challenges-list').text().includes('Buscando') || $('#challenges-list').text().includes('No hay')) {
        $('#challenges-list').empty();
    }

    const html = `
                    <div class="challenge-item" onclick="joinGame('${data.id}', '${data.user}', '${data.time}')" 
                         style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:rgba(255,255,255,0.05); margin-bottom:5px; border-radius:6px; cursor:pointer; font-size:0.7rem;">
                        <span>👤 ${data.user} (${data.elo})</span>
                        <span style="color:var(--accent)">${data.time} min ⚔️</span>
                    </div>
                `;
    $('#challenges-list').append(html);
    playSnd('move');
});

socket.on('my_games_list', (games) => {
    const list = $('#active-games-list');
    list.empty();

    // NOTIFICATION LOGIC (Active Turns)
    const myTurns = games.filter(g => (g.turn === 'w' && g.white === userName) || (g.turn === 'b' && g.black === userName));
    if (myTurns.length > 0) {
        $('#header-elo3').css('border-color', '#ef4444').css('background', 'rgba(239, 68, 68, 0.2)').attr('title', 'Es tu turno!');
        if ($('#header-elo3').find('.notify-dot').length === 0) $('#header-elo3').append('<span class="notify-dot" style="display:inline-block; width:6px; height:6px; background:#ef4444; border-radius:50%; margin-left:4px;"></span>');
    } else {
        $('#header-elo3').css('border-color', '').css('background', '').find('.notify-dot').remove();
    }

    // Update Lobby View
    if (typeof populateLobbyGames === 'function') populateLobbyGames(games);

    if (games.length === 0) {
        list.html('<div style="font-size:0.65rem; color:var(--text-muted); text-align:center; padding:10px;">No tienes partidas activas.</div>');
    } else {
        games.forEach(g => {
            const opp = g.white === userName ? g.black : g.white;
            const isMyTurn = (g.turn === 'w' && g.white === userName) || (g.turn === 'b' && g.black === userName);
            const turnLabel = isMyTurn ? '<b style="color:var(--accent)">TU TURNO</b>' : '<span style="opacity:0.6">Oponente</span>';
            const isCurrentGame = (g.id === gameId);
            const borderColor = isCurrentGame ? '#3b82f6' : (isMyTurn ? 'var(--accent)' : 'rgba(255,255,255,0.1)');
            const bgColor = isCurrentGame ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.04)';

            const html = `
                            <div class="active-game-item" 
                                 style="padding:10px; background:${bgColor}; border-radius:10px; margin-bottom:8px; font-size:12px; border:1px solid ${borderColor}; display:flex; justify-content:space-between; align-items:center;">
                                <div onclick="resumeGame('${g.id}', '${opp}', '${g.fen}', '${g.white === userName ? 'w' : 'b'}', ${g.whiteTime}, ${g.blackTime})" style="flex:1; cursor:pointer;">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <div style="display:flex; flex-direction:column;">
                                            <span style="font-weight:700;">${isCurrentGame ? '🎮 ' : ''}🆚 ${opp}</span>
                                            <span style="font-size:10px; opacity:0.6;">⏳ Yo: ${Math.floor((g.white === userName ? g.whiteTime : g.blackTime) / 60)}m</span>
                                        </div>
                                        ${turnLabel}
                                    </div>
                                </div>
                                <button onclick="window.resignBackgroundGame('${g.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.2rem; padding:0 0 0 10px;" title="Abandonar Partida">🗑️</button>
                            </div>
                        `;
            list.append(html);
        });

        // Auto-loader: If not in a game, auto-resume the first game where it's my turn
        if (gameId === null && currentMode === 'local') {
            const firstMyTurn = games.find(g => (g.turn === 'w' && g.white === userName) || (g.turn === 'b' && g.black === userName));
            if (firstMyTurn) {
                const opp = firstMyTurn.white === userName ? firstMyTurn.black : firstMyTurn.white;
                const color = firstMyTurn.white === userName ? 'w' : 'b';
                resumeGame(firstMyTurn.id, opp, firstMyTurn.fen, color, firstMyTurn.whiteTime, firstMyTurn.blackTime);
                showToast("Turno pendiente en partida vs " + opp, "🔔");
            }
        }
    }
});

window.resumeGame = (id, oppName, fen, color, wTime = null, bTime = null) => {
    gameId = id;
    myColor = color;
    game.load(fen);
    board.orientation(color === 'w' ? 'white' : 'black');
    board.position(fen);
    $('#opp-name').text(oppName);

    if (wTime !== null && bTime !== null) {
        whiteTime = wTime;
        blackTime = bTime;
    }

    updateUI();
    showToast("Sincronizado: vs " + oppName);
};

window.resignBackgroundGame = (id) => {
    if (confirm("¿Estás seguro de que quieres abandonar y eliminar esta partida de tu lista? Perderás los puntos.")) {
        if (socket) {
            // Send user info to properly attribute the loss
            socket.emit('resign_game', { gameId: id, user: userName });
            // Refresh list
            setTimeout(() => socket.emit('get_my_games'), 500);
        }
    }
};

// Request active games every 10 seconds to keep notifications updated
setInterval(() => {
    if (isAuth) {
        socket.emit('get_my_games');
        socket.emit('get_lobby'); // Ensure we also get challenges
    }
}, 8000);

window.joinGame = (id, oppName, time) => {
    console.log("Joining game:", id, oppName, time);
    if (!isAuth) {
        console.log("Not authenticated, opening auth...");
        alert("Solo usuarios registrados pueden unirse a retos.");
        return openAuth();
    }
    if (oppName === userName) {
        console.log("Self-challenge block triggered");
        alert("No puedes unirte a tu propio reto.");
        return;
    }

    if (!socket.connected) {
        alert("No hay conexión con el servidor. Por favor, recarga la página.");
        return;
    }

    gameId = id;
    myColor = 'b';
    board.orientation('black');
    $('#opp-name').text(oppName);
    socket.emit('join_challenge', { id: id, user: userName });
    game.reset();
    board.start();
    resetTimers();
    const mins = parseInt(time) || 10;
    whiteTime = mins * 60;
    blackTime = mins * 60;
    updateUI();
    alert("Te has unido a la partida de " + oppName);
};

window.getEloTypeFromTime = function (mins) {
    if (mins <= 1) return 'elo1';
    if (mins <= 3) return 'elo3';
    if (mins >= 1440) return 'eloDaily';
    return 'elo10';
};

window.updateElo = function (oppElo, result, isPuzzle = false) {
    if (!isAuth) return;

    let type = 'elo';
    let currentRating = userEloRapid; // default

    if (isPuzzle) {
        type = 'puz';
        currentRating = userPuzzleElo;
    } else {
        const activeSelector = currentMode === 'ai' || currentMode === 'maestro' ? '#ai-time-selector' : '#local-time-selector';
        const mins = parseInt($(activeSelector + ' .time-btn.active').data('time')) || 10;
        type = getEloTypeFromTime(mins);

        if (type === 'elo1') currentRating = userEloBullet;
        else if (type === 'elo3') currentRating = userEloBlitz;
        else if (type === 'eloDaily') currentRating = userEloDaily;
        else currentRating = userEloRapid;
    }

    const K = 32;
    const expected = 1 / (1 + Math.pow(10, (oppElo - currentRating) / 400));
    const newElo = Math.round(currentRating + K * (result - expected));

    // Update locally
    if (type === 'puz') {
        userPuzzleElo = newElo;
        localStorage.setItem('chess_puz_elo', newElo);
    } else {
        if (type === 'elo1') { userEloBullet = newElo; localStorage.setItem('chess_elo_1', newElo); }
        else if (type === 'elo3') { userEloBlitz = newElo; localStorage.setItem('chess_elo_3', newElo); }
        else if (type === 'eloDaily') { userEloDaily = newElo; localStorage.setItem('chess_elo_daily', newElo); }
        else { userEloRapid = newElo; localStorage.setItem('chess_elo_10', newElo); }
    }

    if (socket) socket.emit('update_elo', { user: userName, elo: newElo, type: type });
    updateAuthUI();
};

socket.on('game_start', function (data) {
    gameId = data.gameId;
    myColor = (data.white === userName) ? 'w' : 'b';
    board.orientation(myColor === 'w' ? 'white' : 'black');
    board.start();
    game.reset();

    var oppName = (myColor === 'w') ? data.black : data.white;
    opponentElo = (myColor === 'w') ? (data.blackElo || 500) : (data.whiteElo || 500);
    $('#opp-name').text(oppName);
    gameStarted = true;

    whiteTime = data.time * 60;
    blackTime = data.time * 60;

    showToast("¡Partida Iniciada! Juegas con " + (myColor === 'w' ? 'Blancas' : 'Negras'), "♟️");
    setMode('local');
    updateUI();
});

socket.on('game_resume', function (data) {
    gameId = data.id;
    game.load(data.fen);
    board.position(data.fen);
    myColor = (data.white === userName) ? 'w' : 'b';
    board.orientation(myColor === 'w' ? 'white' : 'black');

    whiteTime = data.whiteTime;
    blackTime = data.blackTime;

    var oppName = (myColor === 'w') ? data.black : data.white;
    opponentElo = (myColor === 'w') ? (data.blackElo || 500) : (data.whiteElo || 500);
    $('#opp-name').text(oppName);
    gameStarted = true;

    updateUI();
});

window.loadGame = function (id) {
    if (id === gameId) return;
    if (socket) socket.emit('join_game', { gameId: id });
    showToast("Cambiando de partida...", "🔄");
};

socket.on('lobby_update', (challenges) => {
    const list = $('#challenges-list');
    list.empty();

    // NOTIFICATION LOGIC
    if (challenges.length > 0) {
        $('#header-elo10').css('border-color', '#ef4444').attr('title', 'Hay retos pendientes!');
        // Add visual dot if not present
        if ($('#header-elo10').find('.notify-dot').length === 0) $('#header-elo10').append('<span class="notify-dot" style="display:inline-block; width:6px; height:6px; background:#ef4444; border-radius:50%; margin-left:4px;"></span>');
    } else {
        $('#header-elo10').css('border-color', '').find('.notify-dot').remove();
    }

    // Update Lobby View as well
    if (typeof populateLobbyChallenges === 'function') populateLobbyChallenges(challenges);

    if (challenges.length === 0) return list.append('<div style="font-size:0.65rem; color:var(--text-muted); text-align:center; padding:10px;">No hay retos disponibles.</div>');

    challenges.forEach(data => {
        const html = `
                    <div class="challenge-item" onclick="joinGame('${data.id}', '${data.user}', '${data.time}')" 
                         style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:rgba(255,255,255,0.05); margin-bottom:5px; border-radius:6px; cursor:pointer; font-size:0.7rem;">
                        <span>👤 ${data.user} (${data.elo})</span>
                        <span style="color:var(--accent)">${data.time} min ⚔️</span>
                    </div>
                `;
        list.append(html);
    });
});

socket.on('active_games_update', function (games) {
    const list = $('#active-games-list');
    list.empty();
    if (games.length === 0) return list.append('<div style="font-size:0.65rem; color:var(--text-muted); text-align:center; padding:10px;">No hay partidas activas.</div>');

    games.forEach(g => {
        const isMyTurn = (g.turn === 'w' && g.white === userName) || (g.turn === 'b' && g.black === userName);
        const opp = (g.white === userName) ? g.black : g.white;
        const item = $(`
            <div class="active-game-item ${isMyTurn ? 'my-turn' : ''}" onclick="loadGame('${g.id}')">
                <div style="flex:1"><b>vs ${opp}</b></div>
                <div style="font-size:0.6rem; opacity:0.8">${isMyTurn ? 'TU TURNO ⚡' : 'Esperando...'}</div>
            </div>
        `);
        list.append(item);
    });
});

socket.on('opponent_joined', (data) => {
    // legacy, covered by game_start mostly now
});

socket.on('player_resigned', (data) => {
    stopClock();
    const winner = data.user === userName ? 'Oponente' : 'Tú';
    alert("Tu oponente se ha rendido. ¡Has ganado!");
    updateElo(800, 1);
    game.reset(); board.start(); updateUI();
});

socket.on('game_aborted', () => {
    alert("La partida ha sido abortada.");
    stopClock();
    game.reset(); board.start(); updateUI();
});

// CHAT LOGIC
const sendChat = (customMsg = null) => {
    const msg = customMsg || $('#chat-input').val().trim();
    if (!msg) return;
    socket.emit('chat_message', { user: userName, msg: msg, gameId: gameId });
    appendMsg(userName, msg, true);
    $('#chat-input').val('');
};

$('.btn-emoji').click(function () {
    sendChat($(this).data('emoji'));
});

const appendMsg = (user, msg, isMine) => {
    const html = `<div class="chat-msg ${isMine ? 'mine' : 'other'}">
                                <b style="font-size:0.6rem; display:block; opacity:0.8;">${user}</b>
                                ${msg}
                             </div>`;
    $('#chat-msgs').append(html);
    $('#chat-msgs').scrollTop($('#chat-msgs')[0].scrollHeight);
};

$('#btn-chat-send').click(sendChat);
$('#chat-input').keypress((e) => { if (e.which === 13) sendChat(); });

socket.on('chat_message', (data) => {
    if (!gameId || data.gameId === gameId) {
        appendMsg(data.user, data.msg, false);
        playSnd('move'); // Alert sound
    }
});

socket.on('move', (data) => {
    if (data.gameId === gameId || !gameId) {
        game.move(data.move);
        board.position(game.fen());

        // Sync clocks with server data
        if (data.whiteTime !== undefined) whiteTime = data.whiteTime;
        if (data.blackTime !== undefined) blackTime = data.blackTime;

        updateUI(true);
        checkGameOver();
    }
});

socket.on('move_ack', (data) => {
    if (data.gameId === gameId) {
        // Confirm server times
        if (data.whiteTime !== undefined) whiteTime = data.whiteTime;
        if (data.blackTime !== undefined) blackTime = data.blackTime;
        updateUI(false); // No sound for ack
    }
});

// Global Actions
$('#btn-resign-ai, #btn-resign-local').click(resignGame);
$('#btn-abort').click(abortGame);

$('#btn-toggle-sound').off('click').click(function () {
    soundOn = !soundOn;
    localStorage.setItem('chess_sound', soundOn);
    $(this).text(`🔊 Sonidos: ${soundOn ? 'ON' : 'OFF'}`);
    if (soundOn) playSnd('move');
});

// AI COLOR SELECTION
$('#btn-start-ai').click(() => {
    let color = $('#ai-color-sel').val();
    // Ensure normalization regardless of input source
    if (color === 'white') color = 'w';
    if (color === 'black') color = 'b';

    // Explicitly set board orientation based on USER color
    myColor = color === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : color;

    console.log("🚀 Iniciando IA Mode. MyColor:", myColor);

    game.reset();
    board.orientation(myColor === 'w' ? 'white' : 'black');
    board.start();

    gameStarted = false;
    $('#opp-name').text('Stockfish ' + $('#diff-sel option:selected').text());

    // Check for specific opening practice (Legacy DOM check kept for safety, but direct calls preferred)
    const practiceVal = $('#ai-opening-practice').val();
    if (practiceVal && practiceVal.includes('-') && !aiPracticeLine) {
        // Only load from DOM if not already loaded by direct call
        const [gIdx, iIdx] = practiceVal.split('-');
        const item = ACTIVE_OPENINGS[gIdx].items[iIdx];
        aiPracticeLine = item.moves || item.m;
        currentOpeningName = item.name;
        currentOpeningComments = item.comments || [];
        showToast("Práctica de apertura: " + currentOpeningName, "📖");
    }

    if (aiPracticeLine) {
        console.log(`🎯 Entrenando: ${currentOpeningName}`);
        aiPracticeIndex = 0;
        // Set persist header
        $('#coach-txt').html(`<div style="color:var(--accent); font-size:0.8rem; font-weight:bold;">📖 ENTRENANDO: ${currentOpeningName}</div><div style="font-size:0.7rem;">Juega las líneas maestras.</div>`);
    } else {
        currentOpeningName = null;
        currentOpeningComments = [];
        console.log("🆓 Juego libre activado.");
        $('#coach-txt').html("<b>Modo Maestro Activo.</b><br>Juega contra Stockfish y recibe consejos.");
    }

    currentMode = 'ai';
    updateUI();
    resetTimers();

    if (myColor === 'b') {
        // Force sync for first move
        aiPracticeIndex = 0;
        setTimeout(makeAIMove, 600);
    }
});

// Fix: Ensure puzzle loads on initial click of 'exercises' from specific triggers
// This complements the existing listener
$('#btn-puzzles-menu, .btn-mode-puz').click(function () {
    setTimeout(() => {
        if (!currentPuzzle) loadRandomPuzzle();
    }, 100);
});

// MOBILE DROPDOWN LOGIC
$('#btn-more-options').click(function (e) {
    e.stopPropagation();
    $('#mobile-actions-menu').fadeToggle(200);
});

$(document).click(function () {
    $('#mobile-actions-menu').fadeOut(200);
});

$('#mobile-actions-menu').click(function (e) {
    e.stopPropagation();
});

// Mobile Actions
$('#btn-flip-mobile').click(() => { board.flip(); $('#mobile-actions-menu').fadeOut(); });
$('#btn-analyze-mobile').click(() => { $('#btn-analyze-game').click(); $('#mobile-actions-menu').fadeOut(); });
$('#btn-hint-mobile').click(() => { $('#btn-puz-hint, #btn-ai-hint').click(); $('#mobile-actions-menu').fadeOut(); });
$('#btn-editor-mobile').click(() => { $('#btn-editor').click(); $('#mobile-actions-menu').fadeOut(); });

function resetTimers() {
    const activeSelector = currentMode === 'ai' ? '#ai-time-selector' : '#local-time-selector';
    const mins = parseInt($(activeSelector + ' .time-btn.active').data('time')) || 10;
    whiteTime = mins * 60;
    blackTime = mins * 60;
    $('#my-timer, #opp-timer').text(formatTime(whiteTime)).removeClass('low-time active');
}

$('.time-btn').click(function () {
    $(this).siblings().removeClass('active');
    $(this).addClass('active');
    resetTimers();
});

$('#btn-analyze-game').click(() => {
    if (historyPositions.length < 2) return alert("Juega un poco antes de analizar.");
    alert("Modo Análisis Activo. Mueve por el historial para ver la calidad de tus jugadas.");
    analysisActive = true;
    isJ = true;
    stockfish.postMessage('stop');
    stockfish.postMessage('position fen ' + game.fen());
    stockfish.postMessage('go depth 22 movetime 8000');
});

// --- CHESSIS-STYLE FULL ANALYSIS LOGIC ---
let evalChart = null;
let analysisResults = [];

function initEvalChart(data = []) {
    const ctx = document.getElementById('evalChart').getContext('2d');
    if (evalChart) evalChart.destroy();

    const labels = data.map((_, i) => i);
    const evaluations = data.map(d => Math.max(-10, Math.min(10, d.ev)));

    evalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Evaluación',
                data: evaluations,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointHitRadius: 10,
                pointHoverRadius: 5,
                pointBackgroundColor: '#38bdf8'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    currentHistoryIndex = index;
                    board.position(historyPositions[index]);
                    game.load(historyPositions[index]);
                    navigateHistory('none'); // Trigger analysis for this index
                    showToast("Jugada #" + index, "🎯");
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: (ctx) => {
                            const val = ctx.raw;
                            return (val > 0 ? '+' : '') + val.toFixed(1);
                        }
                    }
                }
            },
            scales: {
                x: { display: false },
                y: {
                    min: -10,
                    max: 10,
                    ticks: { color: '#94a3b8', font: { size: 10 } },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
}

function calculateAccuracy(prevEval, currentEval, turn) {
    // Standard Accuracy model based on Win Probability change
    // WinProb(cp) = 50 + 50 * (2 / (1 + exp(-0.0036 * cp)) - 1)
    function winProb(cp) {
        return 100 / (1 + Math.exp(-0.0036 * cp * 100));
    }

    const wpBefore = winProb(prevEval);
    const wpAfter = winProb(currentEval);

    let loss = 0;
    if (turn === 'w') loss = wpBefore - wpAfter;
    else loss = wpAfter - wpBefore;

    if (loss < 0) loss = 0;

    // Convert win probability loss to accuracy
    // A loss of 100% (mate missed) drops accuracy significantly
    return Math.max(0, 100 - (loss * 1.5));
}

// --- ARROW DRAWING LOGIC ---
function drawBestMoveArrow(move, color = 'rgba(34, 197, 94, 0.7)', clear = true) {
    const canvas = document.getElementById('arrowCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Solo redimensionar si es necesario (evita borrar el canvas en cada dibujo de multi-flecha)
    if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    if (clear) ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (move === null || move === undefined) return;

    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    const p1 = getSqPos(from);
    const p2 = getSqPos(to);

    if (!p1 || !p2) return;

    const headLen = 18;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    let drawColor = color;
    if (color === 'green') drawColor = 'rgba(34, 197, 94, 0.85)';
    if (color === 'red') drawColor = 'rgba(239, 68, 68, 0.85)';
    if (color === 'orange') drawColor = 'rgba(245, 158, 11, 0.85)';
    if (color === 'blue') drawColor = 'rgba(59, 130, 246, 0.85)';

    ctx.strokeStyle = drawColor;
    ctx.fillStyle = drawColor;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';

    // Dibujar línea principal
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Dibujar punta de flecha triangular sólida
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}

function isBookMove(moveSan) {
    const history = game.history();
    const currentMovesStr = history.slice(0, -1).join(' ');
    let isBook = false;

    ACTIVE_OPENINGS.forEach(group => {
        group.items.forEach(item => {
            const moves = item.moves || item.m || [];
            const bookLine = moves.join(' ');
            if (bookLine.startsWith(currentMovesStr)) {
                // If the current move matches the next move in a known sequence
                const moveIdx = history.length - 1;
                if (moves[moveIdx] === moveSan || moves[moveIdx] === (history[moveIdx])) {
                    isBook = true;
                }
            }
        });
    });
    return isBook;
}

async function analyzeFullGame() {
    if (historyPositions.length < 2) return alert("No hay suficientes jugadas para analizar.");

    $('#analysis-report-container').fadeIn();
    $('#accuracy-display').text('--%');
    $('#analysis-progress-bar').css('width', '0%');

    const stats = { brilliant: 0, great: 0, best: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
    const historicalEvals = [{ ev: 0, acc: 100 }];
    const phaseAccs = { opening: [], middle: [], endgame: [] };

    const analysisGame = new Chess();
    analysisResults = [];

    // Disable UI interaction during deep analysis
    const originalMode = currentMode;

    for (let i = 1; i < historyPositions.length; i++) {
        const fen = historyPositions[i];
        const prevFen = historyPositions[i - 1];
        analysisGame.load(fen);
        const turnMoved = analysisGame.turn() === 'w' ? 'b' : 'w'; // Side that just moved

        // Use Stockfish to get eval at this position
        const evalData = await getPositionEval(fen);
        const prevEval = historicalEvals[i - 1].ev;
        const currentEval = evalData.cp;

        let diff = 0;
        if (turnMoved === 'w') diff = prevEval - currentEval;
        else diff = currentEval - prevEval;

        const quality = getQualityMsg(Math.abs(diff), evalData.isMate);

        // Update Stats
        if (quality.symbol === '!!') stats.brilliant++;
        else if (quality.symbol === '!') stats.great++;
        else if (quality.symbol === '') stats.best++;
        else if (quality.symbol === '?!') stats.inaccuracy++;
        else if (quality.symbol === '?') stats.mistake++;
        else if (quality.symbol === '??') stats.blunder++;

        const moveAcc = calculateAccuracy(prevEval, currentEval, turnMoved);
        historicalEvals.push({ ev: currentEval, acc: moveAcc });

        // Phase categorization
        const pieces = analysisGame.board().flat().filter(p => p).length;
        if (i <= 10) phaseAccs.opening.push(moveAcc);
        else if (pieces > 12) phaseAccs.middle.push(moveAcc);
        else phaseAccs.endgame.push(moveAcc);

        // Update Progress
        const percent = Math.round((i / (historyPositions.length - 1)) * 100);
        $('#analysis-progress-bar').css('width', percent + '%');

        // Small delay to keep UI responsive
        await new Promise(r => setTimeout(r, 50));
    }

    // Calculate Final Stats
    const totalAcc = historicalEvals.slice(1).reduce((a, b) => a + b.acc, 0) / (historicalEvals.length - 1);
    const avgOp = phaseAccs.opening.length ? (phaseAccs.opening.reduce((a, b) => a + b, 0) / phaseAccs.opening.length) : 0;
    const avgMid = phaseAccs.middle.length ? (phaseAccs.middle.reduce((a, b) => a + b, 0) / phaseAccs.middle.length) : 0;
    const avgEnd = phaseAccs.endgame.length ? (phaseAccs.endgame.reduce((a, b) => a + b, 0) / phaseAccs.endgame.length) : 0;

    // Update UI
    $('#accuracy-display').text(totalAcc.toFixed(1) + '%');
    $('#phase-opening').text(`Apertura: ${avgOp.toFixed(0)}%`);
    $('#phase-middlegame').text(`Medio Juego: ${avgMid.toFixed(0)}%`);
    $('#phase-endgame').text(`Final: ${avgEnd.toFixed(0)}%`);

    $('#stat-brilliant').text(stats.brilliant);
    $('#stat-great').text(stats.great);
    $('#stat-best').text(stats.best);
    $('#stat-inaccuracy').text(stats.inaccuracy);
    $('#stat-mistake').text(stats.mistake);
    $('#stat-blunder').text(stats.blunder);

    initEvalChart(historicalEvals);
    showToast("Análisis completo", "📊");
}

function getPositionEval(fen) {
    return new Promise((resolve) => {
        stockfish.postMessage('stop');
        stockfish.postMessage('position fen ' + fen);
        stockfish.postMessage('go depth 20 movetime 4000');

        const handler = (e) => {
            const l = e.data;
            if (l.includes('score cp')) {
                const match = l.match(/score cp (-?\d+)/);
                if (match) {
                    const cp = parseInt(match[1]) / 100;
                    // We need to know whose turn it is in this FEN to normalize the CP
                    const turn = fen.split(' ')[1];
                    const normalizedCp = (turn === 'w' ? cp : -cp);

                    stockfish.removeEventListener('message', handler);
                    resolve({ cp: normalizedCp, isMate: false });
                }
            } else if (l.includes('score mate')) {
                const match = l.match(/score mate (-?\d+)/);
                if (match) {
                    const mate = parseInt(match[1]);
                    const turn = fen.split(' ')[1];
                    const normalizedCp = (turn === 'w' ? (mate > 0 ? 10 : -10) : (mate > 0 ? -10 : 10));
                    stockfish.removeEventListener('message', handler);
                    resolve({ cp: normalizedCp, isMate: true });
                }
            }
        };
        stockfish.addEventListener('message', handler);
    });
}

async function fetchOpeningFromLichess() {
    const history = game.history();
    if (history.length === 0) return null;
    try {
        const moves = history.join(',');
        const response = await fetch(`https://explorer.lichess.ovh/masters?play=${moves}`);
        const data = await response.json();
        if (data.opening) {
            return `${data.opening.name} (${data.opening.eco})`;
        }
    } catch (e) { console.error("Error Lichess API:", e); }
    return null;
}

function explainTactics() {
    const history = game.history({ verbose: true });
    if (history.length === 0) return alert("El Maestro dice: Controla el centro y desarrolla piezas en la apertura.");

    const lastMove = history[history.length - 1];
    const ev = window.currentEval || 0.0;

    let detail = `<div style="text-align:left; font-size:0.8rem;"><b>Análisis del Maestro:</b><br><br>`;

    if (ev > 1.5) detail += "⚪ Las Blancas tienen una ventaja clara. Busca presionar las debilidades creadas.<br>";
    else if (ev < -1.5) detail += "⚫ Las Negras están mejor. Mantén la solidez y contraataca.<br>";
    else detail += "⚖️ La posición está equilibrada. Cada detalle cuenta.<br>";

    if (lastMove.captured) detail += `✅ Capturar en ${lastMove.to} fue una decisión táctica concreta. `;
    if (game.in_check()) detail += "⚠️ ¡El rey oponente está bajo ataque directo! ";

    const centerSquares = ['d4', 'd5', 'e4', 'e5'];
    if (centerSquares.includes(lastMove.to)) detail += "🎯 Dominar el centro te da libertad de movimiento. ";

    if (window.pvList && window.pvList[0]) {
        detail += `<br><br>💡 Sugerencia técnica: <b>${window.pvList[0].move}</b> es la continuación más precisa según mi cálculo profundo.`;
    }

    detail += "</div>";

    showToast("Explicación cargada", "💡");
    $('#coach-txt').append(`<div style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px; background:rgba(0,0,0,0.2); border-radius:5px; padding:8px;">${detail}</div>`);
}

function showMoveTooltip(square) {
    if (!window.pvList || !window.pvList[0]) return;
    const best = window.pvList[0];
    const ev = best.eval || 0;
    if (hintsActive) {
        showToast(`Continuación óptima: ${best.move} (${ev > 0 ? '+' : ''}${ev.toFixed(1)})`, "🎯");
    }
}

$('#btn-full-analysis').click(analyzeFullGame);

$('#btn-show-sol').click(() => {
    if (!currentPuzzle) return;
    const move = currentPuzzle.sol[puzzleStep];
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    $('.square-55d63').removeClass('highlight-hint');
    $('[data-square="' + from + '"]').addClass('highlight-hint');
    $('[data-square="' + to + '"]').addClass('highlight-hint');
    playSnd('error');
});

$('#btn-puz-hint').click(() => {
    if (!currentPuzzle) return;
    const move = currentPuzzle.sol[puzzleStep];
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);

    // Highlight the squares
    $('.square-55d63').removeClass('highlight-hint');
    $('[data-square="' + from + '"]').addClass('highlight-hint');
    $('[data-square="' + to + '"]').addClass('highlight-hint');

    $('#coach-txt').html(`Fíjate en la casilla <b style="color:var(--accent)">${from}</b>. ¿Qué pieza podrías mover ahí o desde ahí?`);
    updateElo(userPuzzleElo, 0.2, true); // Penalty for hint
});

$('#btn-next-puz').click(() => loadRandomPuzzle());
$('#puz-cat-sel').change(() => loadRandomPuzzle());
$('#header-elo-puz, #puz-elo-display').text(userPuzzleElo + "🧩");

// AUTH LOGIC
$('#btn-auth-trigger, #btn-auth-drawer').click(openAuth);
$('#btn-auth-close').click(() => $('#auth-modal').hide());
$('#auth-switch').click(function () {
    const currentTitle = $('#auth-title').text();
    const isLogin = currentTitle === "INICIAR SESIÓN";

    if (isLogin) {
        // Switch to Register
        $('#auth-title').text("REGISTRARSE");
        $('#btn-auth-submit').text("REGISTRAR");
        $('#reg-group').css('display', 'block'); // Force show
        $(this).html("¿Ya tienes cuenta? <span style='color:var(--accent)'>Entra</span>");
    } else {
        // Switch to Login
        $('#auth-title').text("INICIAR SESIÓN");
        $('#btn-auth-submit').text("ENTRAR");
        $('#reg-group').css('display', 'none'); // Force hide
        $(this).html("¿No tienes cuenta? <span style='color:var(--accent)'>Regístrate</span>");
    }
});

// --- DEFINITIVE AUTH UI SYNC ---
window.updateAuthUI = function () {
    if (isAuth) {
        // Sync local vars just in case
        userName = localStorage.getItem('chess_username') || "Invitado";
        userEloBullet = parseInt(localStorage.getItem('chess_elo_1')) || 500;
        userEloBlitz = parseInt(localStorage.getItem('chess_elo_3')) || 500;
        userEloRapid = parseInt(localStorage.getItem('chess_elo_10')) || 500;
        userEloDaily = parseInt(localStorage.getItem('chess_elo_daily')) || 500;
        userPuzzleElo = parseInt(localStorage.getItem('chess_puz_elo')) || 500;

        $('#btn-auth-trigger').hide();
        $('#btn-auth-drawer').hide();
        $('#btn-logout-drawer').show();

        $('#my-name-display, #drawer-user-name').text(userName);

        // Update header Elo boxes
        $('#header-elo1').text("1m: " + userEloBullet);
        $('#header-elo3').text("3m: " + userEloBlitz);
        $('#header-elo10').text("R: " + userEloRapid);
        $('#header-eloDaily').text("24h: " + userEloDaily);
        $('#header-elo-puz').text("🧩: " + userPuzzleElo);

        // Update drawer Elo Summary
        $('#drawer-user-elo').html(`
            <div style="margin-top:5px; color:var(--accent); font-weight:700;">Nivel General: ${userElo}</div>
            <div style="margin-top:5px; color:#3b82f6">Puzzles: ${userPuzzleElo}</div>
        `);

        $('#guest-access-section').hide();
    } else {
        $('#btn-auth-trigger').show();
        $('#btn-auth-drawer').show();
        $('#btn-logout-drawer').hide();

        $('#drawer-user-name').text("Invitado");
        $('#my-name-display').text("Invitado");
        $('#guest-access-section').show();
    }
};
updateAuthUI();

$('.mode-pill').on('click', function () {
    const mode = $(this).data('mode');
    if (mode === 'ai') $('#opp-name').text('Maestro IA');
    else if (mode === 'study') $('#opp-name').text('Análisis');
    else $('#opp-name').text('Práctica');
});

$('#btn-register-submit').click(() => {
    const user = $('#reg-user').val().trim();
    const pass = $('#reg-pass').val().trim();
    const email = $('#reg-email').val().trim();

    if (!user || !pass || !email) return alert("Rellena todos los campos.");

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return alert("Por favor introduce un email válido.");

    if (socket) socket.emit('register', { user, pass, email });
});

$('#btn-auth-submit').click(() => {
    const name = $('#auth-user').val();
    const pass = $('#auth-pass').val();
    const email = $('#auth-email').val();
    // Check visibility using check on display property to be safe
    const isReg = $('#reg-group').css('display') !== 'none';

    if (!socket.connected) return alert("❌ No hay conexión con el servidor. Asegúrate de iniciar 'node server.js'");
    if (!name || !pass) return alert("Completa los campos.");
    if (isReg && !email) return alert("Escribe un email.");

    if (isReg) {
        socket.emit('register', { user: name, pass: pass, email: email });
    } else {
        socket.emit('login', { user: name, pass: pass });
    }
});

$('#btn-show-pass').mousedown(function () {
    $('#auth-pass').attr('type', 'text');
}).mouseup(function () {
    $('#auth-pass').attr('type', 'password');
}).mouseleave(function () {
    $('#auth-pass').attr('type', 'password');
});

socket.on('auth_success', (data) => {
    userName = data.user;
    userElo = data.elo || 500;
    userPuzzleElo = data.puzElo || 500;
    isAuth = true;

    localStorage.setItem('chess_username', userName);
    localStorage.setItem('chess_is_auth', 'true');
    localStorage.setItem('chess_elo_1', userEloBullet);
    localStorage.setItem('chess_elo_3', userEloBlitz);
    localStorage.setItem('chess_elo_10', userEloRapid);
    localStorage.setItem('chess_elo_daily', userEloDaily);
    localStorage.setItem('chess_puz_elo', userPuzzleElo);
    if (data.token) localStorage.setItem('chess_token', data.token);

    updateAuthUI();
    $('#auth-modal').hide();
    showToast("¡Bienvenido, " + userName + "!", "👋");
});

// Redundant ready block merged into the main one at line 1254.
// Socket listeners for online play removed.

updateAuthUI();

$('#hamburger-menu').off('click'); // remove old if any
$('#side-drawer-overlay').off('click');

// Llenar aperturas en todos los selectores disponibles
const opHtml = ACTIVE_OPENINGS.map((group, groupIdx) => {
    let optgroup = `<optgroup label="${group.group}">`;
    group.items.forEach((item, itemIdx) => {
        optgroup += `<option value="${groupIdx}-${itemIdx}">${item.name}</option>`;
    });
    return optgroup + `</optgroup>`;
}).join('');

$('#opening-sel, #opening-sel-main, #ai-opening-practice, #maestro-opening-sel').append(opHtml);

var studyMoves = [];
var studyIndex = 0;

$('#opening-sel').change(function () {
    const val = $(this).val();
    if (!val) return;
    const [gIdx, iIdx] = val.split('-');
    const opening = ACTIVE_OPENINGS[gIdx].items[iIdx];

    game.reset();
    board.start();

    studyMoves = opening.moves || opening.m;
    studyIndex = 0;
    currentOpeningName = opening.name;
    currentOpeningComments = opening.comments || [];

    $('#study-controls').show();
    $('#btn-study-next').text("⏩ Siguiente Jugada (" + studyMoves.length + ")").prop('disabled', false);

    // Update Coach Panel
    $('#coach-txt').html(`<div class="quality-book" style="color:var(--accent); font-weight:800;">📖 ESTUDIO: ${currentOpeningName}</div><div style="font-size:0.75rem;">Sigue las jugadas teóricas pulsando "Siguiente".</div>`);

    showToast("Estudiando: " + opening.name, "📖");
    updateUI();
});

$('#btn-study-next').click(() => {
    if (studyIndex < studyMoves.length) {
        game.move(studyMoves[studyIndex]);
        board.position(game.fen());
        playSnd('move');
        studyIndex++;
        $('#btn-study-next').text(studyIndex < studyMoves.length ? "⏩ Siguiente Jugada" : "✨ Apertura Completada - JUEGO LIBRE");
        if (studyIndex === studyMoves.length) {
            alert("Has completado la línea principal. Ahora puedes seguir jugándola libremente para practicar.");
        }
        updateUI();
    }
});

$('#btn-study-prev').click(() => {
    if (studyIndex > 0) {
        game.undo();
        board.position(game.fen());
        studyIndex--;
        $('#btn-study-next').text("⏩ Siguiente Jugada");
        updateUI();
    }
});

// NEW UNIFIED HINT TOGGLE (Study & AI)
const toggleHints = (btn) => {
    if (currentMode === 'exercises') return; // No hints in puzzles
    hintsActive = !hintsActive;
    const txt = hintsActive ? "💡 PISTAS: ON" : "💡 ACTIVAR PISTAS";
    $('#btn-ai-hint, #btn-suggest-move').text(txt).toggleClass('active', hintsActive);

    if (hintsActive) {
        $('#coach-txt').text("El Maestro está analizando la posición...");
        if (stockfish) {
            updateUI(true); // Force re-analysis
        }
        $('#btn-hint-mobile-bar, #btn-ai-hint, #btn-suggest-move, #btn-hint-main').addClass('active');
    } else {
        drawBestMoveArrow(null); // Borrar flechas inmediatamente
        $('.square-55d63').removeClass('highlight-hint');
        $('#best-move-display').hide();
        $('#btn-hint-mobile-bar, #btn-ai-hint, #btn-suggest-move, #btn-hint-main').removeClass('active');
        if (!analysisActive) $('#coach-txt').text("Pistas desactivadas. ¿Quieres que te ayude con el siguiente movimiento?");
    }
};

// Unbind old handlers and bind new one
$('#btn-suggest-move, #btn-ai-hint, #btn-hint-main, #btn-hint-mobile-bar').off('click').on('click', function () { toggleHints(this); });

$('#btn-flip, #btn-flip-mobile, #btn-flip-pc').off('click').on('click', function () {
    board.flip();
    if ($('#mobile-actions-menu').is(':visible')) $('#mobile-actions-menu').fadeOut();
});


// El manejador antiguo de .mode-pill ha sido eliminado porque ahora usamos setMode() y showSubMenu()

$('#btn-hint-main').click(function () {
    toggleHints(this);
});

// NEW MENU LOGIC
window.showSubMenu = function (id, addToHistory = true) {
    $('.menu-step').removeClass('active');
    $('#menu-' + id).addClass('active');

    // Manage History
    if (addToHistory) {
        history.pushState({ view: 'menu', id: id }, '', '#menu-' + id);
    }

    if (id === 'lobby') {
        if (socket && isAuth) {
            socket.emit('get_lobby');
            socket.emit('get_my_games');
        }
    }
};

window.exitGameView = function () {
    $('body').removeClass('board-active');
    $('#game-sidebar-controls').hide();
    $('#master-coach-panel').hide();
    $('#analysis-report-container').hide();
    $('#main-menu-container').show();

    // Al salir, resetear el tablero para que la próxima vez esté limpio
    game.reset();
    board.start();
    aiPracticeLine = null;
    studyMoves = null;
};

window.setMode = function (mode, addToHistory = true) {
    currentMode = mode;

    if (addToHistory) {
        history.pushState({ view: 'game', mode: mode }, '', '#game-' + mode);
    }

    // UI Mode Classes for CSS targeting
    $('body').removeClass('mode-local mode-ai mode-study mode-exercises mode-pass-and-play');
    $('body').addClass('mode-' + mode);

    // UI Visual Feedback
    $('.tab-btn').removeClass('active');
    $('.tab-btn[data-tab="tab-play"]').addClass('active');
    $('.tab-content').removeClass('active');
    $('#tab-play').addClass('active');

    // Ocultar COMPLETAMENTE el menú principal cuando estás en partida
    $('#main-menu-container').hide();

    // Activar controles laterales (PC) - SOLO botones de control
    $('#game-sidebar-controls').fadeIn().css('display', 'flex');
    $('body').addClass('board-active');

    // PC transition: Ensure board is visible and properly sized
    setTimeout(function () {
        if (typeof board !== 'undefined' && board.resize) {
            board.resize();
            // Re-sync position just in case
            board.position(game.fen());
        }
    }, 50);

    setTimeout(function () {
        if (typeof board !== 'undefined' && board.resize) {
            board.resize();
        }
        updateUI(mode === 'study');
    }, 250);

    $('.mode-section').removeClass('active');
    var targetSec = mode;
    if (mode === 'pass-and-play') targetSec = 'study';
    if (mode === 'exercises') targetSec = 'exercises';
    if (mode === 'local') targetSec = 'local';
    if (mode === 'ai') targetSec = 'ai';
    if (mode === 'study') targetSec = 'study';
    $('#sec-' + targetSec).addClass('active');

    if (mode === 'ai' || mode === 'maestro') {
        var isMaestro = (mode === 'maestro' || hintsActive === true);
        $('#opp-name').text(isMaestro ? 'Maestro IA' : 'Stockfish');
    } else if (mode === 'local') {
        $('#opp-name').text('Oponente Online');
        // Ocultar el contenedor de crear reto cuando ya estamos en partida
        $('#online-setup-container').slideUp();

        // En PC, asegurar que la sidebar derecha esté visible y actualizada
        if (window.innerWidth > 900) {
            $('.sidebar-right').show();
            // Refrescar listas de partidas y retos
            if (socket && isAuth) {
                socket.emit('get_my_games');
                socket.emit('get_lobby');
            }
        }
    } else if (mode === 'exercises') {
        // Ensure puzzle loads if not present, regardless of category
        setTimeout(() => {
            if (!currentPuzzle) {
                console.log("🧩 Auto-loading puzzle on mode switch");
                loadRandomPuzzle(0, drillCategory || 'mixed');
            }
        }, 300);
    } else if (mode === 'pass-and-play') {
        $('#opp-name').text('Oponente Local');
    } else {
        $('#opp-name').text('Oponente (Estudio)');
    }

    if (mode === 'ai' || mode === 'study' || mode === 'exercises' || mode === 'maestro') {
        $('#master-coach-panel').css('display', 'flex').hide().fadeIn();
        $('#btn-hint-main').css('display', 'flex').fadeIn();
        $('#btn-hint-mobile-bar').show();

        // Ensure analysis starts immediately
        setTimeout(() => {
            isJ = true;
            if (stockfish) {
                stockfish.postMessage('stop');
                stockfish.postMessage('position fen ' + game.fen());
                stockfish.postMessage('go depth 15');
            }
        }, 300);

        if (mode === 'study' || mode === 'maestro') {
            hintsActive = true;
            $('#btn-hint-main, #btn-ai-hint, #btn-suggest-move').addClass('active').text("💡 PISTAS: ON");
        }
    } else {
        $('#master-coach-panel').hide();
        $('#btn-hint-main').hide();
        $('#btn-hint-mobile-bar').hide();
    }

    // ADJUST MOBILE ACTIONS BAR BASED ON MODE
    if (mode === 'maestro' || mode === 'study') {
        // En estudio/maestro, el boton de rendirse se convierte en GIRAR
        $('.btn-action.resign').text("🔄 GIRAR").off('click').on('click', () => board.flip()).css('background', '#1e293b').css('color', '#fff');
        $('#btn-drills-mobile-bar').hide();
    } else {
        $('.btn-action.resign').html("🏳️ RENDIRSE").off('click').on('click', () => resignGame()).css('background', '').css('color', '');
        $('#btn-drills-mobile-bar').show();

        if (mode === 'pass-and-play' || mode === 'local' || mode === 'exercises') {
            $('#btn-drills-mobile-bar').text("🔄 GIRAR").off('click').on('click', () => board.flip());
        } else {
            $('#btn-drills-mobile-bar').text("🧪 EJERCICIOS").off('click').on('click', () => startOpeningDrillsManual());
        }
    }

    if (mode === 'exercises') {
        $('#btn-hint-mobile-bar').hide();
        $('#master-coach-panel').hide();
        $('#puzzle-categories-sidebar').hide(); // Hide old sidebar
        $('#puzzle-controls-bottom').css('display', 'flex'); // Show new bottom controls
    } else {
        $('#puzzle-categories-sidebar').hide();
        $('#puzzle-controls-bottom').hide();
    }

    // Ensure board is properly initialized
    // Note: Chessboard.js doesn't have a config() method, so we skip this check
    /*
    if (board && board.config().sparePieces) {
        board.destroy();
        board = Chessboard('myBoard', {
            draggable: true,
            position: game.fen(),
            pieceTheme: getPieceTheme,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd
        });
        $(window).resize(board.resize);
    }
    */
};

window.setPuzzleCat = function setPuzzleCat(cat) {
    console.log("Setting puzzle category:", cat);

    // Normalización de categorías para compatibilidad con pool y API
    if (cat === 'midgame') cat = 'middlegame';

    // Sincronizar selectores si existen
    $('#drill-cat-sel').val(cat);
    $('#puz-cat-sel').val(cat);
    $('.puzzle-cat-btn').removeClass('active');
    $(`.puzzle-cat-btn[data-cat="${cat}"]`).addClass('active');

    drillCategory = cat;
    currentPuzzle = null; // Forzar recarga
    setMode('exercises');
    loadRandomPuzzle(0, cat);
}


window.startMaestroModeReal = function () {
    console.log("🎮 Iniciando Modo Maestro...");

    const color = $('#maestro-color-sel').val();
    const mins = parseInt($('#maestro-time-sel').val());

    // Set myColor
    myColor = color === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : color;
    console.log(`👤 Color del jugador configurado: ${myColor === 'w' ? 'Blancas' : 'Negras'}`);

    const diff = parseInt($('#maestro-diff-sel').val() || 15);
    $('#diff-sel').val(diff);

    // Config board and game
    game.reset();
    board.orientation(myColor === 'w' ? 'white' : 'black');
    board.start();
    gameStarted = false;
    aiThinking = false;
    console.log("🔓 aiThinking reseteado a false");

    // Setup Timers
    whiteTime = mins * 60;
    blackTime = mins * 60;
    $('#my-timer, #opp-timer').text(formatTime(whiteTime)).removeClass('low-time active');

    // Set Name
    $('#opp-name').text('Maestro IA (Nivel ' + diff + ')');
    $('#diff-sel').val(diff);

    // Mode Maestro specific
    hintsActive = true;
    setMode('maestro');

    showToast("Entrenamiento Maestro Iniciado", "👴");

    // Check for specific opening practice in Maestro
    const practiceVal = $('#maestro-opening-sel').val();
    if (practiceVal && practiceVal.includes('-')) {
        const [gIdx, iIdx] = practiceVal.split('-');
        const item = ACTIVE_OPENINGS[gIdx].items[iIdx];
        aiPracticeLine = item.moves || item.m;
        aiPracticeIndex = 0;
        currentOpeningName = item.name;
        currentOpeningComments = item.comments || [];

        showToast("Entrenando: " + currentOpeningName, "📖");
        $('#coach-txt').html(`<div class="quality-book" style="color:var(--accent); font-weight:800;">📖 ENTRENAMIENTO ACTIVO</div><div style="font-size:0.8rem;">Apertura: <b>${currentOpeningName}</b><br>Sigue la línea teórica.</div>`);
        console.log("📜 Maestro Line Loaded:", aiPracticeLine);
    } else {
        aiPracticeLine = null;
        currentOpeningName = null;
        currentOpeningComments = [];
        $('#coach-txt').html(`<div style="font-weight:bold; color:var(--text-main);">Maestro IA listo.</div><div style="font-size:0.75rem;">Modo de juego libre.</div>`);
        console.log("🎲 Modo de juego libre (sin apertura específica)");
    }

    if (myColor === 'b') {
        console.log("⚫ Jugador es Negras, IA moverá primero en 600ms");
        setTimeout(makeAIMove, 600);
    } else {
        console.log("⚪ Jugador es Blancas, esperando tu primer movimiento");
    }
};

window.startMaestroMode = function () {
    hintsActive = true;
    setMode('ai');
    showToast("Modo Entrenamiento Activado", "👴");
};

window.startOpeningPractice = function () {
    // This was the old global function, redirected to manual for consistency
    startOpeningPracticeManual();
};

window.createOnlineChallenge = function (fromSidebar, fromLobby = false) {
    if (!isAuth) { alert("Inicia sesión para jugar online."); return openAuth(); }

    var time;
    if (fromLobby) time = $('#online-time-sel-lobby').val();
    else if (fromSidebar) time = $('#local-time-selector .time-btn.active').data('time');
    else time = $('#online-time-sel').val();

    var id = Math.random().toString(36).substr(2, 9);
    var info = {
        id: id,
        user: userName,
        elo: userElo,
        time: parseInt(time)
    };
    if (socket) socket.emit('create_challenge', info);
    showToast("Reto publicado en la sala", "⚔️");

    if (fromLobby) {
        $('#lobby-create-panel').slideUp();
        // Stay in Lobby view
    } else {
        $('#online-setup-container').slideUp();
        setMode('local');
    }
};

window.filterLobby = function (type) {
    // type: 'live' or 'daily'
    $('.btn-tool').removeClass('active');
    $('#tab-lobby-' + type).addClass('active');

    $('#lobby-active-games .lobby-game-card').each(function () {
        const t = parseInt($(this).data('time'));
        if (type === 'live') {
            if (t <= 60) $(this).show(); else $(this).hide();
        } else {
            if (t > 60) $(this).show(); else $(this).hide();
        }
    });
};

function populateLobbyGames(games) {
    const container = $('#lobby-active-games');
    container.empty();
    if (games.length === 0) return container.html('<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.7rem;">No tienes partidas en curso.</div>');

    games.forEach(g => {
        const opp = g.white === userName ? g.black : g.white;
        const isMyTurn = (g.turn === 'w' && g.white === userName) || (g.turn === 'b' && g.black === userName);
        const timeMins = Math.floor((g.white === userName ? g.whiteTime : g.blackTime) / 60);
        const typeLabel = (g.whiteTime > 3600 * 10) ? 'DAILY' : 'LIVE';

        const html = `
            <div class="lobby-game-card" data-time="${timeMins}" onclick="resumeGame('${g.id}', '${opp}', '${g.fen}', '${g.white === userName ? 'w' : 'b'}', ${g.whiteTime}, ${g.blackTime})"
                 style="background:rgba(255,255,255,0.05); padding:12px; border-radius:8px; margin-bottom:8px; border:1px solid ${isMyTurn ? 'var(--accent)' : 'transparent'}; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                 <div>
                    <div style="font-weight:bold; font-size:0.9rem;">vs ${opp}</div>
                    <div style="font-size:0.75rem; opacity:0.7;">⏳ ${timeMins} min • ${typeLabel}</div>
                 </div>
                 <div style="font-size:0.8rem; font-weight:bold; color:${isMyTurn ? 'var(--accent)' : '#aaa'}">
                    ${isMyTurn ? 'TU TURNO ⚡' : 'Esperando...'}
                 </div>
            </div>
        `;
        container.append(html);
    });

    // Apply current filter
    const currentFilter = $('#tab-lobby-live').hasClass('active') ? 'live' : 'daily';
    filterLobby(currentFilter);
}

function populateLobbyChallenges(challenges) {
    const list = $('#lobby-challenges');
    list.empty();
    if (challenges.length === 0) return list.html('<div style="text-align:center; padding:10px; color:var(--text-muted); font-size:0.7rem;">No hay retos disponibles.</div>');

    challenges.forEach(data => {
        const html = `
            <div onclick="joinGame('${data.id}', '${data.user}', '${data.time}')"
                 style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; margin-bottom:5px; border-left:3px solid var(--accent); cursor:pointer; display:flex; justify-content:space-between;">
                 <span>👤 ${data.user} (${data.elo})</span>
                 <span style="font-weight:bold;">${data.time} min ⚔️</span>
            </div>
        `;
        list.append(html);
    });
}

// Auto-sync active games list and lobby
setInterval(function () {
    if (socket && isAuth) {
        socket.emit('get_lobby');
    }
}, 5000);

// Definitive Flip Board Repair
$(document).on('click', '#btn-flip, #btn-flip-mobile', function () {
    if (typeof board !== 'undefined') board.flip();
});

// Manual Opening Handlers
window.startTheoreticalStudy = function () {
    var val = $('#opening-sel').val();
    if (!val) return alert("Selecciona una apertura primero.");

    var parts = val.split('-');
    var gIdx = parseInt(parts[0]);
    var iIdx = parseInt(parts[1]);
    var opening = ACTIVE_OPENINGS[gIdx].items[iIdx];

    game.reset();
    board.start();

    // Setup Manual Study State
    studyMoves = opening.moves || opening.m;
    studyIndex = 0;
    currentOpeningName = opening.name;
    currentOpeningComments = opening.comments || [];

    setMode('study');

    // Hide old controls, use nav bar
    $('#study-controls').hide();

    // Update Coach Panel manual info
    $('#coach-txt').html(`<div class="quality-book" style="color:var(--accent); font-weight:800;">📖 ESTUDIO TEÓRICO</div><div style="font-size:0.75rem;">Apertura: <b>${opening.name}</b><br>Usa las flechas de navegación (▶) para avanzar.</div>`);

    showToast("Modo Teoría: " + opening.name, "📖");
};

// Controls for Manual Study
$('#btn-study-next').click(function () {
    if (currentMode === 'study' && studyMoves && studyIndex < studyMoves.length) {
        let move = studyMoves[studyIndex];
        game.move(move);
        board.position(game.fen());
        studyIndex++;
        $(this).text(`⏩ Siguiente Jugada (${studyIndex}/${studyMoves.length})`);
        playSnd('move');

        // Show expert comment if available
        let comm = (currentOpeningComments && currentOpeningComments[studyIndex - 1]) ? currentOpeningComments[studyIndex - 1] : "Jugada teórica.";
        $('#coach-txt').html(`
            <div class="quality-book" style="color:var(--accent); font-weight:800;">📖 TEORÍA: ${currentOpeningName || ''}</div>
            <div style="font-size:0.75rem; margin-top:5px;"><b>${move}</b>: ${comm}</div>
        `);

        if (studyIndex >= studyMoves.length) {
            $(this).text("✅ Teoría Completada").prop('disabled', true);
            showToast("Línea teórica finalizada", "🎉");
        }
    }
});

$('#btn-study-prev').click(function () {
    if (currentMode === 'study' && studyIndex > 0) {
        game.undo();
        board.position(game.fen());
        studyIndex--;
        $('#btn-study-next').text(`⏩ Siguiente Jugada (${studyIndex}/${studyMoves.length})`).prop('disabled', false);
    }
});

window.startOpeningPracticeManual = function () {
    var val = $('#opening-sel').val();
    if (!val) return alert("Selecciona una apertura primero.");

    // 1. Decidir el bando (Tu Bando)
    const sideChoice = $('#opening-side-sel').val();

    if (sideChoice === 'auto') {
        // Lógica automática anterior
        var parts = val.split('-');
        var gIdx = parseInt(parts[0]);
        var iIdx = parseInt(parts[1]);
        var opName = ACTIVE_OPENINGS[gIdx].items[iIdx].name.toLowerCase();

        if (opName.includes('defensa') || opName.includes('contra') || opName.includes('indian')) {
            $('#ai-color-sel').val('b');
        } else {
            $('#ai-color-sel').val('w');
        }
    } else {
        // Respetar elección manual del usuario ('w' o 'b')
        $('#ai-color-sel').val(sideChoice);
    }

    setMode('ai');

    // 2. Configurar ELO
    const openingElo = $('#opening-elo-sel').val();
    $('#diff-sel').val(openingElo);

    // 3. Cargar datos de apertura explícitamente para asegurar que el modo Entrenamiento los use
    var parts = val.split('-');
    var gIdx_load = parseInt(parts[0]);
    var iIdx_load = parseInt(parts[1]);
    const opening = ACTIVE_OPENINGS[gIdx_load].items[iIdx_load];

    aiPracticeLine = opening.moves || opening.m;
    aiPracticeIndex = 0;
    currentOpeningName = opening.name;
    currentOpeningComments = opening.comments || [];

    // 4. SOLUCIÓN DEFINITIVA: OCULTAR EL SELECTOR Y MOSTRAR INFO ESTÁTICA
    // El selector se resetea por algún evento del DOM, así que lo ocultamos completamente
    // Insertar antes del contenedor oculto
    // [Cuadro bloqueado eliminado a petición del usuario]
    // $practiceContainer.before($lockedDisplay);

    console.log('✅ Display bloqueado creado para:', currentOpeningName);

    // Ejecutar lógica de inicio limpia
    console.log("🚀 LÓGICA DIRECTA: Iniciando...", { myColor: $('#ai-color-sel').val(), theory: currentOpeningName });

    // Resetear juego
    game.reset();

    // Definir color final
    let colorVal = $('#ai-color-sel').val();
    let finalColor = 'w'; // Default
    if (colorVal === 'white' || colorVal === 'w') finalColor = 'w';
    else if (colorVal === 'black' || colorVal === 'b') finalColor = 'b';
    else finalColor = (Math.random() > 0.5 ? 'w' : 'b');

    myColor = finalColor;

    // Configurar tablero
    board.orientation(myColor === 'w' ? 'white' : 'black');
    board.start();
    gameStarted = false;

    // UI del Coach
    $('#opp-name').text('Stockfish ' + $('#diff-sel option:selected').text());
    $('#coach-txt').html(`<div style="color:var(--accent); font-size:0.8rem; font-weight:bold;">📖 ENTRENANDO: ${currentOpeningName}</div><div style="font-size:0.7rem;">Color: ${myColor === 'w' ? '⚪ BLANCAS' : '⚫ NEGRAS'} | Juega las líneas maestras.</div>`);

    // Verificación final del selector
    setTimeout(() => {
        const currentVal = $('#ai-opening-practice').val();
        if (currentVal !== val) {
            console.warn('⚠️ SELECTOR RESETEADO! Forzando de nuevo...');
            $('#ai-opening-practice').val(val);
        }
    }, 500);

    // Timers y Estado
    currentMode = 'ai';
    updateUI();
    resetTimers();

    // Si juego con negras, la IA mueve primero
    if (myColor === 'b') {
        aiPracticeIndex = 0;
        setTimeout(makeAIMove, 800);
    }

    showToast("Entrenamiento: " + currentOpeningName, "⚔️");
};

window.startOpeningDrillsManual = function () {
    var val = $('#opening-sel').val();
    if (!val) return alert("Selecciona una apertura primero.");

    var parts = val.split('-');
    var gIdx = parseInt(parts[0]);
    var iIdx = parseInt(parts[1]);
    var opName = ACTIVE_OPENINGS[gIdx].items[iIdx].name;

    const mappedTag = OPENING_TAG_MAP[opName] || opName.replace(/ /g, '_');
    console.log(`🧪 Iniciando ejercicios tácticos para: ${opName} (Tag: ${mappedTag})`);

    drillCategory = mappedTag;
    setMode('exercises');
    loadRandomPuzzle(0, mappedTag);

    showToast("Ejercicios de: " + opName, "🧪");
};

// New menu triggers
$('#btn-editor-main, #btn-editor').off('click').click(() => {
    setMode('study');

    // Configurar Chessboard para modo edición
    if (board) board.destroy();
    board = Chessboard('myBoard', {
        draggable: true,
        dropOffBoard: 'trash',
        sparePieces: true,
        position: game.fen(),
        pieceTheme: getPieceTheme,
        onDrop: (source, target, piece, newPos, oldPos, orientation) => {
            // Sincronizar Chess.js con la nueva posición del editor
            setTimeout(() => {
                const newFen = Chessboard.objToFen(newPos) + " w - - 0 1";
                try {
                    game.load(newFen);
                    updateUI(true);
                } catch (e) { console.error("FEN Inválido", e); }
            }, 100);
        }
    });

    $(window).resize(board.resize);
    showToast("Modo Editor: Arrastra piezas o bórralas fuera del tablero", "⛏️");
    $('#coach-txt').html("<b>Modo Editor Activo.</b> Coloca las piezas y luego usa las herramientas de análisis.");
});

$('#btn-pgn-main').click(() => {
    setMode('study');
    $('#btn-pgn').click();
});

// Sync puzzles categories
$('#puz-cat-sel-main, #puz-cat-sel').on('change', function () {
    const val = $(this).val();
    $('#puz-cat-sel-main, #puz-cat-sel').val(val);
    drillCategory = val; // Reset or update drillCategory
});

$('#btn-pgn-main').click(() => $('#btn-pgn').click());

// Redundant opening population loop removed. Data now populated at line 2474.

var aiPracticeLine = null;
var aiPracticeIndex = 0;
var drillCategory = null; // For holding current puzzle category in drill mode
var aiThinking = false; // Lock to prevent overlapping AI moves

$('#btn-pgn').click(function () {
    const pgn = prompt("Pega el PGN de la partida:");
    if (pgn) {
        if (game.load_pgn(pgn)) {
            board.position(game.fen());
            historyPositions = ['start', ...game.history().map((m, i) => {
                const g2 = new Chess();
                game.history().slice(0, i + 1).forEach(mv => g2.move(mv));
                return g2.fen();
            })];
            currentHistoryIndex = historyPositions.length - 1;
            updateUI(true);
            alert("Partida cargada correctamente.");
        } else {
            alert("Error: PGN no válido.");
        }
    }
});

// Initial mode setup
$('.menu-step').removeClass('active');
$('#menu-root').addClass('active');

// Logout Handler
$('#btn-logout-drawer').click(() => {
    localStorage.removeItem('chess_token');
    localStorage.removeItem('chess_username');
    localStorage.removeItem('chess_is_auth');
    location.reload();
});

window.goBackToMenu = () => {
    // If we have history, we might want to go back, but "Home" button usually means force root.
    // We will push root state to be safe and clear view.
    exitGameView();
    showSubMenu('root');
};

// HISTORY LISTENER (Browser Back Button)
window.onpopstate = function (event) {
    if (event.state) {
        if (event.state.view === 'menu') {
            exitGameView();
            showSubMenu(event.state.id, false); // false = don't push again
        } else if (event.state.view === 'game') {
            // Restore game view if user goes forward to it
            setMode(event.state.mode, false);
        }
    } else {
        // Root state (or initial)
        exitGameView();
        showSubMenu('root', false);
    }
};

$('#btn-mobile-menu-back').click(function () {
    goBackToMenu();
});


// Helper para cambiar pestañas desde el drawer
window.setTab = function (tabId) {
    $('.tab-btn[data-tab="' + tabId + '"]').click();
    $('#side-drawer').removeClass('open');
    $('#side-drawer-overlay').fadeOut();

    // Si no estamos en modo board, activar el modo board para ver el sidebar-right
    if (!$('body').hasClass('board-active')) {
        setMode('local');
    }
};

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log('SW registrado con éxito');
        }).catch(err => {
            console.log('Error al registrar SW', err);
        });
    });
}

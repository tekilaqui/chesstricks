// --- DANGER DETECTION GLOBAL ---
var currentDangerMsg = "";
function showDangerExplanation() {
    if (!currentDangerMsg) return;
    $('#danger-desc').html(currentDangerMsg);
    $('#danger-alert-box').fadeIn();
}

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
    console.log("✅ Socket conectado:", socket.id);
});

socket.on('connect_error', (err) => {
    console.error("❌ Error de conexión socket:", err.message);
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
var opponentAutoMode = false; // Manuel por defecto en Estudio
var stockfish = null;
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
var userPuzzleElo = parseInt(localStorage.getItem('chess_puz_elo')) || 500;
var drillCategory = null;
var localPuzzles = (typeof LOCAL_PUZZLES_DB !== 'undefined') ? LOCAL_PUZZLES_DB : [];

// SISTEMA ELO & AUTH
var userElo = parseInt(localStorage.getItem('chess_user_elo')) || 500;
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
    const movesStr = history.join(' ');
    let foundName = "";
    let foundMoveCount = 0;
    let foundComments = [];

    // Exact match for the full line
    ACTIVE_OPENINGS.forEach(group => {
        group.items.forEach(item => {
            const moves = item.moves || item.m || [];
            const entryStr = moves.join(' ');
            if (movesStr.startsWith(entryStr)) {
                if (moves.length > foundMoveCount) {
                    foundName = item.name;
                    foundMoveCount = moves.length;
                    foundComments = item.comments || [];
                }
            }
        });
    });

    // Sub-opening detection (Defense)
    let specializedName = foundName;
    if (foundName) {
        // Try to see if there's a more specific sub-entry (common in chess databases)
        // For now, we use the foundName which already contains things like "Siciliana Najdorf"
    }

    return { name: foundName, moveCount: foundMoveCount, comments: foundComments };
}

window.resetGamePosition = function () {
    game.reset();
    board.start();
    aiPracticeIndex = 0;
    studyIndex = 0;
    historyPositions = ['start'];
    currentHistoryIndex = 0;
    moveData = []; // Reset visual history
    updateHistory();
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
    if (isBookMove) return { text: "📖 " + (t.book || "Teoría / Libro"), class: 'q-book', symbol: '📖' };
    if (isMate) return { text: "!! " + t.mate, class: 'q-excellent', symbol: '!!' };

    if (diff === null || diff === undefined) diff = 0;

    if (diff < 0.1) return { text: "!! " + (t.brilliant || "Jugada Maestra"), class: 'q-excellent', symbol: '!!' };
    if (diff < 0.25) return { text: "! " + t.best || "Óptima", class: 'q-best', symbol: '!' };
    if (diff < 0.45) return { text: "⭐ " + (t.excellent || "Excelente"), class: 'q-excellent', symbol: '⭐' };
    if (diff < 0.7) return { text: t.good || "Buena", class: 'q-good', symbol: '' };
    if (diff < 1.3) return { text: "?! " + t.inaccuracy, class: 'q-inaccuracy', symbol: '?!' };
    if (diff < 2.5) return { text: "? " + t.mistake, class: 'q-mistake', symbol: '?' };
    return { text: "?? " + t.blunder, class: 'q-blunder', symbol: '??' };
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

    // Sync with Server (Global ELO)
    if (isAuth) {
        socket.emit('update_elo', {
            user: userName,
            elo: userElo,
            puzElo: userPuzzleElo
        });
    }

    $('#coach-txt').append(`< br > <b style="color:var(--accent)">${isPuzzle ? 'Puzzle ELO' : 'ELO'}: ${newElo}</b>`);
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
// --- STOCKFISH INITIALIZATION ---
// --- STOCKFISH INITIALIZATION ---
try {
    console.log("♟️ Iniciando Stockfish...");
    stockfish = new Worker('stockfish.js');
    stockfish.postMessage('uci');

    stockfish.onmessage = (e) => {
        var l = e.data;
        if (l === 'uciok') console.log("✅ Stockfish UCI OK");
        if (l === 'readyok') console.log("✅ Stockfish Ready");

        // 1. ANÁLISIS EN TIEMPO REAL (Info: Score, PV, Coach, Flechas)
        if (l.includes('score')) {
            // Parse Score
            let score = 0;
            let isMate = l.includes('mate');
            if (isMate) {
                let match = l.match(/score mate (-?\d+)/);
                score = match ? parseInt(match[1]) * 1000 : 9999;
            } else {
                let match = l.match(/score cp (-?\d+)/);
                if (match) score = parseInt(match[1]) / 100;
            }

            // Adjust perspective
            let ev = (game.turn() === 'w' ? score : -score);
            let h = Math.max(0, Math.min(100, 50 + (ev * 15)));

            // Update Eval Bar
            if (!analysisActive) $('#eval-fill-master').css('height', h + '%');
            window.currentEval = ev; // Store for logic

            // Parse Best Move (PV) for Comments & Hints
            var pvFull = l.split(' pv ')[1] ? l.split(' pv ')[1].split(' ') : [];
            if (pvFull.length > 0) {
                var bestMoveLAN = pvFull[0];

                // --- COACH & QUALITY LOGIC (Updates continuously) ---
                const lastMove = fullHistory.length > 0 ? fullHistory[fullHistory.length - 1] : null;
                let diffVal = 0;
                if (window.lastEval !== undefined) {
                    // Logic to determine quality based on eval shift
                    if (game.turn() === 'b') diffVal = ev - window.lastEval;
                    else diffVal = window.lastEval - ev;
                }

                let evalLoss = 0;
                if (game.turn() === 'b') evalLoss = (window.lastEval || ev) - ev;
                else evalLoss = ev - (window.lastEval || ev);

                // Update Quality (only if recent move exists)
                const isBook = isBookMove(lastMove ? lastMove.san : '');
                var q = getQualityMsg(Math.max(0, evalLoss), isMate, isBook);

                if (fullHistory.length > 0) {
                    moveData[fullHistory.length - 1] = { san: lastMove.san, quality: q };
                    updateHistory();
                }

                // Generate Coach Explanation
                let explanation = getHumanExplanation(ev, evalLoss, isMate, isBook, isOpening);
                let moveQualityHtml = `<div class="${q.class}" style="font-size:1.1rem; margin-bottom:5px;">${q.text}</div>`;

                let openingName = ''
                if (isOpening && fullHistory.length >= 2) {
                    const detected = detectOpening();
                    if (detected.name) openingName = '🎯 ' + detected.name;
                }
                let openingMsg = openingName ? `<div style="color:var(--accent); font-size:0.75rem; margin-bottom:10px; font-weight:800; background:rgba(139,92,246,0.1); padding:5px 10px; border-radius:6px; border-left:3px solid var(--accent);">${openingName}</div>` : '';

                // Render Coach Text
                $('#coach-txt').html(`
                    ${openingMsg}
                    ${moveQualityHtml}
                    <div style="display:flex; gap:10px; margin-bottom:8px;">
                        <div style="font-size:0.65rem; color:var(--text-muted);">Eval: <b style="color:var(--text-main)">${ev > 0 ? '+' : ''}${isMate ? 'M' : ev.toFixed(1)}</b></div>
                    </div>
                    <div style="font-size:0.78rem; line-height:1.5; color:var(--text-main); background:rgba(255,255,255,0.03); padding:12px; border-radius:10px;">${explanation}</div>
                `);

                // --- HINTS (Visual Arrows) for Player Turn ---
                // Only show hints if it is NOT the AI's turn to auto-move
                const isAiTurn = (game.turn() !== myColor && (currentMode === 'ai' || currentMode === 'maestro' || (currentMode === 'study' && opponentAutoMode)));

                if (!isAiTurn && (hintsActive || analysisActive)) {
                    $('#best-move-display').html("💡 Sugerencia: <b style='color:white'>" + lanToSan(bestMoveLAN) + "</b>").show();
                    // Click to move functionality for hint
                    $('#best-move-display').off('click').on('click', function () {
                        game.move({ from: bestMoveLAN.substring(0, 2), to: bestMoveLAN.substring(2, 4), promotion: 'q' });
                        board.position(game.fen());
                        updateUI(true);
                        checkGameOver();
                    });

                    if (hintsActive) drawBestMoveArrow(bestMoveLAN);

                    window.pvList = [{ moveLAN: bestMoveLAN }]; // Save for redraw
                }
            }

            // Capture MultiPV
            if (l.includes('multipv')) {
                const mv = l.match(/multipv (\d+)/);
                const pvIdx = mv ? parseInt(mv[1]) : 1;
                let pvScore = score; // Use parsed score
                const pvMoves = l.split(' pv ')[1];
                if (pvMoves) {
                    const move = pvMoves.split(' ')[0];
                    if (!window.pvList || pvIdx === 1) window.pvList = [];
                    window.pvList[pvIdx - 1] = { move: lanToSan(move), eval: pvScore };
                }
            }
        }

        // 2. EJECUCIÓN DE MOVIMIENTO (Best Move) - SOLO AQUÍ MUEVE LA IA
        if (l.startsWith('bestmove')) {
            const bestMoveParts = l.split(' ');
            const bestMoveLAN = bestMoveParts[1];

            // Check if AI should move
            const isAiTurn = game.turn() !== myColor;
            const shouldAiMove = (currentMode === 'ai' || currentMode === 'maestro' || (currentMode === 'study' && opponentAutoMode));

            if (isAiTurn && shouldAiMove && bestMoveLAN && bestMoveLAN !== '(none)') {
                // Prevent double moves if aiThinking flag was weird, but here we trust the engine finish

                setTimeout(() => {
                    game.move({ from: bestMoveLAN.substring(0, 2), to: bestMoveLAN.substring(2, 4), promotion: 'q' });
                    board.position(game.fen());
                    aiThinking = false; // Reset flag
                    updateUI(true); // Loops back to analyze new position
                    checkGameOver();
                }, 500); // Small delay for realism
            } else {
                aiThinking = false; // Reset flag anyway
            }
        }
    };
} catch (e) {
    console.error("❌ Error cargando Stockfish:", e);
    alert("Error crítico cargando IA. Recarga la página.");
}

// Helpers outside to avoid nesting issues
function lanToSan(lan) {
    if (!lan) return "";
    const from = lan.substring(0, 2);
    const to = lan.substring(2, 4);
    const promo = lan.length > 4 ? lan[4] : '';
    const temp = new Chess(game.fen());
    const m = temp.move({ from, to, promotion: promo });
    return m ? m.san : lan;
}

// Helper to categorize move quality
function getQualityMsg(diff, isMate, isBook) {
    if (isBook) return { text: "📖 TEORÍA", class: 'q-book', symbol: '📖' };
    if (isMate) return { text: "🏁 JUGADA DECISIVA", class: 'q-excellent', symbol: '#' };

    // diff is absolute loss in centipawns/pawns
    if (diff <= 0.2) return { text: "⭐ EXCELENTE", class: 'q-best', symbol: '!!' };
    if (diff <= 0.5) return { text: "✅ BUENA", class: 'q-good', symbol: '!' };
    if (diff <= 1.0) return { text: "⚠️ IMPRECISIÓN", class: 'q-inaccuracy', symbol: '?!' };
    if (diff <= 2.0) return { text: "❌ ERROR", class: 'q-mistake', symbol: '?' };

    return { text: "💥 BLUNDER", class: 'q-blunder', symbol: "??" };
}

// Humanized Explanation Logic (Updated & Enhanced)
function getHumanExplanation(ev, diff, isMate, isBook, isOp) {
    // 1. APERTURAS Y TEORÍA
    if (isBook) {
        let opName = currentOpeningName || 'Apertura Estándar';
        let tip = "Sigue el desarrollo lógico de piezas.";

        // Comentarios específicos por apertura (Flavor Text)
        if (opName.includes('Española') || opName.includes('Ruy Lopez'))
            tip = "Clásica Ruy Lopez. Bb5 presiona el caballo, pero a6 suele obligar a decidir. ¡Controla el centro!";
        else if (opName.includes('Siciliana'))
            tip = "Lucha asimétrica (combate). Las negras buscan contrajuego dinámico en c5.";
        else if (opName.includes('Francesa'))
            tip = "Sólida pero pasiva al inicio. Cuidado con el alfil de casillas blancas bloqueado.";
        else if (opName.includes('Caro-Kann'))
            tip = "Estructura de peones muy sólida. Finales favorables si sobrevives al medio juego.";
        else if (opName.includes('Italiana'))
            tip = "Desarrollo rápido de Bc4 apuntando a f7. Un clásico del juego abierto.";

        return `📖 <b class="q-book">TEORÍA DE LIBRO</b><br><span style="font-size:0.9em; opacity:0.9">${opName}: ${tip}</span>`;
    }

    // 2. FINALES Y MATES
    if (isMate) return `♛ <b class="q-excellent">¡JUGADA DE MATE!</b><br>El desenlace es inevitable. ¡Calcula con precisión!`;

    // 3. CALIDAD DE LA JUGADA (Basado en 'diff' - pérdida de ventaja)
    // diff representa cuánto peor es tu jugada respecto a la mejor (en peones)

    // ERROR GRAVE (Blunder): > 2.5 peones
    if (diff > 2.5) {
        return `💥 <b class="q-blunder">ERROR GRAVE (Colgada)</b><br>Has regalado una pieza o un mate. ¡Esta jugada cambia el resultado!`;
    }

    // ERROR (Mistake): > 1.2 peones
    if (diff > 1.2) {
        return `🔥 <b class="q-mistake">ERROR TÁCTICO</b><br>Pierdes una ventaja clara o permites un fuerte contraataque.`;
    }

    // IMPRECISIÓN (Inaccuracy): > 0.6 peones
    if (diff > 0.6) {
        return `⚠️ <b class="q-inaccuracy">IMPRECISIÓN</b><br>Jugada pasiva. Había una continuación más fuerte o activa.`;
    }

    // JUGADA MAESTRA/BUENA (diff muy bajo o ganancia)
    if (diff < 0.1) {
        // Si además cambia la evaluación mucho a nuestro favor (rival se equivocó antes)
        return `⭐ <b class="q-best">¡JUGADA ÓPTIMA!</b><br>La mejor respuesta posible. Mantienes la presión máxima.`;
    }
    if (diff < 0.35) {
        return `✅ <b class="q-good">BUEN MOVIMIENTO</b><br>Sólido y lógico. Mejoras tu posición paso a paso.`;
    }

    // 4. CONTEXTO GENERAL
    let evalText = "La posición está igualada.";
    if (ev > 1.5) evalText = "Las blancas tienen ventaja clara.";
    if (ev < -1.5) evalText = "Las negras dominan la posición.";

    if (isOp) return `🧩 <b class="q-good">FASE DE APERTURA</b><br>${evalText} Recuerda: Control central, desarrollo y seguridad del rey.`;

    return `🧠 <b class="q-good">POSICIÓN COMPLEJA</b><br>${evalText} Busca planes a largo plazo y debilidades estructurales.`;
}

function makeAIMove() {
    if (game.game_over()) return;

    if (aiThinking) return;

    const sideThatMoves = game.turn();
    if (sideThatMoves === myColor) return;

    console.log(`🤖 IA pensando... (Turno: ${sideThatMoves}, MiColor: ${myColor}, PrácticaIdx: ${aiPracticeIndex})`);

    // --- MODO ENTRENAMIENTO DE APERTURA ---
    if (aiPracticeLine && Array.isArray(aiPracticeLine) && aiPracticeIndex < aiPracticeLine.length) {

        // FUERZA SINCRONIZACIÓN: En cada turno de la IA, el índice debe ser igual al historial
        // Esto evita que si una jugada del jugador se procesó raro, la IA se pierda.
        const history = game.history();
        if (aiPracticeIndex !== history.length) {
            console.warn(`[RE-SYNC] Corrigiendo índice: de ${aiPracticeIndex} a ${history.length}`);
            aiPracticeIndex = history.length;
        }

        if (aiPracticeIndex >= aiPracticeLine.length) {
            console.log("[TEORIA] Línea finalizada. El motor ahora toma el mando.");
            aiPracticeLine = null;
            makeAIMove();
            return;
        }

        let moveToPlay = aiPracticeLine[aiPracticeIndex].trim();
        console.log(`📖 [MAESTRO] Turno IA (${sideThatMoves}). Jugando teoría #${aiPracticeIndex}: ${moveToPlay}`);

        if (stockfish) stockfish.postMessage('stop');

        aiThinking = true;
        setTimeout(() => {
            if (game.turn() === myColor || !aiPracticeLine) {
                aiThinking = false;
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

                let comm = (currentOpeningComments && currentOpeningComments[aiPracticeIndex - 1])
                    ? currentOpeningComments[aiPracticeIndex - 1]
                    : "Esta jugada sigue la teoría establecida para esta apertura.";

                $('#coach-txt').html(`
                        <div style="color:var(--accent); font-size:0.7rem; font-weight:800; text-transform:uppercase; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; margin-bottom:10px;">
                            📖 APERTURA: ${currentOpeningName || 'Teoría'}
                        </div>
                        <div class="quality-book" style="color:var(--accent); font-weight:800; font-size:1.1rem; margin-bottom:5px;">MAESTRO IA: ${m.san}</div>
                        <div style="font-size:0.8rem; line-height:1.4; color:var(--text-main); background:rgba(255,255,255,0.03); padding:10px; border-radius:8px;">
                            ${comm}
                        </div>
                    `);
                aiThinking = false;
            } else {
                console.error("❌ Error al realizar jugada de teoría:", moveToPlay);
                aiPracticeLine = null;
                aiThinking = false;
                makeAIMove(); // Deja que Stockfish decida ahora
            }
        }, 1000); // 1s de "reflexión" para el maestro
        return;
    }

    // --- MODO MOTOR ESTÁNDAR (STOCKFISH) ---
    if (stockfish) {
        // Use the correct selector based on mode
        const diffSel = (currentMode === 'maestro') ? '#maestro-diff-sel' : '#diff-sel';
        const diff = parseInt($(diffSel).val()) || 10;

        stockfish.postMessage('stop');
        stockfish.postMessage('setoption name MultiPV value 3'); // Show top 3 moves
        stockfish.postMessage('position fen ' + game.fen());
        stockfish.postMessage('go depth ' + diff);
    }
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

var moveData = []; // [{san: 'e4', color: 'w', quality: null}]

function updateHistory() {
    const history = game.history({ verbose: true });
    historyPositions.push(game.fen());
    currentHistoryIndex = historyPositions.length - 1;

    const list = $('#game-moves-list');
    if (!list.length) return;
    list.empty();

    let html = "";
    for (let i = 0; i < history.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const wMove = history[i];
        const bMove = history[i + 1];

        const wQuality = (moveData[i] && moveData[i].quality) ? moveData[i].quality : { class: '', symbol: '' };
        const bQuality = (moveData[i + 1] && moveData[i + 1].quality) ? moveData[i + 1].quality : { class: '', symbol: '' };

        html += `<div class="move-number">${moveNum}.</div>`;
        html += `<div class="move-item ${wQuality.class} ${i === currentHistoryIndex - 1 ? 'active' : ''}" onclick="navigateHistoryIndex(${i})">
                    ${wMove.san} <span class="move-symbol">${wQuality.symbol}</span>
                 </div>`;
        if (bMove) {
            html += `<div class="move-item ${bQuality.class} ${i + 1 === currentHistoryIndex - 1 ? 'active' : ''}" onclick="navigateHistoryIndex(${i + 1})">
                        ${bMove.san} <span class="move-symbol">${bQuality.symbol}</span>
                     </div>`;
        } else {
            html += `<div></div>`;
        }
    }
    list.append(html);

    // Auto-scroll to bottom
    list.scrollTop(list[0].scrollHeight);
}

window.navigateHistoryIndex = function (idx) {
    currentHistoryIndex = idx + 1;
    board.position(historyPositions[currentHistoryIndex]);
    game.load(historyPositions[currentHistoryIndex]);
    updateUI(false);
    // Highlight the active move in list
    $('#game-moves-list .move-item').removeClass('active');
    $('#game-moves-list .move-item').eq(idx).addClass('active');
};

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
        stockfish.postMessage('go depth 15');

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
        else if (game.history({ verbose: true }).pop().flags.includes('c')) playSnd('capture');
        else playSnd('move');

        updateHistory();
        if (!gameStarted && currentMode !== 'exercises' && currentMode !== 'study') startClock();
        if (currentMode !== 'exercises' && currentMode !== 'study') updateTimerVisuals();

        // SAVE LAST EVAL BEFORE NEW ANALYSIS
        if (window.currentEval !== undefined) {
            window.lastEval = window.currentEval;
        }
        if (stockfish && currentMode !== 'local' && (currentMode === 'ai' || currentMode === 'maestro' || hintsActive || currentMode === 'study')) {
            // Decidir si la IA debe mover (SÓLO si el modo automático está activado)
            const isOurTurn = (game.turn() === myColor);

            // Si es modo AI o MAESTRO, auto-activar el modo si no se ha tocado
            const shouldAIMove = (currentMode === 'ai' || currentMode === 'maestro' || currentMode === 'study') && opponentAutoMode;

            if (shouldAIMove && !isOurTurn) {
                makeAIMove();
            } else {
                // Solo analizar
                stockfish.postMessage('stop');
                stockfish.postMessage('setoption name MultiPV value 3');
                stockfish.postMessage('position fen ' + game.fen());
                stockfish.postMessage('go depth 15');
            }
        }
    } else {
        // Even if not moved, if we are in study mode and just entered, start analysis
        if (currentMode === 'study' || currentMode === 'ai' || currentMode === 'maestro') {
            stockfish.postMessage('stop');
            stockfish.postMessage('setoption name MultiPV value 3');
            stockfish.postMessage('position fen ' + game.fen());
            stockfish.postMessage('go depth 15');
        }
    }
}

function getPieceTheme(piece) {
    try {
        // Check if element exists to avoid errors
        const el = $('#piece-theme-sel');
        const theme = (el.length ? el.val() : null) || localStorage.getItem('chess_piece_theme') || 'wikipedia';

        if (theme === 'alpha' || theme === 'uscf') {
            return 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/' + theme + '/' + piece + '.svg';
        }
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

        // En modo online, solo puedes mover tus piezas
        if (currentMode === 'local' && piece.color !== myColor) {
            return 'snapback';
        }

        // En modo AI/Maestro, si el modo automático está activo, NO puedes mover por el rival
        // Salvo que sea tu turno, claro.
        if ((currentMode === 'ai' || currentMode === 'maestro') && opponentAutoMode) {
            if (game.turn() !== myColor) return 'snapback';
        }
    }

    // En modo ESTUDIO, si el oponente está en AUTO, bloquear movimientos manuales del rival
    if (currentMode === 'study' && opponentAutoMode) {
        const piece = game.get(source);
        if (piece && piece.color !== myColor) return 'snapback';
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
                        ${currentOpeningName || 'Línea de Apertura'}
                    </div>
                    <div style="font-size:1rem; font-weight:700; color:var(--text-main); margin-bottom:8px;">Has jugado: ${move.san}</div>
                    <div style="font-size:0.85rem; line-height:1.5; color:var(--text-main); background:rgba(255,255,255,0.03); padding:10px; border-radius:8px;">
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
    if (selectedSq) {
        if (selectedSq === sq) { selectedSq = null; updateUI(); return; }

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
                            ${currentOpeningName || 'Línea de Apertura'}
                        </div>
                        <div style="font-size:1rem; font-weight:700; color:var(--text-main); margin-bottom:8px;">Has jugado: ${move.san}</div>
                        <div style="font-size:0.85rem; line-height:1.5; color:var(--text-main); background:rgba(255,255,255,0.03); padding:10px; border-radius:8px;">
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
                socket.emit('move', { move: move.san, gameId: gameId, fen: game.fen() });

                // Smart Turn Jumper
                setTimeout(() => {
                    socket.emit('get_my_games');
                    setTimeout(() => {
                        const nextTurn = [...$('.active-game-item')].find(el => $(el).find('b').length > 0 && !$(el).attr('onclick').includes(gameId));
                        if (nextTurn) {
                            showToast("Tu turno en otra partida", "♟️");
                            nextTurn.click();
                        }
                    }, 600);
                }, 500);
            }

            updateUI(true);
            checkGameOver();
            return;
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

// --- RESTRICCIÓN DE MOVIMIENTO (onDragStart) ---
function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;

    // 1. Bloquear si la IA está pensando
    if (typeof aiThinking !== 'undefined' && aiThinking) return false;

    // 2. Definir modo "Local Puro" (Pass & Play)
    // Si estamos en pass-and-play, O si es local sin gameId (modo offline legacy)
    const isLocalPure = currentMode === 'pass-and-play' || (!gameId && currentMode === 'local');

    // 3. RESTRICCIÓN RIGUROSA:
    // Si NO es local puro, y la pieza no es de MI color, BLOQUEAR.
    if (!isLocalPure && piece.charAt(0) !== myColor) {
        // Feedback visual crítico
        showToast('¡No muevas rivales en online!', '⚠️');
        return false;
    }

    // 4. Modos de análisis/entrenamiento (AI, Maestro, Study, Exercises)
    if (currentMode === 'study' || currentMode === 'ai' || currentMode === 'maestro' || currentMode === 'exercises') {
        // En Study con auto-oponente, bloquear turno del oponente si toca a la IA
        if (currentMode === 'study' && opponentAutoMode && game.turn() !== myColor) return false;

        // En AI/Maestro, bloquear si es turno de la IA
        if ((currentMode === 'ai' || currentMode === 'maestro') && game.turn() !== myColor) return false;

        // Validar turno correcto del juego
        if (game.turn() !== piece.charAt(0)) return false;

        return true;
    }

    // 5. Validación genérica de turno (para pass-and-play o fallback)
    if (game.turn() !== piece.charAt(0)) return false;

    // 6. Online estricto (Redundancia de seguridad)
    if (currentMode === 'local' && gameId) {
        if (game.turn() !== myColor) return false;
    }

    return true;
}

// ARROW DRAWING UTILS (Required for hints)
function clearArrowCanvas() {
    const cvs = document.getElementById('arrowCanvas');
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);
}

function drawBestMoveArrow(moveLAN) {
    // Note: hintsActive is defined globally
    if (!hintsActive && !moveLAN) return;
    // If moveLAN is null (clear), we just return (after clearing above if called separately, but here logic paints)

    const cvs = document.getElementById('arrowCanvas');
    if (!cvs) return;

    const ctx = cvs.getContext('2d');

    // Clear first to avoid trails
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    if (!moveLAN || !hintsActive) return;

    // Ajustar canvas al tamaño real
    const r = cvs.getBoundingClientRect();
    cvs.width = r.width;
    cvs.height = r.height;

    const sqSize = cvs.width / 8;

    const from = moveLAN.substring(0, 2);
    const to = moveLAN.substring(2, 4);

    const cols = 'abcdefgh';
    const rows = '87654321';

    const isWhite = board.orientation() === 'white';

    const colIdx = (c) => isWhite ? cols.indexOf(c) : 7 - cols.indexOf(c);
    const rowIdx = (r) => isWhite ? rows.indexOf(r) : 7 - rows.indexOf(r);

    const x1 = colIdx(from[0]) * sqSize + sqSize / 2;
    const y1 = rowIdx(from[1]) * sqSize + sqSize / 2;
    const x2 = colIdx(to[0]) * sqSize + sqSize / 2;
    const y2 = rowIdx(to[1]) * sqSize + sqSize / 2;

    // Draw Arrow
    ctx.beginPath();
    ctx.strokeStyle = '#fbbf24'; // Amber-400
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.7;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.fillStyle = '#fbbf24';
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 15 * Math.cos(angle - Math.PI / 6), y2 - 15 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - 15 * Math.cos(angle + Math.PI / 6), y2 - 15 * Math.sin(angle + Math.PI / 6));
    ctx.fill();
}


$(document).ready(() => {
    board = Chessboard('myBoard', {
        draggable: true,
        position: 'start',
        pieceTheme: getPieceTheme,
        onDragStart: onDragStart,
        onDrop, onSnapEnd
    });

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

    // Sidebar Online Logic
    $('#btn-create').click(() => window.createOnlineChallenge(true));
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
    $('#btn-flip, #btn-flip-mobile, #btn-flip-board, #btn-flip-small, #btn-flip-pc-sidebar, #btn-flip-pc-local').off('click').on('click', function () {
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

    $('#board-theme-sel').off('change').change(function () {
        const theme = $(this).val();
        localStorage.setItem('chess_board_theme', theme);
        let colors = { light: '#f0d9b5', dark: '#b58863' };
        if (theme === 'wood') colors = { light: '#eec', dark: '#8b4513' };
        if (theme === 'neon') colors = { light: '#1e293b', dark: '#0f172a' };
        if (theme === 'forest') colors = { light: '#acc', dark: '#2e8b57' };
        $('.white-1e1d7').css('background', colors.light);
        $('.black-3c85d').css('background', colors.dark);
    });


    $('#piece-theme-sel').off('change').change(function () {
        const theme = $(this).val();
        localStorage.setItem('chess_piece_theme', theme);
        if (!board) return;
        board = Chessboard('myBoard', {
            draggable: true,
            position: board.position(),
            pieceTheme: getPieceTheme,
            onDragStart: onDragStart,
            onDrop, onSnapEnd
        });
        $('#board-theme-sel').trigger('change');
    });

    // Square Clicks
    $(document).on('mousedown touchstart', '.square-55d63', function () {
        onSquareClick($(this).data('square'));
    });

    // PC Reset Button
    $('#btn-reset-board-pc, #btn-reset-ai').off('click').on('click', resetGamePosition);

    // Initial load fixes
    const savedPT = localStorage.getItem('chess_piece_theme') || 'wikipedia';
    $('#piece-theme-sel').val(savedPT);
    $('#board-theme-sel').val(localStorage.getItem('chess_board_theme') || 'classic').trigger('change');
    if (savedPT !== 'wikipedia') $('#piece-theme-sel').trigger('change');

    // Force board render multiple stages
    setTimeout(() => {
        if (board) {
            board.start();
            board.resize();
        }
    }, 500);

    setTimeout(() => {
        if (board) board.resize();
        updateUI();
    }, 1500);

    // Button Bindings
    $('#btn-toggle-hints-study').click(toggleHints);
    $('.tab-btn').on('click', function () {
        setTimeout(() => { if (board) board.resize(); }, 100);
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
    if (mins <= 1) return 'elo1';      // Bullet
    if (mins <= 5) return 'elo3';      // Blitz (incluye 3 y 5)
    if (mins <= 30) return 'elo10';    // Rapid (hasta 30m)
    if (mins >= 1440) return 'eloDaily'; // Daily / Correspondence
    return 'elo'; // Standard fallback
};

window.updateElo = function (oppElo, result, isPuzzle = false) {
    if (!isAuth) return;

    let type = 'elo';
    let currentRating = userElo;

    if (isPuzzle) {
        type = 'puz';
        currentRating = userPuzzleElo;
    } else {
        // Obtener el tiempo de la partida actual para determinar categoría
        let mins = 10; // default
        const activeSelector = (currentMode === 'ai' || currentMode === 'maestro') ? '#maestro-time-sel' : '#online-time-sel-lobby';
        mins = parseInt($(activeSelector).val()) || 10;

        type = getEloTypeFromTime(mins);

        if (type === 'elo1') currentRating = userEloBullet;
        else if (type === 'elo3') currentRating = userEloBlitz;
        else if (type === 'eloDaily') currentRating = userEloDaily;
        else if (type === 'elo10') currentRating = userEloRapid;
        else currentRating = userElo;
    }

    const K = 32;
    const expected = 1 / (1 + Math.pow(10, (oppElo - currentRating) / 400));
    const newElo = Math.round(currentRating + K * (result - expected));

    // Actualizar localmente y persistir
    if (type === 'puz') {
        userPuzzleElo = newElo;
        localStorage.setItem('chess_puz_elo', newElo);
    } else {
        if (type === 'elo1') { userEloBullet = newElo; localStorage.setItem('chess_elo_1', newElo); }
        else if (type === 'elo3') { userEloBlitz = newElo; localStorage.setItem('chess_elo_3', newElo); }
        else if (type === 'eloDaily') { userEloDaily = newElo; localStorage.setItem('chess_elo_daily', newElo); }
        else if (type === 'elo10') { userEloRapid = newElo; localStorage.setItem('chess_elo_10', newElo); }
        else { userElo = newElo; localStorage.setItem('chess_user_elo', newElo); }
    }

    // Informar al servidor
    if (socket) {
        socket.emit('update_elo', {
            user: userName,
            elo: newElo,
            type: type
        });
    }

    updateAuthUI();

    // Feedback visual en el panel del coach
    const catName = type === 'puz' ? 'Puzzle' : (type === 'elo1' ? 'Bullet' : (type === 'elo3' ? 'Blitz' : (type === 'elo10' ? 'Rapid' : (type === 'eloDaily' ? 'Daily' : 'ELO'))));
    $('#coach-txt').append(`<div style="margin-top:10px; padding:5px; background:rgba(34,197,94,0.1); border-radius:5px; border-left:3px solid #22c55e;">
        <b style="color:#22c55e">NUEVO ELO ${catName}: ${newElo}</b> 
        <span style="font-size:0.7rem; color:var(--text-muted)">(${result === 1 ? '+' + (newElo - currentRating) : (newElo - currentRating)})</span>
    </div>`);
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
        $('#coach-txt').html("<b>Modo Maestro Activo.</b><br>Juega contra la IA y recibe consejos en tiempo real.");
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
    stockfish.postMessage('go depth 14');
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
function drawBestMoveArrow(move) {
    const canvas = document.getElementById('arrowCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    return; // Desactivado por petición del usuario
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
        stockfish.postMessage('go depth 14');

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
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; margin-top:5px;">
                <span style="color:#ef4444">Bullet: ${userEloBullet}</span>
                <span style="color:#f59e0b">Blitz: ${userEloBlitz}</span>
                <span style="color:var(--accent)">Rapid: ${userEloRapid}</span>
                <span style="color:#a78bfa">Daily: ${userEloDaily}</span>
            </div>
            <div style="margin-top:5px; color:#3b82f6">Puzzles: ${userPuzzleElo}</div>
        `);

        $('#btn-delete-account, #auth-delete-area').show();
        $('#guest-access-section').hide();
    } else {
        $('#btn-auth-trigger').show();
        $('#btn-auth-drawer').show();
        $('#btn-logout-drawer').hide();
        $('#btn-delete-account, #auth-delete-area').hide();

        $('#drawer-user-name').text("Invitado");
        $('#my-name-display').text("Invitado");
        $('#guest-access-section').show();
    }
};
updateAuthUI();

$('.mode-pill').on('click', function () {
    const mode = $(this).data('mode');
    if (mode === 'ai') $('#opp-name').text('Stockfish');
    else if (mode === 'local') $('#opp-name').text('Oponente Online');
    else $('#opp-name').text('Oponente');
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
    userEloBullet = data.elo1 || 500;
    userEloBlitz = data.elo3 || 500;
    userEloRapid = data.elo10 || 500;
    userEloDaily = data.eloDaily || 500;
    userPuzzleElo = data.puzElo;
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
socket.on('game_start', (data) => {
    console.log("🎮 Game started:", data);
    gameId = data.gameId;
    myColor = data.white === userName ? 'w' : 'b';

    game.reset();
    board.position('start');
    board.orientation(myColor === 'w' ? 'white' : 'black');

    whiteTime = data.time * 60;
    blackTime = whiteTime;

    $('#my-timer').text(formatTime(myColor === 'w' ? whiteTime : blackTime));
    $('#opp-timer').text(formatTime(myColor === 'w' ? blackTime : whiteTime));

    setMode('local');
    startClock();
    showToast("¡Partida iniciada!", "⚔️");
});

socket.on('opponent_joined', (data) => {
    console.log("👥 Opponent joined:", data);
    gameId = data.gameId;
    myColor = data.white === userName ? 'w' : 'b';

    board.orientation(myColor === 'w' ? 'white' : 'black');

    whiteTime = data.time * 60;
    blackTime = whiteTime;

    $('#my-timer').text(formatTime(myColor === 'w' ? whiteTime : blackTime));
    $('#opp-timer').text(formatTime(myColor === 'w' ? blackTime : whiteTime));

    if (data.fen && data.fen !== 'start') {
        game.load(data.fen);
        board.position(data.fen);
    }

    startClock();
    showToast("Oponente conectado", "👥");
});

socket.on('move', (data) => {
    console.log("♟️ Move received:", data);
    game.move(data.move);
    board.position(game.fen());

    whiteTime = data.whiteTime;
    blackTime = data.blackTime;

    $('#my-timer').text(formatTime(myColor === 'w' ? whiteTime : blackTime));
    $('#opp-timer').text(formatTime(myColor === 'w' ? blackTime : whiteTime));

    updateUI(true);
    checkGameOver();
});

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

$('#opening-sel, #opening-sel-main, #ai-opening-practice, #maestro-opening-sel, #opening-sel-universal').append(opHtml);

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

    // Actualizar todos los botones de pistas posibles
    $('#btn-ai-hint, #btn-suggest-move, #btn-toggle-hints-study, #btn-hint-main, #btn-hint-mobile-bar').text(txt).toggleClass('active', hintsActive);

    if (hintsActive) {
        if (!window.currentEval) $('#coach-txt').text("Analizando posición...");
        if (stockfish) {
            updateUI(false); // No, don't move, just analyze
            // Actually updateUI triggers analysis. But updateUI(true) triggers sounds and stuff.
            // We need a way to just trigger analysis.
            // But updateUI call stockfish go.

            // Let's just force a re-analysis
            stockfish.postMessage('stop');
            stockfish.postMessage('position fen ' + game.fen());
            stockfish.postMessage('go depth 15');
        }
    } else {
        $('.square-55d63').removeClass('highlight-hint');
        $('#best-move-display').hide();
        drawBestMoveArrow(null); // Clear arrow

        // Solo restaurar texto si no estamos en un modo que genera comentarios automáticos
        if (!analysisActive && currentMode !== 'ai' && currentMode !== 'maestro' && currentMode !== 'study') {
            $('#coach-txt').text("Bienvenido. Juega una partida o analiza una posición para recibir mis consejos.");
        }
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
    console.log("Showing submenu:", id);
    $('.menu-step').removeClass('active');

    // Si el id ya tiene 'menu-', usarlo tal cual, si no, prepender 'menu-'
    const finalId = id.startsWith('menu-') ? id : 'menu-' + id;
    $('#' + finalId).addClass('active');

    if (addToHistory) {
        history.pushState({ view: 'menu', id: id }, '', '#' + id);
    }

    if (id === 'root' || id === 'menu-root') {
        exitGameView();
    }

    if (id === 'lobby') {
        if (socket && isAuth) {
            socket.emit('get_lobby');
            socket.emit('get_my_games');
        }
    }
};

window.exitGameView = function () {
    console.log("Exiting game view, returning to menu...");
    $('body').removeClass('board-active');
    $('.game-sidebar-controls').hide();
    $('#master-coach-panel').hide();
    $('#analysis-report-container').hide();
    $('#study-extra-controls').hide();
    $('.tab-content').removeClass('active');

    // Asegurar que el contenedor del menú principal se vea
    $('#main-menu-container').fadeIn();

    if (board) {
        board.resize();
        board.start();
    }
    game.reset();
    aiPracticeLine = null;
    studyMoves = null;
};

window.setMode = function (mode, addToHistory = true) {
    currentMode = mode;

    if (addToHistory) {
        history.pushState({ view: 'game', mode: mode }, '', '#game-' + mode);
    }

    // Mostrar/Ocultar controles extra de estudio (ahora también en modo AI)
    if (mode === 'study' || mode === 'maestro' || mode === 'ai') {
        $('#study-extra-controls').css('display', 'flex');
    } else {
        $('#study-extra-controls').hide();
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
    $('.game-sidebar-controls').fadeIn().css('display', 'flex');
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
        $('#opp-name').text('Estudio Teórico');
    }

    // Gestionar visibilidad de tiempos (Ocultar en modo estudio)
    if (mode === 'study') {
        $('#my-timer, #opp-timer').fadeOut();
    } else {
        $('#my-timer, #opp-timer').fadeIn();
    }

    if (mode === 'ai' || mode === 'study' || mode === 'exercises' || mode === 'maestro') {
        $('#master-coach-panel, #current-moves-sidebar').css('display', 'flex').hide().fadeIn();
        $('#btn-hint-main').css('display', 'flex').fadeIn();
        $('#btn-hint-mobile-bar').show();

        // Auto-activar modo automático si entramos en AI o Maestro
        if (mode === 'ai' || mode === 'maestro') {
            opponentAutoMode = true;
            syncOpponentModeUI();
        }

        if (mode === 'study' || mode === 'maestro') {
            hintsActive = true;
            $('#btn-hint-main, #btn-ai-hint, #btn-toggle-hints-study, #btn-hint-mobile-bar').addClass('active').text("💡 PISTAS: ON");
        }
    } else {
        $('#master-coach-panel').hide();
        $('#btn-hint-main').hide();
        $('#btn-hint-mobile-bar').hide();
    }

    // Ensure analysis starts immediately
    setTimeout(() => {
        isJ = true;
        if (stockfish) {
            stockfish.postMessage('stop');
            stockfish.postMessage('position fen ' + game.fen());
            stockfish.postMessage('go depth 15');
        }
    }, 300);

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

    // Ensure board is CLEAN (no spare pieces) after being in editor
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
    const color = $('#maestro-color-sel').val();
    const mins = parseInt($('#maestro-time-sel').val());

    // Set myColor
    myColor = color === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : color;

    const diff = parseInt($('#maestro-diff-sel').val() || 15);
    $('#diff-sel').val(diff);

    // Config board and game
    game.reset();
    board.orientation(myColor === 'w' ? 'white' : 'black');
    board.start();
    gameStarted = false;

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
    }

    if (myColor === 'b') {
        setTimeout(makeAIMove, 600);
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
    var val = $('#opening-sel-main').val();
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
    var val = $('#opening-sel-main').val();
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
    const $practiceContainer = $('#ai-opening-practice').closest('div');
    $practiceContainer.hide(); // Ocultar el selector problemático

    // Crear un display estático que muestre la configuración bloqueada
    const colorText = sideChoice === 'w' ? '⚪ BLANCAS' : sideChoice === 'b' ? '⚫ NEGRAS' : '🎲 AUTO';
    const $lockedDisplay = $('<div id="locked-training-display" style="background:linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2)); padding:15px; border-radius:10px; margin-bottom:15px; border:2px solid rgba(139, 92, 246, 0.5);">' +
        '<div style="font-size:0.65rem; color:rgba(255,255,255,0.7); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">🔒 ENTRENAMIENTO ACTIVO</div>' +
        '<div style="font-size:0.9rem; font-weight:800; color:#a78bfa; margin-bottom:5px;">📖 ' + currentOpeningName + '</div>' +
        '<div style="font-size:0.7rem; color:rgba(255,255,255,0.8);">Color: <strong>' + colorText + '</strong></div>' +
        '<div style="font-size:0.65rem; color:rgba(255,255,255,0.6); margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.1);">Para cambiar la apertura, vuelve al menú principal</div>' +
        '</div>');

    // Insertar antes del contenedor oculto
    $practiceContainer.before($lockedDisplay);

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
    var val = $('#opening-sel-main').val();
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

// La función showSubMenu y exitGameView duplicada ha sido eliminada. Se usan las de arriba.

window.syncOpponentModeUI = function () {
    const $dot = $('#opp-mode-dot');
    const $btn = $('#opp-move-toggle');
    const $label = $('#opp-mode-label');
    if (!$dot.length) return;

    if (opponentAutoMode) {
        $dot.css('left', 'calc(100% - 20px)');
        $btn.css('background', 'var(--accent)');
        $label.text('IA');
    } else {
        $dot.css('left', '2px');
        $btn.css('background', '#475569');
        $label.text('MANUAL');
    }
};

window.toggleOpponentAutoMode = function () {
    opponentAutoMode = !opponentAutoMode;
    syncOpponentModeUI();

    if (opponentAutoMode) {
        showToast("El rival ahora moverá automáticamente", "🤖");
        // Si es el turno de la IA, que mueva ya
        if (game.turn() !== myColor) {
            console.log("🤖 Triggering AI move from toggle");
            setTimeout(makeAIMove, 300);
        }
    } else {
        showToast("Mueve tú mismo por el rival", "👤");
    }
};

window.resetGamePosition = function () {
    if (confirm("¿Reiniciar tablero a la posición inicial?")) {
        game.reset();
        board.start();
        historyPositions = ['start'];
        currentHistoryIndex = 0;
        updateUI();
        showToast("Tablero reseteado", "🧹");
    }
};

window.goBackToMenu = () => {
    exitGameView();
    showSubMenu('root');
};

// HISTORY LISTENER (Browser Back Button)
window.onpopstate = function (event) {
    if (event.state) {
        if (event.state.view === 'menu') {
            exitGameView();
            showSubMenu(event.state.id, false);
        } else if (event.state.view === 'game') {
            setMode(event.state.mode, false);
        }
    } else {
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

// --- APERTURAS: TEORIA, ENTRENAMIENTO, EJERCICIOS ---
let currentOpeningSubMode = 'theory';

window.showOpeningLibrary = function (mode) {
    currentOpeningSubMode = mode;
    showSubMenu('menu-apertura-selector');

    // Configurar UI del selector
    const labels = {
        theory: "📖 MODO TEORÍA: APRENDE LAS LÍNEAS",
        training: "⚔️ ENTRENAMIENTO: JUEGA CONTRA IA",
        exercises: "🧩 EJERCICIOS: TÁCTICA DE APERTURA"
    };
    $('#ap-sel-label').text(labels[mode]);

    if (mode === 'training') {
        $('#training-color-choice').show();
    } else {
        $('#training-color-choice').hide();
    }
};

// Manejo de botones de color en el selector
$(document).on('click', '.color-btn', function () {
    $('.color-btn').removeClass('active');
    $(this).addClass('active');
});

window.startOpeningModeFromSelector = function () {
    const val = $('#opening-sel-universal').val();
    if (!val) return alert("Selecciona una apertura.");

    const [gIdx, iIdx] = val.split('-');
    const opening = ACTIVE_OPENINGS[gIdx].items[iIdx];

    if (currentOpeningSubMode === 'theory') {
        // Modo Teoría: Cargar y pasar a estudio
        game.reset();
        board.start();
        studyMoves = opening.moves || opening.m;
        studyIndex = 0;
        currentOpeningName = opening.name;
        currentOpeningComments = opening.comments || [];

        setMode('study');

        $('#coach-txt').html(`
            <div style="font-size:1rem; font-weight:700; color:var(--accent); margin-bottom:8px;">${opening.name}</div>
            <div style="font-size:0.85rem; line-height:1.5;">Usa las flechas (▶) para explorar la teoría. Te iré explicando cada jugada según avancemos.</div>
        `);
        showToast("Estudiando teoría", "📖");

    } else if (currentOpeningSubMode === 'training') {
        // Modo Entrenamiento: Configurar IA y color
        const color = $('.color-btn.active').data('color') === 'white' ? 'w' : 'b';
        myColor = color;

        aiPracticeLine = opening.moves || opening.m;
        aiPracticeIndex = 0;
        currentOpeningName = opening.name;
        currentOpeningComments = opening.comments || [];

        game.reset();
        board.orientation(color === 'w' ? 'white' : 'black');
        board.start();

        setMode('maestro');

        $('#opp-name').text('Entrenamiento: ' + opening.name);
        $('#coach-txt').html(`
            <div style="font-size:0.9rem; font-weight:700; color:var(--accent); margin-bottom:10px;">CONFIGURACIÓN COMPLETADA</div>
            <div style="font-size:0.85rem; line-height:1.5;">Estamos entrenando <b>${opening.name}</b>. Yo jugaré por mi bando siguiendo la teoría, ¡intenta recordarla!</div>
        `);

        if (color === 'b') {
            setTimeout(makeAIMove, 600);
        }
        showToast("Entrenamiento iniciado", "⚔️");

    } else if (currentOpeningSubMode === 'exercises') {
        // Modo Ejercicios: Puzzles filtrados
        const mappedTag = OPENING_TAG_MAP[opening.name] || opening.name.replace(/ /g, '_');
        drillCategory = mappedTag;
        setMode('exercises');
        loadRandomPuzzle(0, mappedTag);
        showToast("Retos de: " + opening.name, "🧩");
    }

    // Ya no llamamos a exitGameView() aquí porque queremos quedarnos en la partida.
    // setMode ya ocultó el menú principal.
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
// --- DARSE DE BAJA ---
window.confirmDeleteAccount = async function () {
    if (confirm("🚨 ¿ESTÁS SEGURO? Esta acción es IRREVERSIBLE y borrará todos tus datos, partidas y ELO de forma permanente.")) {
        const pass = prompt("Por favor, confirma tu contraseña para proceder con la baja:");
        if (pass) {
            // Usar la función de hash disponible en client_optimized.js
            const hashed = (typeof hashPassword === 'function') ? await hashPassword(pass) : pass;
            socket.emit('delete_account', { pass: hashed });
        }
    }
};

socket.on('account_deleted', (data) => {
    alert(data.message);
    localStorage.clear();
    location.reload();
});

socket.on('auth_error', (data) => {
    if (data.message.includes('borrar')) {
        alert(data.message);
    }
});

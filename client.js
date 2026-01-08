const OPENINGS_DATA = [
    {
        group: "Juegos Abiertos (1.e4 e5)", items: [
            { name: "Apertura Española (Ruy Lopez)", m: ["e4", "e5", "Nf3", "Nc6", "Bb5"] },
            { name: "Apertura Italiana", m: ["e4", "e5", "Nf3", "Nc6", "Bc4"] },
            { name: "Defensa De los Dos Caballos", m: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"] },
            { name: "Apertura Escocesa", m: ["e4", "e5", "Nf3", "Nc6", "d4"] },
            { name: "Gambito de Rey", m: ["e4", "e5", "f4"] },
            { name: "Defensa Philidor", m: ["e4", "e5", "Nf3", "d6"] },
            { name: "Defensa Petrov", m: ["e4", "e5", "Nf3", "Nf6"] }
        ]
    },
    {
        group: "Juegos Semi-Abiertos (1.e4 Otros)", items: [
            { name: "Defensa Siciliana", m: ["e4", "c5"] },
            { name: "Siciliana Najdorf", m: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"] },
            { name: "Siciliana Dragón", m: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"] },
            { name: "Defensa Francesa", m: ["e4", "e6"] },
            { name: "Defensa Caro-Kann", m: ["e4", "c6"] },
            { name: "Defensa Escandinava", m: ["e4", "d5"] },
            { name: "Defensa Pirc", m: ["e4", "d6", "d4", "Nf6", "Nc3", "g6"] },
            { name: "Defensa Alekhine", m: ["e4", "Nf6"] }
        ]
    },
    {
        group: "Juegos Cerrados (1.d4 d5)", items: [
            { name: "Gambito de Dama", m: ["d4", "d5", "c4"] },
            { name: "Gambito de Dama Aceptado", m: ["d4", "d5", "c4", "dxc4"] },
            { name: "Gambito de Dama Rehusado", m: ["d4", "d5", "c4", "e6"] },
            { name: "Defensa Eslava", m: ["d4", "d5", "c4", "c6"] },
            { name: "Sistema Londres", m: ["d4", "d5", "Bf4"] }
        ]
    },
    {
        group: "Defensas Indias (1.d4 Nf6)", items: [
            { name: "India de Rey", m: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6"] },
            { name: "India de Dama", m: ["d4", "Nf6", "c4", "e6", "Nf3", "b6"] },
            { name: "Defensa Nimzo-India", m: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"] },
            { name: "Defensa Grunfeld", m: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"] }
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
var stockfish = null;
var myColor = 'w';

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

    OPENINGS_DATA.forEach(group => {
        group.items.forEach(item => {
            const entryStr = item.m.join(' ');
            if (movesStr.startsWith(entryStr)) {
                if (item.m.length > foundMoveCount) {
                    foundName = item.name;
                    foundMoveCount = item.m.length;
                }
            }
        });
    });

    return { name: foundName, moveCount: foundMoveCount };
}

function getQualityMsg(diff, isMate, isBookMove = false) {
    const t = LANGS[currentLang];
    if (isBookMove) return { text: "📖 " + (t.book || "Teoría / Libro"), class: 'quality-book', symbol: '📖' };
    if (isMate) return { text: "!! " + t.mate, class: 'quality-excellent', symbol: '!!' };
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
    alert(`¡TIEMPO AGOTADO! Ganan las ${winner}`);
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

    $('#coach-txt').append(`<br><b style="color:var(--accent)">${isPuzzle ? 'Puzzle ELO' : 'ELO'}: ${newElo}</b>`);
}

var solvedPuzzles = JSON.parse(localStorage.getItem('chess_solved_puzzles') || '[]');


// Initial Load or Fallback
var localPuzzles = (typeof LOCAL_PUZZLES_DB !== 'undefined') ? LOCAL_PUZZLES_DB : [];

async function loadRandomPuzzle(retryCount = 0) {
    const cat = $('#puz-cat-sel').val();
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
        $('#puz-desc').html("<b style='color:#ef4444'>❌ Error:</b> No se pudieron cargar puzzles. Revisa tu conexión.");
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
                if (cat !== 'all') {
                    const match = candidates.filter(x => (x.Themes || "").toLowerCase().includes(cat.toLowerCase()));
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
    console.log("♟️ Iniciando Stockfish...");
    stockfish = new Worker('stockfish.js');
    stockfish.postMessage('uci');

    stockfish.onmessage = (e) => {
        var l = e.data;
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

            var pv = l.match(/ pv ([a-h0-9]{4})/);
            if (pv && pv[1]) {
                if (hintsActive || analysisActive) {
                    $('#best-move-display').html("💡 Sugerencia: <b style='color:white'>" + pv[1] + "</b>").show();
                    drawBestMoveArrow(pv[1]);
                    $('.square-55d63').removeClass('highlight-hint');
                    $('[data-square="' + pv[1].substring(0, 2) + '"]').addClass('highlight-hint');
                    $('[data-square="' + pv[1].substring(2, 4) + '"]').addClass('highlight-hint');
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
                        // For the side that just moved:
                        if (gameTurn === 'w') { // Black just moved
                            diffVal = currE - prevE;
                        } else { // White just moved
                            diffVal = prevE - currE;
                        }
                    }

                    const evalMag = Math.abs(diffVal);
                    const historyStr = game.history().join(' ');
                    const isBook = isBookMove(lastMove ? lastMove.san : '');
                    var q = getQualityMsg(evalMag, l.includes('mate'), isBook);
                    var acc = isBook ? 100 : Math.max(0, Math.min(100, 100 - (evalMag * 20)));

                    let explanation = '';
                    let tacticalInfo = '';
                    const isOpening = fullHistory.length <= 15;
                    const isEndgame = game.board().flat().filter(p => p && p.type !== 'p').length <= 8;

                    function getStrategicAdvice() {
                        if (isOpening) return "🎯 Desarrolla tus piezas menores y controla el centro.";
                        if (isEndgame) return "👑 Activa tu rey y busca promocionar peones.";
                        return "🧩 Busca debilidades tácticas o mejora la posición de tu peor pieza.";
                    }

                    let openingName = '';
                    if (isOpening && fullHistory.length >= 2) {
                        const detected = detectOpening();
                        if (detected.name) openingName = '🎯 ' + detected.name;
                    }

                    if (isBook) {
                        explanation = `<div style="color:var(--accent); font-weight:bold;">📖 JUGADA DE TEORÍA:</div> Siguiendo las líneas maestras de la apertura ${openingName || ''}.`;
                        $('#book-move-indicator').fadeIn();
                    } else {
                        $('#book-move-indicator').fadeOut();
                        if (diffVal > 2.0) {
                            explanation = `<div style="color:#ef4444; font-weight:bold;">💥 ERROR GRAVE:</div> Perdiste mucha ventaja. ${lastMove && lastMove.captured ? 'Entregaste material.' : 'Debilitaste gravemente tu posición.'}`;
                        } else if (diffVal > 0.8) {
                            explanation = `<div style="color:#f59e0b; font-weight:bold;">⚠️ IMPRECISIÓN:</div> Hay una jugada mejor. ${isOpening ? 'Cada tiempo cuenta en la apertura.' : 'Estás descuidando la seguridad de tu posición.'}`;
                        } else if (diffVal < -0.5) {
                            explanation = `<div style="color:#22c55e; font-weight:bold;">✨ ¡EXCELENTE!:</div> Has encontrado una jugada muy fuerte.`;
                        } else {
                            explanation = `<div style="color:var(--text-muted);">${getStrategicAdvice()}</div>`;
                        }
                    }

                    if (lastMove) {
                        if (game.in_check()) tacticalInfo += '⚔️ ¡Jaque! ';
                        if (lastMove.captured) tacticalInfo += `📍 Captura de ${lastMove.captured.toUpperCase()}. `;
                    }

                    let moveQuality = `<div class="${q.class}" style="font-size:1.1rem; margin-bottom:5px;">${q.text}</div>`;
                    let precisionMsg = `<div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:5px;">Precisión: ${acc.toFixed(0)}%</div>`;
                    let openingMsg = openingName ? `<div style="color:#8b5cf6; font-size:0.75rem; margin-bottom:5px; font-weight:bold;">${openingName}</div>` : '';

                    $('#coach-txt').html(`
                        ${moveQuality}
                        <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:5px;">Evaluación: ${ev > 0 ? '+' : ''}${ev.toFixed(1)}</div>
                        ${precisionMsg}
                        ${openingMsg}
                        <div style="font-size:0.75rem; line-height:1.4; color:var(--text-main); margin-top:8px; background:rgba(255,255,255,0.03); padding:10px; border-radius:8px; border-left:3px solid var(--accent);">${explanation}</div>
                        <div style="font-size:0.7rem; color:#3b82f6; margin-top:8px; font-weight:600;">${tacticalInfo}</div>
                        ${hintsActive ? `<div style="margin-top:10px; padding:10px; background:rgba(34,197,94,0.1); border-radius:6px; border:1px dashed var(--accent); font-size:0.75rem;">💡 Sugerencia: <b style="color:var(--accent); font-size:0.9rem;">${pv[1]}</b></div>` : ''}
                    `);
                    isJ = false;
                }
            }
            window.currentEval = ev;
        }

        if (l.startsWith('bestmove') && currentMode === 'ai' && game.turn() !== myColor) {
            var bestMove = l.split(' ')[1];
            const diffLvl = parseInt($('#diff-sel').val());
            let blunderChance = 0;
            if (diffLvl === 1) blunderChance = 0.5;
            else if (diffLvl === 3) blunderChance = 0.35;
            else if (diffLvl === 5) blunderChance = 0.20;

            if (Math.random() < blunderChance) {
                const legalMoves = game.moves({ verbose: true });
                if (legalMoves.length > 0) {
                    const randomM = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                    bestMove = randomM.from + randomM.to + (randomM.promotion || '');
                }
            }

            game.move({ from: bestMove.substring(0, 2), to: bestMove.substring(2, 4), promotion: 'q' });
            board.position(game.fen());
            updateUI(true);
            checkGameOver();
        }
    };
} catch (e) {
    console.error("❌ Error cargando Stockfish:", e);
}

function makeAIMove() {
    if (game.game_over()) return;

    // Opening Practice Logic
    if (aiPracticeLine && aiPracticeIndex < aiPracticeLine.length) {
        // If it's AI turn, find the move in the practice line
        const sideThatMoves = game.turn();

        // We only force the move if it's the AI's turn color
        if (sideThatMoves !== myColor) {
            let moveToPlay = aiPracticeLine[aiPracticeIndex];

            // Check if the current board state matches the practice line
            // If the user deviated, we stop the practice line
            const currentHistory = game.history();
            const matchingSoFar = aiPracticeLine.slice(0, aiPracticeIndex).every((m, i) => m === currentHistory[i]);

            if (matchingSoFar) {
                setTimeout(() => {
                    game.move(moveToPlay);
                    board.position(game.fen());
                    aiPracticeIndex++;
                    updateUI(true);
                    checkGameOver();

                    // If next move is also AI (shouldn't happen in 1v1), recurse
                    // But usually now it's player's turn, so we just wait.
                }, 800);
                return;
            } else {
                aiPracticeLine = null; // Deviated, switch to engine
            }
        }
    }

    // Engine Logic
    if (stockfish) {
        const diff = parseInt($('#diff-sel').val());
        stockfish.postMessage('stop');
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

        if (currentMode === 'ai') {
            updateElo(getAiElo(), result);
        } else if (currentMode === 'local') {
            updateElo(800, result);
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

        if (stockfish && (currentMode === 'ai' || hintsActive || currentMode === 'study')) {
            if (currentMode === 'ai' && game.turn() !== myColor) {
                makeAIMove();
            } else {
                stockfish.postMessage('stop');
                stockfish.postMessage('position fen ' + game.fen());
                stockfish.postMessage('go depth 15');
            }
        }
    } else {
        // Even if not moved, if we are in study mode and just entered, start analysis
        if (currentMode === 'study' || currentMode === 'ai') {
            stockfish.postMessage('stop');
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
    if (currentMode === 'local' || currentMode === 'ai') {
        const piece = game.get(source);
        if (!piece) return 'snapback';

        // En modo online, solo puedes mover tus piezas
        if (currentMode === 'local' && piece.color !== myColor) {
            return 'snapback';
        }

        // En modo AI, solo puedes mover cuando es tu turno
        if (currentMode === 'ai' && game.turn() !== myColor) {
            return 'snapback';
        }
    }

    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

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

$(document).ready(() => {
    board = Chessboard('myBoard', {
        draggable: true,
        position: 'start',
        pieceTheme: getPieceTheme,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    });

    // Theme Handlers
    $('#board-theme-sel').change(function () {
        const theme = $(this).val();
        localStorage.setItem('chess_board_theme', theme);
        let colors = { light: '#f0d9b5', dark: '#b58863' };
        if (theme === 'wood') colors = { light: '#eec', dark: '#8b4513' };
        if (theme === 'neon') colors = { light: '#1e293b', dark: '#0f172a' };
        if (theme === 'forest') colors = { light: '#acc', dark: '#2e8b57' };

        $('.white-1e1d7').css('background', colors.light);
        $('.black-3c85d').css('background', colors.dark);
    });

    $('#piece-theme-sel').change(function () {
        const theme = $(this).val();
        localStorage.setItem('chess_piece_theme', theme);
        const currentPos = board.position();
        const orientation = board.orientation();

        board = Chessboard('myBoard', {
            draggable: true,
            position: currentPos,
            orientation: orientation,
            pieceTheme: getPieceTheme,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd
        });
        $('#board-theme-sel').trigger('change');
        $(window).resize(board.resize);
        playSnd('move');
    });

    // Re-bind click for mobile squares
    $(document).on('mousedown touchstart', '.square-55d63', function () {
        onSquareClick($(this).data('square'));
    });

    // Init values
    const savedPieceTheme = localStorage.getItem('chess_piece_theme') || 'wikipedia';
    const savedBoardTheme = localStorage.getItem('chess_board_theme') || 'classic';
    $('#piece-theme-sel').val(savedPieceTheme);
    $('#board-theme-sel').val(savedBoardTheme).trigger('change');
    if (savedPieceTheme !== 'wikipedia') $('#piece-theme-sel').trigger('change');
    if (savedPieceTheme !== 'wikipedia') $('#piece-theme-sel').trigger('change');

    // --- MOVED LISTENERS INSIDE READY ---
    $('.tab-btn').click(function () {
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        const tab = $(this).data('tab');
        $('.tab-content').removeClass('active');
        $('#' + tab).addClass('active');

        if (tab === 'tab-ranking') {
            if (socket && socket.connected) socket.emit('get_leaderboard');
        }
        if (tab === 'tab-history') {
            renderHistory();
        }
    });

    $('.mode-pill').click(function () {
        $('.mode-pill').removeClass('active'); $(this).addClass('active');
        currentMode = $(this).data('mode');
        $('.mode-section').removeClass('active');
        $('#sec-' + currentMode).addClass('active');
        stopClock();
        gameStarted = false;

        if (currentMode === 'exercises') {
            loadRandomPuzzle();
        } else {
            game.reset(); board.start(); updateUI();
            historyPositions = ['start']; currentHistoryIndex = 0;
            resetTimers();
        }
    });

    $('.time-btn').click(function () {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
        resetTimers();
    });

    // Nav Handlers
    $('#btn-nav-first').click(() => navigateHistory('first'));
    $('#btn-nav-prev').click(() => navigateHistory('prev'));
    $('#btn-nav-next').click(() => navigateHistory('next'));
    $('#btn-nav-last').click(() => navigateHistory('last'));

    // Online / Local Logic
    $('#btn-create').click(function () {
        window.createOnlineChallenge(true); // true means from sidebar
    });

    // Flip Board Handler
    $('#btn-flip, #btn-flip-mobile, #btn-flip-board, #btn-flip-small').off('click').on('click', function () {
        if (typeof board !== 'undefined' && board.flip) {
            board.flip();
            showToast("Tablero girado", "🔄");
        }
    });

    // Resign and Abort Handlers
    $('#btn-resign-game').off('click').on('click', function () {
        resignGame();
    });

    $('#btn-abort-game').off('click').on('click', function () {
        abortGame();
    });

    // Side Drawer
    $('#hamburger-menu').off('click').click(() => { $('#side-drawer').addClass('open'); $('#side-drawer-overlay').fadeIn(); });
    $('#side-drawer-overlay').off('click').click(() => { $('#side-drawer').removeClass('open'); $('#side-drawer-overlay').fadeOut(); });

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
    if (games.length === 0) {
        list.html('<div style="font-size:0.65rem; color:var(--text-muted); text-align:center; padding:10px;">No tienes partidas activas.</div>');
    } else {
        games.forEach(g => {
            const opp = g.white === userName ? g.black : g.white;
            const isMyTurn = (g.turn === 'w' && g.white === userName) || (g.turn === 'b' && g.black === userName);
            const turnLabel = isMyTurn ? '<b style="color:var(--accent)">TU TURNO</b>' : '<span style="opacity:0.6">Oponente</span>';

            const html = `
                            <div class="active-game-item" 
                                 style="padding:10px; background:rgba(255,255,255,0.04); border-radius:10px; margin-bottom:8px; font-size:12px; border:1px solid ${isMyTurn ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}; display:flex; justify-content:space-between; align-items:center;">
                                <div onclick="resumeGame('${g.id}', '${opp}', '${g.fen}', '${g.white === userName ? 'w' : 'b'}', ${g.whiteTime}, ${g.blackTime})" style="flex:1; cursor:pointer;">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <div style="display:flex; flex-direction:column;">
                                            <span style="font-weight:700;">🆚 ${opp}</span>
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

// Request active games every 10 seconds or when switching to local
setInterval(() => {
    if (isAuth && currentMode === 'local') socket.emit('get_my_games');
}, 5000);

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

socket.on('game_start', function (data) {
    gameId = data.gameId;
    myColor = (data.white === userName) ? 'w' : 'b';
    board.orientation(myColor === 'w' ? 'white' : 'black');
    board.start();
    game.reset();

    var oppName = (myColor === 'w') ? data.black : data.white;
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
    $('#opp-name').text(oppName);
    gameStarted = true;

    updateUI();
});

window.loadGame = function (id) {
    if (id === gameId) return;
    if (socket) socket.emit('join_game', { gameId: id });
    showToast("Cambiando de partida...", "🔄");
};

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
    const color = $('#ai-color-sel').val();
    myColor = color === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : color;

    game.reset();
    board.orientation(myColor === 'w' ? 'white' : 'black');
    board.start();

    gameStarted = false;
    $('#opp-name').text('Stockfish ' + $('#diff-sel option:selected').text());

    // Check for specific opening practice
    const practiceVal = $('#ai-opening-practice').val();
    if (practiceVal) {
        const [gIdx, iIdx] = practiceVal.split('-');
        aiPracticeLine = OPENINGS_DATA[gIdx].items[iIdx].m;
        aiPracticeIndex = 0;
        showToast("Práctica de apertura: " + OPENINGS_DATA[gIdx].items[iIdx].name, "📖");
    } else {
        aiPracticeLine = null;
    }

    currentMode = 'ai';
    updateUI();
    resetTimers();

    if (myColor === 'b') {
        setTimeout(makeAIMove, 600);
    }
});

$('#lang-sel').on('change', function () { setLanguage($(this).val()); });

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
    if (!canvas || !$(canvas).is(':visible')) return;
    const ctx = canvas.getContext('2d');

    // Adjust canvas size to actual pixel size of its element
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!move) return;

    const from = move.substring(0, 2);
    const to = move.substring(2, 4);

    // Helper to get square pixel center
    function getSqPos(sq) {
        const file = sq.charCodeAt(0) - 97; // a=0, b=1...
        const rank = 8 - parseInt(sq[1]);   // 8=0, 7=1...

        // Adjust for board orientation
        const isFlipped = $('.chessboard-63f37').hasClass('orientation-black');
        let f = isFlipped ? (7 - file) : file;
        let r = isFlipped ? (7 - rank) : rank;

        const sqW = canvas.width / 8;
        const sqH = canvas.height / 8;

        return {
            x: f * sqW + sqW / 2,
            y: r * sqH + sqH / 2
        };
    }

    const p1 = getSqPos(from);
    const p2 = getSqPos(to);

    // Draw Arrow
    const headLen = 15;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'; // Accent sky blue
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    // Line part
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Head part
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function isBookMove(moveSan) {
    const history = game.history();
    const currentMovesStr = history.slice(0, -1).join(' ');
    let isBook = false;

    OPENINGS_DATA.forEach(group => {
        group.items.forEach(item => {
            const bookLine = item.m.join(' ');
            if (bookLine.startsWith(currentMovesStr)) {
                // If the current move matches the next move in a known sequence
                const moveIdx = history.length - 1;
                if (item.m[moveIdx] === moveSan || item.m[moveIdx] === (history[moveIdx])) {
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

const updateAuthUI = () => {
    if (localStorage.getItem('chess_is_auth') === 'true') {
        isAuth = true;
        userName = localStorage.getItem('chess_username');
        userElo = parseInt(localStorage.getItem('chess_user_elo')) || 500;
        userPuzzleElo = parseInt(localStorage.getItem('chess_puz_elo')) || 500;

        $('#btn-auth-trigger').text("👤 " + userName);
        $('#my-name-display').text(userName);
        $('#btn-auth-drawer').text("CERRAR SESIÓN").off('click').click(() => {
            localStorage.clear(); location.reload();
        });
        $('#drawer-user-name').text(userName);
        $('#drawer-user-elo, #header-elo').text(userElo + " ELO");
        $('#header-elo-puz, #puz-elo-display').text(userPuzzleElo + "🧩");
    }
};

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
    userElo = data.elo;
    userPuzzleElo = data.puzElo;
    isAuth = true;

    localStorage.setItem('chess_username', userName);
    localStorage.setItem('chess_is_auth', 'true');
    localStorage.setItem('chess_user_elo', userElo);
    localStorage.setItem('chess_puz_elo', userPuzzleElo);
    if (data.token) localStorage.setItem('chess_token', data.token);

    updateAuthUI();
    $('#auth-modal').hide();
    showToast("¡Bienvenido, " + userName + "!", "👋");
});

socket.on('auth_error', (msg) => {
    alert("Error: " + msg);
});

// Socket handlers for online games
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

// Llenar aperturas
OPENINGS_DATA.forEach((group, groupIdx) => {
    let optgroup = `<optgroup label="${group.group}">`;
    group.items.forEach((item, itemIdx) => {
        optgroup += `<option value="${groupIdx}-${itemIdx}">${item.name}</option>`;
    });
    optgroup += `</optgroup>`;
    $('#opening-sel').append(optgroup);
});

var studyMoves = [];
var studyIndex = 0;

$('#opening-sel').change(function () {
    const val = $(this).val();
    if (!val) return;
    const [gIdx, iIdx] = val.split('-');
    const opening = OPENINGS_DATA[gIdx].items[iIdx];

    game.reset();
    board.start();

    studyMoves = opening.m;
    studyIndex = 0;

    $('#study-controls').show();
    $('#btn-study-next').text("⏩ Siguiente Jugada (" + studyMoves.length + ")");
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
    hintsActive = !hintsActive;
    const txt = hintsActive ? "💡 PISTAS: ON" : "💡 ACTIVAR PISTAS";
    $('#btn-ai-hint, #btn-suggest-move').text(txt).toggleClass('active', hintsActive);

    if (hintsActive) {
        $('#coach-txt').text("Analizando posición...");
        if (stockfish) {
            updateUI(true); // Force re-analysis
        }
    } else {
        $('.square-55d63').removeClass('highlight-hint');
        $('#best-move-display').hide();
        if (!analysisActive) $('#coach-txt').text("Bienvenido. Juega una partida o analiza una posición para recibir mis consejos.");
    }
};

// Unbind old handlers and bind new one
$('#btn-suggest-move, #btn-ai-hint, #btn-hint-main, #btn-hint-mobile-bar').off('click').on('click', function () { toggleHints(this); });

$('#btn-flip, #btn-flip-mobile').off('click').on('click', function () {
    board.flip();
    if ($('#mobile-actions-menu').is(':visible')) $('#mobile-actions-menu').fadeOut();
});


// El manejador antiguo de .mode-pill ha sido eliminado porque ahora usamos setMode() y showSubMenu()

$('#btn-hint-main').click(function () {
    toggleHints(this);
});

// NEW MENU LOGIC
window.showSubMenu = function (id) {
    $('.menu-step').removeClass('active');
    $('#menu-' + id).addClass('active');
};

window.setMode = function (mode) {
    currentMode = mode;

    // UI Visual Feedback
    $('.tab-btn').removeClass('active');
    $('.tab-btn[data-tab="tab-play"]').addClass('active');
    $('.tab-content').removeClass('active');
    $('#tab-play').addClass('active');

    // Ocultar COMPLETAMENTE el menú principal cuando estás en partida
    $('#main-menu-container').hide();

    // Activar controles laterales (PC) - SOLO botones de control
    $('#game-sidebar-controls').fadeIn().css('display', 'flex');

    // Mobile transition: Show board
    if (window.innerWidth <= 900) {
        $('body').addClass('board-active');
        setTimeout(function () {
            if (typeof board !== 'undefined' && board.resize) board.resize();
        }, 150);
    }
    $('.mode-section').removeClass('active');
    var targetSec = mode;
    if (mode === 'pass-and-play') targetSec = 'study';
    if (mode === 'exercises') targetSec = 'exercises';
    if (mode === 'local') targetSec = 'local';
    if (mode === 'ai') targetSec = 'ai';
    if (mode === 'study') targetSec = 'study';
    $('#sec-' + targetSec).addClass('active');

    if (mode === 'ai') {
        var isMaestro = (hintsActive === true);
        $('#opp-name').text(isMaestro ? 'Maestro IA' : 'Stockfish');
    } else if (mode === 'local') {
        $('#opp-name').text('Oponente Online');
        // Ocultar el contenedor de crear reto cuando ya estamos en partida
        $('#online-setup-container').slideUp();
    } else if (mode === 'exercises') {
        loadRandomPuzzle();
    } else if (mode === 'pass-and-play') {
        $('#opp-name').text('Oponente Local');
    } else {
        $('#opp-name').text('Oponente (Estudio)');
    }

    if (mode === 'ai' || mode === 'study' || mode === 'exercises') {
        $('#master-coach-panel').css('display', 'flex').hide().fadeIn();
        $('#btn-hint-main').css('display', 'flex').fadeIn();
        $('#btn-hint-mobile-bar').show();

        // Ensure analysis starts immediately in study/ai
        setTimeout(() => {
            isJ = true;
            stockfish.postMessage('stop');
            stockfish.postMessage('position fen ' + game.fen());
            stockfish.postMessage('go depth 15');
        }, 300);

        if (mode === 'study') {
            hintsActive = true;
            $('#btn-hint-main, #btn-ai-hint, #btn-suggest-move').addClass('active').text("💡 PISTAS: ON");
        }
    } else {
        $('#master-coach-panel').hide();
        $('#btn-hint-main').hide();
        $('#btn-hint-mobile-bar').hide();
    }

    resetTimers();
    updateUI(mode === 'study');
};

window.startMaestroMode = function () {
    hintsActive = true;
    setMode('ai');
    showToast("Modo Entrenamiento Activado", "👴");
};

window.startOpeningPractice = function () {
    const val = $('#opening-sel-main').val();
    if (!val) return alert("Selecciona una apertura primero.");

    $('#ai-opening-practice').val(val);
    $('#btn-start-ai').click();
    showToast("Iniciando entrenamiento...", "⚔️");
};

window.createOnlineChallenge = function (fromSidebar) {
    if (!isAuth) { alert("Inicia sesión para jugar online."); return openAuth(); }
    var time = fromSidebar ? $('#local-time-selector .time-btn.active').data('time') : $('#online-time-sel').val();
    var id = Math.random().toString(36).substr(2, 9);
    var info = {
        id: id,
        user: userName,
        elo: userElo,
        time: parseInt(time)
    };
    if (socket) socket.emit('create_challenge', info);
    showToast("Reto lanzado a la sala", "⚔️");
    $('#online-setup-container').slideUp();
    setMode('local');
};

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

// Sync opening selector
$('#opening-sel-main').on('change', function () {
    var val = $(this).val();
    if (!val) return;
    setMode('study'); // Entrar en modo estudio al elegir apertura

    var parts = val.split('-');
    var gIdx = parseInt(parts[0]);
    var iIdx = parseInt(parts[1]);
    var opening = OPENINGS_DATA[gIdx].items[iIdx];

    game.reset();
    board.start();

    studyMoves = opening.m;
    studyIndex = 0;

    $('#study-controls').show();
    $('#btn-study-next').text("⏩ Siguiente Jugada (" + studyMoves.length + ")");
    updateUI();
});

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
$('#puz-cat-sel-main').on('change', function () {
    $('#puz-cat-sel').val($(this).val()).trigger('change');
});

$('#btn-pgn-main').click(() => $('#btn-pgn').click());

// Fill opening selector main & AI Practice selector
if (typeof OPENINGS_DATA !== 'undefined') {
    OPENINGS_DATA.forEach((group, groupIdx) => {
        let optgroup = `<optgroup label="${group.group}">`;
        group.items.forEach((item, itemIdx) => {
            optgroup += `<option value="${groupIdx}-${itemIdx}">${item.name}</option>`;
        });
        optgroup += `</optgroup>`;
        $('#opening-sel-main, #ai-opening-practice').append(optgroup);
    });
}

let aiPracticeLine = null;
let aiPracticeIndex = 0;

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
    $('body').removeClass('board-active');
    $('#game-sidebar-controls').hide();
    $('#master-coach-panel').hide();
    $('#analysis-report-container').hide();
    $('#main-menu-container').show();
    showSubMenu('root');
};

$('#btn-mobile-menu-back').click(function () {
    goBackToMenu();
});

// UI Auth Check for Drawer
if (isAuth) {
    $('#btn-auth-drawer, #btn-auth-trigger').hide();
    $('#btn-logout-drawer').show();
    $('#drawer-user-name').text(userName);
    $('#drawer-user-elo').text("ELO: " + userElo);
}

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

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
    },
    fr: {
        mate: "ECHEC ET MAT", win: "VOUS AVEZ GAGNÉ!", lose: "VOUS AVEZ PERDU", draw: "NULLE",
        resign: "Êtes-vous sûr de vouloir abandonner ?", abort: "Annuler la partie ? Pas de perte d'ELO.",
        guest: "Invité", login: "CONNEXION", logout: "DÉCONNEXION",
        puz_done: "EXCELLENT !", puz_hint: "Analysez bien la position...",
        best_move: "Meilleur coup", level: "Niveau", diff: "Difficulté", theme: "Thèmes",
        brilliant: "BRILLANT !", great: "Superbe !", best: "Meilleur coup",
        good: "Bon", inaccuracy: "Imprécision", mistake: "Erreur", blunder: "GAFFE",
        privacy: "🔒 Vos données sont sécurisées.",
        logout_auth: "SE DÉCONNECTER"
    },
    pt: {
        mate: "XEQUE-MATE", win: "VOCÊ GANHOU!", lose: "VOCÊ PERDEU", draw: "EMPATE",
        resign: "Tem certeza que deseja desistir?", abort: "Abortar jogo? Sem perda de ELO.",
        guest: "Convidado", login: "ENTRAR", logout: "SAIR",
        puz_done: "EXCELENTE!", puz_hint: "Analise bem a posição...",
        best_move: "Melhor lance", level: "Nível", diff: "Dificuldade", theme: "Temas",
        brilliant: "BRILHANTE!", great: "Ótimo!", best: "Melhor lance",
        good: "Bom", inaccuracy: "Imprecisão", mistake: "Erro", blunder: "CAPIVARADA",
        privacy: "🔒 Seus dados estão seguros.",
        logout_auth: "SAIR"
    },
    de: {
        mate: "SCHACHMATT", win: "GEWONNEN!", lose: "VERLOREN", draw: "REMIS",
        resign: "Aufgeben?", abort: "Abbrechen?",
        guest: "Gast", login: "LOGIN", logout: "LOGOUT",
        puz_done: "AUSGEZEICHNET!", puz_hint: "Analysiere die Position...",
        best_move: "Bester Zug", level: "Stufe", diff: "Schwierigkeit", theme: "Themen",
        brilliant: "BRILLANT!", great: "Super!", best: "Bester Zug",
        good: "Gut", inaccuracy: "Ungenauigkeit", mistake: "Fehler", blunder: "PATZER",
        privacy: "🔒 Daten sicher.",
        logout_auth: "ABMELDEN"
    }
};

function getQualityMsg(diff, isMate) {
    if (isMate && diff === 0) return { text: "🏁 MATE", class: "quality-best" };
    if (diff < 0.2) return { text: "🌟 MUY BIEN", class: "quality-best" };
    if (diff < 0.5) return { text: "✅ BIEN", class: "quality-good" };
    if (diff < 1.0) return { text: "⚖️ NORMAL", class: "quality-inaccuracy" };
    if (diff < 2.0) return { text: "❓ MAL", class: "quality-mistake" };
    return { text: "❌ MUY MAL", class: "quality-blunder" };
}

function setLanguage(l) {
    currentLang = l;
    localStorage.setItem('chess_lang', l);
    const t = LANGS[l] || LANGS.en;
    $('#auth-title').text(t.login);
    if (!isAuth) {
        $('#my-name-display').text(t.guest);
        $('#drawer-user-name').text(t.guest);
    }
    $('#lbl-user').text(l === 'es' ? "👤 USUARIO" : (l === 'pt' ? "👤 USUÁRIO" : "👤 USER"));
    $('#lbl-appearance').text(l === 'es' ? "🎨 APARIENCIA" : (l === 'fr' ? "🎨 APPARENCE" : "🎨 APPEARANCE"));
    $('#lbl-board').text(l === 'es' ? "Tablero" : (l === 'fr' ? "Échiquier" : "Board"));
    $('#lbl-pieces').text(l === 'es' ? "Piezas" : (l === 'fr' ? "Pièces" : "Pieces"));
    $('#lbl-lang').text(l === 'es' ? "🌐 IDIOMA" : "🌐 LANGUAGE");
    $('#btn-flip').text(l === 'es' ? "GIRAR TABLERO" : (l === 'fr' ? "TOURNER L'ÉCHIQUIER" : "FLIP BOARD"));
    $('#btn-abort').text(t.abort.split('?')[0] + "?"); // Simple hack
    $('#btn-resign-ai, #btn-resign-local').text(l === 'es' ? "RENDIRSE" : (l === 'fr' ? "ABANDONNER" : "RESIGN"));
    $('#btn-start-ai').text(l === 'es' ? "EMPEZAR PARTIDA" : (l === 'fr' ? "COMMENCER" : "START GAME"));
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
// try {
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
            if (hintsActive) {
                $('#best-move-display').html("💡 Sugerencia: <b style='color:white'>" + pv[1] + "</b>").show();
                $('.square-55d63').removeClass('highlight-hint');
                $('[data-square="' + pv[1].substring(0, 2) + '"]').addClass('highlight-hint');
                $('[data-square="' + pv[1].substring(2, 4) + '"]').addClass('highlight-hint');
            } else {
                $('.square-55d63').removeClass('highlight-hint');
                $('#best-move-display').hide();
            }

            if (currentMode === 'ai' || isJ || analysisActive || hintsActive || currentMode === 'study') {
                var diff = 0;
                if (window.lastEval !== undefined) {
                    const turn = game.turn();
                    const prev = window.lastEval;
                    const curr = ev;
                    if (turn === 'b') { diff = prev - curr; }
                    else { diff = curr - prev; }
                }

                let trapMsg = "";
                if (diff > 1.5) {
                    if (!hintsActive) {
                        trapMsg = `<span class="trap-warning">⚠️ ¡ERROR GRAVE DETECTADO!</span>`;
                        playSnd('error');
                    } else {
                        trapMsg = `<span class="trap-warning">⚠️ ¡OJO! MEJOR RECTIFICAR</span>`;
                    }
                }

                var evalMag = Math.abs(diff);
                var q = getQualityMsg(evalMag, l.includes('mate'));
                var acc = Math.max(0, Math.min(100, 100 - (evalMag * 20)));

                let explanation = '';
                let tacticalInfo = '';
                const history = game.history({ verbose: true });
                const lastMove = history.length > 0 ? history[history.length - 1] : null;
                const isOpening = history.length <= 15;
                const isEndgame = game.board().flat().filter(p => p && p.type !== 'p').length <= 8;

                function getStrategicAdvice() {
                    const turn = game.turn();
                    const myPieces = game.board().flat().filter(p => p && p.color === turn);
                    if (isOpening) {
                        const developedPieces = myPieces.filter(p => ['n', 'b', 'r', 'q'].includes(p.type)).length;
                        if (developedPieces < 3) return "🎯 Enfócate en desarrollar tus caballos y alfiles hacia el centro.";
                        if (!game.history().some(m => m.includes('O-O'))) return "🏰 Considera proteger tu rey mediante el enroque pronto.";
                        return "⚔️ Controla el centro con tus peones y prepara el ataque.";
                    } else if (isEndgame) {
                        return "👑 En el final, el rey es una pieza activa. Trata de centralizarlo.";
                    } else {
                        return "🧩 Busca debilidades en la estructura de peones del rival o piezas sin defensa.";
                    }
                }

                let openingName = '';
                if (isOpening && history.length >= 2) {
                    const movesStr = game.history().join(' ');
                    if (movesStr.startsWith('e4 e5 Nf3 Nc6 Bb5')) openingName = '🎯 Apertura Española (Ruy López)';
                    else if (movesStr.startsWith('e4 e5 Nf3 Nc6 Bc4')) openingName = '🎯 Apertura Italiana';
                    else if (movesStr.startsWith('e4 c5')) openingName = '🎯 Defensa Siciliana';
                    else if (movesStr.startsWith('d4 d5 c4')) openingName = '🎯 Gambito de Dama';
                }

                if (lastMove) {
                    if (game.in_check()) tacticalInfo += '⚔️ ¡Jaque! ';
                    if (lastMove.captured) tacticalInfo += `📍 Captura de ${lastMove.captured}. `;
                }

                if (l.includes('score cp') || l.includes('score mate')) {
                    if (analysisActive || hintsActive || currentMode === 'study') {
                        // --- COPY EXISTING PARSING LOGIC SIMPLIFIED --- 
                        var match = l.match(/score cp (-?\d+)/);
                        var cp = match ? parseInt(match[1]) / 100 : 0;
                        if (l.includes('mate')) {
                            var matchMate = l.match(/score mate (-?\d+)/);
                            if (matchMate) cp = (parseInt(matchMate[1]) > 0 ? 999 : -999);
                        }
                        var ev = (game.turn() === 'w' ? cp : -cp);

                        // Update Bar
                        var h = Math.max(0, Math.min(100, 50 + (ev * 15)));
                        $('#eval-fill-master').css('height', h + '%');

                        var pv = l.match(/ pv ([a-h0-9]{4})/);
                        if (pv && pv[1]) {
                            // Highlighting Best Move on Board
                            $('.square-55d63').removeClass('highlight-hint');
                            if (hintsActive) {
                                $('[data-square="' + pv[1].substring(0, 2) + '"]').addClass('highlight-hint');
                                $('[data-square="' + pv[1].substring(2, 4) + '"]').addClass('highlight-hint');

                                if (typeof drawBestMoveArrow === 'function') {
                                    drawBestMoveArrow(pv[1].substring(0, 2), pv[1].substring(2, 4));
                                }
                            } else {
                                if (typeof drawBestMoveArrow === 'function') drawBestMoveArrow(null, null);
                            }

                            if (isJ || true) { // Always update info if active 
                                var diff = 0;
                                if (window.lastEval !== undefined) {
                                    // Calc diff from OTHER side perspective if we just moved
                                    // If I am White, lastEval was Black's eval of position.
                                    // Actually lastEval is always numeric eval of position.
                                    // If standard chess engines: + is white advantage.
                                    // diff = (Current Pos Eval) - (Previous Pos Eval)
                                    // If I am White and just moved, I want Current val to be higher than previous.
                                    diff = ev - (window.lastEval);
                                    // If turn is Black, ev is from Black perspective? 
                                    // Stockfish 'score cp' is always from side to move? Not always.
                                    // Usually command line UCI is white-based unless specified.
                                    // But my existing code: var ev = (game.turn() === 'w' ? cp : -cp);
                                    // This 'ev' variable seems to be "Evaluation for the side whose turn just started".

                                    // Let's rely on simple magnitude for now.
                                }

                                var q = getQualityMsg(Math.abs(diff), l.includes('mate'));
                                // q.text is like "Excellent", "Blunder"

                                let symbol = "";
                                if (q.text.includes("GRAVE")) symbol = "??";
                                else if (q.text.includes("MALA")) symbol = "?";
                                else if (q.text.includes("IMPRECISIÓN")) symbol = "?!";
                                else if (q.text.includes("BUENA")) symbol = "!";
                                else if (q.text.includes("EXCELENTE")) symbol = "!!";
                                else symbol = ""; // Normal

                                let explanation = "";
                                if (diff < -1.5) explanation = "📉 Error Grave: Has perdido ventaja significativa.";
                                else if (diff < -0.8) explanation = "⚠️ Imprecisión: Había mejores opciones.";
                                else if (diff > 0.5) explanation = "✨ Buena jugada: Mejoras tu posición.";
                                else explanation = "Jugada normal de desarrollo o equilibrio.";

                                if (currentMode === 'study') {
                                    // Update Analysis Panel Header
                                    $('#analysis-last-move-quality').html(`<span style="color:${q.color}">${symbol}</span>`);
                                    // Update ECO if needed (stub)
                                    // $('#analysis-eco-code').text("A00"); // TODO: Real logic

                                    $('#master-comment-text').html(`
                               <div style="font-weight:bold; color:var(--accent); margin-bottom:4px;">${q.text} ${symbol}</div>
                               <div style="margin-bottom:5px;">${explanation}</div>
                               <div style="display:none;" id="hidden-advice">${getStrategicAdvice()}</div>
                           `);

                                    $('#btn-explain-move').show();
                                } else {
                                    // Standard Coach
                                    $('#master-coach-unified').show();
                                    $('#coach-txt-unified').html(`
                                <div class="${q.class}" style="font-weight:bold; font-size:1.1rem; margin-bottom:5px;">${q.text}</div>
                                <div style="font-size:0.8rem; color:var(--text-main); line-height:1.4;">
                                    ${explanation}
                                    <div style="margin-top:8px; font-weight:700; color:var(--accent);">💡 CONSEJO: ${getStrategicAdvice()}</div>
                                </div>
                            `);
                                }
                            }
                        }
                        window.currentEval = ev;
                    }
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

                    // Update ELO
                    if (currentMode === 'ai') {
                        // AI always generic or maybe different for levels? defaulting to generic 10m
                        updateElo(getAiElo(), result, false, 10);
                    } else if (currentMode === 'local' && gameId) {
                        // For local/online, we should know the time control.
                        // We can check the active time selector or game defaults
                        // But gameId suggests online.
                        // We'll try to find the game info or default to 10
                        // Assuming 10 for now as 'standard' if not tracked
                        var tc = 10;
                        var activeBtn = $('#local-time-selector .time-btn.active');
                        if (activeBtn.length) tc = activeBtn.data('time');

                        updateElo(800, result, false, tc);
                    } else if (currentMode === 'exercises') {
                        // Logic handled elsewhere for puzzles usually? 
                        // But Puzzles don't usually trigger game_over(), they trigger success/fail.
                    }

                    // Show result toast
                    const msgText = LANGS[currentLang][reasonKey] || LANGS[currentLang].draw;
                    showToast("Fin de la partida: " + msgText, "🏁");
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

                        // Clear game state and refresh list
                        const oldGameId = gameId;
                        gameId = null;

                        // Request updated games list after a short delay
                        setTimeout(() => {
                            socket.emit('get_my_games');
                        }, 500);
                    }

                    $('#overlay-msg').text(LANGS[currentLang].lose);
                    $('#game-overlay').fadeIn();
                    playSnd('end');

                    // Final reset after a delay
                    setTimeout(() => {
                        game.reset(); board.start(); updateUI();
                        $('#game-overlay').fadeOut();
                    }, 2500);
                }
            }

            function abortGame() {
                if (confirm(LANGS[currentLang].abort)) {
                    stopClock();
                    if (currentMode === 'local' && gameId) {
                        socket.emit('abort_online_game', { gameId: gameId });

                        // Clear game state and refresh list
                        gameId = null;

                        // Request updated games list after a short delay
                        setTimeout(() => {
                            socket.emit('get_my_games');
                        }, 500);
                    }
                    game.reset(); board.start(); updateUI();
                }
            }

            function updateHistory() {
                historyPositions.push(game.fen());
                currentHistoryIndex = historyPositions.length - 1;
            }

            function navigateHistory(dir) {
                // STUDY MODE NAVIGATION
                if (currentMode === 'study' && studyMoves.length > 0) {
                    if (dir === 'next' && studyIndex < studyMoves.length) {
                        game.move(studyMoves[studyIndex]);
                        studyIndex++;
                        board.position(game.fen());
                        playSnd('move');
                        updateUI();
                        return;
                    } else if (dir === 'prev' && studyIndex > 0) {
                        game.undo();
                        studyIndex--;
                        board.position(game.fen());
                        updateUI();
                        return;
                    } else if (dir === 'first') {
                        game.reset();
                        studyIndex = 0;
                        board.start();
                        updateUI();
                        return;
                    }
                }

                if (dir === 'first') currentHistoryIndex = 0;
                else if (dir === 'last') currentHistoryIndex = historyPositions.length - 1;
                else if (dir === 'prev') currentHistoryIndex = Math.max(0, currentHistoryIndex - 1);
                else if (dir === 'next') currentHistoryIndex = Math.min(historyPositions.length - 1, currentHistoryIndex + 1);

                board.position(historyPositions[currentHistoryIndex]);
                game.load(historyPositions[currentHistoryIndex]);

                if (stockfish && currentHistoryIndex > 0) {
                    isJ = true;
                    stockfish.postMessage('stop');
                    stockfish.postMessage('position fen ' + game.fen());
                    stockfish.postMessage('go depth 15');
                    $('#coach-txt-unified').html('<div style="color:var(--accent);">Analizando jugada...</div>');
                } else if (currentHistoryIndex === 0) {
                    $('#coach-txt-unified').html('<div style="font-size:0.7rem; color:var(--text-muted);">Posición inicial.</div>');
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
                    else if (game.history({ verbose: true }).length > 0 && game.history({ verbose: true }).pop().flags.includes('c')) playSnd('capture');
                    else playSnd('move');

                    updateHistory();
                    if (!gameStarted && currentMode !== 'exercises' && currentMode !== 'study') startClock();
                    if (currentMode !== 'exercises' && currentMode !== 'study') updateTimerVisuals();

                    // SAVE LAST EVAL BEFORE NEW ANALYSIS
                    if (window.currentEval !== undefined) {
                        window.lastEval = window.currentEval;
                    }

                    if (stockfish && (currentMode === 'ai' || hintsActive || currentMode === 'study')) {
                        stockfish.postMessage('stop');

                        // HANDLING RESIGN vs RESET IN STUDY MODE
                        const resignBtn = $('.btn-action.resign, #btn-resign-mobile-trigger');
                        if (currentMode === 'study') {
                            resignBtn.show().html("🔄 RESET").off('click').click(function () {
                                game.reset(); board.start(); updateUI();
                                showToast("Tablero reseteado");
                            });
                            // Also styling to make it look like a tool, not danger?
                            resignBtn.css('border-color', 'var(--accent)').css('color', 'var(--accent)');
                        } else {
                            resignBtn.show().html("🏳️ RENDIRSE").off('click').click(resignGame);
                            resignBtn.css('border-color', 'rgba(239, 68, 68, 0.3)').css('color', '#ef4444');
                        }

                        stockfish.postMessage('position fen ' + game.fen());

                        const diff = parseInt($('#diff-sel').val()) || 5;
                        // AI Turn: Use selected difficulty
                        // But if HintsActive and it's NOT AI mode, use max depth
                        if (currentMode === 'ai' && game.turn() !== myColor) {
                            stockfish.postMessage('go depth ' + diff);
                        } else {
                            // Player Turn or Analysis/Hints
                            stockfish.postMessage('go depth 15');
                        }
                    }
                }
            }

            function getPieceTheme(piece) {
                try {
                    const el = $('#piece-theme-sel');
                    const theme = (el.length ? el.val() : null) || localStorage.getItem('chess_piece_theme') || 'wikipedia';

                    const baseUrl = 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/';

                    switch (theme) {
                        case 'alpha': return baseUrl + 'alpha/' + piece + '.svg';
                        case 'uscf': return 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/california/' + piece + '.svg'; // Using california as approximation for USCF style in lila if needed, or fallback
                        case 'merida': return baseUrl + 'merida/' + piece + '.svg';
                        case 'cburnett': return baseUrl + 'cburnett/' + piece + '.svg';
                        case 'fantasy': return baseUrl + 'fantasy/' + piece + '.svg';
                        case 'leipzig': return baseUrl + 'leipzig/' + piece + '.svg';
                        case 'wikipedia':
                        default:
                            return 'https://raw.githubusercontent.com/oakmac/chessboardjs/master/website/img/chesspieces/wikipedia/' + piece + '.png';
                    }
                } catch (e) {
                    return 'https://raw.githubusercontent.com/oakmac/chessboardjs/master/website/img/chesspieces/wikipedia/' + piece + '.png';
                }
            }

            function onSnapEnd() {
                board.position(game.fen());
            }

            function onDrop(source, target) {
                // RESTRICTION: Prevent dragging opponent's pieces in online/AI modes
                if (currentMode === 'local' || currentMode === 'ai') {
                    const piece = game.get(source);
                    if (piece && piece.color !== myColor) {
                        return 'snapback'; // Return piece to original position
                    }
                }

                var move = game.move({
                    from: source,
                    to: target,
                    promotion: 'q'
                });

                if (move === null) return 'snapback';

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

                    // DOUBLE CHECK: Prevent moving opponent's pieces in online/AI modes
                    if ((currentMode === 'local' || currentMode === 'ai') && selectedSq) {
                        const selectedPiece = game.get(selectedSq);
                        if (selectedPiece && selectedPiece.color !== myColor) {
                            selectedSq = null;
                            updateUI();
                            return; // Block the move
                        }
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
                                    // Find next game where it IS my turn, excluding current game
                                    const nextTurnItem = $('.active-game-item.my-turn').not(`[data-id="${gameId}"]`).first();

                                    if (nextTurnItem.length > 0) {
                                        showToast("Saltando a siguiente partida...", "🚀");
                                        nextTurnItem.click();
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

                // RESTRICTION: Only pick up own pieces in Online and AI modes
                if ((currentMode === 'local' || currentMode === 'ai') && piece && piece.color !== myColor) {
                    return; // Cannot pick up opponent pieces in online/AI modes
                }

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
                // Estado inicial del historial para evitar salir de la web con el botón atrás
                if (!history.state) {
                    history.replaceState({ menu: 'root' }, "Chess Pro", "");
                }

                board = Chessboard('myBoard', {
                    draggable: true,
                    position: 'start',
                    pieceTheme: getPieceTheme,
                    onDrop: onDrop,
                    onSnapEnd: onSnapEnd
                });

                // --- APPEARANCE & PREVIEW LOGIC ---

                function updatePreview() {
                    const boardTheme = $('#board-theme-sel').val();
                    const pieceTheme = $('#piece-theme-sel').val();
                    const bgTheme = $('#bg-theme-sel').val();

                    // Update Preview Board Colors
                    let colors = { light: '#f0d9b5', dark: '#b58863' };
                    if (boardTheme === 'wood') colors = { light: '#eec', dark: '#8b4513' };
                    else if (boardTheme === 'neon') colors = { light: '#1e293b', dark: '#0f172a' };
                    else if (boardTheme === 'forest') colors = { light: '#acc', dark: '#2e8b57' };
                    else if (boardTheme === 'dark') colors = { light: '#777', dark: '#222' };
                    else if (boardTheme === 'purple') colors = { light: '#d8b4fe', dark: '#581c87' };
                    else if (boardTheme === 'glass') colors = { light: 'rgba(255,255,255,0.2)', dark: 'rgba(0,0,0,0.2)' };

                    $('#preview-board .preview-sq.light').css('background', colors.light);
                    $('#preview-board .preview-sq.dark').css('background', colors.dark);

                    // Update Preview Piece
                    // Use a White Knight (wN) sample
                    const pieceUrl = getPieceTheme('wN');
                    $('#preview-piece').attr('src', pieceUrl);

                    // Update Main Board Classes (moved from CSS application)
                    localStorage.setItem('chess_board_theme', boardTheme);
                    localStorage.setItem('chess_piece_theme', pieceTheme);
                    localStorage.setItem('chess_bg_theme', bgTheme);

                    // Apply Background
                    applyBackground(bgTheme);
                }

                function applyBackground(theme) {
                    $('body').removeClass('bg-dark bg-gradient-blue bg-gradient-purple bg-wood bg-scifi');

                    if (theme === 'dark') $('body').css('background', '#111');
                    else if (theme === 'gradient-blue') $('body').css('background', 'linear-gradient(135deg, #0f172a, #1e293b)');
                    else if (theme === 'gradient-purple') $('body').css('background', 'linear-gradient(135deg, #1e1b4b, #4c1d95)');
                    else if (theme === 'wood') $('body').css('background', '#3e2723'); // Simple fallback, maybe use image later
                    else if (theme === 'image-scifi') $('body').css('background', 'radial-gradient(circle at center, #1a1a2e, #000)');

                    // If we had classes defined in CSS we would use them, but inline is fast for now
                }

                // Theme Handlers
                $('#board-theme-sel').change(function () {
                    const theme = $(this).val();

                    // CSS Class application for board effect
                    $('body').removeClass('board-theme-classic board-theme-wood board-theme-neon board-theme-forest board-theme-dark board-theme-purple board-theme-glass')
                        .addClass('board-theme-' + theme);

                    // Update actual board squares
                    let colors = { light: '#f0d9b5', dark: '#b58863' };
                    if (theme === 'wood') colors = { light: '#eec', dark: '#8b4513' };
                    if (theme === 'neon') colors = { light: '#1e293b', dark: '#0f172a' };
                    if (theme === 'forest') colors = { light: '#acc', dark: '#2e8b57' };
                    if (theme === 'dark') colors = { light: '#777', dark: '#222' };
                    if (theme === 'purple') colors = { light: '#d8b4fe', dark: '#581c87' };
                    if (theme === 'glass') colors = { light: 'rgba(255,255,255,0.2)', dark: 'rgba(0,0,0,0.2)' };

                    $('.white-1e1d7').css('background', colors.light);
                    $('.black-3c85d').css('background', colors.dark);

                    updatePreview();
                });

                $('#piece-theme-sel').change(function () {
                    const theme = $(this).val();
                    localStorage.setItem('chess_piece_theme', theme);

                    const currentPos = board.position();
                    const orientation = board.orientation();

                    // Re-init board to apply new piece theme
                    board = Chessboard('myBoard', {
                        draggable: true,
                        position: currentPos,
                        orientation: orientation,
                        pieceTheme: getPieceTheme,
                        onDrop: onDrop,
                        onSnapEnd: onSnapEnd
                    });

                    // Re-trigger board theme to ensure colors persist after re-init
                    $('#board-theme-sel').trigger('change');
                    $(window).resize(board.resize);

                    updatePreview();
                });

                $('#bg-theme-sel').change(function () {
                    updatePreview();
                });

                // Initialize Preview on Load
                setTimeout(updatePreview, 500);

                // Re-bind click for mobile squares
                $(document).on('mousedown touchstart', '.square-55d63', function () {
                    onSquareClick($(this).data('square'));
                });

                // Init values
                // Init values
                const savedPieceTheme = localStorage.getItem('chess_piece_theme') || 'wikipedia';
                const savedBoardTheme = localStorage.getItem('chess_board_theme') || 'classic';
                const savedBgTheme = localStorage.getItem('chess_bg_theme') || 'dark';

                $('#piece-theme-sel').val(savedPieceTheme);
                $('#board-theme-sel').val(savedBoardTheme);
                $('#bg-theme-sel').val(savedBgTheme);

                // Trigger changes to apply themes and preview
                $('#board-theme-sel').trigger('change');
                if (savedPieceTheme !== 'wikipedia') $('#piece-theme-sel').trigger('change');
                $('#bg-theme-sel').trigger('change');

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

                // Side Drawer
                $('#hamburger-menu').off('click').click(() => { $('#side-drawer').addClass('open'); $('#side-drawer-overlay').fadeIn(); });
                $('#side-drawer-overlay').off('click').click(() => { $('#side-drawer').removeClass('open'); $('#side-drawer-overlay').fadeOut(); });

                // --- SYSTEMATIC EVENT LISTENERS ---
                $(document).on('click', '[data-action="submenu"]', function () {
                    showSubMenu($(this).data('target'));
                });

                $(document).on('click', '.btn-challenge', function () {
                    createOnlineChallenge($(this).data('time'));
                });

                $(document).on('click', '#btn-start-24h', function () {
                    start24hGame();
                });

                $(document).on('click', '.btn-set-mode', function () {
                    setMode($(this).data('mode'));
                });

                $(document).on('click', '#btn-toggle-online-setup', function () {
                    $('#online-setup-container').slideToggle();
                });

                $(document).on('click', '#btn-launch-challenge', function () {
                    createOnlineChallenge();
                });

                $(document).on('click', '#btn-goto-active-games', function () {
                    setMode('local');
                    setTimeout(() => {
                        const el = $('#active-games-list')[0];
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                });

                $(document).on('click', '#btn-openings-search-trigger', function () {
                    setMode('study');
                    setTimeout(() => $('#opening-search').focus(), 300);
                });

                $(document).on('click', '#btn-reset-board', function () {
                    game.reset(); board.start(); updateUI();
                });

                $(document).on('click', '#btn-start-puzzles', function () {
                    setMode('exercises'); loadRandomPuzzle();
                });

                $(document).on('click', '#btn-back-to-menu', function () {
                    goBackToMenu();
                });

                $(document).on('click', '#btn-close-overlay', function () {
                    $('#game-overlay').fadeOut();
                });

                $(document).on('click', '#btn-resign-mobile-trigger', function () {
                    resignGame();
                });

                $(document).on('click', '#btn-back-menu-mobile', function () {
                    goBackToMenu();
                });

                $(document).on('click', '#btn-create-challenge-final', function () {
                    createOnlineChallenge(true);
                });

                $(document).on('click', '#btn-create-toggle', function () {
                    $('#create-challenge-opts').slideToggle();
                });

                $(document).on('click', '#btn-study-reset', function () {
                    game.reset(); board.start(); updateUI(); $('#study-controls').hide();
                });

                $(document).on('click', '#btn-copy-fen', function () {
                    const fen = game.fen();
                    navigator.clipboard.writeText(fen).then(() => {
                        showToast("FEN copiado al portapapeles", "📋");
                    }).catch(() => {
                        alert(fen);
                    });
                });

                $(document).on('click', '.btn-view-history', function () {
                    viewHistoryGame($(this).data('index'));
                });

                $(document).on('click', '.btn-join-challenge', function () {
                    joinGame($(this).data('id'), $(this).data('user'), $(this).data('time'));
                });

                $(document).on('click', '.btn-resume-game', function () {
                    const d = $(this).data();
                    resumeGame(d.id, d.opp, d.fen, d.color, d.wtime, d.btime);
                });

                $(document).on('click', '.btn-resign-bg', function () {
                    resignBackgroundGame($(this).data('id'));
                });

                $(document).on('click', '.btn-load-game', function () {
                    loadGame($(this).data('id'));
                });

                $(document).on('click', '#btn-hint-mobile-bar', function () {
                    toggleHints(this);
                });

                // Quick navigation for active games
                $(document).on('click', '#btn-toggle-games-list', function () {
                    $('#active-games-list').slideToggle(200);
                });

                $(document).on('click', '#btn-back-to-lobby', function () {
                    // Scroll to fast challenges section
                    const fastChallengesEl = $('#challenges-list-fast')[0];
                    if (fastChallengesEl) {
                        fastChallengesEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    // Also refresh the active games list to show current state
                    socket.emit('get_my_games');
                    showToast("Sala de retos", "🏰");
                });

                // Flip board button
                $(document).on('click', '#btn-flip-board', function () {
                    board.flip();
                    showToast("Tablero girado", "🔄");
                });

                // Fix responsive board
                $(window).resize(() => {
                    if (board) board.resize();
                });

                // Auto-resize once more after a small delay to ensure container size is settled
                setTimeout(() => { if (board) board.resize(); }, 1000);

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
                        <div class="history-item btn-view-history" data-index="${i}">
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
                const fastList = $('#challenges-list-fast');
                const slowList = $('#challenges-list-24h');

                fastList.empty();
                slowList.empty();

                if (challenges.length === 0) {
                    fastList.html('<div style="font-size:0.65rem; color:var(--text-muted); text-align:center; padding:10px;">No hay retos rápidos.</div>');
                    slowList.html('<div style="font-size:0.65rem; color:var(--text-muted); text-align:center; padding:10px;">No hay retos de 24h.</div>');
                } else {
                    const currentU = localStorage.getItem('chess_username') || userName;
                    const othersChallenges = challenges.filter(c => c.user !== currentU);

                    const fastChallenges = othersChallenges.filter(c => c.time < 1440);
                    const slowChallenges = othersChallenges.filter(c => c.time === 1440);

                    // Populate fast challenges
                    if (fastChallenges.length === 0) {
                        fastList.html('<div style="font-size:0.65rem; color:var(--text-muted); text-align:center; padding:10px;">No hay retos rápidos activos.</div>');
                    } else {
                        fastChallenges.forEach(data => {
                            const timeLabel = data.time === 1 ? '1 min' : data.time === 3 ? '3 min' : data.time === 10 ? '10 min' : data.time === 30 ? '30 min' : data.time + ' min';
                            const html = `
                    <div class="challenge-item btn-join-challenge" data-id="${data.id}" data-user="${data.user}" data-time="${data.time}" 
                         style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:rgba(56, 189, 248, 0.1); margin-bottom:5px; border-radius:6px; cursor:pointer; font-size:0.7rem; border:1px solid var(--accent);">
                        <span>👤 ${data.user} (${data.elo})</span>
                        <span style="color:var(--accent); font-weight:700;">⚡ ${timeLabel}</span>
                    </div>
                `;
                            fastList.append(html);
                        });
                    }

                    // Populate 24h challenges
                    if (slowChallenges.length === 0) {
                        slowList.html('<div style="font-size:0.65rem; color:var(--text-muted); text-align:center; padding:10px;">No hay retos de 24h activos.</div>');
                    } else {
                        slowChallenges.forEach(data => {
                            const html = `
                    <div class="challenge-item btn-join-challenge" data-id="${data.id}" data-user="${data.user}" data-time="${data.time}" 
                         style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:rgba(255,255,255,0.05); margin-bottom:5px; border-radius:6px; cursor:pointer; font-size:0.7rem;">
                        <span>👤 ${data.user} (${data.elo})</span>
                        <span style="color:#aaa;">📅 24h</span>
                    </div>
                `;
                            slowList.append(html);
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
                    <div class="challenge-item btn-join-challenge" data-id="${data.id}" data-user="${data.user}" data-time="${data.time}" 
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
                                <div class="btn-resume-game" data-id="${g.id}" data-opp="${opp}" data-fen="${g.fen}" data-color="${g.white === userName ? 'w' : 'b'}" data-wtime="${g.whiteTime}" data-btime="${g.blackTime}" style="flex:1; cursor:pointer;">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <div style="display:flex; flex-direction:column;">
                                            <span style="font-weight:700;">🆚 ${opp}</span>
                                            <span style="font-size:10px; opacity:0.6;">⏳ Yo: ${Math.floor((g.white === userName ? g.whiteTime : g.blackTime) / 60)}m</span>
                                        </div>
                                        ${turnLabel}
                                    </div>
                                </div>
                                <button class="btn-resign-bg" data-id="${g.id}" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.2rem; padding:0 0 0 10px;" title="Abandonar Partida">🗑️</button>
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

                // Show my color indicator
                const colorText = (myColor === 'w') ? "(Blancas)" : "(Negras)";
                $('#my-name-display').html(`${userName} <span style='font-size:0.7rem; color:var(--accent); margin-left:5px;'>${colorText}</span>`);

                gameStarted = true;

                updateUI();
            });

            window.loadGame = function (id) {
                if (id === gameId) {
                    // Just switch view if already loaded
                    showSubMenu('jugar'); // Ensure we are in the 'jugar' submenu (which contains the game board in mobile flow effectively)
                    // Actually, the game board is in 'root' -> 'jugar' -> 'local' mode.
                    // But the layout is different.
                    // IF MOBILE: We need to hide the menu and show the game board.
                    // The current mobile flow seems to be: Menu covers everything.
                    // To show game, we need to hide sidebar/menu layer if it's open.

                    // This seems to refer to a tab system that might not be fully active in this single-page app version?
                    // Let's assume switching mode and hiding menu is enough.

                    setMode('local');
                    $('#mobile-actions-menu').fadeOut(); // Ensure dropdowns are closed

                    // Specially for mobile: If we are in the "menu-root" or similar, we might need to "close" the menu overlay if it exists.
                    // However, looking at CSS, sidebar-left is visible.
                    // Let's force the game view by scrolling to it or ensuring it's main.
                    if (window.innerWidth <= 768) {
                        // In mobile, sidebar and game are stacked? Or toggled?
                        // Based on 'tab-btn' usage in previous context, there might be tabs.
                        // But looking at HTML, it seems single page.
                        // Let's try to scroll to board.
                        $('#myBoard')[0].scrollIntoView({ behavior: 'smooth' });
                    }
                    return;
                }
                if (socket) socket.emit('join_game', { gameId: id });
                showToast("Cambiando de partida...", "🔄");

                // Force switch to game view logic
                setMode('local');
                if (window.innerWidth <= 768) {
                    setTimeout(() => {
                        const boardEl = $('#myBoard')[0];
                        if (boardEl) boardEl.scrollIntoView({ behavior: 'smooth' });
                    }, 500);
                }
            };

            socket.on('active_games_update', function (games) {
                const listSidebar = $('#active-games-list');
                const listHome = $('#home-active-games');
                const homeContainer = $('#home-active-games-container');

                listSidebar.empty();
                listHome.empty();

                if (games.length === 0) {
                    listSidebar.append('<div style="font-size:0.65rem; color:var(--text-muted); text-align:center; padding:10px;">No hay partidas activas.</div>');
                    homeContainer.hide();
                    return;
                }

                homeContainer.show();

                // Enhancing game objects with calculated remaining time for sorting
                const now = Date.now();
                const processedGames = games.map(g => {
                    const elapsed = Math.floor((now - g.lastUpdate) / 1000);
                    let wTime = g.whiteTime;
                    let bTime = g.blackTime;
                    if (g.turn === 'w') wTime = Math.max(0, wTime - elapsed);
                    else bTime = Math.max(0, bTime - elapsed);

                    const isMyTurn = (g.turn === 'w' && g.white === userName) || (g.turn === 'b' && g.black === userName);
                    const timeLeft = (g.turn === 'w') ? wTime : bTime;

                    return { ...g, isMyTurn, timeLeft, wTime, bTime };
                });

                // Sort by timeLeft (less time first)
                processedGames.sort((a, b) => a.timeLeft - b.timeLeft);

                processedGames.forEach(g => {
                    const opp = (g.white === userName) ? g.black : g.white;
                    const timeStr = formatTime(g.timeLeft);

                    const itemHtml = `
            <div class="active-game-item btn-load-game ${g.isMyTurn ? 'my-turn' : 'opp-turn'}" data-id="${g.id}">
                <div style="flex:1"><b>vs ${opp}</b></div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px;">
                    <div style="font-size:0.75rem; font-weight:800; color:${g.isMyTurn ? 'var(--accent)' : '#aaa'}">${timeStr}</div>
                    <div style="font-size:0.55rem; opacity:0.7">${g.isMyTurn ? 'TU TURNO' : 'ESPERANDO...'}</div>
                </div>
            </div>
        `;

                    listSidebar.append($(itemHtml));
                    listHome.append($(itemHtml));
                });
            });

            socket.on('opponent_joined', (data) => {
                // legacy, covered by game_start mostly now
            });

            socket.on('player_resigned', (data) => {
                stopClock();
                $('#overlay-msg').text(LANGS[currentLang].win);
                $('#game-overlay').fadeIn();
                playSnd('end');
                showToast("Tu oponente se ha rendido. ¡Has ganado!", "🏆");
                game.reset(); board.start(); updateUI();
            });

            socket.on('game_aborted', () => {
                showToast("La partida ha sido abortada.", "⚠️");
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
            // AI COLOR SELECTION FINAL (FROM SUBMENU)
            $('#btn-start-ai-final').click(() => {
                const color = $('#ai-color-sel-menu').val();
                myColor = color === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : color;

                setMode('ai'); // Ensure mode is set

                game.reset();
                board.orientation(myColor === 'w' ? 'white' : 'black');
                board.start();

                gameStarted = false;
                $('#opp-name').text('Stockfish ' + $('#diff-sel-menu option:selected').text());

                updateUI();
                resetTimers();

                // Trigger analysis if it's AI turn (Black start)
                if (myColor === 'b') {
                    setTimeout(() => {
                        const openings = ['e4', 'd4', 'Nf3', 'c4'];
                        const move = openings[Math.floor(Math.random() * openings.length)];
                        game.move(move);
                        board.position(game.fen());
                        updateUI(true);
                    }, 500);
                } else {
                    if (stockfish) {
                        stockfish.postMessage('stop');
                        stockfish.postMessage('position fen ' + game.fen());
                        stockfish.postMessage('go depth 10'); // Warm up
                    }
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
                const activeSelector = currentMode === 'ai' ? '#ai-time-selector-menu' : '#local-time-selector';
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
            // AUTH LOGIC
            $('#btn-auth-trigger, #btn-auth-drawer, #btn-home-auth-trigger').click(openAuth);
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
                    // Hide Main Login Button
                    $('#btn-home-auth-trigger').hide();
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
                } else {
                    // Show Main Login Button if NOT auth
                    $('#btn-home-auth-trigger').css('display', 'flex');
                    $('#btn-auth-trigger').text("👤 INICIAR SESIÓN");
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

            updateAuthUI();

            $('#hamburger-menu').off('click'); // remove old if any
            $('#side-drawer-overlay').off('click');

            // Llenar aperturas (Select y Datalist para búsqueda)
            const datalist = $('#openings-datalist');
            const openingSelect = $('#opening-sel');
            const openingSelectMenu = $('#opening-sel-menu');
            // Populate Menu Select as well
            OPENINGS_DATA.forEach((group, groupIdx) => {
                let optgroup = `<optgroup label="${group.group}">`;
                group.items.forEach((item, itemIdx) => {
                    const val = `${groupIdx}-${itemIdx}`;
                    optgroup += `<option value="${val}">${item.name}</option>`;
                });
                optgroup += `</optgroup>`;
                openingSelect.append(optgroup);
                openingSelectMenu.append(optgroup);
            });

            // Sincronización eliminada ya que se quitó el input de búsqueda
            // Se mantiene la lógica de selección directa


            var studyMoves = [];
            var studyIndex = 0;

            const loadOpening = (val) => {
                if (!val) return;
                const [gIdx, iIdx] = val.split('-');
                const opening = OPENINGS_DATA[gIdx].items[iIdx];

                // Ensure we switch to Study Mode first
                setMode('study');

                game.reset();
                board.start();

                studyMoves = opening.m;
                studyIndex = 0;

                $('#study-controls').show();
                $('#btn-study-next').text("⏩ Siguiente Jugada (" + studyMoves.length + ")");
                updateUI();
            };

            $('#opening-sel, #opening-sel-menu').change(function () {
                loadOpening($(this).val());
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

            const toggleHints = (btn) => {
                hintsActive = !hintsActive;

                // UI Update for all hint buttons
                $('.btn-action#btn-hint-mobile-bar, #btn-ai-hint, #btn-hint-main, #btn-hint-mobile, #btn-suggest-move').toggleClass('active', hintsActive);

                // Specific logic for Study Mode Button Illumination
                if (hintsActive) {
                    $('#btn-hint-main').css('box-shadow', '0 0 15px var(--accent)');
                    $('#master-assessment').slideDown();
                    $('#master-coach-unified').show(); // Main board coach
                    $('#coach-txt-unified').text("Analizando mejor jugada...");
                    updateUI(true); // Force re-analysis
                } else {
                    $('#btn-hint-main').css('box-shadow', 'none');
                    $('.square-55d63').removeClass('highlight-hint');
                    $('#best-move-unified').hide();
                    $('#master-assessment').slideUp();
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

                // Activar controles laterales (PC)
                $('#game-sidebar-controls').fadeIn().css('display', 'flex');
                $('#main-menu-container').hide();

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
                } else if (mode === 'exercises') {
                    loadRandomPuzzle();
                } else if (mode === 'pass-and-play') {
                    $('#opp-name').text('Oponente Local');
                } else {
                    $('#opp-name').text('Oponente (Estudio)');
                }

                if (mode === 'ai' || mode === 'study' || mode === 'exercises') {
                    $('#btn-hint-main').css('display', 'flex').fadeIn();
                    $('#btn-hint-mobile-bar').show();
                    $('#master-coach-unified').fadeIn();
                } else {
                    $('#btn-hint-main').hide();
                    $('#btn-hint-mobile-bar').hide();
                    if (!hintsActive) $('#master-coach-unified').hide();
                }

                if (mode === 'study') {
                    setTimeout(() => $('#opening-search').focus(), 500);
                }

                resetTimers();
                updateUI();
            };

            window.start24hGame = function () {
                if (!isAuth) {
                    showToast("Inicia sesión para jugar", "⚠️");
                    return openAuth();
                }
                createOnlineChallenge(1440);
                showToast("Reto de 24 horas creado", "🕒");
            };

            window.createOnlineChallenge = function (arg) {
                if (!isAuth) { alert("Inicia sesión para jugar online."); return openAuth(); }
                var time = (typeof arg === 'number') ? arg : (arg === true ? $('#local-time-selector .time-btn.active').data('time') : $('#online-time-sel').val());
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
                $('#create-challenge-opts').slideUp();
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

            // Sync puzzles categories
            $('#puz-cat-sel-main').on('change', function () {
                $('#puz-cat-sel').val($(this).val()).trigger('change');
            });

            $('#btn-pgn-main').click(() => $('#btn-pgn').click());

            // Fill opening selector main
            if (typeof OPENINGS_DATA !== 'undefined') {
                OPENINGS_DATA.forEach((group, groupIdx) => {
                    let optgroup = `<optgroup label="${group.group}">`;
                    group.items.forEach((item, itemIdx) => {
                        optgroup += `<option value="${groupIdx}-${itemIdx}">${item.name}</option>`;
                    });
                    optgroup += `</optgroup>`;
                    $('#opening-sel-main').append(optgroup);
                });
            }

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
                        reg.update(); // Check for updates immediately
                    }).catch(err => {
                        console.log('Error al registrar SW', err);
                    });
                });
            }

            // --- NAVIGATION HISTORY & MENU HANDLING ---
            window.showSubMenu = function (targetId, push = true) {
                console.log("Navigating to:", targetId);
                $('.menu-step').removeClass('active');

                // Determine the actual ID
                let finalId = 'menu-root';
                if (targetId && targetId !== 'root') {
                    finalId = 'menu-' + targetId;
                }

                const el = $('#' + finalId);
                if (el.length) {
                    el.addClass('active');
                    if (push) {
                        history.pushState({ menu: targetId }, "Menu " + targetId, "?menu=" + targetId);
                    }
                } else {
                    // Fallback
                    $('#menu-root').addClass('active');
                }

                // Mobile optimization: Scroll to top when changing menu
                window.scrollTo(0, 0);
            };

            window.onpopstate = function (event) {
                if (event.state && event.state.menu) {
                    showSubMenu(event.state.menu, false); // false = don't push state again
                } else {
                    showSubMenu('root', false);
                }
            };

            // Hook into the click events
            $(document).ready(function () {
                $(document).on('click', '[data-action="submenu"]', function () {
                    const target = $(this).data('target');
                    showSubMenu(target);
                });

                // Also handle board theme changes to apply CSS classes
                $('#board-theme-sel').change(function () {
                    const theme = $(this).val();
                    localStorage.setItem('chess_board_theme', theme);
                    $('body').removeClass(function (index, className) {
                        return (className.match(/(^|\s)board-theme-\S+/g) || []).join(' ');
                    });
                    $('body').addClass('board-theme-' + theme);
                });

                // Initialize theme from storage
                const storedTheme = localStorage.getItem('chess_board_theme');
                if (storedTheme) {
                    $('#board-theme-sel').val(storedTheme);
                    $('body').addClass('board-theme-' + storedTheme);
                }
            });

            // --- EDITOR MODE LOGIC ---
            var isEditorMode = false;

            function toggleEditorMode() {
                isEditorMode = !isEditorMode;

                if (isEditorMode) {
                    showToast("Modo Editor Activado", "⛏️");
                    const currentPos = board.position();
                    board = Chessboard('myBoard', {
                        draggable: true,
                        position: currentPos,
                        sparePieces: true,
                        dropOffBoard: 'trash',
                        pieceTheme: getPieceTheme,
                        onDrop: onDropEditor,
                        onSnapEnd: hasSparePieces() ? null : onSnapEnd
                    });
                    $('#btn-editor').addClass('active');
                    $('#btn-editor-mobile').text("✅ HECHO (Analizar)");
                } else {
                    showToast("Análisis iniciado.", "🎓");
                    try {
                        const fen = board.fen() + " w - - 0 1";
                        var valid = game.load(fen);
                        if (!valid) game.load(board.fen() + " b - - 0 1");
                    } catch (e) { }

                    board = Chessboard('myBoard', {
                        draggable: true,
                        position: board.position(),
                        sparePieces: false,
                        pieceTheme: getPieceTheme,
                        onDrop: onDrop,
                        onSnapEnd: onSnapEnd
                    });
                    $('#btn-editor').removeClass('active');
                    $('#btn-editor-mobile').text("⛏️ Editor");

                    if (!hintsActive) toggleHints($("#btn-hint-main"));

                    updateUI(true);
                }

                $(window).resize(board.resize);
            }

            function onDropEditor(source, target, piece, newPos, oldPos, orientation) {
            }

            function hasSparePieces() { return isEditorMode; }

            function updateUI(moved = false) {
                $('.square-55d63').removeClass('highlight-selected highlight-hint');
                $('.legal-dot').remove();

                updateMaterial();

                if (moved) {
                    if (game.in_check()) playSnd('check');
                    else if (game.history({ verbose: true }).length > 0 && game.history({ verbose: true }).pop().flags.includes('c')) playSnd('capture');
                    else playSnd('move');

                    updateHistory();
                    if (!gameStarted && currentMode !== 'exercises' && currentMode !== 'study') startClock();
                    if (currentMode !== 'exercises' && currentMode !== 'study') updateTimerVisuals();

                    if (window.currentEval !== undefined) window.lastEval = window.currentEval;

                    // ANALYSIS & HINTS LOGIC
                    if (stockfish && (currentMode === 'ai' || hintsActive || currentMode === 'study')) {
                        stockfish.postMessage('stop');

                        // Manage "Resign" vs "Reset" button
                        const resignBtn = $('.btn-action.resign, #btn-resign-mobile-trigger');
                        if (currentMode === 'study') {
                            resignBtn.show().html("🔄 RESET").off('click').click(function () {
                                game.reset(); board.start(); updateUI();
                                showToast("Tablero reseteado");
                            });
                            resignBtn.css('border-color', 'var(--accent)').css('color', 'var(--accent)');
                        } else {
                            resignBtn.show().html("🏳️ RENDIRSE").off('click').click(resignGame);
                            resignBtn.css('border-color', 'rgba(239, 68, 68, 0.3)').css('color', '#ef4444');
                        }

                        stockfish.postMessage('position fen ' + game.fen());

                        const diff = parseInt($('#diff-sel').val()) || 5;
                        if (currentMode === 'ai' && game.turn() !== myColor) {
                            stockfish.postMessage('go depth ' + diff);
                        } else {
                            stockfish.postMessage('go depth 15');
                        }
                    }
                }

                // UI Refresh for Study Mode Panels
                if (currentMode === 'study') {
                    $('body').addClass('mode-study');

                    // Dynamically show correct panel
                    // If we are studying a specific opening, show openings panel
                    // If free analysis, show analysis tools

                    if (studyMoves.length > 0) {
                        $('#study-panel-openings').show();
                        $('#study-panel-analysis').hide();
                    } else {
                        $('#study-panel-openings').hide();
                        $('#study-panel-analysis').show();
                    }

                    // Update Analysis Info
                    const history = game.history({ verbose: true });
                    if (history.length > 0) {
                        const last = history[history.length - 1];
                        // Try to find ECO or Name (Mockup logic or real lookup if we had big DB)
                        // For now we rely on existing basic detection
                        const detected = $('#master-comment-text').text().match(/🎯 (.*)/);
                        if (detected) {
                            $('#analysis-opening-name').text(detected[1]);
                        } else {
                            if (history.length < 2) $('#analysis-opening-name').text("Apertura Inicial");
                            else $('#analysis-opening-name').text("Variante " + (history.length % 2 === 0 ? "Negras" : "Blancas"));
                        }
                    } else {
                        $('#analysis-opening-name').text("Posición Inicial");
                        $('#analysis-last-move-quality').text("");
                    }

                } else {
                    $('body').removeClass('mode-study');
                }
            }

            // Hook Editor Button
            $('#btn-editor').off('click').click(toggleEditorMode);
            $('#btn-study-reset').click(function () {
                game.reset(); board.start();
                studyMoves = []; // Reset study moves to go to free analysis
                updateUI();
            });

            // Flip Board Small Button
            $('#btn-flip-small').click(function () { board.flip(); });

            // Best Move / Engine Toggle (Persistent)
            function toggleHints(btn) {
                hintsActive = !hintsActive;
                if (hintsActive) {
                    $(btn).addClass('active').html("💡 PISTAS: ON");
                    $('#btn-toggle-engine').addClass('active').html("⚙️ MOTOR: ON");
                    showToast("Modo Maestro Activado", "🎓");
                    $('#master-assessment').slideDown();
                    updateUI(true); // Force analysis
                } else {
                    $(btn).removeClass('active').html("💡 MEJOR JUGADA");
                    $('#btn-toggle-engine').removeClass('active').html("⚙️ MOTOR: OFF");
                    showToast("Pistas Desactivadas");
                    // Clear
                    $('.square-55d63').removeClass('highlight-hint');
                    $('#best-move-unified').hide();
                    $('#master-assessment').slideUp();
                    $('#analysis-last-move-quality').html(""); // Clear quality mark
                }
            };

            $('#btn-toggle-engine').click(function () {
                toggleHints($('#btn-hint-main'));
            });

            // Explanation Button
            $('#btn-explain-move').click(function () {
                alert($('#master-comment-text').text() + "\n\nConsejo: " + getStrategicAdvice());
            });


            // Also verify mobile button logic for persistent hints
            $('#btn-hint-mobile-bar').click(function () {
                toggleHints($('#btn-hint-main'));
            });

            // Navigation Last Move Fix
            function navigateHistory(dir) {
                if (currentMode === 'study' && studyMoves.length > 0) {
                    if (dir === 'next' && studyIndex < studyMoves.length) {
                        game.move(studyMoves[studyIndex]);
                        studyIndex++;
                        board.position(game.fen());
                        playSnd('move');
                        updateUI();
                        return;
                    } else if (dir === 'prev' && studyIndex > 0) {
                        game.undo();
                        studyIndex--;
                        board.position(game.fen());
                        updateUI();
                        return;
                    } else if (dir === 'first') {
                        game.reset(); studyIndex = 0; board.start(); updateUI(); return;
                    } else if (dir === 'last') {
                        // Fast forward entire opening
                        game.reset();
                        for (let m of studyMoves) game.move(m);
                        studyIndex = studyMoves.length;
                        board.position(game.fen());
                        updateUI();
                        return;
                    }
                }

                if (dir === 'first') currentHistoryIndex = 0;
                else if (dir === 'last') currentHistoryIndex = historyPositions.length - 1;
                else if (dir === 'prev') currentHistoryIndex = Math.max(0, currentHistoryIndex - 1);
                else if (dir === 'next') currentHistoryIndex = Math.min(historyPositions.length - 1, currentHistoryIndex + 1);

                board.position(historyPositions[currentHistoryIndex]);
                game.load(historyPositions[currentHistoryIndex]);

                if (stockfish) {
                    stockfish.postMessage('stop');
                    stockfish.postMessage('position fen ' + game.fen());
                    stockfish.postMessage('go depth 15');
                }
            }

            // ELO Separation Logic
            function getEloKey(time) {
                if (time <= 1) return 'chess_elo_bullet'; // 1 min (Bullet)
                if (time <= 3) return 'chess_elo_blitz';  // 3 min (Blitz)
                if (time <= 30) return 'chess_elo_rapid'; // 10-30 (Rapid)
                return 'chess_elo_daily'; // 24h
            }

            function getUserElo(time) {
                const key = getEloKey(time);
                return parseInt(localStorage.getItem(key)) || 1200; // Default 1200? Or 500
            }

            // Override updateElo to support types
            function updateElo(opponentElo, result, isPuzzle = false, timeControl = 10) {
                const k = 32;
                let currentElo, key;

                if (isPuzzle) {
                    currentElo = userPuzzleElo;
                    key = 'chess_puz_elo';
                } else {
                    key = getEloKey(timeControl);
                    currentElo = parseInt(localStorage.getItem(key)) || 500;
                    userElo = currentElo;
                }

                const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
                const newElo = Math.round(currentElo + k * (result - expectedScore));

                localStorage.setItem(key, newElo);

                if (isPuzzle) {
                    userPuzzleElo = newElo;
                    $('#header-elo-puz, #puz-elo-display').text(userPuzzleElo + "🧩");
                } else {
                    $('#header-elo').text(userElo + " ELO");
                }

                if (isAuth) {
                    socket.emit('update_elo', {
                        user: userName,
                        elo: userElo,
                        puzElo: userPuzzleElo
                    });
                }

                $('#coach-txt').append(`<br><b style="color:var(--accent)">${isPuzzle ? 'Puzzle ELO' : 'ELO'}: ${newElo}</b>`);
            }

            // Modify setMode to trigger Editor for Free Analysis
            var originalSetMode = window.setMode;
            window.setMode = function (mode) {
                originalSetMode(mode);
                if (mode === 'study') {
                    // Determine if we are initiating clean analysis
                    // This is often handled by specific button clicks now
                    $('body').addClass('mode-study');
                    studyIndex = 0;
                } else {
                    $('body').removeClass('mode-study');
                    if (isEditorMode) toggleEditorMode();
                }
            };

            $('#btn-start-analysis-pro').click(function () {
                setMode('study');
                studyMoves = []; // Clear any preset opening
                game.reset();
                board.start();
                updateUI();
                // Auto-enable engine
                if (!hintsActive) toggleHints($('#btn-hint-main'));
            });

            // Fix click handlers for Nav
            $('#btn-nav-first').click(() => navigateHistory('first'));
            $('#btn-nav-prev').click(() => navigateHistory('prev'));
            $('#btn-nav-next').click(() => navigateHistory('next'));
            $('#btn-nav-last').click(() => navigateHistory('last'));

            // Ensure Spare Pieces fix
            var oldOnDrop = onDrop;
            onDrop = function (source, target) {
                if (isEditorMode) return;
                return oldOnDrop(source, target);
            };


            // Navigation Last Move Fix
            function navigateHistory(dir) {
                if (currentMode === 'study' && studyMoves.length > 0) {
                    if (dir === 'next' && studyIndex < studyMoves.length) {
                        game.move(studyMoves[studyIndex]);
                        studyIndex++;
                        board.position(game.fen());
                        playSnd('move');
                        updateUI();
                        return;
                    } else if (dir === 'prev' && studyIndex > 0) {
                        game.undo();
                        studyIndex--;
                        board.position(game.fen());
                        updateUI();
                        return;
                    } else if (dir === 'first') {
                        game.reset(); studyIndex = 0; board.start(); updateUI(); return;
                    } else if (dir === 'last') {
                        // Fast forward entire opening
                        game.reset();
                        for (let m of studyMoves) game.move(m);
                        studyIndex = studyMoves.length;
                        board.position(game.fen());
                        updateUI();
                        return;
                    }
                }

                if (dir === 'first') currentHistoryIndex = 0;
                else if (dir === 'last') currentHistoryIndex = historyPositions.length - 1;
                else if (dir === 'prev') currentHistoryIndex = Math.max(0, currentHistoryIndex - 1);
                else if (dir === 'next') currentHistoryIndex = Math.min(historyPositions.length - 1, currentHistoryIndex + 1);

                board.position(historyPositions[currentHistoryIndex]);
                game.load(historyPositions[currentHistoryIndex]);

                if (stockfish) {
                    stockfish.postMessage('stop');
                    stockfish.postMessage('position fen ' + game.fen());
                    stockfish.postMessage('go depth 15');
                }
            }

            // ELO Separation Logic
            function getEloKey(time) {
                if (time <= 1) return 'chess_elo_bullet'; // 1 min (Bullet)
                if (time <= 3) return 'chess_elo_blitz';  // 3 min (Blitz)
                if (time <= 30) return 'chess_elo_rapid'; // 10-30 (Rapid)
                return 'chess_elo_daily'; // 24h
            }

            function getUserElo(time) {
                const key = getEloKey(time);
                return parseInt(localStorage.getItem(key)) || 1200; // Default 1200? Or 500
            }

            // Override updateElo to support types
            function updateElo(opponentElo, result, isPuzzle = false, timeControl = 10) {
                const k = 32;
                let currentElo, key;

                if (isPuzzle) {
                    currentElo = userPuzzleElo;
                    key = 'chess_puz_elo';
                } else {
                    key = getEloKey(timeControl);
                    currentElo = parseInt(localStorage.getItem(key)) || 500;
                }

                const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
                const newElo = Math.round(currentElo + k * (result - expectedScore));

                localStorage.setItem(key, newElo);

                if (isPuzzle) {
                    userPuzzleElo = newElo;
                    $('#header-elo-puz, #puz-elo-display').text(userPuzzleElo + "🧩");
                } else {
                    userElo = newElo;
                    $('#header-elo').text(userElo + " ELO");
                }

                if (isAuth) {
                    socket.emit('update_elo', {
                        user: userName,
                        elo: userElo,
                        puzElo: userPuzzleElo
                    });
                }

                $('#coach-txt').append(`<br><b style="color:var(--accent)">${isPuzzle ? 'Puzzle ELO' : 'ELO'}: ${newElo}</b>`);
            }

            // Modify setMode to trigger Editor for Free Analysis
            var originalSetMode = window.setMode;
            window.setMode = function (mode) {
                originalSetMode(mode);
                if (mode === 'study') {
                    // Check if it was triggered by "Free Analysis" specifically?
                    // Openings study sets moves. Free analysis is empty.
                    // If studyMoves is empty, we assume Free Analysis or fresh entry.
                    if (studyMoves.length === 0) {
                        if (!isEditorMode) toggleEditorMode();
                    }

                    $('body').addClass('mode-study');

                    // Fix navigation last button behavior for free analysis (empty studyMoves)
                    studyIndex = 0;
                } else {
                    $('body').removeClass('mode-study');
                    if (isEditorMode) toggleEditorMode(); // Turn off if switching away
                }
            };

            // Fix click handlers for Nav
            $('#btn-nav-first').click(() => navigateHistory('first'));
            $('#btn-nav-prev').click(() => navigateHistory('prev'));
            $('#btn-nav-next').click(() => navigateHistory('next'));
            $('#btn-nav-last').click(() => navigateHistory('last'));

            // Ensure Spare Pieces fix
            var oldOnDrop = onDrop;
            onDrop = function (source, target) {
                if (isEditorMode) return;
                return oldOnDrop(source, target);
            };
            // --- EDITOR MODE LOGIC ---
            var isEditorMode = false;



            function onDropEditor(source, target, piece, newPos, oldPos, orientation) {
                // In editor mode, we don't validate moves with game.js immediately
                // We just let the board update visually.
                // When exiting editor, we sync.
            }

            function hasSparePieces() {
                return isEditorMode;
            }

            // Update UI to handle Resign -> Reset in Study Mode


            // Hook Editor Button
            $('#btn-editor').off('click').click(toggleEditorMode);
            $('#btn-study-reset').click(function () {
                game.reset(); board.start(); updateUI();
            });

            // Fix: Ensure spare pieces doesn't break normal drop
            var oldOnDrop = onDrop;
            onDrop = function (source, target) {
                if (isEditorMode) return;
                return oldOnDrop(source, target);
            };

            // ARROW DRAWING HELPER
            function drawBestMoveArrow(from, to) {
                // 1. Create layer if not exists
                let $layer = $('#board-arrow-layer');
                if ($layer.length === 0) {
                    // Append inside myBoard
                    $('#myBoard').append('<div id="board-arrow-layer" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1000;"><svg width="100%" height="100%" id="arrow-svg" style="width:100%; height:100%;"><defs><marker id="arrowhead" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><polygon points="0 0, 4 2, 0 4" class="arrow-head" style="fill:rgba(255, 170, 0, 0.8);"/></marker></defs></svg></div>');
                    $layer = $('#board-arrow-layer');
                }
                const $svg = $layer.find('svg');

                // Remove old arrows
                $svg.find('.arrow-line').remove();

                if (!from || !to) return;

                // Calc coords
                const boardWidth = $('#myBoard').width();
                const sqSize = boardWidth / 8;

                const fileMap = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 };
                const rankMap = { 1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 0 };

                let x1 = fileMap[from[0]] * sqSize + sqSize / 2;
                let y1 = rankMap[from[1]] * sqSize + sqSize / 2;
                let x2 = fileMap[to[0]] * sqSize + sqSize / 2;
                let y2 = rankMap[to[1]] * sqSize + sqSize / 2;

                // If flipped, invert
                if (board.orientation() === 'black') {
                    x1 = (7 - fileMap[from[0]]) * sqSize + sqSize / 2;
                    y1 = (7 - rankMap[from[1]]) * sqSize + sqSize / 2;
                    x2 = (7 - fileMap[to[0]]) * sqSize + sqSize / 2;
                    y2 = (7 - rankMap[to[1]]) * sqSize + sqSize / 2;
                }

                // SVG Line
                // We need to create element with namespace for SVG to work properly in DOM
                const line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                line.setAttribute('class', 'arrow-line');
                // Inline style fallback
                line.style.stroke = "rgba(255, 170, 0, 0.8)";
                line.style.strokeWidth = "10";
                line.style.strokeLinecap = "round";
                line.style.markerEnd = "url(#arrowhead)";
                line.style.opacity = "0.8";

                $svg.append(line);
            }

            // Alerta antes de salir si hay partida en curso
            window.addEventListener('beforeunload', function (e) {
                if (gameId || (game.history().length > 10 && currentMode !== 'study')) {
                    e.preventDefault();
                    e.returnValue = '';
                }
            });
            // Aviso antes de salir
            window.onbeforeunload = function () {
                if (gameId || (game.history().length > 5 && currentMode !== 'study')) {
                    return "¿Seguro que quieres salir?";
                }
            };

            // Botón atrás móvil
            window.onpopstate = function (e) {
                if (e.state && e.state.menu) showSubMenu(e.state.menu, false);
                else showSubMenu('root', false);
            };

            $(window).resize(function () { if (board) board.resize(); if (typeof drawBestMoveArrow === 'function') drawBestMoveArrow(null, null); });
        });

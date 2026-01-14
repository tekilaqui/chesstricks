// Load Opening Data
const OPENINGS_DATA = (typeof OPENINGS_ENHANCED !== 'undefined') ? OPENINGS_ENHANCED : [
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
    }
];


var currentOpening = null;
var openingSubMode = null; // 'theory', 'training', 'exercises'

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

const showToast = (msg, icon = '✅', type = 'default') => {
    // Redirección para Tácticas: si estamos en modo ejercicios, enviamos el aviso al panel lateral
    if (currentMode === 'exercises' && !msg.includes('ELO') && !msg.includes('CORRECTO') && !msg.includes('INCORRECTO')) {
        const feedbackHtml = `<div style="color:var(--accent); font-weight:700; margin-bottom:5px;">${icon} AVISO</div>
                              <div style="font-size:0.85rem; opacity:0.9;">${msg}</div>`;
        renderTacticalDashboard(feedbackHtml);
        return;
    }

    // Si es un mensaje de entrenador o táctica, limpiamos los anteriores para no saturar
    if (type === 'suggestion' || type === 'coach') {
        $('.toast-coach, .toast-suggestion').remove();
    }

    // En móvil, ser más agresivos: solo una notificación de cualquier tipo a la vez
    if (window.innerWidth <= 768) {
        $('.toast').remove();
    }

    const toast = $(`<div class="toast toast-${type}"><span>${icon}</span> <span>${msg}</span></div>`);
    $('#toast-container').append(toast);

    // Animación de salida
    setTimeout(() => {
        toast.css({ 'opacity': '0', 'transform': 'translateY(-10px)', 'transition': '0.4s' });
        setTimeout(() => toast.remove(), 400);
    }, 3500);
};

var gameId = null;
var currentMode = 'local'; // Default mode
var selectedSq = null;
var hintsActive = false; // Unified hints toggle
var aiThinking = false;
var opponentAutoMode = true;
var isJ = false;
var moveQualityHistory = []; // Para el informe final

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
var lastAIProcessedMove = null; // Para evitar repetir peticiones de IA en la misma jugada
var evalHistory = [0]; // Historial para el gráfico de Fase 1
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
const analysisCache = new Map(); // FEN -> Analysis results

// ACADEMY VARIABLES
var academyLevel = parseInt(localStorage.getItem('chess_academy_level')) || 0;
var currentAcademyLevelIndex = 0;
var currentAcademyPuzzleIndex = 0;
var academyInProgress = false;

// MULTI-LANGUAGE SUPPORT
var currentLang = localStorage.getItem('chess_lang') || 'es';
const LANGS = {
    es: {
        mate: "JAQUE MATE", win: "¡HAS GANADO!", lose: "HAS PERDIDO", draw: "TABLAS",
        resign: "¿Estás seguro de que quieres rendirte?", abort: "¿Abortar partida? No perderás ELO.",
        guest: "Invitado", login: "INICIAR SESIÓN", logout: "CERRAR SESIÓN",
        puz_done: "¡EXCELENTE!", puz_hint: "Analiza bien la posición...",
        best_move: "Mejor jugada", level: "Nivel", diff: "Dificultad", theme: "Temas",
        brilliant: "¡LA MEJOR!", great: "¡Muy buena!", best: "La mejor",
        good: "Buena", inaccuracy: "Error insustancial", mistake: "Error", blunder: "ERROR GRAVE",
        book: "De libro",
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

const COACH_TEMPLATES = {
    'brilliant': [
        '💎 ¡Movimiento de genio!',
        '✨ Eso fue brillante',
        '🚀 Jugada maestra',
        '🧠 Visión excepcional'
    ],
    'excellent': [
        '✅ Excelente movimiento',
        '👏 Muy bien pensado',
        '🎯 Perfecto',
        '🌟 Sólido y fuerte'
    ],
    'good': [
        '👍 Buena jugada',
        '👌 Mantienes la posición',
        '♟️ Movimiento correcto'
    ],
    'inaccuracy': [
        '😕 Una imprecisión',
        '🧐 Había algo mejor',
        '📉 Pierdes un poco de fuelle'
    ],
    'mistake': [
        '⚠️ Cuidado con ese movimiento',
        '💭 Podría haber algo mejor',
        '🤔 Repiensa tu estrategia'
    ],
    'blunder': [
        '🚨 ¡ERROR GRAVE!',
        '❌ Has pasado por alto algo importante',
        '😨 Esto cambia las cosas'
    ],
    'book': [
        '📚 Teoría pura',
        '📖 Tal como dicen los libros',
        '🎓 Conocimiento sólido'
    ]
};

function getQuickCoachComment(qualityClass) {
    const templates = COACH_TEMPLATES[qualityClass] || COACH_TEMPLATES['good'];
    return templates[Math.floor(Math.random() * templates.length)];
}

function getQualityMsg(diff, isMate) {

    const t = LANGS[currentLang];
    if (isMate) return { text: t.mate, class: 'excellent', symbol: '#', color: '#4CAF50' };
    if (diff < 0.1) return { text: t.best, class: 'brilliant', symbol: '!!', color: '#00BCD4' };
    if (diff < 0.3) return { text: t.great, class: 'excellent', symbol: '!', color: '#4CAF50' };
    if (diff < 0.6) return { text: t.good, class: 'good', symbol: '', color: '#8BC34A' };
    if (diff < 1.2) return { text: t.inaccuracy, class: 'inaccuracy', symbol: '?!', color: '#FFEB3B' };
    if (diff < 2.5) return { text: t.mistake, class: 'mistake', symbol: '?', color: '#FF9800' };
    return { text: t.blunder, class: 'blunder', symbol: '??', color: '#F44336' };
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

    if (isPuzzle && typeof renderPuzzleUI === 'function') renderPuzzleUI();

    $('#coach-txt').append(`<br><b style="color:var(--accent)">${isPuzzle ? 'Puzzle ELO' : 'ELO'}: ${newElo}</b>`);
}

// Mobile Move Timeline - Grouped in pairs
function addMoveToTimeline(moveSAN, qualityObj) {
    const mobileTimeline = $('#mobile-move-timeline');
    const desktopTimeline = $('#desktop-move-log');
    if (!moveSAN) return;

    // Reset initial text if exists
    if (desktopTimeline.text().includes('Sin movimientos')) desktopTimeline.empty();

    const history = game.history();
    const moveCount = history.length;
    const isWhite = moveCount % 2 !== 0;
    const turnNumber = Math.ceil(moveCount / 2);
    const moveIndex = moveCount;

    if ($(`.move-chip[data-index="${moveIndex}"]`).length > 0) return;

    let qClass = (qualityObj && qualityObj.class) ? qualityObj.class : 'good';
    let qSymbol = (qualityObj && qualityObj.symbol) ? qualityObj.symbol : '';
    let qText = (qualityObj && qualityObj.text) ? qualityObj.text : 'Buena';

    const moveChip = `<span class="move-chip ${qClass}" data-index="${moveIndex}" title="${qText}" onclick="goToMove(${moveIndex})">${moveSAN}${qSymbol}</span>`;

    const targetContainers = [mobileTimeline, desktopTimeline];

    targetContainers.forEach(container => {
        if (!container.length) return;
        if (isWhite) {
            const pairId = `${container.attr('id')}-pair-${turnNumber}`;
            container.append(`
                <div class="move-pair" id="${pairId}">
                    <span class="move-pair-number">${turnNumber}.</span>
                    ${moveChip}
                </div>
            `);
        } else {
            const pairId = `${container.attr('id')}-pair-${turnNumber}`;
            let pair = container.find(`#${pairId}`);
            if (pair.length === 0) {
                container.append(`<div class="move-pair" id="${pairId}"><span class="move-pair-number">${turnNumber}.</span><span class="move-chip hidden">...</span>${moveChip}</div>`);
            } else {
                pair.append(moveChip);
            }
        }
    });

    highlightActiveMoveChip(moveIndex);

    if (mobileTimeline.length) mobileTimeline.scrollLeft(mobileTimeline[0].scrollWidth);
    if (desktopTimeline.length) desktopTimeline.scrollTop(desktopTimeline[0].scrollHeight);
}


window.goToMove = function (index) {
    if (index < 0 || index >= historyPositions.length) return;
    currentHistoryIndex = index;

    const targetFen = historyPositions[currentHistoryIndex];
    board.position(targetFen);

    const tempGame = new Chess();
    const fullHistory = moveHistoryGlobal || [];
    for (let i = 0; i < currentHistoryIndex; i++) {
        tempGame.move(fullHistory[i]);
    }
    game.load(tempGame.fen());

    // Sync UI
    highlightActiveMoveChip(index);

    // Trigger analysis
    if (stockfish && currentHistoryIndex > 0) {
        stockfish.postMessage('stop');
        stockfish.postMessage('position fen ' + targetFen);
        stockfish.postMessage('go depth 15');
    }

    updateUI(false); // Update visuals without triggering move logic
};

var solvedPuzzles = JSON.parse(localStorage.getItem('chess_solved_puzzles') || '[]');
var puzStats = JSON.parse(localStorage.getItem('chess_puz_stats') || '{}');
var puzHistory = JSON.parse(localStorage.getItem('chess_puz_recent') || '[]');

const PUZZLE_THEMES_ES = {
    'fork': 'Ataque doble', 'pin': 'Clavada', 'skewer': 'Enfilada', 'sacrifice': 'Sacrificio',
    'mate': 'Mate', 'matein2': 'Mate en 2', 'matein1': 'Mate en 1', 'advantage': 'Ventaja',
    'crushing': 'Aplastante', 'opening': 'Apertura', 'middlegame': 'Medio juego', 'endgame': 'Final',
    'long': 'Largo', 'short': 'Corto', 'interference': 'Interferencia', 'attraction': 'Atracción',
    'defensivemove': 'Defensa', 'doublecheck': 'Jaque doble', 'enpassant': 'Al paso',
    'discoveredattack': 'Ataque descubierta', 'quietmove': 'Jugada tranquila', 'zugzwang': 'Zugzwang',
    'underpromotion': 'Sub-promoción', 'vulnerableking': 'Rey expuesto', 'xrayattack': 'Rayos X',
    'advancedpawn': 'Peón avanzado', 'backrankmate': 'Mate pasillo', 'capturingdefender': 'Eliminar defensor',
    'clearance': 'Despeje', 'hangingpiece': 'Pieza colgada', 'hookmate': 'Mate gancho',
    'kingsideattack': 'Flanco de rey', 'queensideattack': 'Flanco de dama', 'overload': 'Sobrecarga',
    'promotion': 'Coronación', 'smotheredmate': 'Mate de la coz', 'trappedpiece': 'Pieza atrapada',
    'onemove': 'Una jugada', 'verylong': 'Muy largo', 'equality': 'Igualdad', 'master': 'Maestro',
    'mastervsmaster': 'Duelo de maestros', 'supergm': 'Súper GM'
};

function getThemeNameES(theme) {
    if (!theme) return "Varios";
    const t = theme.trim();
    // Si contiene espacios, traducir cada palabra individualmente (insensible a mayúsculas)
    if (t.includes(' ')) {
        return t.split(' ').map(word => {
            const lower = word.toLowerCase();
            return PUZZLE_THEMES_ES[lower] || (word.charAt(0).toUpperCase() + word.slice(1));
        }).join(' ');
    }
    const lowerT = t.toLowerCase();
    return PUZZLE_THEMES_ES[lowerT] || t.charAt(0).toUpperCase() + t.slice(1);
}

function updatePuzzleStats(themes, success, rating) {
    if (!themes) return;
    const themeList = themes.split(',').map(t => t.trim());

    themeList.forEach(theme => {
        if (!puzStats[theme]) puzStats[theme] = { attempts: 0, success: 0, ratingSum: 0 };
        puzStats[theme].attempts++;
        if (success) {
            puzStats[theme].success++;
            puzStats[theme].ratingSum += rating;
        }
    });

    if (success) {
        // Guardar en el historial reciente con temas traducidos
        puzHistory.unshift({
            rating: rating,
            themes: themeList.slice(0, 2).map(getThemeNameES).join(', '),
            date: new Date().getTime()
        });
        if (puzHistory.length > 20) puzHistory.pop();
    }

    localStorage.setItem('chess_puz_stats', JSON.stringify(puzStats));
    localStorage.setItem('chess_puz_recent', JSON.stringify(puzHistory));
    renderPuzzleUI();
}

function renderPuzzleUI() {
    $('#puz-elo-display').text(userPuzzleElo + "🧩");

    // Si estamos en modo ejercicios, actualizamos el panel derecho también
    if (currentMode === 'exercises') {
        renderTacticalDashboard();
    }

    // Render Stats (Mini en el menú de configuración)
    let statsHtml = '';
    const sortedThemes = Object.keys(puzStats).sort((a, b) => puzStats[b].attempts - puzStats[a].attempts).slice(0, 6);

    sortedThemes.forEach(theme => {
        const s = puzStats[theme];
        const perc = ((s.success / s.attempts) * 100).toFixed(0);
        const pClass = perc > 70 ? 'high' : (perc < 40 ? 'low' : '');
        statsHtml += `
            <div class="puz-theme-card">
                <span class="puz-theme-name">${getThemeNameES(theme)}</span>
                <span class="puz-theme-perc ${pClass}">${perc}%</span>
            </div>
        `;
    });
    $('#puz-stats-list').html(statsHtml || '<div style="grid-column: 1 / -1; font-size: 0.7rem; color: var(--text-dim); text-align: center;">Resuelve puzzles para ver estadísticas</div>');

    // Render History
    let histHtml = '';
    puzHistory.forEach(item => {
        histHtml += `
            <div class="puz-hist-item">
                <span>${item.themes}</span>
                <span class="puz-hist-rating">${item.rating}</span>
            </div>
        `;
    });
    $('#puz-history-list').html(histHtml || '<div style="font-size: 0.7rem; color: var(--text-dim); text-align: center;">Aún no hay historial</div>');
}

function renderTacticalDashboard(msg) {
    const $panel = $('#tactic-dashboard-container');
    const $mobilePanel = $('#mobile-tactics-stats');
    if (!$panel.length) return;

    // Actualizar Feedback del Puzzle SOLO si se pasa el argumento msg
    // Si msg es undefined, mantenemos lo que hay (para actualizaciones de stats)
    // Si msg es "" o null, limpiamos y ocultamos.
    const $feedbackPanel = $('#puzzle-feedback-panel');
    const $feedbackContent = $('#puzzle-feedback-content');
    const $mobileFeedback = $('#puz-feedback-mobile');

    if (msg !== undefined) {
        if (msg) {
            $feedbackContent.html(msg);
            $feedbackPanel.show();
            if ($mobileFeedback.length) $mobileFeedback.html(msg).show();
        } else {
            $feedbackContent.html("");
            $feedbackPanel.hide();
            if ($mobileFeedback.length) $mobileFeedback.hide();
        }
    }

    let html = ''; // Initialize variable


    // Actualizar ELO en cabeceras
    $('#puz-elo-display, #header-elo-puz, #mobile-tactics-elo').text(userPuzzleElo);

    const themes = Object.keys(puzStats).sort((a, b) => puzStats[b].attempts - puzStats[a].attempts);
    if (themes.length === 0) {
        html += `<div style="text-align:center; padding:20px; color:var(--text-dim); font-size:0.8rem;">Completa puzzles para ver tu progreso analítico.</div>`;
    }

    themes.forEach(theme => {
        const s = puzStats[theme];
        const perc = Math.round((s.success / s.attempts) * 100);
        const avgRating = s.ratingSum > 0 ? Math.round(s.ratingSum / s.success) : "--";

        let colorClass = 'success';
        if (perc < 40) colorClass = 'danger';
        else if (perc < 70) colorClass = 'warning';

        // Traducción simple
        const themeDisplayName = getThemeNameES(theme);

        html += `
            <div class="theme-progress-item">
                <div class="theme-info-row">
                    <span style="font-weight:700;">${themeDisplayName}</span>
                    <span style="color:var(--accent)">Nivel: ${avgRating}</span>
                    <span>${perc}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill ${colorClass}" style="width: ${perc}%"></div>
                </div>
                <div style="font-size:0.6rem; opacity:0.5; margin-top:4px;">${s.success} aciertos de ${s.attempts} intentos</div>
            </div>
        `;
    });

    html += `
            </div>
            <h4 style="margin-top:15px; font-size:0.8rem; color:var(--text-dim);">ÚLTIMA ACTIVIDAD</h4>
            <div class="puz-history-list" style="max-height: 200px; overflow-y:auto;">
    `;

    puzHistory.slice(0, 10).forEach(item => {
        // Asegurar que los temas mostrados en el historial estén traducidos
        const translatedThemes = item.themes.split(/[, ]+/).map(getThemeNameES).join(' ');

        html += `
            <div class="puz-hist-item" style="border-bottom: 1px solid var(--border-light); padding: 8px 0;">
                <div style="display:flex; justify-content:space-between; width:100%;">
                    <span style="font-size:0.7rem;">${translatedThemes}</span>
                    <span class="puz-hist-rating" style="background:var(--bg-side); padding:2px 6px; border-radius:4px;">${item.rating}</span>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    $panel.html(html);

    // Sincronizar con móvil si existe el contenedor
    if ($mobilePanel.length) {
        // En móvil lo hacemos colapsable si lo desea el usuario
        let mobileHtml = `
            <div class="mobile-tactics-collapsible">
                <div class="collapsible-header" onclick="$(this).next().slideToggle()">
                    <span>📈 Ver Estadísticas Detalladas</span>
                    <span class="icon">▼</span>
                </div>
                <div class="collapsible-body" style="display:none; padding-top:10px;">
                    ${html}
                </div>
            </div>
        `;
        $mobilePanel.find('.stats-bars-container').html(html); // Actualizar los datos
    }
    $('#coach-txt').hide();
}


// Initial render
$(document).ready(() => renderPuzzleUI());


// Initial Load or Fallback
var localPuzzles = (typeof LOCAL_PUZZLES_DB !== 'undefined') ? LOCAL_PUZZLES_DB : [];

async function loadRandomPuzzle(retryCount = 0) {
    const cat = $('#puz-cat-sel').val();
    const themesPool = ['fork', 'pin', 'skewer', 'sacrifice', 'mate', 'mateIn2', 'mateIn1', 'advantage', 'crushing', 'opening', 'middlegame', 'endgame', 'long', 'short', 'hangingPiece', 'discoveredAttack', 'kingsideAttack', 'queensideAttack', 'doubleCheck', 'vulnerableKing', 'trappedPiece'];

    if (retryCount === 0) {
        clearInterval(puzTimerInterval);
        puzSeconds = 0;
        $('#puz-timer, #puz-timer-main').text("00:00").css('color', 'var(--accent)');
        puzTimerInterval = setInterval(() => {
            puzSeconds++;
            $('#puz-timer, #puz-timer-main').text(formatTime(puzSeconds));
        }, 1000);

        // Limpiar feedback anterior al empezar nuevo puzzle
        renderTacticalDashboard("");
    }

    if (retryCount > 6) {
        $('#puz-desc, #puz-desc-main').html("<b style='color:#ef4444'>❌ Error:</b> No se pudieron cargar puzzles.");
        clearInterval(puzTimerInterval);
        return;
    }

    $('#puz-desc, #puz-desc-main').html("<span style='color:var(--accent)'>🧩 Cargando reto...</span>");

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
        historyPositions = [game.fen()];
        currentHistoryIndex = 0;
        board.position(game.fen());
        myColor = game.turn(); // El usuario siempre mueve el siguiente turno
        board.orientation(myColor === 'w' ? 'white' : 'black');

        setTimeout(syncSquaresWithData, 200); // Asegurar que las casillas tengan data-square para los puntos de ayuda

        $('#puz-desc, #puz-desc-main').html(`
            <div style="color:var(--accent); font-weight:bold; margin-bottom:4px;">Tu turno (${currentPuzzle.rating})</div>
            <div style="color:#3b82f6; font-size:0.6rem; text-transform:uppercase; font-weight:800;">${(currentPuzzle.themes || "").split(',').slice(0, 2).map(getThemeNameES).join(', ')}</div>
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
        if (l === 'uciok') {
            console.log("✅ Stockfish UCI OK");
            stockfish.postMessage('setoption name MultiPV value 3');
        }
        if (l === 'readyok') console.log("✅ Stockfish Ready");

        // Cache results if depth is high enough
        if (l.includes('depth 18') || l.includes('depth 15')) {
            const currentFen = game.fen();
            if (!analysisCache.has(currentFen)) {
                // We could store the raw messages or just the final evaluation
                // For now, let's just make the handling modular
                analysisCache.set(currentFen, l);
            }
        }

        handleStockfishAnalysis(l);
    };
} catch (e) {
    console.error("❌ Error cargando Stockfish:", e);
}

function handleStockfishAnalysis(l) {
    if (typeof l !== 'string') return; // For cached objects we might need a different handling or just cache the messages

    // 1. PROCESAR EVALUACIÓN (MultiPV)
    if (l.includes('multipv')) {
        var depthMatch = l.match(/depth (\d+)/);
        if (depthMatch) $('#eval-depth').text(depthMatch[1]);

        var pvMatch = l.match(/multipv (\d+)/);
        var cpMatch = l.match(/score cp (-?\d+)/);
        var mateMatch = l.match(/score mate (-?\d+)/);
        var pvMoves = l.split(' pv ')[1];

        if (pvMatch && (cpMatch || mateMatch)) {
            var idx = parseInt(pvMatch[1]);
            var scoreCp = cpMatch ? parseInt(cpMatch[1]) / 100 : 0;
            var ev = cpMatch ? (game.turn() === 'w' ? scoreCp : -scoreCp) : (mateMatch[1].startsWith('-') ? -100 : 100);
            var scoreStr = cpMatch ? ev.toFixed(1) : ('M' + mateMatch[1]);
            var firstMove = pvMoves ? pvMoves.split(' ')[0] : '...';

            if (idx === 1) {
                window.currentEval = ev;
                const depth = depthMatch ? parseInt(depthMatch[1]) : 0;
                const isNewMove = window.isNewMoveAnalysis || false;
                const isMate = l.includes('mate');

                if (isNewMove) {
                    window.coachUpdateLocked = false;
                    window.isNewMoveAnalysis = false;
                    const initialQuality = { text: "Analizando...", class: "good", color: "#ccc", symbol: "⏳" };
                    const initialTheory = detectOpeningTheory();
                    updateCoachDashboard(initialQuality, initialTheory, "Calculando variantes...", firstMove, ev, isMate, true);
                }

                if (depth >= 12 && !window.coachUpdateLocked) {
                    window.coachUpdateLocked = true;
                    var diff = 0;
                    if (window.lastEval !== undefined) {
                        const turn = game.turn();
                        diff = (turn === 'b') ? (window.lastEval - ev) : (ev - window.lastEval);
                    }
                    window.stableLastEval = ev;

                    const quality = getQualityMsg(Math.abs(diff), isMate);
                    const theoryInfo = detectOpeningTheory();
                    const tacticalAdvice = generateTacticalAdvice(diff, ev, isMate);

                    // Defer non-critical dashboard updates
                    scheduleUIUpdate('low', () => {
                        updateCoachDashboard(quality, theoryInfo, tacticalAdvice, firstMove, ev, isMate, true);
                        updateMaestroInsight(theoryInfo);
                    });
                }
            }

            if (!window.topMoves) window.topMoves = [];
            window.topMoves[idx - 1] = { move: firstMove, score: scoreStr };

            // Asynchronous rendering of top moves
            updateBestMovesAsync();
        }
    }


    if (openingSubMode === 'training' && currentOpening) {
        // IA follows the opening theory
        const moves = currentOpening.moves || currentOpening.m || [];
        const historyLen = game.history().length;
        if (historyLen < moves.length) {
            const theoryMove = moves[historyLen];
            const m = game.move(theoryMove);
            if (m) {
                board.position(game.fen());
                playSnd('move');
                updateUI(true);
                return;
            }
        }
    }

    // 2. PROCESAR MOVIMIENTO DE LA IA (Modo Normal)
    if (l.startsWith('bestmove') && currentMode === 'ai' && game.turn() !== myColor) {
        var bestMove = l.split(' ')[1];
        if (bestMove === '(none)') return;

        // Dificultad REAL: Calcular blunder chance basado en nivel
        const diffLvl = typeof gameConfig !== 'undefined' ? gameConfig.difficulty : 5;
        let blunderChance = 0;

        if (diffLvl <= 0) blunderChance = 0.65; // Principiante: 65% fallos
        else if (diffLvl === 1) blunderChance = 0.50;
        else if (diffLvl === 2) blunderChance = 0.40;
        else if (diffLvl === 3) blunderChance = 0.25;
        else if (diffLvl === 4) blunderChance = 0.15;
        else if (diffLvl === 5) blunderChance = 0.08;
        else if (diffLvl < 10) blunderChance = 0.04;

        if (Math.random() < blunderChance) {
            console.log("🎲 IA provocando error intencionado (Nivel " + diffLvl + ")");
            const legalMoves = game.moves({ verbose: true });
            if (legalMoves.length > 0) {
                // Elegir un movimiento aleatorio pero filtrar los "mejores" para asegurar un error
                // O simplemente uno aleatorio si estamos en nivel muy bajo
                const randomM = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                bestMove = randomM.from + randomM.to + (randomM.promotion || '');
            }
        }

        // Pausa humana: La IA espera un momento antes de mover para no generar ansiedad
        const thinkDelay = diffLvl < 5 ? 1800 : 1200; // Más pausa en niveles bajos

        setTimeout(() => {
            const moveObj = game.move({ from: bestMove.substring(0, 2), to: bestMove.substring(2, 4), promotion: 'q' });
            if (moveObj) {
                board.position(game.fen());
                updateUI(true);
                updateMaestroInsight(detectOpeningTheory());

                // Almacenar calidad si estamos en modo análisis (o IA)
                if (window.lastMoveQuality) {
                    moveQualityHistory.push(window.lastMoveQuality);
                }

                checkGameOver();
            }
            aiThinking = false;
        }, thinkDelay);
    }
}


/**
 * Motor de Detección de Aperturas Avanzado
 */
function detectOpeningTheory() {
    const history = game.history();
    const historySAN = history.join(' ');
    const historyLAN = history.map((m, i) => {
        try {
            const temp = new Chess();
            // Try to detect if the game started from a custom FEN
            // If currentMode is exercises, it definitely did.
            if (currentMode === 'exercises' && currentPuzzle) {
                temp.load(currentPuzzle.fen);
            }

            for (let j = 0; j < i; j++) temp.move(history[j]);
            const move = temp.move(m);
            return move ? (move.from + move.to) : "";
        } catch (e) {
            return "";
        }
    }).filter(x => x !== "").join(' ');

    let match = { name: "Posición Personalizada", comments: ["Analizando estructura de piezas..."] };

    // 1. Check SAN-style from knowledge base
    if (typeof MAESTRO_KNOWLEDGE !== 'undefined' && MAESTRO_KNOWLEDGE.eco) {
        const key = historySAN;
        if (MAESTRO_KNOWLEDGE.eco[key]) {
            match = { name: MAESTRO_KNOWLEDGE.eco[key], comments: ["Línea teórica principal."] };
        }
    }

    // 2. Check Enhanced Database
    if (typeof OPENINGS_DATA !== 'undefined') {
        for (const group of OPENINGS_DATA) {
            for (const item of group.items) {
                const moves = item.moves || item.m || [];
                const openingMoves = moves.join(' ');
                if (historySAN === openingMoves) {
                    return { name: item.name, comments: item.comments || ["Variante teórica principal."], isExact: true };
                } else if (historySAN.startsWith(openingMoves) || openingMoves.startsWith(historySAN)) {
                    if (history.length <= moves.length) {
                        match = { name: item.name, comments: item.comments || ["Desarrollando apertura..."], isExact: false };
                    }
                }
            }
        }
    }
    return match;
}

/**
 * Generador de Lenguaje Natural para el Entrenador
 */
function generateTacticalAdvice(diff, ev, isMate) {
    if (isMate) return "🎯 Hay una red de mate en esta posición.";

    const absDiff = Math.abs(diff);

    // Priorizar narrativa de variantes y estructura
    const theory = detectOpeningTheory();
    const history = game.history();

    if (history.length < 15 && theory.name !== "Posición Personalizada") {
        return `🎓 En esta variante de la ${theory.name}, el plan suele centrarse en la estructura de peones y el desarrollo armónico.`;
    }

    if (absDiff > 2.0) return "⚠️ Has permitido una variante muy favorable para el rival. Revisa el plan estratégico.";
    if (absDiff > 0.8) return "📉 Imprecisión teórica. Estás desviándote de la línea principal de esta defensa.";

    if (Math.abs(ev) < 0.5) return "⚖️ Posición teóricamente equilibrada. Ambos bandos mantienen sus ventajas dinámicas.";
    if (ev > 1.5) return "📈 Tu posición es superior. El rival está sufriendo para encontrar variantes de defensa.";
    if (ev < -1.5) return "📉 El rival ha logrado consolidar una mejor variante defensiva.";

    return "🧩 Posición sólida. Desarrolla tus piezas buscando variantes centrales.";
}

function updateCoachDashboard(quality, theory, tactical, bestMove, ev, isMate, moved = false) {
    const currentFen = game.fen();
    // 1. Detección de Apertura
    $('#maestro-opening-name').text(theory.name || "Posición Inicial");

    // Show opening info or analysis in the description box
    let descText = theory.comments ? theory.comments[0] : (theory.name ? "Línea teórica detectada." : "Analizando estructura de peones...");
    $('#maestro-plan').text(descText);

    // Preparar variables de calidad antes del sistema de estabilidad
    const qText = quality.text || "Analizando...";
    const qClass = quality.class || "good";
    const symbol = quality.symbol || "";

    // --- SISTEMA DE ESTABILIDAD (THROTTLE) ---
    const now = Date.now();
    // No actualizar el texto más de una vez cada 2 segundos, a menos que sea un movimiento nuevo
    const shouldUpdateText = (moved || !window.lastCoachTextUpdateTime || (now - window.lastCoachTextUpdateTime > 1500));

    if (shouldUpdateText) {
        window.lastCoachTextUpdateTime = now;

        const $coachTxt = $('#coach-txt');

        // Use quick template if analysis is still in progress
        let displayedTactical = tactical;
        if (tactical === "Calculando variantes..." || !tactical) {
            displayedTactical = getQuickCoachComment(qClass);
        }

        let logHtml = `<div class="quality-label ${qClass}" style="margin-bottom:10px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:8px;" onclick="showMoveType('${qText}')">
            <span style="background:${quality.color}; color:#000; padding:2px 6px; border-radius:4px; font-size:0.8rem;">${symbol}</span>
            <span>${qText}</span>
        </div>`;
        logHtml += `<div style="font-size:0.9em; opacity:0.9; line-height:1.4;" id="coach-tactical-text">${displayedTactical}</div>`;

        $coachTxt.html(logHtml);
    }



    // AI GENERATIVA: Solo si la profundidad es suficiente y no estamos ya procesando
    if (window.aiConfig?.enabled && window.aiConfig?.apiKey && lastAIProcessedMove !== currentFen) {
        if (!moved) {
            const lastMove = game.history({ verbose: true }).pop();
            const lastMoveSan = lastMove ? lastMove.san : null;
            lastAIProcessedMove = currentFen;

            enhanceCoachWithAI(quality, theory, tactical, currentFen, lastMoveSan, ev).then(aiExplanation => {
                if (aiExplanation) {
                    const $target = $('#coach-tactical-text');
                    if ($target.length) {
                        $target.html(`<div style="background:rgba(33,150,243,0.1); padding:10px; border-radius:8px; border-left:3px solid var(--accent); margin-top:10px;">
                            <div style="font-size:0.7rem; opacity:0.6; margin-bottom:5px;">🤖 EXPLICACIÓN IA</div>
                            ${aiExplanation}
                        </div>`);
                    }
                }
            }).catch(err => console.error('AI Error:', err));
        }
    }

    // 3. Sistema de Amenazas (FASE 1)
    if (Math.abs(ev) > 1.5 || isMate) {
        const side = ev > 0 ? 'Blancas' : 'Negras';
        const severity = Math.abs(ev) > 4 ? 'CRÍTICA' : 'IMPORTANTE';
        $('#threats-panel').fadeIn();
        $('#threats-list').html(`<span style="color:#ef4444;">[${severity}]</span> Ventaja decisiva para ${side}. <br> <small>Próxima mejor jugada: ${bestMove}</small>`);
    } else {
        if ($('#threats-panel').length) $('#threats-panel').fadeOut();
    }

    // 4. FLECHAS INTELIGENTES
    if (hintsActive && window.showBestMoves) {
        drawBestMoveArrow(bestMove, '#4CAF50');
        if (quality.class === 'blunder' && window.topMoves && window.topMoves[0]) {
            setTimeout(() => {
                if (window.showBestMoves) drawBestMoveArrow(window.topMoves[0].move, '#F44336');
            }, 1000);
        }
    } else {
        clearArrowCanvas();
    }

    // Guardar en historial detallado (Permitir sobrescribir para actualizar calidad)
    const history = game.history();
    const moveIndex = history.length;
    if (moveIndex > 0 && typeof moveHistoryDetails !== 'undefined') {
        moveHistoryDetails[moveIndex] = {
            san: history[moveIndex - 1],
            quality: quality,
            theory: theory,
            tactical: tactical
        };
        if (typeof renderMoveHistory === 'function') renderMoveHistory();
    }

    // 5. Evaluación Visual
    if (window.currentEval !== undefined) {
        const barW = Math.max(5, Math.min(95, 50 + (ev * 10)));
        $('#eval-bar-fill, #mobile-eval-fill').css('width', barW + '%');
        $('#eval-text-overlay, #mobile-eval-text').text((ev > 0 ? '+' : '') + ev.toFixed(1));

        const acc = Math.max(60, 100 - (Math.abs(ev) * 5)).toFixed(0);
        $('#eval-accuracy, #mobile-accuracy').text(acc + "%");
    }

    // 6. INFO RÁPIDA MÓVIL (SISTEMA ESTABLE)
    if (shouldUpdateText) {
        const stableOpening = theory.name || "Apertura Abierta";
        const stablePlan = theory.comments ? theory.comments[0] : (theory.trap ? "🚨 ¡CUIDADO! Trampa detectada." : tactical);

        $('#mobile-opening-quick').text(stableOpening);
        const $mobCoach = $('#mobile-coach-quick');
        if (theory.trap) $mobCoach.css('color', 'var(--trap-color)');
        else $mobCoach.css('color', '');
        $mobCoach.text(stablePlan);
    }

    // Actualizar logs móviles
    let mobileLogHtml = `<div class="quality-label ${qClass}">${qText}</div><p>${tactical}</p>`;
    $('#mobile-coach-logs').html(mobileLogHtml);

    // 7. ACTUALIZAR GRÁFICO DE EVALUACIÓN (Async)
    if (window.currentEval !== undefined) {
        if (evalHistory[evalHistory.length - 1] !== window.currentEval || moved) {
            evalHistory.push(window.currentEval);
            if (evalHistory.length > 200) evalHistory.shift();
            updateEvalChartAsync();
        }
    }


    // 8. Feedback visual en móvil mediante Toasts
    if (window.innerWidth <= 768) {
        const lastMoveObj = game.history({ verbose: true }).pop();
        if (lastMoveObj) {
            if (['brilliant', 'excellent', 'blunder', 'mistake'].includes(quality.class)) {
                setTimeout(() => {
                    let icon = quality.symbol || "ℹ️";
                    if (quality.class === 'brilliant') icon = "💎";
                    if (quality.class === 'blunder') icon = "💀";
                    showToast(`${qText}`, icon, 'coach');
                }, 600);
            }
        }
    }

    let finalQuality = quality;
    if (theory.isExact) {
        finalQuality = { text: LANGS[currentLang].book, class: 'book', symbol: '📖' };
    }
    const lastM = game.history({ verbose: true }).pop();
    if (lastM) addMoveToTimeline(lastM.san, finalQuality);
}

// VISUAL SETTINGS
window.showBestMoves = true;

window.toggleBestMoves = function (val) {
    window.showBestMoves = val;
    // Sync all toggles
    $('#toggle-best-moves, #sidebar-toggle-best-moves, #mobile-toggle-best-moves').prop('checked', val);

    if (val) {
        $('#best-moves-list, #mobile-best-moves').show();
        updateTopMovesUI();
    } else {
        $('#best-moves-list, #mobile-best-moves').hide();
        clearArrowCanvas();
    }
};

window.applySuggestedMove = function (lan) {
    if (!lan || lan.length < 4) return;

    // Only allow if it's player's turn or we are in analysis/study mode
    const isPlayerTurn = game.turn() === myColor;
    const isFreeMode = currentMode === 'study' || currentMode === 'pass-and-play' || currentMode === 'local' && !gameId;

    if (currentMode === 'ai' && !isPlayerTurn) {
        showToast('Espera tu turno', 'clock');
        return;
    }

    const from = lan.substring(0, 2);
    const to = lan.substring(2, 4);
    const promo = lan.length > 4 ? lan[4] : 'q';

    const m = game.move({ from: from, to: to, promotion: promo });
    if (m) {
        board.position(game.fen());
        playSnd('move');
        updateUI(true);

        // If vs AI, trigger response
        if (currentMode === 'ai' && game.turn() !== myColor) {
            makeAIMove();
        }
    }
};

function updateTopMovesUI() {
    if (!window.showBestMoves) return; // Respect toggle
    if (!window.topMoves) return;
    let html = '';
    window.topMoves.forEach((m, i) => {
        if (!m) return;
        html += `
            <div class="move-item" onclick="applySuggestedMove('${m.move}')" style="cursor:pointer;" title="Haz clic para jugar este movimiento">
                <span><b style="color:var(--text-dim)">${i + 1}.</b> ${m.move}</span>
                <span style="color:var(--primary); font-weight:800">${m.score > 0 ? '+' : ''}${m.score}</span>
            </div>
        `;
    });
    $('#best-moves-list').html(html || '<div class="move-item placeholder">Calculando...</div>');
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
        setTimeout(() => alert("Fin de la partida: " + msgText), 100);
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

// --- HISTORY SYSTEM ---
var moveHistoryGlobal = [];
var moveHistoryDetails = []; // [{san, quality, theory, tactical}]

function renderMoveHistory() {
    const list = $('#move-history-list');
    if (list.length === 0) return;

    let html = '<table class="history-table"><tbody>';
    const history = game.history();

    for (let i = 0; i < history.length; i += 2) {
        const turnNum = Math.floor(i / 2) + 1;
        const wIdx = i + 1;
        const bIdx = i + 2;

        const wMove = history[i];
        const bMove = history[i + 1] || '';

        const wDet = moveHistoryDetails[wIdx] || {};
        const bDet = moveHistoryDetails[bIdx] || {};

        const wClass = wDet.quality ? wDet.quality.class : '';
        const bClass = bDet.quality ? bDet.quality.class : '';

        const wSymbol = wDet.quality ? wDet.quality.symbol : '';
        const bSymbol = bDet.quality ? bDet.quality.symbol : '';

        html += `
            <tr class="history-row">
                <td class="history-num">${turnNum}.</td>
                <td class="history-move ${wClass}" data-idx="${wIdx}" onclick="goToMove(${wIdx})">${wMove}<span class="history-sym">${wSymbol}</span></td>
                <td class="history-move ${bClass}" data-idx="${bIdx}" onclick="goToMove(${bIdx})">${bMove}<span class="history-sym">${bSymbol}</span></td>
            </tr>
        `;
    }
    html += '</tbody></table>';
    list.html(html);

    highlightActiveHistoryMove(currentHistoryIndex);
}

function highlightActiveHistoryMove(index) {
    $('.history-move').removeClass('active-hist');
    if (index > 0) {
        $(`.history-move[data-idx="${index}"]`).addClass('active-hist');
    }
}

window.showMoveType = function (qText) {
    showToast(`Análisis del Maestro: ${qText}`, '🎓');
};

function highlightActiveMoveChip(index) {
    $('.move-chip').removeClass('active-move');
    $(`.move-chip[data-index="${index}"]`).addClass('active-move');
    highlightActiveHistoryMove(index);
}

function navigateHistory(dir) {
    if (historyPositions.length <= 1) return;

    if (dir === 'first') currentHistoryIndex = 0;
    else if (dir === 'last') currentHistoryIndex = historyPositions.length - 1;
    else if (dir === 'prev') currentHistoryIndex = Math.max(0, currentHistoryIndex - 1);
    else if (dir === 'next') currentHistoryIndex = Math.min(historyPositions.length - 1, currentHistoryIndex + 1);

    // Unified logic: we always use historyPositions and moveHistoryGlobal
    const targetFen = historyPositions[currentHistoryIndex];
    if (!targetFen) return;

    board.position(targetFen);

    // Logic state adjustment
    const tempG = new Chess();
    const all = moveHistoryGlobal || [];
    for (let i = 0; i < currentHistoryIndex; i++) {
        if (all[i]) tempG.move(all[i]);
    }
    game.load(tempG.fen());

    highlightActiveMoveChip(currentHistoryIndex);
    updateUI(false);
    // Trigger Stockfish analysis
    if (stockfish && currentHistoryIndex > 0) {
        stockfish.postMessage('stop');
        stockfish.postMessage('position fen ' + targetFen);
        stockfish.postMessage('go depth 15');
    }

    if (openingSubMode) syncOpeningSubModeUI();
}

function updateHistory() {
    historyPositions.push(game.fen());
    const history = game.history();
    if (history.length > 0) {
        moveHistoryGlobal.push(history[history.length - 1]);
    }
    currentHistoryIndex = historyPositions.length - 1;
}

window.switchSideTab = function (tab) {
    $('.tab-content').hide().removeClass('active');
    $('.tab-btn').removeClass('active');

    // Mapeo selectivo si los IDs difieren
    let targetId = 'tab-' + tab;
    if (tab === 'exercises') {
        setMode('exercises');
        loadRandomPuzzle();
        targetId = 'tab-play'; // Puzzles está dentro de tab-play mode-section
    }

    $(`#${targetId}`).show().addClass('active');
    $(`button[onclick*="'${tab}'"]`).addClass('active');

    // Forzar scroll arriba
    $('.sidebar-tabs-content').scrollTop(0);
};

window.inviteFriend = function () {
    const url = window.location.href;
    const text = `🏆 ¡Te reto a una partida de ajedrez en Chess Tricks! Juega conmigo aquí: ${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
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

let uiUpdateQueue = [];
let uiUpdateScheduled = false;
let lastUpdateTime = 0;

function scheduleUIUpdate(priority = 'normal', callback) {
    uiUpdateQueue.push({ priority, callback, time: Date.now() });

    // Ordenamos por prioridad: critical > high > normal > low
    const priorityMap = { 'critical': 4, 'high': 3, 'normal': 2, 'low': 1 };

    uiUpdateQueue.sort((a, b) => (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0));

    if (!uiUpdateScheduled) {
        uiUpdateScheduled = true;
        requestAnimationFrame(processUIQueue);
    }
}

function processUIQueue() {
    const frameStart = performance.now();
    const FRAME_BUDGET = 12;

    while (uiUpdateQueue.length > 0) {
        const elapsed = performance.now() - frameStart;
        if (elapsed > FRAME_BUDGET) {
            requestAnimationFrame(processUIQueue);
            return;
        }

        const task = uiUpdateQueue.shift();
        try {
            if (task && typeof task.callback === 'function') {
                task.callback();
            }
        } catch (e) {
            console.error('UI Update Error:', e);
        }
    }
    uiUpdateScheduled = false;
    lastUpdateTime = performance.now();
}

// ASYNC HELPER FUNCTIONS FOR PERFORMANCE
function updateBestMovesAsync() {
    if (!window.showBestMoves || !window.topMoves) return;

    const renderTask = () => {
        let html = '';
        window.topMoves.forEach((m, i) => {
            if (!m) return;
            const scoreVal = parseFloat(m.score);
            const scoreColor = isNaN(scoreVal) ? 'var(--text-dim)' : (scoreVal >= 0 ? 'var(--accent)' : '#ff6b6b');

            html += `
                <div class="move-item" onclick="applySuggestedMove('${m.move}')">
                    <span><b style="color:var(--text-dim)">${i + 1}.</b> ${m.move}</span>
                    <span style="color:${scoreColor}; font-weight:800">${m.score.startsWith('M') ? m.score : (scoreVal > 0 ? '+' : '') + m.score}</span>
                </div>
            `;
        });

        const desktopEl = document.getElementById('best-moves-list');
        const mobileEl = document.getElementById('mobile-best-moves');

        if (desktopEl) desktopEl.innerHTML = html || '<div class="move-item placeholder">Calculando...</div>';
        if (mobileEl) {
            mobileEl.innerHTML = html || '<div class="move-item placeholder">Calculando...</div>';
            mobileEl.className = 'moves-list'; // Ensure it has the PC class
        }
    };


    if (window.requestIdleCallback) window.requestIdleCallback(renderTask, { timeout: 1000 });
    else scheduleUIUpdate('low', renderTask);
}

function updateEvalChartAsync() {
    if (!evalHistory || evalHistory.length < 2) return;

    const renderTask = () => {
        if (typeof drawEvalChart === 'function') {
            drawEvalChart('evalChart');
            drawEvalChart('evalChartMobile');
        }
    };

    if (window.requestIdleCallback) window.requestIdleCallback(renderTask, { timeout: 2000 });
    else scheduleUIUpdate('low', renderTask);
}

function updateCoachCommentAsync(qClass) {
    const renderTask = () => {
        const lastMove = game.history({ verbose: true }).pop();
        if (!lastMove) return;

        // This is a placeholder for the logic that usually lives in updateCoachDashboard
        // We ensure it runs without blocking the main thread
        if (typeof updateCoachDashboard === 'function') {
            // We might need to pass parameters or use globals
            // For now, let's just ensure the dashboard refreshes correctly
        }
    };

    if (window.requestIdleCallback) window.requestIdleCallback(renderTask, { timeout: 1500 });
    else scheduleUIUpdate('low', renderTask);
}



function updateUI(moved = false) {
    // 1. Immediate Visuals (Direct execution)
    if (board && game) board.position(game.fen());

    // Clean up previous highlights
    $('.square-55d63').removeClass('highlight-selected highlight-hint highlight-last-move');
    $('.legal-dot').remove();

    if (typeof initializeArrowCanvas === 'function') initializeArrowCanvas();

    // 2. Timeline & Highlights
    const history = game.history({ verbose: true });
    if (history.length > 0) {
        const lastM = history[history.length - 1];
        $(`.square-${lastM.from}`).addClass('highlight-last-move');
        $(`.square-${lastM.to}`).addClass('highlight-last-move');

        // UPDATE TIMELINE Direct call
        if (typeof addMoveToTimeline === 'function') {
            addMoveToTimeline(lastM, 'current');
        }
    }

    updateMaterial();
    updateHistory(); // Internal state update

    if (typeof highlightActiveMoveChip === 'function') {
        highlightActiveMoveChip(currentHistoryIndex);
    }

    // 3. Mode Context Check
    if (currentMode === 'exercises') {
        $('.panel-section').not('#sec-exercises').hide();
        $('.panel-tabs, .tab-content').hide();
        $('.opening-info, .evaluation-viz, .top-moves').hide();
        $('#sec-exercises').show();
        $('.player-info').hide();
        $('#eval-bar-fill, #mobile-eval-fill').css('width', '50%');
        $('#eval-text-overlay, #mobile-eval-text').text('0.0');
    } else {
        // Analysis & Charts (Can stay async if helpers exist, else safe check)
        if (currentMode === 'ai' || currentMode === 'study') {
            if (typeof updateBestMovesAsync === 'function') updateBestMovesAsync();
            if (typeof updateEvalChartAsync === 'function') updateEvalChartAsync();
        }

        $('.panel-section').show();
        $('.panel-tabs').show();
        $('.tab-content.active').show();
        $('.player-info').show();
        $('#sec-exercises').hide();
    }

    if (currentMode !== 'local' || gameId) {
        $('#board-layout').css('display', 'flex');
    }

    // 4. Coach Comments (Safe Check)
    if (window.showCoachMessages && typeof updateCoachCommentAsync === 'function') {
        updateCoachCommentAsync();
    }

    // 5. GAME LOGIC TRIGGERS
    if (moved) {
        // Visual/Audio Feedback
        if (navigator.vibrate) {
            if (game.in_check()) navigator.vibrate([100, 50, 100]);
            else navigator.vibrate(50);
        }

        const lastMove = game.history({ verbose: true }).pop();
        if (game.in_check()) playSnd('check');
        else if (lastMove && lastMove.flags.includes('c')) playSnd('capture');
        else playSnd('move');

        // Logic Updates
        if (!gameStarted && currentMode !== 'exercises' && currentMode !== 'study') startClock();
        if (currentMode !== 'exercises' && currentMode !== 'study') updateTimerVisuals();

        if (window.stableLastEval !== undefined) {
            window.lastEval = window.stableLastEval;
        }

        // STOCKFISH TRIGGER
        const fen = game.fen();
        if (analysisCache.has(fen)) {
            handleStockfishAnalysis(analysisCache.get(fen));
        } else if (stockfish && (currentMode === 'ai' || hintsActive)) {
            window.isNewMoveAnalysis = true;
            window.coachUpdateLocked = false;
            stockfish.postMessage('stop');
            stockfish.postMessage('position fen ' + fen);

            // Logic for AI move vs Analysis
            const diff = parseInt($('#diff-sel').val()) || 5;
            if (currentMode === 'ai' && game.turn() !== myColor) {
                const aiDepth = diff >= 20 ? 22 : (diff + 2);
                stockfish.postMessage('go depth ' + aiDepth);
            } else {
                stockfish.postMessage('go depth 18');
            }
        }
    }
}





function getPieceTheme(piece) {
    try {
        const el = $('#piece-theme-sel');
        const theme = (el.length ? el.val() : null) || localStorage.getItem('chess_piece_theme') || 'wikipedia';

        if (theme === 'alpha' || theme === 'uscf') {
            // Lichess standard set in official CDN
            return 'https://lichess1.org/assets/piece/standard/' + theme + '/' + piece + '.svg';
        }
        return 'https://raw.githubusercontent.com/oakmac/chessboardjs/master/website/img/chesspieces/wikipedia/' + piece + '.png';
    } catch (e) {
        return 'https://raw.githubusercontent.com/oakmac/chessboardjs/master/website/img/chesspieces/wikipedia/' + piece + '.png';
    }
}

function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;
    if (typeof aiThinking !== 'undefined' && aiThinking) return false;

    // ✅ NUEVA VALIDACIÓN: En modo AI/Maestro, solo permite mover TUS piezas
    const isLocalPure = currentMode === 'pass-and-play' || currentMode === 'exercises' || currentMode === 'academy' || (!gameId && currentMode === 'local');

    if (!isLocalPure && piece.charAt(0) !== myColor) {
        showToast('🚫 No puedes mover piezas del rival en línea', 'error');
        return false;
    }

    // En modo AI/Maestro con auto-move activado, bloquear turno del rival
    if (currentMode === 'ai' || currentMode === 'maestro') {
        if (opponentAutoMode && game.turn() !== myColor) {
            showToast('Es el turno de la IA', 'info');
            return false;
        }
    }

    // En modo ejercicios, siempre permitir mover si es el turno de la pieza
    if (currentMode === 'exercises') {
        if (game.turn() !== piece.charAt(0)) {
            // Usamos una versión local de feedback para evitar el toast
            const sideMsg = `<b style="color:var(--accent)">⏳ TURNO PENDIENTE</b><br><span style="font-size:0.8rem">Primero debe mover la IA el movimiento del puzzle.</span>`;
            renderTacticalDashboard(sideMsg);
            return false;
        }
        return true;
    }

    if (game.turn() !== piece.charAt(0)) return false;
    return true;
}

function drawBestMoveArrow(moveLAN, color) {
    if (!hintsActive || !moveLAN) return;

    const cvs = document.getElementById('arrowCanvas');
    if (!cvs) return;
    cvs.style.display = 'block';

    const boardDiv = document.getElementById('myBoard');
    if (!boardDiv) return;

    const rect = boardDiv.getBoundingClientRect();
    cvs.width = rect.width;
    cvs.height = rect.height;
    // Positioning absolute inside relative container
    cvs.style.top = '0px';
    cvs.style.left = '0px';
    cvs.style.pointerEvents = 'none';

    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    const sqSize = cvs.width / 8;
    const from = moveLAN.substring(0, 2);
    const to = moveLAN.substring(2, 4);

    const cols = 'abcdefgh';
    const rows = '87654321';
    const isWhite = board.orientation() === 'white';

    const colIdxFrom = isWhite ? cols.indexOf(from[0]) : 7 - cols.indexOf(from[0]);
    const rowIdxFrom = isWhite ? rows.indexOf(from[1]) : 7 - rows.indexOf(from[1]);

    const colIdxTo = isWhite ? cols.indexOf(to[0]) : 7 - cols.indexOf(to[0]);
    const rowIdxTo = isWhite ? rows.indexOf(to[1]) : 7 - rows.indexOf(to[1]);

    const x1 = colIdxFrom * sqSize + sqSize / 2;
    const y1 = rowIdxFrom * sqSize + sqSize / 2;
    const x2 = colIdxTo * sqSize + sqSize / 2;
    const y2 = rowIdxTo * sqSize + sqSize / 2;

    ctx.beginPath();
    ctx.strokeStyle = color || '#fbbf24'; // Use passed color or default yellow
    if (moveLAN.includes('mate')) ctx.strokeStyle = '#ef4444'; // Red if mate

    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.8;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 15 * Math.cos(angle - Math.PI / 6), y2 - 15 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - 15 * Math.cos(angle + Math.PI / 6), y2 - 15 * Math.sin(angle + Math.PI / 6));
    ctx.fill();
}

function initializeArrowCanvas() {
    const cvs = document.getElementById('arrowCanvas');
    if (!cvs) return;

    const boardDiv = document.getElementById('myBoard');
    if (!boardDiv) return;

    const rect = boardDiv.getBoundingClientRect();
    cvs.width = rect.width;
    cvs.height = rect.height;
}

function clearArrowCanvas() {
    const cvs = document.getElementById('arrowCanvas');
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);
}

function onSnapEnd() {
    board.position(game.fen());
    syncSquaresWithData(); // Siempre sincronizar tras movimiento manual
}

function syncSquaresWithData() {
    $('.square-55d63').each(function () {
        const sq = $(this).attr('class').split(' ').find(c => c.length === 9 && c.includes('square-')).split('-')[1];
        if (sq) $(this).attr('data-square', sq);
    });
}

function handlePuzzleMove(move) {
    if (!currentPuzzle) {
        console.warn("⚠️ No hay puzzle activo.");
        return 'snapback';
    }

    const expectedMove = currentPuzzle.sol[puzzleStep];
    if (!expectedMove) return 'snapback';

    // Normalizar formato para comparación
    // Tomamos solo origen y destino (4 chars) primero
    const playerMoveBase = move.from + move.to;
    const expectedMoveBase = expectedMove.substring(0, 4);

    // Caso especial: Promoción
    let isCorrect = false;
    if (playerMoveBase === expectedMoveBase) {
        if (expectedMove.length > 4) {
            // El puzzle espera promoción, verificamos si el jugador la envió (o usamos 'q' por defecto)
            const playerPromo = move.promotion || 'q';
            if (playerPromo === expectedMove[4]) isCorrect = true;
        } else {
            // El puzzle NO espera promoción
            isCorrect = true;
        }
    }

    console.log(`🧩 Tácticas: ${playerMoveBase} vs ${expectedMoveBase} | Res: ${isCorrect}`);

    if (isCorrect) {
        // Correct Move
        const actualMove = game.move(move);
        renderTacticalDashboard(`<b style='color:var(--success); font-size:1.1rem;'>✅ ¡CORRECTO!<br><span style="font-size:0.8rem; font-weight:400; opacity:0.8;">Has jugado ${actualMove.san}. Sigue así.</span></b>`);
        puzzleStep++;

        if (puzzleStep >= currentPuzzle.sol.length) {
            clearInterval(puzTimerInterval);
            renderTacticalDashboard(`<b style='color:var(--success); font-size:1.1rem;'>🏆 ¡PIEZA GANADA!<br><span style="font-size:0.8rem; font-weight:400; opacity:0.8;">Puzzle resuelto con éxito.</span></b>`);
            playSnd('end');
            if (currentPuzzle.id && !solvedPuzzles.includes(currentPuzzle.id)) {
                solvedPuzzles.push(currentPuzzle.id);
                localStorage.setItem('chess_solved_puzzles', JSON.stringify(solvedPuzzles.slice(-1000)));
            }
            updatePuzzleStats(currentPuzzle.themes, true, currentPuzzle.rating);
            updateElo(currentPuzzle.rating, 1, true);

            setTimeout(() => board.position(game.fen()), 50);
            setTimeout(loadRandomPuzzle, 2000);
        } else {
            // Opponent Counter-move in puzzle
            setTimeout(() => {
                const nextMove = currentPuzzle.sol[puzzleStep];
                const m = game.move({
                    from: nextMove.substring(0, 2),
                    to: nextMove.substring(2, 4),
                    promotion: nextMove.length > 4 ? nextMove[4] : 'q'
                });
                board.position(game.fen());
                puzzleStep++;

                if (puzzleStep >= currentPuzzle.sol.length) {
                    clearInterval(puzTimerInterval);
                    renderTacticalDashboard(`<b style='color:var(--success); font-size:1.1rem;'>🏆 ¡EXCELENTE!<br><span style="font-size:0.8rem; font-weight:400; opacity:0.8;">Has completado el ejercicio.</span></b>`);
                    playSnd('end');
                    updatePuzzleStats(currentPuzzle.themes, true, currentPuzzle.rating);
                    updateElo(currentPuzzle.rating, 1, true);
                    setTimeout(loadRandomPuzzle, 2000);
                } else {
                    playSnd('move');
                    updateUI();
                }
            }, 600);
        }
        updateUI(true);
        return actualMove;
    } else {
        // Wrong Move
        console.log("❌ Incorrecto");
        renderTacticalDashboard("<b style='color:var(--trap-color); font-size:1.1rem;'>❌ ¡INCORRECTO!<br><span style='font-size:0.8rem; font-weight:400; opacity:0.8;'>Esa no era la mejor continuación. Inténtalo de nuevo.</span></b>");
        playSnd('error');
        updatePuzzleStats(currentPuzzle.themes, false, currentPuzzle.rating);
        updateElo(currentPuzzle.rating, 0, true);

        // Snap back effectively or reset
        setTimeout(() => {
            game.load(currentPuzzle.fen);
            const firstMove = currentPuzzle.sol[0];
            game.move({
                from: firstMove.substring(0, 2),
                to: firstMove.substring(2, 4),
                promotion: firstMove.length > 4 ? firstMove[4] : 'q'
            });
            board.position(game.fen());
            puzzleStep = 1;
            updateUI();
        }, 800);
        return 'snapback';
    }
}

function onDrop(source, target) {
    // Basic legal move validation
    var tempMove = game.move({ from: source, to: target, promotion: 'q' });
    if (tempMove === null) return 'snapback';
    game.undo(); // Undo to handle it properly in each mode

    if (currentMode === 'exercises') {
        const puzMove = handlePuzzleMove({ from: source, to: target, promotion: 'q' });
        // If puzMove is truthy and not 'snapback', it's a move object.
        return (puzMove === 'snapback') ? 'snapback' : undefined;
    }

    var move = game.move({ from: source, to: target, promotion: 'q' });
    if (!move) return 'snapback';

    // AVISOS Y LÓGICA DE APERTURA (MODO ENTRENAMIENTO)
    if (openingSubMode === 'training' && currentOpening) {
        const moves = currentOpening.moves || currentOpening.m;
        const currentMIndices = game.history().length - 1;
        const expected = moves[currentMIndices];

        if (expected && move.san !== expected && move.lan !== expected) {
            game.undo(); // Undo the move
            const errorMsg = `Has jugado ${move.san}, pero la <b>${currentOpening.name}</b> requiere <b>${expected}</b>.`;
            showToast(errorMsg, "⚠️", "error");
            $('#coach-txt').html(`<b style="color:var(--trap-color)">¡ERROR DE TEORÍA!</b><br>${errorMsg}<br><br><span style="font-size:0.75rem;">El Maestro ha devuelto la pieza. Intenta seguir la línea principal.</span>`);
            setTimeout(() => board.position(game.fen()), 250);
            return 'snapback';
        }
    }

    // Sync opening context UI if in opening module
    if (openingSubMode) syncOpeningSubModeUI();

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

    // Trigger AI response if needed
    if (currentMode === 'ai' && game.turn() !== myColor) {
        setTimeout(makeAIMove, 250);
    }

    updateUI(true);
    checkGameOver();
    return move; // Always return move object to confirm drop
}

function onSquareClick(sq) {
    if (selectedSq) {
        if (selectedSq === sq) { selectedSq = null; updateUI(); return; }

        if (currentMode === 'exercises') {
            const tempGame = new Chess(game.fen());
            const move = tempGame.move({ from: selectedSq, to: sq, promotion: 'q' });

            if (move) {
                const result = handlePuzzleMove({ from: selectedSq, to: sq, promotion: 'q' });
                if (result !== 'snapback') {
                    board.position(game.fen());
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

            // Trigger AI response if needed
            if (currentMode === 'ai' && game.turn() !== myColor) {
                setTimeout(makeAIMove, 250);
            }

            updateUI(true);
            checkGameOver();
            return;
        }
    }

    // Initial Selection (First Click)
    if (!sq) return; // Guard for undefined squares

    if (currentMode === 'academy') {
        const puzzle = ACADEMY_CURRICULUM[currentAcademyLevelIndex].puzzles[currentAcademyPuzzleIndex];
        if (puzzle.type === 'click') {
            if (sq === puzzle.target) {
                playSnd('move');
                showToast("¡Correcto!", "✅");
                currentAcademyPuzzleIndex++;
                setTimeout(loadAcademyPuzzle, 800);
            } else {
                playSnd('error');
                showToast("Esa no es la casilla correcta", "❌");
            }
            return;
        }
    }

    var piece = game.get(sq);
    if (!piece) return;

    // Validar propiedad de la pieza
    const isLocalPure = currentMode === 'pass-and-play' || currentMode === 'exercises' || (!gameId && currentMode === 'local');
    if (!isLocalPure && piece.color !== myColor) {
        // Si intentamos seleccionar pieza rival en modo online/ai
        return;
    }

    if (piece.color === game.turn()) {
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
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    });
    syncSquaresWithData(); // Ensure data-square is present

    // Load AI Configuration
    if (typeof loadAIConfig === 'function') {
        loadAIConfig();
    }

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
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd
        });
        syncSquaresWithData(); // Re-sync after board re-creation
        $('#board-theme-sel').trigger('change');
        $(window).resize(board.resize);
        playSnd('move');
    });

    // Re-bind click for mobile squares
    // Re-bind click for mobile squares with ghost-click prevention
    let lastTouch = 0;
    $(document).on('touchstart', '.square-55d63', function (e) {
        lastTouch = new Date().getTime();
        // We do NOT prevent default here to allow scrolling/dragging if handled by library
        onSquareClick($(this).data('square'));
    });

    $(document).on('mousedown', '.square-55d63', function (e) {
        // Ignore mousedown if it was a touch event (mobile phantom click)
        if (new Date().getTime() - lastTouch < 500) return;
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
        if ($(this).hasClass('mobile-tab-right')) {
            openMobileInfo();
            // Call update mode directly
            updateMobileViewMode();
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
    // Side Drawer / Sidebar Toggles
    $('#hamburger-menu').off('click').click(() => {
        $('.sidebar').addClass('open');
        $('#mobile-panel-overlay').fadeIn();
    });

    $('#mobile-panel-overlay').off('click').click(() => {
        $('.sidebar').removeClass('open');
        $('.side-panel').removeClass('mobile-open'); // Also close side panel if overlay clicked
        $('#mobile-panel-overlay').fadeOut();
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

    currentMode = 'ai'; // Forzar modo IA por si acaso
    updateUI();
    resetTimers();

    // Trigger analysis if it's AI turn (Black start)
    if (myColor === 'b') {
        // Initial move for White (AI)
        setTimeout(() => {
            const openings = ['e4', 'd4', 'Nf3', 'c4'];
            const move = openings[Math.floor(Math.random() * openings.length)];
            game.move(move);
            board.position(game.fen());
            updateUI(true);
        }, 500);
    } else {
        // Player is white, wait for move
        if (stockfish) {
            stockfish.postMessage('stop');
            stockfish.postMessage('position fen ' + game.fen());
            stockfish.postMessage('go depth 10'); // Warm up
        }
    }
});

$('#lang-sel').on('change', function () { setLanguage($(this).val()); });

// MOBILE DROPDOWN LOGIC
// Mobile Info Modal Functions
window.toggleMobilePanel = function () {
    const modal = $('#mobile-info-modal');
    if (modal.hasClass('active')) {
        closeMobileInfo();
    } else {
        openMobileInfo();
    }
};

window.openMobileInfo = function () {
    const modal = $('#mobile-info-modal');
    modal.addClass('active');

    // Sync data from desktop panel to mobile modal
    syncMobileInfo();

    console.log('Mobile info opened');
};

window.closeMobileInfo = function () {
    const modal = $('#mobile-info-modal');
    modal.removeClass('active');
    console.log('Mobile info closed');
};

// Sync data from desktop to mobile
function syncMobileInfo() {
    // Sync evaluation
    $('#mobile-eval-text').text($('#eval-text-overlay').text());
    $('#mobile-eval-fill').css('width', $('#eval-bar-fill').css('width'));
    $('#mobile-accuracy').text($('#eval-accuracy').text());
    $('#mobile-depth').text($('#eval-depth').text());

    // Sync best moves
    $('#mobile-best-moves').html($('#best-moves-list').html());

    // Sync Maestro Insight
    $('#mobile-maestro-opening').text($('#maestro-opening-name').text());
    $('#mobile-maestro-plan').text($('#maestro-plan').text());
    if ($('#maestro-trap-container').is(':visible')) {
        $('#mobile-maestro-trap-box').show();
        $('#mobile-maestro-trap').text($('#maestro-trap').text());
    } else {
        $('#mobile-maestro-trap-box').hide();
    }

    // FASE 2: Sync Stats
    if ($('#maestro-stats-container').is(':visible')) {
        $('#mobile-maestro-stats-container').show();
        $('#mobile-stat-white').css('width', $('#stat-white').css('width'));
        $('#mobile-stat-draw').css('width', $('#stat-draw').css('width'));
        $('#mobile-stat-black').css('width', $('#stat-black').css('width'));

        $('#mobile-txt-white').text($('#txt-white').text());
        $('#mobile-txt-draw').text($('#txt-draw').text());
        $('#mobile-txt-black').text($('#txt-black').text());
    } else {
        $('#mobile-maestro-stats-container').hide();
    }

    // Sync coach logs
    $('#mobile-coach-logs').html($('#coach-txt').html());

    // Sync Threats (Fase 1 Mobile)
    if ($('#threats-panel').is(':visible')) {
        $('#mobile-threats-section').show();
        $('#mobile-threats-list').html($('#threats-list').html());
    } else {
        $('#mobile-threats-section').hide();
    }

    // Refresh chart on open
    setTimeout(() => drawEvalChart('evalChartMobile'), 100);
}

// Nueva función extraída para limpiar lógica
function updateMobileViewMode() {
    if (currentMode === 'exercises') {
        $('#mobile-modal-title').text("Tus Estadísticas en Táctica");
        $('.game-info-only').hide(); // Hide analysis, logs
        $('#mobile-tactics-stats').show();

        // Update Dummy Stats if real not available
        $('#mobile-tactics-elo').text(userPuzzleElo);
        // Here we could update the solved/failed counters if we had session tracking
        // For now let's just use what we have in UI or simple placeholders
        // We will just read from current session vars if we add them later
    } else {
        $('#mobile-modal-title').text("Información de Partida");
        $('.game-info-only').show();
        $('#mobile-tactics-stats').hide();
    }
}

async function updateMaestroInsight(theory) {
    if (!theory) return;

    // 1. Update Opening Name
    let openingName = theory.name;

    // Fallback to Lichess API if generic
    if (openingName === "Posición Personalizada" && game.history().length > 0) {
        let ouverture = await fetchLichessOpening(game.fen());
        if (ouverture) openingName = ouverture;
    }

    $('#maestro-opening-name').html(`${openingName} <a href="https://lichess.org/analysis/${game.fen()}" target="_blank" style="font-size:0.7rem; color:var(--accent); text-decoration:none;">[↗]</a>`);

    // 2. Fetch Strategic Plan
    const knowledge = MAESTRO_KNOWLEDGE.plans[openingName] || MAESTRO_KNOWLEDGE.plans[Object.keys(MAESTRO_KNOWLEDGE.plans).find(k => openingName.includes(k))];
    if (knowledge) {
        $('#maestro-plan').text(knowledge.ideas + " " + knowledge.plans.join(" "));
    } else {
        $('#maestro-plan').text("Controla el centro y desarrolla tus piezas menores hacia casillas activas.");
    }

    // 3. Check for Traps
    const currentFen = game.fen();
    const trap = MAESTRO_KNOWLEDGE.traps.find(t => currentFen.includes(t.fen_part));
    if (trap) {
        $('#maestro-trap-container').fadeIn();
        $('#maestro-trap').text(trap.warning + " " + (trap.plan || ""));
        showToast("⚠️ ¡Trampa detectada!", "warning");
    } else {
        $('#maestro-trap-container').hide();
    }

    // 4. Update Stats (FASE 2)
    // If late game, try Tablebase instead of Opening Stats
    if (game.history().length > 20) {
        checkEndgameTablebase(game.fen());
    } else {
        updateOpeningStats(game.fen());
    }

    syncMobileInfoIfOpen();
}

// FASE 2: SYZYGY TABLEBASES (FINALES)
async function checkEndgameTablebase(fen) {
    // Count pieces
    const pieces = fen.split(' ')[0].replace(/\//g, '').replace(/\d/g, '').length;

    // Syzygy works best with 7 pieces or less
    if (pieces > 7) {
        $('#maestro-stats-container').hide();
        return;
    }

    try {
        const response = await fetch(`https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(fen)}`);
        const data = await response.json();

        // category: win, loss, draw, unknown
        if (data.category) {
            let label = "";
            let color = "#fff";

            // Interpret WDL (Win-Draw-Loss)
            // Lichess API returns category for the side to move? Need to verify wdl.
            // wdl: 2 (Win), 1 (Blessed Loss/Draw?), 0 (Draw), -2 (Loss)

            const wdl = data.wdl;
            const turn = game.turn() === 'w' ? 'Blancas' : 'Negras';

            if (wdl === 2) { label = `Victoria forzada para ${turn}`; color = "#4CAF50"; }
            else if (wdl === -2) { label = `Derrota forzada para ${turn}`; color = "#F44336"; }
            else if (wdl === 0) { label = "Tablas teóricas"; color = "#9E9E9E"; }
            else { label = "Final complejo"; color = "#FFC107"; }

            let details = "";
            if (data.dtm) details = `Mate en ${Math.abs(data.dtm)} jugadas.`;
            else if (data.dtz) details = `Regla 50 mov en: ${data.dtz}`;

            // Update UI Reuse Maestro Card
            $('#maestro-stats-container').hide(); // Hide opening stats
            $('#maestro-opening-name').html(`<span style="color:${color}">🏁 ${label}</span>`);
            $('#maestro-plan').text(details || "Juega con precisión absoluta.");

            // Sync Mobile
            $('#mobile-maestro-opening').html(`<span style="color:${color}">🏁 ${label}</span>`);
            $('#mobile-maestro-plan').text(details || "Final teórico.");
        }
    } catch (e) {
        console.warn("Tablebase Error", e);
    }
}

async function updateOpeningStats(fen) {
    // Solo consultar si estamos en apertura/temprano medio juego
    if (game.history().length > 25) {
        $('#maestro-stats-container').hide();
        return;
    }

    try {
        const response = await fetch(`https://explorer.lichess.ovh/lichess?fen=${encodeURIComponent(fen)}&speeds=blitz,rapid,classical`);
        const data = await response.json();

        if (data.white + data.black + data.draws > 0) {
            const total = data.white + data.black + data.draws;
            const wPct = Math.round((data.white / total) * 100);
            const dPct = Math.round((data.draws / total) * 100);
            const bPct = Math.round((data.black / total) * 100);

            $('#stat-white').css('width', wPct + '%');
            $('#stat-draw').css('width', dPct + '%');
            $('#stat-black').css('width', bPct + '%');

            $('#txt-white').text(`B: ${wPct}%`);
            $('#txt-draw').text(`T: ${dPct}%`);
            $('#txt-black').text(`N: ${bPct}%`);

            $('#maestro-stats-container').fadeIn();
        } else {
            $('#maestro-stats-container').hide();
        }
    } catch (e) {
        // Fail silently
        $('#maestro-stats-container').hide();
    }
}

async function fetchLichessOpening(fen) {
    try {
        const response = await fetch(`https://explorer.lichess.ovh/lichess?fen=${encodeURIComponent(fen)}&topLines=1`);
        const data = await response.json();
        if (data.opening) return data.opening.name;
    } catch (e) { console.warn("Lichess Explorer Error", e); }
    return null;
}

// Auto-sync when data updates (call this in updateCoachDashboard and updateTopMovesUI)
window.syncMobileInfoIfOpen = function () {
    if ($('#mobile-info-modal').hasClass('active')) {
        syncMobileInfo();
    }
};

// Ensure mobile tab click works
$(document).on('click touchend', '.mobile-side-tab', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Mobile tab clicked');
    toggleMobilePanel();
});

// Close panel when clicking overlay
$(document).on('click', '#mobile-panel-overlay', function () {
    toggleMobilePanel();
});

// Close panel when clicking on the panel's top-right area (where X is)
$(document).on('click', '.side-panel', function (e) {
    // Check if click is in top-right corner (close button area)
    const rect = this.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (clickX > rect.width - 50 && clickY < 50) {
        toggleMobilePanel();
    }
});

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

// --- AI LOGIC ---
window.makeAIMove = function () {
    if (game.game_over()) return;
    if (typeof stockfish === 'undefined' || !stockfish) return;

    // Visual feedback that AI is thinking
    aiThinking = true;

    // AI LÓGICA DE APERTURAS (TRAINING)
    if (currentMode === 'ai' && openingSubMode === 'training' && currentOpening) {
        const movesArr = currentOpening.moves || currentOpening.m;
        const currentMIndices = game.history().length;
        if (currentMIndices < movesArr.length) {
            setTimeout(() => {
                const nextBookMove = movesArr[currentMIndices];
                const m = game.move(nextBookMove);
                if (m) {
                    board.position(game.fen());
                    playSnd(m.flags.includes('c') ? 'capture' : 'move');
                    updateUI(true);
                    syncOpeningSubModeUI(); // Update comments after AI book move
                }
                aiThinking = false;
            }, 800);
            return;
        }
    }

    $('#coach-txt').html('<div style="color:var(--text-muted); font-style:italic;">🤔 El Maestro está pensando...</div>');

    const diff = (typeof gameConfig !== 'undefined' ? gameConfig.difficulty : 5) || 0;

    // Sincronizar Skill Level antes de calcular
    stockfish.postMessage("setoption name Skill Level value " + diff);

    let depth = 2; // Profundidad bajísima para niveles iniciales
    if (diff > 2) depth = 5;
    if (diff > 5) depth = 10;
    if (diff > 12) depth = 15;
    if (diff > 18) depth = 20;

    stockfish.postMessage('stop');
    stockfish.postMessage('position fen ' + game.fen());
    stockfish.postMessage('go depth ' + depth);
};

$(document).click(function (e) {
    if (!$(e.target).closest('.action-menu, .btn-action-mobile').length) {
        $('.action-menu').fadeOut();
    }
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

// GAME CONFIG STATE
let gameConfig = {
    difficulty: 5,
    timeControl: '10+0',
    side: 'white'
};

const DIFFICULTY_LEVELS = [
    { lvl: 0, elo: 400, label: "Principiante" },
    { lvl: 1, elo: 600, label: "Novato" },
    { lvl: 2, elo: 800, label: "Aficionado" },
    { lvl: 3, elo: 1000, label: "Intermedio" },
    { lvl: 4, elo: 1200, label: "Club" },
    { lvl: 5, elo: 1400, label: "Competitivo" }, // Default
    { lvl: 10, elo: 1800, label: "Experto" },
    { lvl: 15, elo: 2200, label: "Maestro" },
    { lvl: 20, elo: 3000, label: "Grandmaster" }
];

window.selectDifficulty = function (lvl) {
    gameConfig.difficulty = lvl;

    // Update UI Bar
    $('.diff-seg').each(function () {
        const segLvl = parseInt($(this).data('lvl'));
        $(this).removeClass('active active-last');
        if (segLvl <= lvl) $(this).addClass('active');
        if (segLvl === lvl) $(this).addClass('active-last');
    });

    // Update Text
    const diffInfo = DIFFICULTY_LEVELS.find(d => d.lvl === lvl) || { elo: '???', label: 'Personalizado' };
    $('#diff-display').text(diffInfo.label);
    $('#diff-desc').text(`ELO Aprox: ${diffInfo.elo}`);
};

window.selectTime = function (time) {
    gameConfig.timeControl = time;
    $('.btn-option', '.config-group:nth-child(2)').removeClass('active'); // Scope to time group
    $(`.btn-option[onclick*="'${time}'"]`).addClass('active');
};

window.selectSide = function (side) {
    gameConfig.side = side;
    $('.color-selector .btn-option').removeClass('active');
    $(`.btn-option[onclick*="'${side}'"]`).addClass('active');
};

window.launchMaestroGame = function () {
    // Determine user color
    let userColor = gameConfig.side;
    if (userColor === 'random') userColor = Math.random() < 0.5 ? 'white' : 'black';

    // Set Mode
    startMaestroModeReal(gameConfig.difficulty, userColor);

    // UI Feedback for Difficulty in Board
    const diffInfo = DIFFICULTY_LEVELS.find(d => d.lvl === gameConfig.difficulty);
    $('#eval-depth').text(`Nivel ${gameConfig.difficulty} (${diffInfo.label})`); // Abuse depth label for immediate feedback
};

// Initialize Config UI defaults
$(document).ready(() => {
    selectDifficulty(5);
});

// AUTH HELPERS
window.switchAuthMode = function (mode) {
    $('.auth-tab-btn').removeClass('active');

    if (mode === 'login') {
        $('.auth-tab-btn:first-child').addClass('active');
        $('#group-email').slideUp();
        $('#btn-auth-submit').text("ENTRAR");
        $('#remember-me-row').slideDown();
    } else {
        $('.auth-tab-btn:last-child').addClass('active');
        $('#group-email').slideDown();
        $('#btn-auth-submit').text("CREAR CUENTA");
        $('#remember-me-row').slideUp();
    }
};

window.togglePasswordVisibility = function (id) {
    const input = document.getElementById(id);
    if (input.type === "password") {
        input.type = "text";
        $(input).next('.password-toggle').text("🙈"); // Monkey covering eyes or crossed eye
    } else {
        input.type = "password";
        $(input).next('.password-toggle').text("👁️");
    }
};

const updateAuthUI = () => {
    // Check Remember Me persistence first
    const rememberedUser = localStorage.getItem('chess_remembered_user');
    if (rememberedUser && !localStorage.getItem('chess_is_auth')) {
        $('#auth-user').val(rememberedUser);
        $('#auth-remember').prop('checked', true);
    }

    if (localStorage.getItem('chess_is_auth') === 'true') {
        isAuth = true;
        userName = localStorage.getItem('chess_username');
        userElo = parseInt(localStorage.getItem('chess_user_elo')) || 500;
        userPuzzleElo = parseInt(localStorage.getItem('chess_puz_elo')) || 500;

        $('#btn-auth-trigger').text("👤 " + userName);
        $('#my-name-display').text(userName);
        $('#btn-auth-drawer').text("CERRAR SESIÓN").off('click').click(() => {
            // Only clear critical auth flags, maybe keep remembered user if checked? 
            // For now standard logout
            localStorage.removeItem('chess_token');
            localStorage.removeItem('chess_is_auth');
            location.reload();
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

// Unified Auth Handler
$('#btn-auth-submit').click(() => {
    const name = $('#auth-user').val().trim();
    const pass = $('#auth-pass').val().trim();
    const email = $('#auth-email').val().trim();
    // Check mode based on visibility of email field
    const isRegister = $('#group-email').is(':visible');

    if (!name || !pass) return alert("Por favor introduce usuario y contraseña.");
    if (isRegister && !email) return alert("Por favor introduce tu email.");

    if (isRegister) {
        // Registration Logic
        // Validate Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return alert("Email no válido.");

        if (socket) socket.emit('register', { user: name, pass: pass, email: email });
    } else {
        // Login Logic
        if (socket) socket.emit('login', { user: name, pass: pass });

        // Handle Remember Me (Optimistic save, ideally should be after success response)
        if ($('#auth-remember').is(':checked')) {
            localStorage.setItem('chess_remembered_user', name);
        } else {
            localStorage.removeItem('chess_remembered_user');
        }
    }
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

// Llenar aperturas
OPENINGS_DATA.forEach((group, groupIdx) => {
    let optgroup = `<optgroup label="${group.group}">`;
    group.items.forEach((item, itemIdx) => {
        optgroup += `<option value="${groupIdx}-${itemIdx}">${item.name}</option>`;
    });
    optgroup += `</optgroup>`;

    if (group.group.includes("Trampas") || group.group.includes("Mates")) {
        $('#opening-traps-sel').append(optgroup);
    } else {
        $('#opening-module-sel, #opening-sel').append(optgroup);
    }
});

$('#opening-module-sel').change(function () { if ($(this).val()) $('#opening-traps-sel').val(""); });
$('#opening-traps-sel').change(function () { if ($(this).val()) $('#opening-module-sel').val(""); });

var studyMoves = [];
var studyIndex = 0;

window.startOpeningModule = function (submode) {
    let val = $('#opening-traps-sel').val();
    let isTrap = true;

    if (!val) {
        val = $('#opening-module-sel').val();
        isTrap = false;
    }

    if (!val) {
        showToast("Por favor, selecciona una apertura o trampa primero", "warning");
        return;
    }

    const [groupIdx, itemIdx] = val.split('-').map(Number);
    const opening = OPENINGS_DATA[groupIdx].items[itemIdx];
    currentOpening = opening;
    openingSubMode = submode;

    // Reset game and state
    game.reset();
    board.start();
    updateUI();
    syncOpeningSubModeUI();

    if (submode === 'exercises') {
        setMode('exercises');
        loadOpeningSpecificPuzzle(opening.name, isTrap);
        return;
    }

    // Theory & Training stick to standard Openings
    if (submode === 'theory') {
        setMode('study');
        studyMoves = opening.moves || opening.m;
        studyIndex = 0;
        $('#study-controls').show();
        showToast(`Teoría: ${opening.name}`, "📖");
        $('#coach-txt').html(`<b style="color:var(--accent)">MODO TEORÍA:</b> Estudia los movimientos maestros de la ${opening.name}.`);

        // Populate navigation history
        historyPositions = [game.fen()];
        moveHistoryGlobal = [];
        let temp = new Chess();
        for (let m of studyMoves) {
            let res = temp.move(m);
            if (res) {
                historyPositions.push(temp.fen());
                moveHistoryGlobal.push(res.san);
            }
        }
        currentHistoryIndex = 0;
        board.position(historyPositions[0]);
        updateUI();
    } else if (submode === 'training') {
        // Use the color selected in the UI Toggle
        myColor = (window.trainingColor || 'w');
        gameConfig.side = myColor === 'w' ? 'white' : 'black';

        setMode('ai');
        $('.player-top, .player-bottom').addClass('hidden-in-tactics'); // Ocultar en entrenamiento de aprender
        board.orientation(gameConfig.side);

        // If playing Black, AI moves first
        if (myColor === 'b') {
            setTimeout(() => {
                // If opening has a first move defined, use it. Otherwise standard e4/d4
                const firstMove = (currentOpening.moves && currentOpening.moves[0]) ? currentOpening.moves[0] : 'e4';
                game.move(firstMove);
                board.position(game.fen());
                updateUI();
            }, 500);
        }

        showToast(`Entrenamiento: ${opening.name}`, "🎯");
        $('#coach-txt').html(`<b style="color:var(--accent)">MODO ENTRENAMIENTO:</b> Juegas con ${myColor === 'w' ? 'Blancas' : 'Negras'}. La IA te pondrá a prueba en la ${opening.name}.`);
    }
}

function syncOpeningSubModeUI() {
    if (!currentOpening) return;

    const openingMoves = currentOpening.moves || currentOpening.m || [];
    const currentStep = game.history().length;

    // 1. Update Opening Name
    $('#maestro-opening-name').text(currentOpening.name);

    // 2. Fetch Comment based on step
    let comment = "Posición inicial. Controla el centro.";
    if (currentOpening.comments) {
        // Map comments to progress
        const commentIdx = Math.floor((currentStep / openingMoves.length) * (currentOpening.comments.length - 1));
        comment = currentOpening.comments[commentIdx] || currentOpening.comments[0];
    }

    $('#maestro-plan').text(comment);

    // If in Training or Exercises, also update coach
    if (openingSubMode === 'training') {
        $('#coach-txt').html(`<b style="color:var(--accent)">ENTRENAMIENTO:</b> ${comment}<br><br><span style="font-size:0.7rem; opacity:0.8;">Paso ${currentStep} de ${openingMoves.length}</span>`);
    }
}

async function loadOpeningSpecificPuzzle(name, forceTrap = false) {
    $('#puz-desc-main').html(`<span style="color:var(--accent)">Configurando reto de ${name}...</span>`);

    if (forceTrap && currentOpening && (currentOpening.moves || currentOpening.m)) {
        // Convertir la trampa en un puzzle interactivo
        const moves = currentOpening.moves || currentOpening.m;
        currentPuzzle = {
            id: 'trap-' + name,
            fen: 'start',
            sol: moves,
            rating: 1000,
            themes: 'Opening Trap'
        };
        puzzleStep = 0;
        game.reset();
        board.start();
        updateUI();
        showToast(`¡RETO! Realiza la línea de la ${name}`, "🔥");
        return;
    }

    // Primero intentamos buscar en locales
    if (typeof localPuzzles !== 'undefined') {
        const themeMatch = name.toLowerCase().split(' ')[0]; // E.g. "Siciliana" -> "siciliana"
        let candidates = localPuzzles.filter(p => (p.Themes || "").toLowerCase().includes(themeMatch));
        if (candidates.length > 0) {
            const p = candidates[Math.floor(Math.random() * candidates.length)];
            currentPuzzle = { id: p.PuzzleId, fen: p.FEN, sol: p.Moves.split(' '), rating: p.Rating, themes: p.Themes };
            puzzleStep = 0;
            game.load(currentPuzzle.fen);

            // Sync theory context for exercise
            syncOpeningSubModeUI();

            const firstMove = currentPuzzle.sol[0];
            game.move({ from: firstMove.substring(0, 2), to: firstMove.substring(2, 4), promotion: 'q' });
            puzzleStep = 1;
            board.position(game.fen());
            updateUI();

            // Mobile Task Display (Disabled per user request for clean UI in tactics)
            if (window.innerWidth <= 768) {
                const taskText = p.Themes.includes("MateIn") ? `Jaque Mate en ${p.Themes.match(/MateIn(\d)/)?.[1] || '?'}` : "Encuentra la mejor jugada";
                $('#mobile-opening-quick').text("Entrenamiento Táctico");
                $('#mobile-coach-quick').text(taskText);
                // $('.mobile-board-info').show(); // Mantener oculto para limpieza total
            }

            return;
        }
    }
    // Si no, cargamos uno genérico con aviso
    showToast("No hay retos específicos, cargando táctica general", "info");
    loadRandomPuzzle();

    // Mobile Task update for generic puzzles
    if (window.innerWidth <= 768 && currentPuzzle) {
        updateMobilePuzzleTaskDisplay(currentPuzzle.fen, currentPuzzle.themes);
    }
}

// Helper to show puzzle task
function updateMobilePuzzleTaskDisplay(fen, themes) {
    if (currentMode !== 'exercises') return;

    // Default task
    let task = "Encuentra la mejor jugada";
    if (themes && themes.includes("MateIn")) {
        const moves = themes.match(/MateIn(\d)/);
        if (moves) task = `🏁 JAQUE MATE EN ${moves[1]}`;
    }

    $('#mobile-opening-quick').text("🧩 Táctica");
    $('#mobile-coach-quick').text(task);

    // Keep hidden per user feedback (quitar de la pantalla)
    $('.mobile-board-info').hide();
}

$('#opening-sel').change(function () {
    const val = $(this).val();
    if (!val) return;
    const [gIdx, iIdx] = val.split('-');
    const opening = OPENINGS_DATA[gIdx].items[iIdx];

    game.reset();
    board.start();

    studyMoves = opening.moves || opening.m;
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
function toggleHints(btn) {
    // ✅ VALIDAR MODO: solo permitir en juegos normales
    const allowedModes = ['local', 'ai', 'maestro', 'study'];

    if (!allowedModes.includes(currentMode)) {
        showToast('⚠️ Sugerencias no disponibles aquí', 'info');
        return;
    }

    hintsActive = !hintsActive;

    if (hintsActive) {
        $('#best-move-display').show();
        $('.btn-hint-main, .btn-hint-mobile-bar, .btn-suggestion').addClass('active');
        showToast('💡 Sugerencias ACTIVADAS');

        if (stockfish) {
            stockfish.postMessage('stop');
            stockfish.postMessage('position fen ' + game.fen());
            stockfish.postMessage('go depth 18');
        }
    } else {
        $('#best-move-display').hide();
        $('.btn-hint-main, .btn-hint-mobile-bar, .btn-suggestion').removeClass('active');
        showToast('💡 Sugerencias DESACTIVADAS');
        clearArrowCanvas();
    }
}


// Unbind old handlers and bind new one
$('#btn-suggest-move, #btn-ai-hint, #btn-hint-main, #btn-hint-mobile-bar').off('click').on('click', function () { toggleHints(this); });
$('#btn-hint-main').click(function () {
    toggleHints(this);
});

function handleFlipBoard() {
    if (typeof board !== 'undefined') {
        board.flip();
        showToast('📋 Tablero girado', 'info');
        if ($('#mobile-actions-menu').is(':visible')) $('#mobile-actions-menu').fadeOut();
    }
}

$('#btn-flip, #btn-flip-mobile, .btn-flip-universal').off('click').on('click', handleFlipBoard);


// El manejador antiguo de .mode-pill ha sido eliminado porque ahora usamos setMode() y showSubMenu()

$('#btn-hint-main').click(function () {
    toggleHints(this);
});

// Color Toggle Logic for Training
window.trainingColor = 'w';
window.toggleOpeningColor = function (color) {
    window.trainingColor = color;
    $('.pill-opt').removeClass('active');
    $(`#pill-${color}`).addClass('active');
};

// NEW MENU LOGIC
window.showSubMenu = function (id) {
    $('.menu-step').removeClass('active');
    $('#menu-' + id).addClass('active');

    // Update Sidebar visual active state
    $('.nav-item').removeClass('active');
    $(`#nav-${id}`).addClass('active');

    // Update Nav Center visual active state (Navbar)
    $('.nav-center-link').removeClass('active');
    $(`.nav-center-link[onclick*="'${id}'"]`).addClass('active');
    if (id === 'home') $('.nav-center-link[onclick*="goBackToMenu"]').addClass('active');

    // Unified navigation handling
    $('#board-layout').hide();
    $('#submenus-container').show();

    $('.hero-board-preview').removeClass('forming'); // stop anim when leaving

    if (id === 'home') {
        // Trigger cool digital forming animation
        $('.hero-board-preview').removeClass('forming').outerWidth();
        $('.hero-board-preview').addClass('forming');
        $('body').removeClass('board-active'); // Ensure we leave game mode style
    } else {
        $('body').removeClass('board-active'); // For non-game submenus
    }

    // Safety check: ensure board is hidden in menu mode
    $('#board-layout').hide();
};

window.setMode = function (mode) {
    currentMode = mode;
    aiThinking = false;
    openingSubMode = null;
    academyInProgress = (mode === 'academy');

    // Independent UI Reset
    game.reset();
    if (mode !== 'exercises') board.start();

    historyPositions = [game.fen()];
    currentHistoryIndex = 0;
    moveHistoryGlobal = [];
    window.currentEval = 0.0;
    window.lastEval = 0.0;
    evalHistory = [0];

    if (typeof drawEvalChart === 'function') {
        drawEvalChart('evalChart');
        drawEvalChart('evalChartMobile');
    }
    clearArrowCanvas();
    $('.legal-dot').remove();

    // UI Visual Feedback
    $('.tab-btn').removeClass('active');
    $('.tab-btn[onclick*="analysis"]').addClass('active');
    $('.tab-content').removeClass('active');

    // Activar controles de tablero y ocultar menús
    $('#submenus-container').hide();
    $('#board-layout').fadeIn(300, function () {
        if (board) board.resize();

        // After board is visible and resized, load puzzle if needed
        if (mode === 'exercises') {
            loadRandomPuzzle();
        }
    }).css('display', 'flex');

    // Toggle board-specific puzzle controls
    if (mode === 'exercises') {
        $('#puzzle-controls').fadeIn().css('display', 'block');
        $('#side-opening-info, #side-eval-viz, #side-top-moves, #threats-panel, .panel-tabs, #coach-txt, .mobile-board-info').hide();
        $('#tactic-dashboard-container').show();
        renderTacticalDashboard();
    } else if (mode === 'academy') {
        $('#puzzle-controls').fadeIn().css('display', 'block');
        $('#side-opening-info, #side-eval-viz, #side-top-moves, #threats-panel, .panel-tabs, #coach-txt, .mobile-board-info').hide();
        $('#tactic-dashboard-container').hide();
    } else {
        $('#puzzle-controls').hide();
        $('#side-opening-info, #side-eval-viz, #side-top-moves, .panel-tabs, #coach-txt').show();
        $('.mobile-board-info').show();
        $('#tactic-dashboard-container').hide();
        currentPuzzle = null;
        clearInterval(puzTimerInterval);
    }

    $('body').addClass('board-active');

    // FASE 2: UI CLEANUP FOR LEARN/TACTICS (Mobile & PC)
    if (mode === 'exercises' || mode === 'study') {
        $('body').addClass('mode-exercises');
        // Ocultar info móvil solo en táctica, en estudio la mantenemos para ver la apertura
        if (mode === 'exercises') $('.mobile-board-info').hide();
        $('.player-top, .player-bottom').addClass('hidden-in-tactics');
    } else {
        $('body').removeClass('mode-exercises');
        $('.mobile-board-info').show(); // Restaurar
        $('.player-top, .player-bottom').removeClass('hidden-in-tactics');
    }

    $('.sidebar').removeClass('open'); // Auto close sidebar

    setTimeout(function () {
        if (typeof board !== 'undefined' && board.resize) board.resize();
    }, 150);

    let targetSec = 'jugar';
    if (mode === 'local') targetSec = 'local';
    if (mode === 'ai') targetSec = 'ai';
    if (mode === 'study') targetSec = 'study';
    if (mode === 'exercises') targetSec = 'exercises';

    $('.mode-section').removeClass('active');
    $('#sec-' + targetSec).addClass('active');

    if (mode === 'ai') {
        var isMaestro = (hintsActive === true);
        $('#opp-name').text(isMaestro ? 'Maestro IA' : 'Stockfish');
    } else if (mode === 'local') {
        $('#opp-name').text('Oponente Online');
    } else if (mode === 'exercises') {
        $('#opp-name').text('Entrenamiento Táctico');
    }

    // Refresh Maestro Insight when changing mode (Solo si no es táctica para evitar lo de las fotos 2 y 3)
    if (mode !== 'exercises') {
        updateMaestroInsight(detectOpeningTheory());
    }

    if (mode === 'ai' || mode === 'study' || mode === 'exercises') {
        $('#btn-hint-main').css('display', 'flex').fadeIn();
    } else {
        $('#btn-hint-main').hide();

    }

    if (window.resetTimers) resetTimers();
    updateUI();
    updateUI();
};

window.toggleMobileInfoExpand = function () {
    $('.mobile-board-info').removeClass('new-content'); // Remove pulse hint
    $('.mobile-board-info').toggleClass('expanded');
};

window.selectPuzzleCategory = function (cat) {
    $('#puz-cat-sel').val(cat);
    // Cambiar modo. El propio setMode llamará a loadRandomPuzzle
    if (typeof setMode === 'function') setMode('exercises');
    else if (window.setMode) window.setMode('exercises');
};


window.startMaestroModeReal = function (level = 10, userColor = 'white') {
    hintsActive = true;
    aiThinking = false;
    currentMode = 'ai';

    setMode('ai'); // This handles the view switch to board

    // Set AI Level
    if (stockfish) stockfish.postMessage("setoption name Skill Level value " + level);

    // Set Orientation and internal Color
    // myColor needs to be 'w' or 'b' for move validation logic
    myColor = (userColor === 'white' || userColor === 'w') ? 'w' : 'b';
    board.orientation(userColor === 'w' ? 'white' : userColor); // board uses full string

    // Reset Game
    game.reset();
    board.start();
    updateUI();

    // If playing black, AI must move first
    if (myColor === 'b') {
        makeAIMove(); // Trigger AI start
    }

    showToast(`Maestro IA Iniciado (${myColor === 'w' ? 'Blancas' : 'Negras'})`, "👴");
};

// Legacy support if needed, redirects to new flow or default
window.startMaestroMode = function () {
    // Redirect to config instead of instant start
    showSubMenu('maestro-config');
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
$(document).on('click', '#btn-flip, #btn-flip-mobile', handleFlipBoard);

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

    studyMoves = opening.moves || opening.m;
    studyIndex = 0;

    $('#study-controls').show();
    $('#btn-study-next').text("⏩ Siguiente Jugada (" + studyMoves.length + ")");
    updateUI();
});

// Sync puzzles categories - Handled by direct ID change in HTML

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
$('#menu-home').addClass('active');
showSubMenu('home'); // Ensure correct initialization of home

// Logout Handler
$('#btn-logout-drawer').click(() => {
    localStorage.removeItem('chess_token');
    localStorage.removeItem('chess_username');
    localStorage.removeItem('chess_is_auth');
    location.reload();
});

window.goBackToMenu = () => {
    $('body').removeClass('board-active');
    $('#board-layout').hide();
    $('#submenus-container').show();
    showSubMenu('home');
};

$('#btn-mobile-menu-back').click(function () {
    goBackToMenu();
});

$('#hamburger-menu').click(function () {
    $('.sidebar').toggleClass('open');
});

// Close sidebar when clicking outside on mobile
$(document).on('click', function (e) {
    if ($(window).width() <= 900) {
        if (!$(e.target).closest('.sidebar').length && !$(e.target).closest('#hamburger-menu').length) {
            $('.sidebar').removeClass('open');
        }
    }
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



window.selectPuzzleCat = function (cat) {
    $('#puz-cat-sel').val(cat);
    $('.puz-card').removeClass('active');
    $(`.puz-card[onclick*="'${cat}'"]`).addClass('active');

    // Direct trigger as requested
    setMode('exercises');
};

// Default select
$(document).ready(() => {
    // selectPuzzleCat('all'); // Don't trigger on load to avoid switching mode
});

window.showPuzzleHint = function () {
    if (currentMode !== 'exercises' || !currentPuzzle) return;
    const expected = currentPuzzle.sol[puzzleStep];
    if (!expected) return;

    const from = expected.substring(0, 2);
    // Highlight the starting square
    $('.square-55d63').removeClass('highlight-hint');
    $(`.square-${from}`).addClass('highlight-hint');

    showToast("💡 Pista: Mueve la pieza resaltada", "info");
};

window.showPuzzleSolution = function () {
    if (currentMode !== 'exercises' || !currentPuzzle) return;
    const expected = currentPuzzle.sol[puzzleStep];
    if (!expected) return;

    const m = game.move({
        from: expected.substring(0, 2),
        to: expected.substring(2, 4),
        promotion: expected.length > 4 ? expected[4] : 'q'
    });

    if (m) {
        handlePuzzleMove(m);
        showToast("🔓 Solución aplicada", "warning");
    }
};

// FASE 1: DIBUJAR GRÁFICO DE EVALUACIÓN (CANVAS)
function drawEvalChart(canvasId = 'evalChart') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Solo dibujar si es visible para ahorrar recursos
    if (canvas.offsetParent === null) return;

    // Ajustar resolución para Retina/High DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Eje central (Igualdad)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    if (evalHistory.length < 2) return;

    // Normalizar valores: +/- 5 ELO es el máximo visible normalmente
    const maxEval = 5;
    const points = evalHistory.map((ev, i) => {
        const x = (i / (evalHistory.length - 1)) * w;
        let normalizedEv = Math.max(-maxEval, Math.min(maxEval, ev));
        const y = (h / 2) - (normalizedEv / maxEval) * (h / 2.5);
        return { x, y };
    });

    // Dibujar Gradiente de Área
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h / 2);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(33, 150, 243, 0.4)'); // Ventaja blancas
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(156, 163, 175, 0.2)'); // Ventaja negras
    ctx.fillStyle = gradient;
    ctx.fill();

    // Dibujar Línea de Tendencia
    ctx.strokeStyle = 'var(--primary)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Punto actual (Último movimiento)
    const last = points[points.length - 1];
    ctx.fillStyle = 'var(--primary)';
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();
}

// Redibujar gráfico al cambiar tamaño de ventana
window.addEventListener('resize', drawEvalChart);

// --- MAESTRO IA: NEW SYSTEMS ---

function showGameReport() {
    // moveHistoryDetails guarda { quality, theory, tactical ... }
    const details = Object.values(moveHistoryDetails);
    if (details.length < 3) return;

    const counts = { brilliant: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, best: 0, book: 0 };
    let totalScore = 0;
    let movesWithScore = 0;

    details.forEach(m => {
        const q = m.quality.class;
        if (counts[q] !== undefined) counts[q]++;

        let score = 0;
        if (q === 'brilliant' || q === 'excellent' || q === 'best' || q === 'book') score = 100;
        else if (q === 'good') score = 80;
        else if (q === 'inaccuracy') score = 50;
        else if (q === 'mistake') score = 20;
        else if (q === 'blunder') score = 0;

        totalScore += score;
        movesWithScore++;
    });

    const accuracy = movesWithScore > 0 ? (totalScore / movesWithScore).toFixed(1) : 0;
    $('#report-accuracy').text(accuracy + "%");

    const breakdownHtml = `
        <div class="breakdown-item"><span style="color:#00ffff">💎 Brillantes</span> <b>${counts.brilliant}</b></div>
        <div class="breakdown-item"><span style="color:#4CAF50">⭐ Excelentes</span> <b>${counts.excellent}</b></div>
        <div class="breakdown-item"><span style="color:#8BC34A">✅ Buenas</span> <b>${counts.good}</b></div>
        <div class="breakdown-item"><span style="color:#FFEB3B">?! Imprecisiones</span> <b>${counts.inaccuracy}</b></div>
        <div class="breakdown-item"><span style="color:#FF9800">? Errores</span> <b>${counts.mistake}</b></div>
        <div class="breakdown-item"><span style="color:#F44336">?? Graves</span> <b>${counts.blunder}</b></div>
    `;
    $('#report-move-breakdown').html(breakdownHtml);
    $('#game-report-modal').fadeIn().css('display', 'flex');
}

window.exportPGN = function () {
    const pgn = game.pgn();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'partida_maestro_ia.pgn';
    a.click();
    showToast("PGN Exportado", "💾");
};

// Enlazar el reporte al final de la partida
const originalCheckGameOver = window.checkGameOver;
window.checkGameOver = function () {
    const isOver = game.game_over() || game.in_draw();
    if (isOver && currentMode !== 'exercises') {
        setTimeout(showGameReport, 1500);
    }
    if (typeof originalCheckGameOver === 'function') originalCheckGameOver();
};
// --- BOARD EDITOR LOGIC ---
function showBoardEditor() {
    $('#editor-fen-input').val(game.fen());
    $('#editor-pgn-input').val(game.pgn());
    $('#board-editor-modal').fadeIn();
}

function loadEditorPosition(type) {
    if (type === 'start') {
        $('#editor-fen-input').val('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    } else if (type === 'clear') {
        $('#editor-fen-input').val('8/8/8/8/8/8/8/8 w - - 0 1');
    }
}

function applyEditorPosition() {
    const fen = $('#editor-fen-input').val().trim();
    const pgn = $('#editor-pgn-input').val().trim();

    $('#board-editor-modal').fadeOut();
    setMode('study');

    if (pgn) {
        if (!game.load_pgn(pgn)) {
            showToast("PGN inválido, cargando FEN si es posible...", "⚠️");
        } else {
            board.position(game.fen());
            updateUI(true);
            return;
        }
    }

    if (fen) {
        if (!game.load(fen)) {
            showToast("FEN inválido / Posición ilegal", "❌");
        } else {
            board.position(game.fen());
            updateUI(true);
            showToast("Posición cargada", "✅");
        }
    }
}

// NAVIGATION STATE UPDATE
function updateNavigationTabs(mode) {
    $('.nav-center-link').removeClass('active');

    let activeSection = 'jugar'; // default
    if (mode === 'exercises' || mode === 'puzzles') activeSection = 'puzzles';
    else if (mode === 'study' && (openingSubMode === 'theory' || openingSubMode === 'training')) activeSection = 'aperturas';
    else if (mode === 'study' && !openingSubMode) activeSection = 'analisis';
    else activeSection = 'jugar';

    $(`.nav-center-link[data-section="${activeSection}"]`).addClass('active');
}

// Hook into setMode to update tabs
const originalSetMode = setMode;
setMode = function (mode, subMode) {
    originalSetMode(mode, subMode);
    // Special handling for analysis vs openings view which setMode might not cover fully if subMode isn't passed
    // We defer to updateNavigationTabs logic
    setTimeout(() => updateNavigationTabs(currentMode), 50);
};

// Also hook existing subMenu navigation
const originalShowSubMenu = showSubMenu;
showSubMenu = function (menuId) {
    originalShowSubMenu(menuId);
    // Update tabs based on manual menu click
    $('.nav-center-link').removeClass('active');
    $(`.nav-center-link[data-section="${menuId}"]`).addClass('active');
};

// --- CRITICAL RESTORATION: CHESSBOARD LOGIC ---
// Las funciones onDragStart, onDrop y onSnapEnd ya están definidas arriba con la lógica completa.

function initBoard() {
    console.log("Initializing Board (Restored)...");

    if ($('#myBoard').length === 0) {
        console.error("CRITICAL: #myBoard element not found in DOM");
        return;
    }

    var config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: getPieceTheme
    };
    board = Chessboard('myBoard', config);
    $(window).resize(board.resize);
    console.log("Board Initialized Success.");
}

// FORCE START
$(document).ready(function () {
    setTimeout(initBoard, 500);
});

// --- COLLAPSIBLE PANEL SECTIONS TOGGLE (FIXED) ---
window.togglePanelSection = function (contentId) {
    const content = document.getElementById(contentId);
    const header = content.previousElementSibling;

    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        header.classList.remove('collapsed');
    } else {
        content.classList.add('collapsed');
        header.classList.add('collapsed');
    }
};

// Sync puzzle stats to the new historial page
const originalUpdatePuzzleStats = window.updatePuzzleStats;
if (typeof originalUpdatePuzzleStats === 'function') {
    window.updatePuzzleStats = function (...args) {
        originalUpdatePuzzleStats(...args);
        // Sync to historial page
        $('#puz-elo-display-main').html($('#puz-elo-display').html());
        $('#puz-stats-list-main').html($('#puz-stats-list').html());
        $('#puz-history-list-main').html($('#puz-history-list').html());
    };

}

// --- PERFORMANCE MONITOR (Solución #1) ---
// --- ACADEMY LOGIC ---
window.renderAcademy = function () {
    if (!isAuth) {
        $('#academy-auth-notice').show();
        $('#academy-lessons-grid').html('<div style="text-align:center; padding:40px; color:var(--text-dim); width:100%;">Registrate para desbloquear la academia.</div>');
        $('#academy-placement-box').hide();
        return;
    }

    $('#academy-auth-notice').hide();
    $('#academy-placement-box').show();

    const grid = $('#academy-lessons-grid');
    grid.empty();

    ACADEMY_CURRICULUM.forEach((lesson, index) => {
        const isLocked = index > academyLevel;
        const progress = isLocked ? 0 : (index < academyLevel ? 100 : 0);

        const card = $(`
            <div class="academy-card ${isLocked ? 'locked' : ''}" onclick="${isLocked ? '' : `startAcademyLesson(${index})`}">
                <h3>${lesson.title}</h3>
                <p style="font-size:0.8rem; color:var(--text-secondary);">${lesson.description}</p>
                <div style="margin-top:15px;">
                    <span class="academy-progress-label">Progreso: ${progress}%</span>
                    <div class="academy-progress-bar">
                        <div class="academy-progress-fill" style="width:${progress}%"></div>
                    </div>
                </div>
            </div>
        `);
        grid.append(card);
    });
};

window.startAcademyLesson = function (index) {
    currentAcademyLevelIndex = index;
    currentAcademyPuzzleIndex = 0;
    const lesson = ACADEMY_CURRICULUM[index];

    setMode('academy');
    loadAcademyPuzzle();
    showToast(`Iniciando: ${lesson.title}`, '🎓');
};

function loadAcademyPuzzle() {
    const lesson = ACADEMY_CURRICULUM[currentAcademyLevelIndex];
    const puzzle = lesson.puzzles[currentAcademyPuzzleIndex];

    if (!puzzle) {
        // Lección completada
        showToast("¡Lección completada!", '🏆');
        if (currentAcademyLevelIndex === academyLevel) {
            academyLevel++;
            localStorage.setItem('chess_academy_level', academyLevel);
        }
        showSubMenu('academy');
        renderAcademy();
        return;
    }

    game.load(puzzle.fen);
    if (board) {
        board.position(puzzle.fen);
        myColor = game.turn();
        board.orientation(myColor === 'w' ? 'white' : 'black');
    }

    setTimeout(syncSquaresWithData, 100); // Dar tiempo al renderizado de piezas

    $('#puz-desc-main').text(puzzle.goal);
    $('#puzzle-controls').show();
}

// Hook original checkMove o handleDrop para academia
const originalOnDrop = onDrop;
onDrop = function (source, target) {
    if (currentMode === 'academy') {
        const lesson = ACADEMY_CURRICULUM[currentAcademyLevelIndex];
        const puzzle = lesson.puzzles[currentAcademyPuzzleIndex];

        if (puzzle.type === 'click') return 'snapback';

        const move = game.move({ from: source, to: target, promotion: 'q' });
        if (move === null) return 'snapback';

        const expected = puzzle.moves ? puzzle.moves[0] : null;
        if (expected && (move.san === expected || (source + target) === expected)) {
            playSnd('move');
            showToast("¡Bien hecho!", "✅");
            currentAcademyPuzzleIndex++;
            setTimeout(loadAcademyPuzzle, 800);
        } else {
            game.undo();
            playSnd('error');
            showToast("Intenta otro movimiento", "❌");
            return 'snapback';
        }
        return;
    }
    return originalOnDrop(source, target);
};

// PLACEMENT TEST
var currentPlacementQ = 0;
window.startPlacementTest = function () {
    currentPlacementQ = 0;
    $('#placement-modal').css('display', 'flex');
    renderPlacementQuestion();
};

function renderPlacementQuestion() {
    const q = PLACEMENT_TEST[currentPlacementQ];
    const html = `
        <h2 style="color:var(--accent); margin-bottom:20px;">Prueba de Nivel (${currentPlacementQ + 1}/${PLACEMENT_TEST.length})</h2>
        <p class="placement-question">${q.question}</p>
        <div class="placement-options">
            ${q.options.map((opt, i) => `<div class="placement-option" onclick="handlePlacementAnswer(${i})">${opt}</div>`).join('')}
        </div>
    `;
    $('#placement-content').html(html);
}

window.handlePlacementAnswer = function (idx) {
    const q = PLACEMENT_TEST[currentPlacementQ];
    if (idx === q.correct) {
        academyLevel = Math.max(academyLevel, q.level);
        localStorage.setItem('chess_academy_level', academyLevel);
    }

    currentPlacementQ++;
    if (currentPlacementQ < PLACEMENT_TEST.length) {
        renderPlacementQuestion();
    } else {
        $('#placement-modal').fadeOut();
        showToast("¡Nivel evaluado! Revisa tus lecciones desbloqueadas.", '📊');
        renderAcademy();
    }
};

// Sync academy render to submenu logic
const academyOriginalShowSubMenu = showSubMenu;
showSubMenu = function (menuId) {
    academyOriginalShowSubMenu(menuId);
    if (menuId === 'academy') renderAcademy();
};


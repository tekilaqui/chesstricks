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
        socket = { on: () => { }, emit: () => { }, connected: false };
    }
} catch (e) { console.error(e); }

const openAuth = () => {
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
var currentMode = 'local';
var selectedSq = null;
var hintsActive = false;
var isJ = false;
window.lastEval = undefined;
window.currentEval = undefined;
var stockfish = null;
var myColor = 'w';

// TIMERS
var whiteTime = 600;
var blackTime = 600;
var clockInterval = null;
var gameStarted = false;
var puzSeconds = 0;
var puzTimerInterval = null;
var currentPuzzle = null;
var puzzleStep = 0;
var userPuzzleElo = parseInt(localStorage.getItem('chess_puz_elo')) || 500;
var userElo = parseInt(localStorage.getItem('chess_user_elo')) || 500;
var userName = localStorage.getItem('chess_username') || "Invitado";
var isAuth = localStorage.getItem('chess_is_auth') === 'true';

// SOUNDS
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
var moveHistory = [];
var analysisActive = false;

// LANGUAGES
var currentLang = localStorage.getItem('chess_lang') || 'es';
const LANGS = {
    es: { mate: "JAQUE MATE", win: "¡HAS GANADO!", lose: "HAS PERDIDO", draw: "TABLAS", resign: "¿Seguro?", abort: "¿Abortar?", guest: "Invitado", login: "ENTRAR", logout: "SALIR" },
    en: { mate: "CHECKMATE", win: "YOU WON!", lose: "YOU LOST", draw: "DRAW", resign: "Resign?", abort: "Abort?", guest: "Guest", login: "LOGIN", logout: "LOGOUT" }
};

function getQualityMsg(diff, isMate) {
    if (isMate && diff === 0) return { text: "🏁 MATE", class: "quality-best", color: "#fbbf24" };
    if (diff < 0.2) return { text: "🌟 MUY BIEN", class: "quality-best", color: "#fbbf24" };
    if (diff < 0.5) return { text: "✅ BIEN", class: "quality-good", color: "#4ade80" };
    if (diff < 1.0) return { text: "⚖️ NORMAL", class: "quality-inaccuracy", color: "#cbd5e1" };
    if (diff < 2.0) return { text: "❓ MAL", class: "quality-mistake", color: "#f87171" };
    return { text: "❌ MUY MAL", class: "quality-blunder", color: "#ef4444" };
}

function setLanguage(l) {
    currentLang = l;
    localStorage.setItem('chess_lang', l);
    // ... UI updates logic ...
}

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (sec < 10 ? "0" : "") + sec;
}

function stopClock() { clearInterval(clockInterval); clockInterval = null; $('.timer-box').removeClass('active'); }

function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    gameStarted = true;
    clockInterval = setInterval(() => {
        if (game.turn() === 'w') { whiteTime--; $('#my-timer').text(formatTime(whiteTime)); }
        else { blackTime--; $('#opp-timer').text(formatTime(blackTime)); }
        updateTimerVisuals();
    }, 1000);
}

function updateTimerVisuals() {
    $('.timer-box').removeClass('active');
    if (game.turn() === 'w') $('#my-timer').addClass('active'); else $('#opp-timer').addClass('active');
}

function getAiElo() {
    const lvl = parseInt($('#diff-sel').val()) || 10;
    return 500 + lvl * 100;
}

function updateElo(opponentElo, result, isPuzzle = false, timeControl = 10) {
    const k = 32;
    const key = isPuzzle ? 'chess_puz_elo' : 'chess_user_elo';
    const currentElo = parseInt(localStorage.getItem(key)) || 500;
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
    const newElo = Math.round(currentElo + k * (result - expectedScore));
    localStorage.setItem(key, newElo);
    if (isPuzzle) { userPuzzleElo = newElo; $('#header-elo-puz').text(newElo + "🧩"); }
    else { userElo = newElo; $('#header-elo').text(newElo + " ELO"); }
    if (isAuth) socket.emit('update_elo', { user: userName, elo: userElo, puzElo: userPuzzleElo });
}

// STOCKFISH
stockfish = new Worker('stockfish.js');
stockfish.postMessage('uci');

stockfish.onmessage = (e) => {
    let l = e.data;
    if (l.includes('score cp')) {
        let match = l.match(/score cp (-?\d+)/);
        if (!match) return;
        let cp = parseInt(match[1]) / 100;
        let ev = (game.turn() === 'w' ? cp : -cp);
        let h = Math.max(0, Math.min(100, 50 + (ev * 15)));
        $('#eval-fill-master').css('height', h + '%');
        window.currentEval = ev;

        let pv = l.match(/ pv ([a-h0-9]{4})/);
        if (pv && pv[1] && hintsActive) {
            $('.square-55d63').removeClass('highlight-hint');
            $('[data-square="' + pv[1].substring(0, 2) + '"]').addClass('highlight-hint');
            $('[data-square="' + pv[1].substring(2, 4) + '"]').addClass('highlight-hint');
            if (typeof drawBestMoveArrow === 'function') drawBestMoveArrow(pv[1].substring(0, 2), pv[1].substring(2, 4));
        }
    }
    if (l.startsWith('bestmove') && currentMode === 'ai' && game.turn() !== myColor) {
        let move = l.split(' ')[1];
        game.move({ from: move.substring(0, 2), to: move.substring(2, 4), promotion: 'q' });
        board.position(game.fen());
        updateUI(true);
    }
};

function getPieceTheme(piece) {
    const theme = localStorage.getItem('chess_piece_theme') || 'wikipedia';
    const baseUrl = 'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/';
    if (theme === 'wikipedia') return 'https://raw.githubusercontent.com/oakmac/chessboardjs/master/website/img/chesspieces/wikipedia/' + piece + '.png';
    return baseUrl + theme + '/' + piece + '.svg';
}

function onDrop(source, target) {
    if (isEditorMode) return;
    let move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    if (currentMode === 'local') socket.emit('move', { move: move.san, gameId: gameId, fen: game.fen() });
    updateUI(true);
}

function updateUI(moved = false) {
    if (moved) {
        if (game.in_check()) playSnd('check'); else playSnd('move');
        historyPositions.push(game.fen());
        currentHistoryIndex = historyPositions.length - 1;
        if (stockfish && (currentMode === 'ai' || hintsActive || currentMode === 'study')) {
            stockfish.postMessage('stop');
            stockfish.postMessage('position fen ' + game.fen());
            stockfish.postMessage('go depth 15');
        }
        checkGameOver();
    }
}

function checkGameOver() {
    if (game.game_over()) {
        showToast("Fin de la partida", "🏁");
        stopClock();
    }
}

window.showSubMenu = function (id, push = true) {
    $('.menu-step').removeClass('active');
    $('#menu-' + id).addClass('active');
    if (push) history.pushState({ menu: id }, "Menu", "?menu=" + id);
};

window.setMode = function (mode) {
    currentMode = mode;
    $('#main-menu-container').hide();
    $('#game-sidebar-controls').fadeIn().css('display', 'flex');
    $('.mode-section').removeClass('active');
    $('#sec-' + (mode === 'local' ? 'local' : (mode === 'ai' ? 'ai' : 'study'))).addClass('active');
    if (window.innerWidth <= 900) $('body').addClass('board-active');
    board.resize();
    updateUI();
};

$(document).ready(() => {
    board = Chessboard('myBoard', {
        draggable: true,
        position: 'start',
        pieceTheme: getPieceTheme,
        onDrop: onDrop,
        onSnapEnd: () => board.position(game.fen())
    });

    $(document).on('click', '[data-action="submenu"]', function () { showSubMenu($(this).data('target')); });
    $(document).on('click', '.btn-set-mode', function () { setMode($(this).data('mode')); });

    $('#board-theme-sel').change(function () {
        let theme = $(this).val();
        localStorage.setItem('chess_board_theme', theme);
        $('body').attr('class', (i, c) => c.replace(/(^|\s)board-theme-\S+/g, '')).addClass('board-theme-' + theme);
    });

    $('#btn-flip').click(() => board.flip());
});

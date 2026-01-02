// 🎮 GAME MODULE
// Core game logic, board handling, and Stockfish integration

import { playSnd, showToast, formatTime, LANGS, currentLang } from './ui.js';
import { updateElo, userName, isAuth, userElo } from './auth.js';
import { handlePuzzleMove, loadRandomPuzzle } from './puzzles.js';
import { getSocket } from './socket.js';

import { Chess } from 'chess.js';

// GAME STATE
export const game = new Chess();
window.game = game; // For debugging and global access
window.Chess = Chess; // For modules expecting it on window
export let board = null;
export let currentMode = 'local';
export let gameId = null;
export let myColor = 'w';
let selectedSq = null;
let gameStarted = false;

// TIMERS
let whiteTime = 600;
let blackTime = 600;
let clockInterval = null;

// ANALYSIS
let stockfish = null;
let historyPositions = ['start'];
let currentHistoryIndex = 0;
let analysisActive = false;
let hintsActive = false;
let isJ = false; // "Judging" flag for analysis

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// OPENINGS DATA
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
        group: "Juegos Semi-Abiertos", items: [
            { name: "Defensa Siciliana", m: ["e4", "c5"] },
            { name: "Defensa Francesa", m: ["e4", "e6"] },
            { name: "Defensa Caro-Kann", m: ["e4", "c6"] }
        ]
    },
    {
        group: "Juegos Cerrados", items: [
            { name: "Gambito de Dama", m: ["d4", "d5", "c4"] },
            { name: "Sistema Londres", m: ["d4", "d5", "Bf4"] }
        ]
    }
];

export function getOpenings() { return OPENINGS_DATA; }

// INIT
export function initGame() {
    // Board Setup
    board = Chessboard('myBoard', {
        draggable: true,
        position: 'start',
        pieceTheme: getPieceTheme,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    });

    // Stockfish Setup
    initStockfish();

    // Click Handlers (Mobile/Global)
    $(document).on('mousedown touchstart', '.square-55d63', function () {
        onSquareClick($(this).data('square'));
    });

    setupGameListeners();
}

function setupGameListeners() {
    // Mode Switching
    $('.mode-pill').click(function () {
        const mode = $(this).data('mode');
        setMode(mode);
    });

    // Game Actions
    $('#btn-flip').click(() => board.flip());
    $('#btn-reset').click(resetGame);
    $('#btn-resign-ai, #btn-resign-local').click(resignGame);
    $('#btn-abort').click(abortGame);

    // Start AI
    $('#btn-start-ai').click(startAiGame);

    // Create/Join Online
    $('#btn-create').click(createOnlineChallenge);

    // Navigation
    $('#btn-nav-first').click(() => {
        if (currentMode === 'study' && currentOpeningMoves.length > 0) { resetGame(); currentOpeningIndex = 0; return; }
        navigateHistory('first');
    });
    $('#btn-nav-prev').click(handleNavPrev);
    $('#btn-nav-next').click(handleNavNext);
    $('#btn-nav-last').click(() => navigateHistory('last'));

    // Hints
    $('#btn-ai-hint, #btn-suggest-move').click(function () {
        toggleHints(this);
    });

    // Opening Selector
    $('#opening-sel').change(function () {
        loadOpening($(this).val());
    });
}

function handleNavNext() {
    if (currentMode === 'study' && currentOpeningMoves.length > 0) {
        if (currentOpeningIndex < currentOpeningMoves.length) {
            const moveSan = currentOpeningMoves[currentOpeningIndex];
            const move = game.move(moveSan);
            if (move) {
                board.position(game.fen());
                currentOpeningIndex++;
                handleMoveSuccess(move);
                playSnd('move');
            } else {
                navigateHistory('next');
            }
            return;
        }
    }
    navigateHistory('next');
}

function handleNavPrev() {
    if (currentMode === 'study' && currentOpeningMoves.length > 0) {
        if (currentOpeningIndex > 0) {
            game.undo();
            board.position(game.fen());
            currentOpeningIndex--;
            updateUI();
            return;
        }
    }
    navigateHistory('prev');
}

export function setMode(mode, subMode) {
    currentMode = mode;
    stopClock();
    gameStarted = false;

    if (mode === 'ai') $('#opp-name').text('Stockfish');
    else if (mode === 'local') $('#opp-name').text('Oponente Online');
    else if (mode === 'exercises') {
        loadRandomPuzzle();
    }
    else if (mode === 'study') {
        $('#opp-name').text('Análisis / Estudio');
        resetGame();
    }
    else if (mode === 'friend') {
        $('#opp-name').text('Amigo Local');
        resetGame();
        showToast('Partida local iniciada. Juega por turnos.', '👥');
    }

    resetTimers();
    updateUI();

    const needsStockfish = ['ai', 'study'].includes(mode) || hintsActive;
    if (needsStockfish) {
        if (!stockfish) initStockfish();
        else {
            stockfish.postMessage('ucinewgame');
            stockfish.postMessage('isready');
        }
    } else {
        terminateStockfish();
    }

    if (mode === 'study' && !subMode) {
        populateOpeningsDropdown();
    }
}

function initStockfish() {
    if (stockfish) return;
    console.log("🤖 Iniciando motor Stockfish...");

    const localUrl = 'stockfish.js';
    const cdnUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';

    const setupWorker = (url) => {
        try {
            const worker = new Worker(url);
            worker.onmessage = handleStockfishMessage;
            worker.onerror = (err) => {
                console.error(`❌ Error en Worker (${url}):`, err);
                if (url !== cdnUrl) {
                    console.log("🔄 Intentando cargar desde CDN...");
                    initStockfishFromUrl(cdnUrl);
                }
            };
            stockfish = worker;
            setupStockfishListeners();
            console.log(`✅ Stockfish Worker intentando cargar desde: ${url}`);
        } catch (e) {
            console.error(`❌ Fallo crítico al crear Worker (${url}):`, e);
            if (url !== cdnUrl) initStockfishFromUrl(cdnUrl);
            else showToast("Error fatal del motor", "🚫");
        }
    };

    setupWorker(localUrl);
}

function initStockfishFromUrl(url) {
    try {
        stockfish = new Worker(url);
        stockfish.onmessage = handleStockfishMessage;
        setupStockfishListeners();
        console.log("✅ Stockfish Worker cargado desde fallback.");
    } catch (e) {
        showToast("No se pudo iniciar la IA", "⚠️");
    }
}

function setupStockfishListeners() {
    if (!stockfish) return;

    stockfish.postMessage('uci');
    stockfish.postMessage('isready');
    stockfish.postMessage('ucinewgame');

    // Default options
    const threads = isMobile() ? 1 : 2;
    const hash = isMobile() ? 16 : 64;
    stockfish.postMessage(`setoption name Threads value ${threads}`);
    stockfish.postMessage(`setoption name Hash value ${hash}`);

    if (currentMode === 'ai' || hintsActive) {
        setTimeout(analyzePosition, 500);
    }
}


function terminateStockfish() {
    if (stockfish) {
        stockfish.postMessage('quit');
        stockfish.terminate();
        stockfish = null;
        console.log("🤖 Stockfish Worker terminado para ahorrar recursos.");
    }
}

let currentOpeningMoves = [];
let currentOpeningIndex = 0;

function populateOpeningsDropdown() {
    const sel = $('#opening-sel');
    if (sel.children('option').length > 1) return; // Already populated
    OPENINGS_DATA.forEach((g, gI) => {
        const grp = $(`<optgroup label="${g.group}">`);
        g.items.forEach((it, iI) => {
            grp.append(new Option(it.name, `${gI}-${iI}`));
        });
        sel.append(grp);
    });
}

export function loadOpening(val) {
    if (!val) return;
    const [gIdx, iIdx] = val.split('-');
    const opening = OPENINGS_DATA[gIdx]?.items[iIdx];

    if (opening) {
        resetGame();
        currentOpeningMoves = opening.m;
        currentOpeningIndex = 0;
        showToast(`Apertura: ${opening.name} `, "📖");
        // Play first move immediately or wait? User asked to use controls.
        // Let's reset and let them trigger it.
        updateUI();
    }
}


// MOVEMENT HANDLERS
function onDrop(source, target) {
    if (currentMode === 'exercises') return 'snapback'; // Puzzles handled by click usually, but if drag allowed...
    // Let's rely on click mostly for puzzles or implement logic

    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    const socket = getSocket();
    if (currentMode === 'local' && socket) {
        socket.emit('move', { move: move.san, gameId: gameId, fen: game.fen() });
    } else if (currentMode === 'friend') {
        playSnd(move.captured ? 'capture' : 'move');
    }

    handleMoveSuccess(move);
}

function onSquareClick(sq) {
    if (selectedSq) {
        if (selectedSq === sq) { selectedSq = null; updateUI(); return; }

        if (currentMode === 'exercises') {
            const handled = handlePuzzleMove(sq, selectedSq);
            if (handled) selectedSq = null; else updateUI(); // Unselect if invalid puzzle move
            return;
        }

        var move = game.move({ from: selectedSq, to: sq, promotion: 'q' });
        if (move) {
            board.position(game.fen());
            selectedSq = null;

            const socket = getSocket();
            if (currentMode === 'local' && socket) {
                socket.emit('move', { move: move.san, gameId: gameId, fen: game.fen() });
            } else if (currentMode === 'friend') {
                playSnd(move.captured ? 'capture' : 'move');
            }

            handleMoveSuccess(move);
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

function handleMoveSuccess(move) {
    updateUI(true);
    checkGameOver();
}

function onSnapEnd() {
    board.position(game.fen());
}

// LOGIC HELPERS
export function updateUI(moved = false) {
    $('.square-55d63').removeClass('highlight-selected highlight-hint');
    $('.legal-dot').remove();
    updateMaterial();

    if (moved) {
        if (game.in_check()) playSnd('check');
        else playSnd('move');

        updateHistory();
        if (!gameStarted && currentMode !== 'exercises' && currentMode !== 'study') startClock();
        if (currentMode !== 'exercises' && currentMode !== 'study') updateTimerVisuals();

        if (stockfish && (currentMode === 'ai' || hintsActive)) {
            analyzePosition();
        }
    }
}

function analyzePosition() {
    if (!stockfish) return;
    stockfish.postMessage('stop');

    // UCI standard: send position then go
    stockfish.postMessage('position fen ' + game.fen());

    // Determine depth
    let depth = 15;
    if (currentMode === 'ai' && game.turn() !== myColor) {
        depth = parseInt($('#diff-sel').val()) || 5;
    }

    stockfish.postMessage('go depth ' + depth);
    console.log(`🤖 Analizando posición (Turno: ${game.turn()}, Modo: ${currentMode}, Profundidad: ${depth})`);
}

function handleStockfishMessage(e) {
    const l = e.data;
    if (typeof l !== 'string') return;

    // Verbose log for debugging
    if (l.startsWith('bestmove') || l.includes('score cp') || l.includes('readyok')) {
        console.log("🤖 SF ->", l);
    }

    // Evaluation
    if (l.includes('score cp')) {
        const cpMatch = l.match(/score cp (-?\d+)/);
        if (cpMatch) {
            const cp = parseInt(cpMatch[1]) / 100;
            const ev = (game.turn() === 'w' ? cp : -cp);
            const h = Math.max(0, Math.min(100, 50 + (ev * 15)));
            if (!analysisActive) $('#eval-fill-master').css('height', h + '%');
            updateCoachMessage(ev);
        }
    }

    // Best Move Logic
    if (l.startsWith('bestmove')) {
        const parts = l.split(' ');
        const bestMove = parts[1];

        if (bestMove && bestMove !== '(none)') {
            // 1. If AI turn, make the move
            if (currentMode === 'ai' && game.turn() !== myColor) {
                console.log(`🤖 AI decidió: ${bestMove}`);
                setTimeout(() => {
                    if (game.turn() !== myColor) {
                        const m = game.move({
                            from: bestMove.substring(0, 2),
                            to: bestMove.substring(2, 4),
                            promotion: bestMove.length > 4 ? bestMove[4] : 'q'
                        });

                        if (m) {
                            board.position(game.fen());
                            handleMoveSuccess(m);
                        }
                    }
                }, 600);
            }

            // 2. If hints/study active, show it
            if (hintsActive || currentMode === 'study') {
                const from = bestMove.substring(0, 2);
                const to = bestMove.substring(2, 4);
                $('#best-move-display, #study-best-move-text').text(`Mejor jugada: ${bestMove}`).show();

                if (hintsActive) {
                    $('.square-55d63').removeClass('highlight-hint');
                    $(`[data-square="${from}"]`).addClass('highlight-hint');
                    $(`[data-square="${to}"]`).addClass('highlight-hint');
                }
            }
        }
    }
}

function updateCoachMessage(ev) {
    const coach = $('#coach-txt');
    if (ev > 2) coach.text("¡Las blancas tienen una ventaja decisiva!");
    else if (ev > 0.8) coach.text("Las blancas están mejor posisionadas.");
    else if (ev < -2) coach.text("¡Las negras dominan el tablero!");
    else if (ev < -0.8) coach.text("Las negras tienen ventaja técnica.");
    else coach.text("La posición está bastante equilibrada.");
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
    let txt = diff === 0 ? "Igualdad" : (diff > 0 ? `+ ${diff} Blancas` : ` + ${Math.abs(diff)} Negras`);
    $('#material-display').text(txt).css('color', diff > 0 ? '#fff' : (diff < 0 ? '#aaa' : '#888'));
}


// TIMERS
function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    gameStarted = true;
    clockInterval = setInterval(() => {
        if (game.turn() === 'w') {
            whiteTime--;
            $('#my-timer').text(formatTime(whiteTime));
            if (whiteTime <= 0) endGameByTime('w');
        } else {
            blackTime--;
            $('#opp-timer').text(formatTime(blackTime));
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

function stopClock() {
    clearInterval(clockInterval);
    clockInterval = null;
    $('.timer-box').removeClass('active');
}

function resetTimers() {
    whiteTime = 600; blackTime = 600;
    $('#my-timer, #opp-timer').text("10:00");
}

function endGameByTime(loser) {
    stopClock();
    alert(`¡TIEMPO AGOTADO! Ganan las ${loser === 'w' ? 'Negras' : 'Blancas'} `);
    checkGameOver();
}

function checkGameOver() {
    if (game.game_over()) {
        let result = 0.5;
        if (game.in_checkmate()) result = (game.turn() !== myColor) ? 1 : 0;

        stopClock();

        if (currentMode === 'ai') updateElo(getAiElo(), result);
        else if (currentMode === 'local') updateElo(800, result); // Sim

        playSnd('end');
        alert("Fin de la partida");
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

    game.load(historyPositions[currentHistoryIndex]);
    board.position(game.fen());
}


// UTILS
function resetGame() {
    game.reset();
    board.start();
    historyPositions = ['start'];
    currentHistoryIndex = 0;
    // reset opening state unless we are specifically loading one
    if (currentMode !== 'study') currentOpeningMoves = [];
    updateUI();
}

function startAiGame() {
    const color = $('#ai-color-sel').val();
    myColor = color === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : color;
    resetGame();
    board.orientation(myColor === 'w' ? 'white' : 'black');
    if (myColor === 'b') {
        setTimeout(() => {
            game.move('e4');
            board.position(game.fen());
            updateUI(true);
        }, 500);
    }
}

function createOnlineChallenge() {
    if (!isAuth) { alert("Regístrate para jugar online."); return; }
    gameId = Math.random().toString(36).substr(2, 9);
    myColor = 'w';
    board.orientation('white');
    const socket = getSocket();
    if (socket) socket.emit('create_challenge', { id: gameId, user: userName, elo: userElo, time: 10 });
    alert("Reto creado, esperando rival...");
}

// RESIGN / ABORT
function resignGame() {
    if (confirm(LANGS[currentLang].resign)) {
        stopClock();
        if (currentMode === 'ai') updateElo(getAiElo(), 0);
        resetGame();
    }
}

function abortGame() {
    if (confirm("¿Abortar?")) {
        resetGame();
    }
}

function getAiElo() {
    const lvl = parseInt($('#diff-sel').val()) || 10;
    return 1000 + (lvl * 50);
}

function getPieceTheme(piece) {
    return 'https://raw.githubusercontent.com/oakmac/chessboardjs/master/website/img/chesspieces/wikipedia/' + piece + '.png';
}

function toggleHints(btn) {
    hintsActive = !hintsActive;
    $(btn).toggleClass('active', hintsActive);

    if (hintsActive) {
        showToast("Pistas activadas", "💡");
        analyzePosition();
    } else {
        $('.square-55d63').removeClass('highlight-hint');
        $('#best-move-display').hide();
    }
}

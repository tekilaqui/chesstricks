// ChessdreZ Kids - Main Logic
let board = null;
let aiBoard = null;
let game = new Chess();
let stars = 0;
let aiDepth = 0; // Inicia en Nivel 0
let userColor = 'w';
let kidsStockfish = null;
let autoHelpEnabled = true;

let kidProfiles = JSON.parse(localStorage.getItem('kid_profiles') || '{}');
let currentKid = localStorage.getItem('current_kid_id') || null;

// Variables para Click-to-move
let selectedSquare = null;

$(document).ready(function () {
    initKidsStockfish();

    if (!currentKid) {
        showProfileSelector();
    } else {
        loadKidProfile(currentKid);
    }

    document.addEventListener('touchmove', function (e) {
        const boardEl = e.target.closest('#kidsBoard') || e.target.closest('#aiBoard');
        if (boardEl) e.preventDefault();
    }, { passive: false });

    renderWorlds();
});

function initKidsStockfish() {
    try {
        kidsStockfish = new Worker('../stockfish.js');
        kidsStockfish.onmessage = (e) => {
            const msg = e.data;
            if (msg.startsWith('bestmove')) {
                const moveStr = msg.split(' ')[1];
                if (window.pendingMaestroHint) {
                    showMaestroHint(moveStr);
                    window.pendingMaestroHint = false;
                } else {
                    makeAIMove(moveStr);
                }
            }
        };
        kidsStockfish.postMessage('uci');
    } catch (e) {
        console.error("Stockfish Error:", e);
    }
}

// PROFILE SYSTEM
function showProfileSelector() {
    $('#kids-profiles').css('display', 'flex').show();
    renderProfiles();
}

function renderProfiles() {
    const list = $('#profiles-list');
    list.empty();
    Object.keys(kidProfiles).forEach(id => {
        const kid = kidProfiles[id];
        const item = $(`
            <div class="kids-card" style="padding:15px; border:4px solid var(--kids-blue); cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:1.2rem; font-weight:900;">👦 ${kid.name}</span>
                <span>⭐ ${kid.stars}</span>
            </div>
        `);
        item.click(() => selectKid(id));
        list.append(item);
    });
}

function addNewKid() {
    const name = $('#new-kid-name').val().trim();
    if (!name) return;
    const id = 'kid_' + Date.now();
    kidProfiles[id] = { name: name, stars: 0, unlockedWorlds: 1 };
    saveProfiles();
    $('#new-kid-name').val('');
    renderProfiles();
}

function selectKid(id) {
    currentKid = id;
    localStorage.setItem('current_kid_id', id);
    loadKidProfile(id);
    $('#kids-profiles').hide();
    showHome();
}

function loadKidProfile(id) {
    const kid = kidProfiles[id];
    if (kid) {
        stars = kid.stars;
        $('#current-kid-name').text(kid.name);
        updateStarDisplay();
        renderWorlds();
    }
}

function saveProfiles() {
    if (currentKid && kidProfiles[currentKid]) {
        kidProfiles[currentKid].stars = stars;
    }
    localStorage.setItem('kid_profiles', JSON.stringify(kidProfiles));
}

function updateStarDisplay() {
    $('#star-count').text(stars);
    saveProfiles();
}

// NAVIGATION
function goBackStep() {
    if ($('#kids-game').is(':visible')) showWorlds();
    else if ($('#kids-worlds').is(':visible') || $('#kids-play-ai').is(':visible')) showHome();
    else showProfileSelector();
}

function showHome() {
    $('#kids-home').show();
    $('#kids-worlds').hide();
    $('#kids-game').hide();
    $('#kids-play-ai').hide();
}

function showWorlds() {
    $('#kids-home').hide();
    $('#kids-worlds').show();
    $('#kids-game').hide();
    $('#kids-play-ai').hide();
    renderWorlds();
}

function showPlayAI() {
    $('#kids-home').hide();
    $('#kids-worlds').hide();
    $('#kids-game').hide();
    $('#kids-play-ai').show();
    setTimeout(resetKidsGame, 200);
}

function renderWorlds() {
    const container = $('#worlds-container');
    if (!container.length) return;
    container.empty();
    KIDS_LEVELS.forEach((world, index) => {
        const isLocked = index > 0 && stars < (index * 20);
        const card = $(`
            <div class="kids-card world-card ${isLocked ? 'locked' : ''}" style="border-color: ${world.color}">
                <div class="card-icon">${index + 1}</div>
                <div class="card-text">${world.name}</div>
                <div style="font-size: 0.8rem; margin-top: 10px; opacity: 0.8;">${world.description}</div>
            </div>
        `);
        if (!isLocked) card.click(() => startWorld(world));
        container.append(card);
    });
}

function startWorld(world) {
    currentWorld = world;
    currentPuzzleIndex = 0;
    $('#kids-worlds').hide();
    $('#kids-game').show();
    loadPuzzle();
}

function loadPuzzle() {
    const puzzle = currentWorld.puzzles[currentPuzzleIndex];
    if (!puzzle) {
        stars += 10;
        updateStarDisplay();
        alert("¡CAMPEÓN! 🏆 Has ganado 10 estrellas.");
        showWorlds();
        return;
    }
    game.load(puzzle.fen);
    $('#level-name').text(currentWorld.name + " - Nivel " + (currentPuzzleIndex + 1));
    $('#level-task').text(puzzle.goal);
    speak(puzzle.goal);

    if (board) board.destroy();
    board = Chessboard('kidsBoard', {
        draggable: true,
        position: puzzle.fen,
        onDrop: handleDrop,
        onMouseoutSquare: removeHighlights,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: () => board.position(game.fen()),
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    });

    // Soporte Click-to-move
    $('#kidsBoard .square-55d63').on('click', function () {
        const square = $(this).data('square');
        handleSquareClick(square, 'kidsBoard');
    });

    $('#btn-hint').off('click').on('click', () => {
        speak(puzzle.hint);
        alert("💡 Pista: " + puzzle.hint);
    });
}

function handleDrop(source, target) {
    const puzzle = currentWorld.puzzles[currentPuzzleIndex];
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    const isCorrect = puzzle.moves.some(m => m === move.san || m === (source + target));
    if (isCorrect) {
        stars += 3;
        updateStarDisplay();
        currentPuzzleIndex++;
        setTimeout(loadPuzzle, 600);
    } else {
        game.undo();
        stars = Math.max(0, stars - 1);
        updateStarDisplay();
        return 'snapback';
    }
}

// AI GAME logic
function resetKidsGame() {
    game = new Chess();
    selectedSquare = null;
    if (aiBoard) aiBoard.destroy();

    aiBoard = Chessboard('aiBoard', {
        draggable: true,
        position: 'start',
        onDrop: handleAIDrop,
        onMouseoutSquare: removeHighlights,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: () => aiBoard.position(game.fen()),
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    });

    // Click-to-move bindings
    $('#aiBoard .square-55d63').on('click', function () {
        const square = $(this).data('square');
        handleSquareClick(square, 'aiBoard');
    });

    $('#ai-advice').text("¡Hola! Soy tu oponente. ¿Jugamos?");
    speak("¡Hola! Soy tu oponente. ¿Jugamos?");
}

function handleSquareClick(square, boardId) {
    const currentBoard = (boardId === 'aiBoard' ? aiBoard : board);

    // Si ya hay uno seleccionado y pulsamos en un movimiento legal
    if (selectedSquare) {
        const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
        if (move) {
            currentBoard.position(game.fen());
            if (boardId === 'aiBoard') finalizeUserMove();
            else handleDrop(selectedSquare, square);
            selectedSquare = null;
            removeHighlights();
            return;
        }
    }

    // Seleccionar nueva pieza
    selectedSquare = square;
    removeHighlights();

    const moves = game.moves({ square: square, verbose: true });
    if (moves.length === 0) {
        selectedSquare = null;
        return;
    }

    $(`#${boardId} .square-${square}`).addClass('highlight-maestro');
    moves.forEach(m => {
        $(`#${boardId} .square-${m.to}`).addClass('highlight-possible');
    });
}

function onMouseoverSquare(square, piece) {
    const moves = game.moves({ square: square, verbose: true });
    if (moves.length === 0) return;
    moves.forEach(m => {
        $('#aiBoard .square-' + m.to).addClass('highlight-possible');
        $('#kidsBoard .square-' + m.to).addClass('highlight-possible');
    });
}

function removeHighlights() {
    $('.square-55d63').removeClass('highlight-possible highlight-maestro highlight-last');
}

function handleAIDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    finalizeUserMove();
}

function finalizeUserMove() {
    aiBoard.position(game.fen());
    removeHighlights();

    if (autoHelpEnabled) {
        verifyMoveMaestro();
    } else {
        if (!game.game_over()) setTimeout(thinkAI, 1000);
        else checkGameOverAI();
    }
}

function verifyMoveMaestro() {
    // Si el movimiento te deja en jaque o pierde una pieza valiosa
    // Usamos stockfish para evaluar rápido
    kidsStockfish.postMessage('position fen ' + game.fen());
    kidsStockfish.postMessage('go depth 5'); // Evaluación rápida

    // Pero para niños, detectamos capturas simples de Dama o Rey
    const history = game.history({ verbose: true });
    const lastMove = history[history.length - 1];

    // Simular que el Maestro te avisa si el rival puede comerte
    setTimeout(() => {
        const fen = game.fen();
        const opponentGame = new Chess(fen);
        const captures = opponentGame.moves({ verbose: true }).filter(m => m.captured);

        const dangerousCapture = captures.find(c => c.captured === 'q' || c.captured === 'r');

        if (dangerousCapture) {
            $('#ai-advice').text("¡Cuidado! Si te quedas ahí, te comerán. ¿Quieres repetir?");
            speak("¡Cuidado! Si te quedas ahí, te comerán. ¿Quieres repetir?");
            if (confirm("🛡️ EL MAESTRO DICE:\n\nEse movimiento es peligroso. ¿Quieres intentar otro?")) {
                game.undo();
                aiBoard.position(game.fen());
                return;
            }
        }

        if (!game.game_over()) thinkAI();
        else checkGameOverAI();
    }, 500);
}

function thinkAI() {
    $('#ai-advice').text("Mmm... dejame pensar... 🤔");

    // DIFICULTAD PARA NIÑOS REAL
    let blunderChance = 0;
    if (aiDepth === 0) blunderChance = 0.90; // 90% de mover al azar
    else if (aiDepth === 1) blunderChance = 0.70;
    else if (aiDepth === 3) blunderChance = 0.40;
    else if (aiDepth === 5) blunderChance = 0.20;

    if (Math.random() < blunderChance) {
        const moves = game.moves();
        const rand = moves[Math.floor(Math.random() * moves.length)];
        setTimeout(() => makeAIMoveSAN(rand), 1500);
    } else {
        kidsStockfish.postMessage('position fen ' + game.fen());
        kidsStockfish.postMessage('go depth ' + Math.max(1, aiDepth));
    }
}

function makeAIMoveSAN(san) {
    const m = game.move(san);
    if (m) {
        aiBoard.position(game.fen());
        const msg = getRandomAIMessage();
        $('#ai-advice').text(msg);
        speak(msg);
        checkGameOverAI();
    }
}

function makeAIMove(moveStr) {
    const move = game.move({ from: moveStr.substring(0, 2), to: moveStr.substring(2, 4), promotion: 'q' });
    if (move) {
        aiBoard.position(game.fen());
        const msg = getRandomAIMessage();
        $('#ai-advice').text(msg);
        speak(msg);
        checkGameOverAI();
    }
}

function maestroGetHint() {
    window.pendingMaestroHint = true;
    kidsStockfish.postMessage('position fen ' + game.fen());
    kidsStockfish.postMessage('go depth 10');
}

function showMaestroHint(moveStr) {
    const source = moveStr.substring(0, 2);
    const target = moveStr.substring(2, 4);
    removeHighlights();
    $(`#aiBoard .square-${source}`).addClass('highlight-maestro');
    $(`#aiBoard .square-${target}`).addClass('highlight-maestro');
    speak("Yo movería de " + source + " a " + target);
    $('#ai-advice').text("💡 El Maestro sugiere: " + source + " -> " + target);
}

function toggleAutoHelp() {
    autoHelpEnabled = !autoHelpEnabled;
    $('#btn-toggle-autohelp').text(autoHelpEnabled ? "🛡️ Maestro: SI" : "🛡️ Maestro: NO");
    $('#btn-toggle-autohelp').css('background', autoHelpEnabled ? '#fbbf24' : '#ccc');
}

function changeAIDifficulty(depth) {
    aiDepth = parseInt(depth);
    const names = { "0": "Bebé 👶", "1": "Tortuga 🐢", "3": "Caracol 🐌", "5": "Perrito 🐶", "8": "Zorro 🦊" };
    $('#ai-level-title').text("Nivel: " + (names[aiDepth] || "Amigo"));
}

function getRandomAIMessage() {
    const msgs = ["¡Te toca!", "¡Qué divertido!", "¿Viste lo que hice?", "¡Eres un gran jugador!", "¡Uy, qué difícil!", "¡Me gusta jugar contigo!"];
    return msgs[Math.floor(Math.random() * msgs.length)];
}

function checkGameOverAI() {
    if (game.game_over()) {
        if (game.in_checkmate()) {
            if (game.turn() === 'b') { speak("¡Increíble! ¡Me has ganado!"); alert("¡HAS GANADO! 🏆"); stars += 20; }
            else { speak("¡Gané yo! Pero has jugado muy bien."); alert("¡Gané yo! 😜"); }
        } else { speak("¡Es un empate! Choca esos cinco."); alert("¡Empate! 🤝"); }
        updateStarDisplay();
    }
}

function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }
}

let board = null;
let aiBoard = null;
let kidsPuzBoard = null;
let currentKidPuzzle = null;
let game = new Chess();
let stars = 0;
let aiDepth = 0;
let userColor = 'w';
let kidsStockfish = null;
let autoHelpEnabled = true;
let isMinigame = false;
let isKidsLoading = false; // Prevent multiple clicks during level load

const ACHIEVEMENTS = {
    first_win: { id: 'first_win', name: '🌟 Primer Triunfo', emoji: '🏆', reward: 10 },
    speed_solver: { id: 'speed_solver', name: '⚡ Velocista', emoji: '🚀', reward: 25 },
    puzzle_warrior: { id: 'puzzle_warrior', name: '🗡️ Guerrero', emoji: '⚔️', reward: 50 },
    perfect_week: { id: 'perfect_week', name: '🔥 Semana Perfecta', emoji: '📅', reward: 100 }
};

const DAILY_CHALLENGES = {
    monday: { name: '🎯 Lunes de Mate', theme: 'mate', reward: 150 },
    tuesday: { name: '🛡️ Martes de Defensa', theme: 'defense', reward: 150 },
    wednesday: { name: '🔱 Miércoles de Táctica', theme: 'tactic', reward: 150 },
    thursday: { name: '👑 Jueves de Reyes', theme: 'king', reward: 150 },
    friday: { name: '🎠 Viernes de Caballos', theme: 'knight', reward: 150 },
    saturday: { name: '✨ Sábado Brillante', theme: 'brilliant', reward: 150 },
    sunday: { name: '🏰 Domingo de Enroque', theme: 'castle', reward: 150 }
};

const KIDS_SOUNDS = {
    move: new Audio('https://github.com/lichess-org/lila/raw/master/public/sound/standard/Move.mp3'),
    win: new Audio('https://github.com/lichess-org/lila/raw/master/public/sound/standard/GenericNotify.mp3'),
    loss: new Audio('https://github.com/lichess-org/lila/raw/master/public/sound/standard/Error.mp3'),
    achievement: new Audio('https://github.com/lichess-org/lila/raw/master/public/sound/standard/Confirmation.mp3'),
    checkmate: new Audio('https://github.com/lichess-org/lila/raw/master/public/sound/standard/Victory.mp3')
};

function playKidSound(s) {
    if (kidsConfig.sound && KIDS_SOUNDS[s]) {
        KIDS_SOUNDS[s].currentTime = 0;
        KIDS_SOUNDS[s].play().catch(e => { });
    }
}

// Settings with defaults
let kidsConfig = JSON.parse(localStorage.getItem('kids_config') || '{"sound":true,"theme":"space","board":"classic","pieces":"wikipedia","moveMethod":"click"}');

let kidProfiles = JSON.parse(localStorage.getItem('kid_profiles') || '{}');
let currentKid = localStorage.getItem('current_kid_id') || null;

// Variables para Click-to-move
let selectedSquare = null;

$(document).ready(function () {
    initKidsStockfish();
    applyInitialConfig();

    // Delegación de eventos para clics en el tablero (Click-to-move)
    $(document).on('click', '#kidsBoard [data-square], #aiBoard [data-square], #kidsPuzBoard [data-square]', function () {
        if (kidsConfig.moveMethod !== 'click') return;
        const square = $(this).attr('data-square');
        const boardId = $(this).closest('.kids-board-styled').attr('id');
        handleSquareClick(square, boardId);
    });


    $(document).on('click', '.kid-profile-card', function () {
        const id = $(this).attr('data-id');
        selectKid(id);
    });

    if (!currentKid || !kidProfiles[currentKid]) {
        showProfileSelector();
    } else {
        loadKidProfile(currentKid);
        showHome();
    }

    $(window).on('resize', function () {
        if (board) board.resize();
        if (aiBoard) aiBoard.resize();
    });

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
                    if (!isMinigame) {
                        setTimeout(() => makeAIMove(moveStr), 2500);
                    } else {
                        setTimeout(() => makeAIMove(moveStr), 1000);
                    }
                }
            }
        };
        kidsStockfish.postMessage('uci');
    } catch (e) {
        console.error("Stockfish Error:", e);
    }
}

// CONFIG & SETTINGS
function applyInitialConfig() {
    changeTheme(kidsConfig.theme);
    updateSoundUI();
}

function showSettings() {
    $('.kids-main > div').hide();
    $('#kids-settings').show();

    $('.theme-btn').removeClass('active');
    $('.theme-btn.theme-' + kidsConfig.theme).addClass('active');

    $('.piece-btn').removeClass('active');
    $('#piece-theme-' + kidsConfig.pieces).addClass('active');
    $(`#move-method-${kidsConfig.moveMethod}`).addClass('active');

    $('.settings-group .theme-btn[id^="board-theme-"]').removeClass('active');
    $('#board-theme-' + kidsConfig.board).addClass('active');
}

function toggleSound() {
    kidsConfig.sound = !kidsConfig.sound;
    saveConfig();
    updateSoundUI();
    if (!kidsConfig.sound) window.speechSynthesis.cancel();
}

function updateSoundUI() {
    const icon = kidsConfig.sound ? "🔊" : "🔇";
    const text = kidsConfig.sound ? "Sonido Activado" : "Sonido Silenciado";
    $('#setting-sound-icon').text(icon);
    $('#setting-sound-text').text(text);
    $('#setting-sound-btn').css('border-color', kidsConfig.sound ? 'var(--kids-green)' : 'var(--kids-red)');
}

function changeTheme(theme) {
    kidsConfig.theme = theme;
    saveConfig();
    $('body').removeClass('theme-space theme-forest theme-ocean theme-candy').addClass('theme-' + theme);
    $('.theme-btn').removeClass('active');
    $('.theme-btn.theme-' + theme).addClass('active');
}

function changeBoardTheme(color) {
    kidsConfig.board = color;
    saveConfig();
    $('.settings-group .theme-btn[id^="board-theme-"]').removeClass('active');
    $('#board-theme-' + color).addClass('active');
    updateBoardStyles();
}

function changePieceTheme(set) {
    kidsConfig.pieces = set;
    saveConfig();
    $('.piece-btn').removeClass('active');
    $('#piece-theme-' + set).addClass('active');
    updateBoardStyles();
}

function changeMoveMethod(method) {
    kidsConfig.moveMethod = method;
    saveConfig();
    $('[id^="move-method-"]').removeClass('active');
    $(`#move-method-${method}`).addClass('active');

    if (board) board.destroy();
    if (aiBoard) aiBoard.destroy();

    if ($('#kids-game').is(':visible')) loadPuzzle();
    if ($('#kids-play-ai').is(':visible')) resetKidsGame();
}

function saveConfig() {
    localStorage.setItem('kids_config', JSON.stringify(kidsConfig));
}

function updateBoardStyles() {
    if ($('#kids-game').is(':visible')) loadPuzzle();
    if ($('#kids-play-ai').is(':visible')) {
        const fen = game.fen();
        resetKidsGame();
        game.load(fen);
        aiBoard.position(fen);
    }
}

function getPieceTheme(piece) {
    return 'https://chessboardjs.com/img/chesspieces/wikipedia/' + piece + '.png';
}

// PROFILE SYSTEM
function showProfileSelector() {
    $('#kids-profiles').css('display', 'flex').show();
    renderProfiles();
}

function renderProfiles() {
    const list = $('#profiles-list');
    list.empty();
    const ids = Object.keys(kidProfiles);
    if (ids.length === 0) {
        list.append('<p style="color:white; font-weight:700;">¡Hola! Registra el nombre de un niño para empezar a jugar.</p>');
    }
    ids.forEach(id => {
        const kid = kidProfiles[id];
        const item = $(`
            <div class="kids-card kid-profile-card" data-id="${id}" style="padding:15px; border:4px solid var(--kids-blue); cursor:pointer; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; background:white; color:#333;">
                <span style="font-size:1.2rem; font-weight:900;">👦 ${kid.name}</span>
                <span style="background:var(--kids-yellow); padding:5px 10px; border-radius:10px; font-weight:900;">⭐ ${kid.stars}</span>
            </div>
        `);
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
    selectKid(id);
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
        stars = kid.stars || 0;
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
    checkAchievements();
}

function checkAchievements() {
    if (!currentKid || !kidProfiles[currentKid]) return;
    const kid = kidProfiles[currentKid];
    if (!kid.achievements) kid.achievements = [];

    // Simple conditions for now
    if (!kid.achievements.includes('first_win') && stars >= 10) {
        unlockAchievement('first_win');
    }
    if (!kid.achievements.includes('puzzle_warrior') && stars >= 100) {
        unlockAchievement('puzzle_warrior');
    }
}

function unlockAchievement(id) {
    const kid = kidProfiles[currentKid];
    if (kid.achievements.includes(id)) return;

    const ach = ACHIEVEMENTS[id];
    kid.achievements.push(id);
    stars += ach.reward;
    saveProfiles();
    updateStarDisplay();

    playKidSound('achievement');
    showAchievementNotif(ach);
}

function showAchievementNotif(ach) {
    const $notif = $(`
        <div class="achievement-notif">
            <span style="font-size: 2rem;">${ach.emoji}</span>
            <div>
                <div style="font-size: 0.7rem; opacity: 0.7;">¡LOGRO DESBLOQUEADO!</div>
                <div style="font-size: 1.1rem;">${ach.name}</div>
                <div style="color: #000; font-size: 0.8rem;">+${ach.reward} estrellas</div>
            </div>
        </div>
    `);
    $('body').append($notif);
    setTimeout(() => $notif.addClass('show'), 100);
    setTimeout(() => {
        $notif.removeClass('show');
        setTimeout(() => $notif.remove(), 500);
    }, 4000);
}

function createConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const confetti = $('<div class="confetti"></div>');
    confetti.css({
        left: Math.random() * 100 + 'vw',
        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
        width: Math.random() * 10 + 5 + 'px',
        height: Math.random() * 10 + 5 + 'px',
        opacity: Math.random()
    });
    $('body').append(confetti);
    setTimeout(() => confetti.remove(), 3000);
}

function createFloatingStar() {
    const star = $('<div class="kids-reward-star">⭐</div>');
    star.css({
        left: (Math.random() * 60 + 20) + 'vw',
        top: (Math.random() * 60 + 20) + 'vh'
    });
    $('body').append(star);
    setTimeout(() => star.remove(), 1000);
}

function showKidsReward(amount) {
    playKidSound('win');
    for (let i = 0; i < 30; i++) setTimeout(createConfetti, i * 50);
    for (let i = 0; i < 5; i++) setTimeout(createFloatingStar, i * 200);

    stars += amount;
    updateStarDisplay();
}


// NAVIGATION
function goBackStep() {
    clearArrows('aiBoard');
    clearArrows('kidsBoard');
    if ($('#kids-game').is(':visible')) showWorlds();
    else if ($('#kids-worlds').is(':visible') || $('#kids-play-ai').is(':visible') || $('#kids-minigames').is(':visible') || $('#kids-progress').is(':visible') || $('#kids-settings').is(':visible')) showHome();
    else showProfileSelector();
}

function showHome() {
    $('.kids-main > div').hide();
    $('#kids-home').show();
    isMinigame = false;
    initDailyChallenge();
}

function initDailyChallenge() {
    const challenge = getTodayChallenge();
    if (challenge) {
        $('#daily-challenge-name').text(challenge.name);
        $('#daily-challenge-banner').fadeIn();
    }
}

function getTodayChallenge() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[new Date().getDay()];
    return DAILY_CHALLENGES[dayName];
}

function startDailyChallenge() {
    const challenge = getTodayChallenge();
    alert("🚀 ¡PREPÁRATE!\n\nTu reto de hoy es: " + challenge.name + "\n\nResuelve 3 puzzles para ganar las estrellas.");
    showKidsPuzzles();
}


function showWorlds() {
    $('.kids-main > div').hide();
    $('#kids-worlds').show();
    isMinigame = false;
    renderWorlds();
}

function showPlayAI() {
    $('.kids-main > div').hide();
    $('#kids-play-ai').show();
    setTimeout(() => {
        resetKidsGame();
        $(window).trigger('resize');
    }, 200);
}

function showKidsPuzzles() {
    $('.kids-main > div').hide();
    $('#kids-tactics').show();
    loadKidsPuzzle();
}

let solvedKidsPuzzles = [];

function loadKidsPuzzle() {
    const pDb = (typeof LOCAL_PUZZLES_DB !== 'undefined') ? LOCAL_PUZZLES_DB : [];
    if (pDb.length === 0) {
        alert("¡Oh no! No hay puzzles disponibles ahora.");
        return showHome();
    }

    // Filtrar puzzles para niños (short, mateIn1, opening) o simplemente aleatorio
    const candidates = pDb.filter(p => !solvedKidsPuzzles.includes(p.PuzzleId));
    const p = (candidates.length > 0) ? candidates[Math.floor(Math.random() * candidates.length)] : pDb[Math.floor(Math.random() * pDb.length)];

    currentKidPuzzle = {
        id: p.PuzzleId,
        fen: p.FEN,
        sol: p.Moves.split(' '),
        goal: "¡Encuentra el mejor movimiento!"
    };

    game.load(currentKidPuzzle.fen);

    // Aplicar el primer movimiento del oponente
    const firstMove = currentKidPuzzle.sol[0];
    game.move({
        from: firstMove.substring(0, 2),
        to: firstMove.substring(2, 4),
        promotion: 'q'
    });

    $('#kids-puz-task').text(currentKidPuzzle.goal);

    if (kidsPuzBoard) kidsPuzBoard.destroy();

    kidsPuzBoard = Chessboard('kidsPuzBoard', {
        draggable: true,
        position: game.fen(),
        onDrop: handleKidsPuzDrop,
        pieceTheme: getPieceTheme,
        onSnapEnd: () => kidsPuzBoard.position(game.fen())
    });

    const colors = getBoardColors();
    applyBoardColors('kidsPuzBoard', colors);
    setTimeout(() => $(window).trigger('resize'), 200);
}

function handleKidsPuzDrop(source, target) {
    if (!currentKidPuzzle) return;

    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';

    const solution = currentKidPuzzle.sol[1]; // UCI format like 'd7d8q'
    const playerMoveUCI = move.from + move.to + (move.promotion || '');
    const solutionUCI = solution.toLowerCase();

    if (playerMoveUCI === solutionUCI || (move.from + move.to) === solutionUCI.substring(0, 4)) {

        playKidSound('win');
        createFloatingStar();
        stars += 5;
        updateStarDisplay();
        solvedKidsPuzzles.push(currentKidPuzzle.id);

        setTimeout(() => {
            alert("✨ ¡EXCELENTE! ✨\nHas ganado 5 estrellas.");
            loadKidsPuzzle();
        }, 600);
    } else {
        game.undo();
        playKidSound('loss');
        return 'snapback';
    }
}


function showMinigames() {
    $('.kids-main > div').hide();
    $('#kids-minigames').show();
}

function showProgress() {
    $('.kids-main > div').hide();
    $('#kids-progress').show();

    const kid = kidProfiles[currentKid];
    $('#stat-stars').text(stars);
    $('#stat-worlds').text(kid ? kid.unlockedWorlds || Math.floor(stars / 20) + 1 : 1);
    $('#progress-stats').text("¡Vas genial, " + (kid ? kid.name : "") + "!");
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
    isMinigame = false;
    loadPuzzle();
}

// ARROW DRAWING LOGIC
function drawArrow(source, target, boardId) {
    clearArrows(boardId);
    const $board = $('#' + boardId);
    const $sourceSq = $board.find('.square-' + source);
    const $targetSq = $board.find('.square-' + target);

    if (!$sourceSq.length || !$targetSq.length) return;

    const bRect = $board[0].getBoundingClientRect();
    const sRect = $sourceSq[0].getBoundingClientRect();
    const tRect = $targetSq[0].getBoundingClientRect();

    const x1 = sRect.left + sRect.width / 2 - bRect.left;
    const y1 = sRect.top + sRect.height / 2 - bRect.top;
    const x2 = tRect.left + tRect.width / 2 - bRect.left;
    const y2 = tRect.top + tRect.height / 2 - bRect.top;

    const svg = `
        <svg class="kid-arrow-svg" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:100;">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255, 215, 0, 0.8)" />
                </marker>
            </defs>
            <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
                stroke="rgba(255, 215, 0, 0.6)" stroke-width="8" marker-end="url(#arrowhead)" />
        </svg>
    `;
    $board.append(svg);
}

function clearArrows(boardId) {
    $('#' + boardId + ' .kid-arrow-svg').remove();
}

function loadPuzzle() {
    isKidsLoading = false;
    clearArrows('kidsBoard');
    selectedSquare = null;
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

    const turnColor = game.turn() === 'w' ? 'white' : 'black';

    // Reuse board if possible
    if (board) {
        board.orientation(turnColor);
        board.position(puzzle.fen);
    } else {
        const colors = getBoardColors();
        board = Chessboard('kidsBoard', {
            draggable: kidsConfig.moveMethod === 'drag',
            position: puzzle.fen,
            orientation: turnColor,
            onDrop: handleDrop,
            onMouseoutSquare: onMouseoutSquare,
            onMouseoverSquare: onMouseoverSquare,
            onSnapEnd: () => {
                if (board) board.position(game.fen());
            },
            pieceTheme: getPieceTheme
        });
        applyBoardColors('kidsBoard', colors);
    }

    setTimeout(() => $(window).trigger('resize'), 100);

    $('#btn-hint').off('click').on('click', () => {
        const bestMove = puzzle.moves[0];
        if (bestMove.length === 4) drawArrow(bestMove.substring(0, 2), bestMove.substring(2, 4), 'kidsBoard');
        speak(puzzle.hint);
    });
}

function handleDrop(source, target) {
    if (isKidsLoading) return 'snapback';

    const puzzle = currentWorld.puzzles[currentPuzzleIndex];
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';

    if (navigator.vibrate) navigator.vibrate(50);

    const isCorrect = puzzle.moves.some(m =>
        move.san.startsWith(m) ||
        (source + target) === m ||
        move.to === m
    );


    if (isCorrect) {
        isKidsLoading = true;
        clearArrows('kidsBoard');
        playKidSound('win');
        createFloatingStar();
        stars += 3;
        updateStarDisplay();
        currentPuzzleIndex++;
        setTimeout(loadPuzzle, 800);
    } else {
        game.undo();
        playKidSound('loss');
        stars = Math.max(0, stars - 1);
        updateStarDisplay();
        return 'snapback';
    }
}


// AI GAME logic
function resetKidsGame() {
    game = new Chess();
    selectedSquare = null;
    clearArrows('aiBoard');
    removeHighlights();
    if (aiBoard) aiBoard.destroy();

    const colors = getBoardColors();

    aiBoard = Chessboard('aiBoard', {
        draggable: kidsConfig.moveMethod === 'drag',
        position: 'start',
        onDrop: handleAIDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: () => aiBoard.position(game.fen()),
        pieceTheme: getPieceTheme
    });

    applyBoardColors('aiBoard', colors);

    $('#ai-advice').text("¡Hola! Soy tu oponente. ¿Jugamos?");
    speak("¡Hola! Soy tu oponente. ¿Jugamos?");
}

function getBoardColors() {
    const boardColors = {
        'classic': { light: '#ffffff', dark: '#444444' },
        'wood': { light: '#f0d9b5', dark: '#b58863' },
        'blue': { light: '#DEE3E6', dark: '#8CA2AD' },
        'green': { light: '#EEEED2', dark: '#769656' }
    };
    return boardColors[kidsConfig.board] || boardColors.classic;
}

function applyBoardColors(boardId, colors) {
    $(`#${boardId} .white-1e1d7`).css('background', colors.light);
    $(`#${boardId} .black-3c85d`).css('background', colors.dark);
}

function handleSquareClick(square, boardId) {
    const currentBoard = (boardId === 'aiBoard' ? aiBoard : board);
    if (!currentBoard) return;

    if (selectedSquare) {
        if (selectedSquare === square) {
            selectedSquare = null;
            removeHighlights();
            return;
        }

        // Just call handleDrop for everything, it handles move and logic
        const dropResult = handleDrop(selectedSquare, square);

        if (dropResult === 'snapback') {
            const piece = game.get(square);
            if (piece && piece.color === game.turn()) {
                selectedSquare = square;
                showSelectionHighlights(square, boardId);
                return;
            }
            selectedSquare = null;
            removeHighlights();
        } else {
            // Success
            if (currentBoard) currentBoard.position(game.fen());
            if (boardId === 'aiBoard') finalizeUserMove();
            selectedSquare = null;
            removeHighlights();
        }
    } else {
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
            selectedSquare = square;
            showSelectionHighlights(square, boardId);
        }
    }
}

function showSelectionHighlights(square, boardId) {
    removeHighlights();
    $(`#${boardId} .square-${square}`).addClass('highlight-maestro');

    // Only show possible move circles in AI Board (Play mode)
    if (boardId === 'aiBoard') {
        const moves = game.moves({ square: square, verbose: true });
        moves.forEach(m => {
            $(`#${boardId} .square-${m.to}`).addClass('highlight-possible');
        });
    }
}


function onMouseoverSquare(square, piece) {
    if (selectedSquare || kidsConfig.moveMethod === 'click') return;
    // Hide in study/puzzle modes
    if ($('#kids-game').is(':visible') || $('#kids-tactics').is(':visible')) return;

    const moves = game.moves({ square: square, verbose: true });
    if (moves.length === 0) return;
    moves.forEach(m => {
        $('#aiBoard .square-' + m.to).addClass('highlight-possible');
    });
}


function onMouseoutSquare(square, piece) {
    if (selectedSquare || kidsConfig.moveMethod === 'click') return;
    removeHighlights();
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
    if (aiBoard) aiBoard.position(game.fen());
    removeHighlights();
    clearArrows('aiBoard');

    if (isMinigame) {
        checkMinigameGoal();
        return;
    }

    if (autoHelpEnabled) {
        verifyMoveMaestro();
    } else {
        if (!game.game_over()) thinkAI();
        else checkGameOverAI();
    }
}

function verifyMoveMaestro() {
    kidsStockfish.postMessage('position fen ' + game.fen());
    kidsStockfish.postMessage('go depth 5');

    setTimeout(() => {
        const fen = game.fen();
        const opponentGame = new Chess(fen);
        const captures = opponentGame.moves({ verbose: true }).filter(m => m.captured);
        const dangerousCapture = captures.find(c => c.captured === 'q' || c.captured === 'r');

        if (dangerousCapture) {
            $('#ai-advice').text("¡Cuidado! Si te quedas ahí, te comerán. ¿Quieres repetir?");
            speak("¡Cuidado! Si te quedas ahí, te comerán. ¿Quieres repetir?");
            setTimeout(() => {
                if (confirm("🛡️ EL MAESTRO DICE:\n\nEse movimiento es peligroso. ¿Quieres intentar otro?")) {
                    game.undo();
                    aiBoard.position(game.fen());
                    clearArrows('aiBoard');
                } else {
                    if (!game.game_over()) thinkAI();
                }
            }, 50);
            return;
        }

        if (!game.game_over()) thinkAI();
        else checkGameOverAI();
    }, 500);
}

function thinkAI() {
    $('#ai-advice').text("Mmm... dejame pensar... 🤔");

    let blunderChance = 0.5;
    if (aiDepth === 0) blunderChance = 0.95;
    else if (aiDepth === 1) blunderChance = 0.75;
    else if (aiDepth === 3) blunderChance = 0.45;

    if (Math.random() < blunderChance) {
        const moves = game.moves();
        if (moves.length === 0) { checkGameOverAI(); return; }
        const rand = moves[Math.floor(Math.random() * moves.length)];
        setTimeout(() => makeAIMoveSAN(rand), 2500);
    } else {
        kidsStockfish.postMessage('position fen ' + game.fen());
        kidsStockfish.postMessage('go depth ' + Math.max(1, aiDepth));
    }
}

function makeAIMoveSAN(san) {
    const m = game.move(san);
    if (m) {
        highlightLastMove(m.from, m.to);
        if (aiBoard) aiBoard.position(game.fen());
        const msg = getRandomAIMessage();
        $('#ai-advice').text(msg);
        speak(msg);

        if (isMinigame) checkMinigameGoal();
        else checkGameOverAI();
    }
}

function makeAIMove(moveStr) {
    const from = moveStr.substring(0, 2);
    const to = moveStr.substring(2, 4);
    const move = game.move({ from: from, to: to, promotion: 'q' });
    if (move) {
        highlightLastMove(from, to);
        if (aiBoard) aiBoard.position(game.fen());
        const msg = getRandomAIMessage();
        $('#ai-advice').text(msg);
        speak(msg);

        if (isMinigame) checkMinigameGoal();
        else checkGameOverAI();
    }
}

function highlightLastMove(from, to) {
    removeHighlights();
    $('#aiBoard .square-' + from).addClass('highlight-last');
    $('#aiBoard .square-' + to).addClass('highlight-last');
}

function maestroGetHint() {
    window.pendingMaestroHint = true;
    kidsStockfish.postMessage('position fen ' + game.fen());
    kidsStockfish.postMessage('go depth 10');
}

function showMaestroHint(moveStr) {
    const source = moveStr.substring(0, 2);
    const target = moveStr.substring(2, 4);
    drawArrow(source, target, 'aiBoard');
    speak("Yo movería de " + source + " a " + target);
}

function toggleAutoHelp() {
    autoHelpEnabled = !autoHelpEnabled;
    $('#btn-toggle-autohelp').text(autoHelpEnabled ? "🛡️ Maestro: SI" : "🛡️ Maestro: NO");
    $('#btn-toggle-autohelp').css('background', autoHelpEnabled ? '#fbbf24' : '#ccc');
    if (!autoHelpEnabled) clearArrows('aiBoard');
}

function changeAIDifficulty(depth) {
    aiDepth = parseInt(depth);
    const names = { "0": "Bebé 👶", "1": "Tortuga 🐢", "3": "Caracol 🐌" };
    $('#ai-level-title').text("Nivel: " + (names[aiDepth] || "Amigo"));
}

function getRandomAIMessage() {
    const msgs = ["¡Te toca!", "¡Qué divertido!", "¿Viste lo que hice?", "¡Eres un gran jugador!", "¡Uy!", "¡Me gusta jugar!"];
    return msgs[Math.floor(Math.random() * msgs.length)];
}

function checkGameOverAI() {
    if (game.game_over()) {
        if (game.in_checkmate()) {
            if (game.turn() === 'b') {
                speak("¡Increíble! ¡Me has ganado!");
                showKidsReward(20);
                playKidSound('checkmate');
            }
            else {
                speak("¡Gané yo! Pero has jugado muy bien.");
                playKidSound('loss');
            }
        } else {
            speak("¡Es un empate! Choca esos cinco.");
            playKidSound('move');
        }
        updateStarDisplay();
    }
}


function speak(text) {
    if (kidsConfig.sound && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// MINIGAMES LOGIC
function startPawnRace() {
    isMinigame = 'pawnrace';
    $('.kids-main > div').hide();
    $('#kids-play-ai').show();

    game = new Chess();
    game.clear();
    // Chess.js necesita Reyes para validez (los ponemos lejos)
    game.put({ type: 'k', color: 'w' }, 'e1');
    game.put({ type: 'k', color: 'b' }, 'e8');

    // Peones Blancos intercalados
    game.put({ type: 'p', color: 'w' }, 'a2');
    game.put({ type: 'p', color: 'w' }, 'c2');
    game.put({ type: 'p', color: 'w' }, 'e2');
    game.put({ type: 'p', color: 'w' }, 'g2');

    // Peones Negros intercalados
    game.put({ type: 'p', color: 'b' }, 'b7');
    game.put({ type: 'p', color: 'b' }, 'd7');
    game.put({ type: 'p', color: 'b' }, 'f7');
    game.put({ type: 'p', color: 'b' }, 'h7');

    game.load(game.fen());

    if (aiBoard) aiBoard.destroy();
    aiBoard = Chessboard('aiBoard', {
        draggable: kidsConfig.moveMethod === 'drag',
        position: game.fen(),
        onDrop: handleAIDrop,
        onSnapEnd: () => aiBoard.position(game.fen()),
        pieceTheme: getPieceTheme
    });

    applyBoardColors('aiBoard', getBoardColors());
    $('#ai-level-title').text("Carrera de Peones 🏁");
    $('#ai-advice').text("¡El primero que llegue a la fila 8 gana!");
    speak("¡El primero que llegue a la fila 8 gana!");
}

function startKingMaze() {
    isMinigame = 'kingmaze';
    $('.kids-main > div').hide();
    $('#kids-play-ai').show();

    game = new Chess();
    game.clear();
    game.put({ type: 'k', color: 'w' }, 'e1');
    game.put({ type: 'k', color: 'b' }, 'e8');
    game.load(game.fen());

    if (aiBoard) aiBoard.destroy();
    aiBoard = Chessboard('aiBoard', {
        draggable: kidsConfig.moveMethod === 'drag',
        position: game.fen(),
        onDrop: handleAIDrop,
        onSnapEnd: () => aiBoard.position(game.fen()),
        pieceTheme: getPieceTheme
    });

    applyBoardColors('aiBoard', getBoardColors());
    $('#ai-level-title').text("Rey al Centro 🌀");
    $('#ai-advice').text("¡Lleva a tu Rey a las casillas del centro (d4, d5, e4, e5)!");
    speak("¡Lleva a tu Rey al centro del tablero!");
}

function checkMinigameGoal() {
    const row8 = ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'];
    const row1 = ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'];
    const center = ['d4', 'd5', 'e4', 'e5'];

    if (isMinigame === 'pawnrace') {
        if (row8.some(s => game.get(s)?.type === 'p' && game.get(s)?.color === 'w')) {
            speak("¡Bravo! Has llegado al final. ¡Has ganado!");
            showKidsReward(20);
            showHome(); return;
        }
        if (row1.some(s => game.get(s)?.type === 'p' && game.get(s)?.color === 'b')) {
            speak("¡Oh no! He llegado yo primero. ¡Inténtalo otra vez!");
            playKidSound('loss');
            showHome(); return;
        }
    } else if (isMinigame === 'kingmaze') {
        if (center.some(s => game.get(s)?.type === 'k' && game.get(s)?.color === 'w')) {
            speak("¡Perfecto! Tu Rey está a salvo en el centro.");
            showKidsReward(20);
            showHome(); return;
        }
        if (center.some(s => game.get(s)?.type === 'k' && game.get(s)?.color === 'b')) {
            speak("¡Llegué yo al centro primero!");
            playKidSound('loss');
            showHome(); return;
        }
    }


    if (game.turn() === 'b' && !game.game_over()) {
        setTimeout(thinkAI, 1000);
    }
}

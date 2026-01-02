
// 🧩 PUZZLES MODULE
// Handles fetching, caching, and solving logic for puzzles

import { formatTime, showToast, playSnd } from './ui.js';
import { userPuzzleElo, setPuzzleElo, userName, isAuth } from './auth.js';
import { updateElo } from './game.js'; // We might need a unified updateElo, or use the one in game.js if we move it there

// STATE
let currentPuzzle = null;
let puzzleStep = 0;
let solvedPuzzles = JSON.parse(localStorage.getItem('chess_solved_puzzles') || '[]');
let puzSeconds = 0;
let puzTimerInterval = null;

// DEPENDENCIES
let deps = {};
let dependenciesLoaded = false;

export function initPuzzles(injectedDeps) {
    deps = injectedDeps;
    dependenciesLoaded = true;

    // Listeners
    $('#btn-next-puz').click(() => loadRandomPuzzle());
    $('#puz-cat-sel').change(() => loadRandomPuzzle());
    $('#btn-show-sol').click(showSolution);
    $('#btn-puz-hint').click(showHint);
}

// FETCHING
export async function loadRandomPuzzle(retryCount = 0) {
    if (!dependenciesLoaded) return console.error("Puzzles module not initialized");

    const { game, getBoard, updateUI } = deps;
    const board = getBoard();
    if (!board) return console.warn("Board not ready yet");

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

        // 1. API Fetch
        const baseR = 600 + (retryCount * 200);
        const r = baseR + Math.floor(Math.random() * 1000);
        let theme = cat;
        if (cat === 'all' || retryCount > 0) {
            theme = themesPool[Math.floor(Math.random() * themesPool.length)];
        }

        const url = `/puzzles?themes=${theme}&min_rating=${r}&max_rating=${r + 500}&limit=1`; // Use local proxy with limit=1

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error("API response error");
        const data = await response.json();

        if (data && data.length > 0) {
            // Find one not solved
            const fresh = data.filter(x => !solvedPuzzles.includes(x.PuzzleId));
            p = fresh.length > 0 ? fresh[Math.floor(Math.random() * fresh.length)] : data[0];
        }

        if (!p) return loadRandomPuzzle(retryCount + 1);

        // 3. Setup
        currentPuzzle = {
            id: p.PuzzleId,
            fen: p.FEN,
            sol: p.Moves.split(' '),
            rating: p.Rating,
            themes: p.Themes || ""
        };

        puzzleStep = 0;
        game.load(currentPuzzle.fen);

        // Apply first move (opponent)
        const firstMove = currentPuzzle.sol[0];
        const m = game.move({
            from: firstMove.substring(0, 2),
            to: firstMove.substring(2, 4),
            promotion: firstMove.length > 4 ? firstMove[4] : 'q'
        });

        if (!m) throw new Error("Movimiento de puzzle inválido");

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

// LOGIC
export function handlePuzzleMove(sq, selectedSq) {
    if (!dependenciesLoaded) return false;
    const { game, getBoard, updateUI } = deps;
    const board = getBoard();
    if (!board) return false;

    // Simulate move in temp game
    const tempGame = new window.Chess(game.fen());
    const move = tempGame.move({ from: selectedSq, to: sq, promotion: 'q' });

    if (move) {
        const expectedMove = currentPuzzle.sol[puzzleStep];
        const playerMove = move.from + move.to + (move.promotion || "");

        if (playerMove === expectedMove) {
            game.move(move);
            board.position(game.fen());
            puzzleStep++;

            if (puzzleStep >= currentPuzzle.sol.length) {
                // SOLVED
                clearInterval(puzTimerInterval);
                $('#coach-txt').html(`<b style='color:var(--success)'>¡EXCELENTE! Puzzle resuelto en ${formatTime(puzSeconds)}.</b>`);
                playSnd('end');

                if (currentPuzzle.id && !solvedPuzzles.includes(currentPuzzle.id)) {
                    solvedPuzzles.push(currentPuzzle.id);
                    localStorage.setItem('chess_solved_puzzles', JSON.stringify(solvedPuzzles.slice(-1000)));
                }

                updateElo(userPuzzleElo + 200, 1, true);

                setTimeout(() => loadRandomPuzzle(), 1500);
            } else {
                // AI Move
                setTimeout(() => {
                    const nextMove = currentPuzzle.sol[puzzleStep];
                    const m = game.move({
                        from: nextMove.substring(0, 2),
                        to: nextMove.substring(2, 4),
                        promotion: nextMove.length > 4 ? nextMove[4] : 'q'
                    });
                    board.position(game.fen());
                    puzzleStep++;
                    if (m.flags.includes('c')) playSnd('capture'); else playSnd('move');
                }, 500);
            }
        } else {
            // WRONG MOVE
            $('#coach-txt').html("<b style='color:var(--trap-color)'>¡MOVIMIENTO INCORRECTO!</b>");
            playSnd('error');
            updateElo(userPuzzleElo + 200, 0, true);
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
            }, 1000);
        }
        return true;
    }
    return false;
}

function showSolution() {
    if (!currentPuzzle) return;
    const move = currentPuzzle.sol[puzzleStep];
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    $('.square-55d63').removeClass('highlight-hint');
    $('[data-square="' + from + '"]').addClass('highlight-hint');
    $('[data-square="' + to + '"]').addClass('highlight-hint');
    playSnd('error');
}

function showHint() {
    if (!currentPuzzle) return;
    const move = currentPuzzle.sol[puzzleStep];
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);

    $('.square-55d63').removeClass('highlight-hint');
    $('[data-square="' + from + '"]').addClass('highlight-hint');
    $('[data-square="' + to + '"]').addClass('highlight-hint');

    $('#coach-txt').html(`Fíjate en la casilla <b style="color:var(--accent)">${from}</b>. ¿Qué pieza podrías mover ahí o desde ahí?`);
    updateElo(userPuzzleElo, 0.2, true);
}

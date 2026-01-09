// ============================================
// MEJORAS CRÍTICAS DE RENDIMIENTO Y SEGURIDAD
// ============================================

// --- 1. SISTEMA DE SEGURIDAD PARA CONTRASEÑAS ---
async function hashPassword(password) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'chess_salt_2024'); // Salt básico
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    } catch (e) {
        console.error('Hash error:', e);
        return password; // Fallback si falla
    }
}

// Sanitización de inputs
function sanitizeInput(input) {
    if (!input) return '';
    return input.toString()
        .trim()
        .replace(/[<>'"]/g, '') // Prevenir XSS
        .substring(0, 100); // Límite razonable
}

// --- 2. DEBOUNCING DE STOCKFISH (CRÍTICO PARA RENDIMIENTO) ---
let analysisTimeout = null;
let lastAnalyzedFen = null;

function analyzePositionDebounced(fen, depth = 15, force = false) {
    // Si es la misma posición, no analizar de nuevo
    if (!force && lastAnalyzedFen === fen) return;

    clearTimeout(analysisTimeout);
    analysisTimeout = setTimeout(() => {
        if (stockfish && fen) {
            lastAnalyzedFen = fen;
            stockfish.postMessage('stop');
            stockfish.postMessage('position fen ' + fen);
            stockfish.postMessage('go depth ' + depth);
        }
    }, 250); // Esperar 250ms antes de analizar
}

// --- 3. FIX RACE CONDITION EN AI ---
var aiThinking = false;
var aiMoveTimeout = null;

function makeAIMoveSecure() {
    if (game.game_over()) {
        aiThinking = false;
        return;
    }

    if (aiThinking) {
        console.warn('⚠️ AI ya está pensando, ignorando llamada duplicada');
        return;
    }

    const sideThatMoves = game.turn();
    if (sideThatMoves === myColor) {
        aiThinking = false;
        return;
    }

    console.log(`🤖 IA pensando... (Turno: ${sideThatMoves})`);
    aiThinking = true;

    try {
        // --- MODO ENTRENAMIENTO DE APERTURA ---
        if (aiPracticeLine && Array.isArray(aiPracticeLine) && aiPracticeIndex < aiPracticeLine.length) {
            const history = game.history();
            if (aiPracticeIndex !== history.length) {
                console.warn(`[RE-SYNC] Corrigiendo índice: de ${aiPracticeIndex} a ${history.length}`);
                aiPracticeIndex = history.length;
            }

            if (aiPracticeIndex >= aiPracticeLine.length) {
                console.log("[TEORIA] Línea finalizada. Motor toma el mando.");
                aiPracticeLine = null;
                aiThinking = false;
                makeAIMoveSecure();
                return;
            }

            let moveToPlay = aiPracticeLine[aiPracticeIndex].trim();
            console.log(`📖 [MAESTRO] Jugando teoría #${aiPracticeIndex}: ${moveToPlay}`);

            if (stockfish) stockfish.postMessage('stop');

            clearTimeout(aiMoveTimeout);
            aiMoveTimeout = setTimeout(() => {
                try {
                    if (game.turn() === myColor || !aiPracticeLine) {
                        aiThinking = false;
                        return;
                    }

                    let cleanMove = moveToPlay.replace(/[+#x=?!]/g, '').trim();
                    let m = game.move(cleanMove);

                    if (!m) {
                        const legalMoves = game.moves({ verbose: true });
                        let match = legalMoves.find(lm => lm.san.replace(/[+#x=?!]/g, '') === cleanMove);

                        if (!match && cleanMove.length === 3) {
                            const p = cleanMove[0];
                            const dest = cleanMove.substring(1);
                            match = legalMoves.find(lm => lm.to === dest && lm.piece.toUpperCase() === p);
                        }

                        if (!match && cleanMove.length === 2) {
                            match = legalMoves.find(lm => lm.to === cleanMove && lm.piece === 'p');
                        }

                        if (!match && cleanMove.length >= 4) {
                            const from = cleanMove.substring(0, 2);
                            const to = cleanMove.substring(2, 4);
                            match = legalMoves.find(lm => lm.from === from && lm.to === to);
                        }

                        if (match) m = game.move(match.san);
                    }

                    if (m) {
                        board.position(game.fen());
                        aiPracticeIndex++;
                        updateUI(true);
                        checkGameOver();
                        $('#book-move-indicator').fadeIn();

                        let comm = (currentOpeningComments && currentOpeningComments[aiPracticeIndex - 1])
                            ? currentOpeningComments[aiPracticeIndex - 1]
                            : "Esta jugada sigue la teoría establecida.";

                        $('#coach-txt').html(`
                            <div style="color:var(--accent); font-size:0.7rem; font-weight:800; text-transform:uppercase; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; margin-bottom:10px;">
                                ${currentOpeningName || 'Línea Teórica'}
                            </div>
                            <div style="font-size:1rem; font-weight:700; color:var(--text-main); margin-bottom:8px;">Mi respuesta: ${m.san}</div>
                            <div style="font-size:0.85rem; line-height:1.5; color:var(--text-main); background:rgba(255,255,255,0.03); padding:10px; border-radius:8px;">
                                ${comm}
                            </div>
                        `);
                    } else {
                        console.error("❌ Error con jugada de teoría:", moveToPlay);
                        aiPracticeLine = null;
                        makeAIMoveSecure();
                    }
                } catch (error) {
                    console.error("Error en teoría:", error);
                    aiPracticeLine = null;
                } finally {
                    aiThinking = false;
                }
            }, 1000);
            return;
        }

        // --- MODO MOTOR ESTÁNDAR ---
        if (stockfish) {
            const diffSel = (currentMode === 'maestro') ? '#maestro-diff-sel' : '#diff-sel';
            const diff = parseInt($(diffSel).val()) || 10;

            stockfish.postMessage('stop');
            stockfish.postMessage('setoption name MultiPV value 3');
            stockfish.postMessage('position fen ' + game.fen());
            stockfish.postMessage('go depth ' + diff);
        } else {
            aiThinking = false;
        }
    } catch (error) {
        console.error('❌ Error crítico en makeAIMove:', error);
        aiThinking = false;
    }
}

// --- 4. CONSOLIDACIÓN DE INTERVALOS ---
let globalSyncInterval = null;

function startGlobalSync() {
    if (globalSyncInterval) clearInterval(globalSyncInterval);

    globalSyncInterval = setInterval(() => {
        if (!isAuth || !socket || !socket.connected) return;

        try {
            // Sincronizar todo en un solo intervalo
            socket.emit('get_my_games');
            socket.emit('get_lobby');

            // Solo actualizar leaderboard si está visible
            if ($('#tab-ranking').hasClass('active')) {
                socket.emit('get_leaderboard');
            }
        } catch (e) {
            console.error('Sync error:', e);
        }
    }, 12000); // 12 segundos - más eficiente
}

function stopGlobalSync() {
    if (globalSyncInterval) {
        clearInterval(globalSyncInterval);
        globalSyncInterval = null;
    }
}

// --- 5. LIMPIEZA DE MEMORY LEAKS ---
function cleanupPuzzle() {
    if (puzTimerInterval) {
        clearInterval(puzTimerInterval);
        puzTimerInterval = null;
    }
    puzSeconds = 0;
    $('#puz-timer').text("00:00").css('color', 'var(--accent)');
}

function cleanupClocks() {
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
    }
    $('.timer-box').removeClass('active low-time');
}

function cleanupGame() {
    cleanupClocks();
    cleanupPuzzle();
    clearTimeout(analysisTimeout);
    clearTimeout(aiMoveTimeout);
    aiThinking = false;
    lastAnalyzedFen = null;
}

// --- 6. UPDATE UI OPTIMIZADO ---
function updateUIOptimized(moved = false) {
    $('.square-55d63').removeClass('highlight-selected highlight-hint');
    $('.legal-dot').remove();

    updateMaterial();

    if (moved) {
        // Sound logic
        if (game.in_check()) playSnd('check');
        else if (game.history({ verbose: true }).pop()?.flags.includes('c')) playSnd('capture');
        else playSnd('move');

        updateHistory();

        if (!gameStarted && currentMode !== 'exercises' && currentMode !== 'study') {
            startClock();
        }

        if (currentMode !== 'exercises' && currentMode !== 'study') {
            updateTimerVisuals();
        }

        // SAVE LAST EVAL
        if (window.currentEval !== undefined) {
            window.lastEval = window.currentEval;
        }

        // Usar análisis debounced
        if (stockfish && currentMode !== 'local' &&
            (currentMode === 'ai' || currentMode === 'maestro' || hintsActive || currentMode === 'study')) {

            if ((currentMode === 'ai' || currentMode === 'maestro') && game.turn() !== myColor) {
                makeAIMoveSecure(); // Usar versión segura
            } else {
                analyzePositionDebounced(game.fen(), 15);
            }
        }
    } else {
        if (currentMode === 'study' || currentMode === 'ai' || currentMode === 'maestro') {
            analyzePositionDebounced(game.fen(), 15);
        }
    }
}

// --- 7. AUTH MEJORADO CON HASH ---
async function handleAuthSubmit() {
    const name = sanitizeInput($('#auth-user').val());
    const pass = $('#auth-pass').val();
    const email = sanitizeInput($('#auth-email').val());
    const isReg = $('#reg-group').css('display') !== 'none';

    if (!socket || !socket.connected) {
        return alert("❌ No hay conexión con el servidor.");
    }

    if (!name || !pass) {
        return alert("Completa los campos.");
    }

    if (isReg && !email) {
        return alert("Escribe un email.");
    }

    // Validación de email
    if (isReg) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return alert("Email inválido.");
        }
    }

    // Hash de contraseña
    const hashedPass = await hashPassword(pass);

    if (isReg) {
        socket.emit('register', {
            user: name,
            pass: hashedPass,
            email: email
        });
    } else {
        socket.emit('login', {
            user: name,
            pass: hashedPass
        });
    }
}

// --- 8. INDICADOR DE PENSAMIENTO ---
function showThinkingIndicator() {
    if ($('#ai-thinking').length > 0) return;

    const indicator = $(`
        <div id="ai-thinking" style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); 
                    background:rgba(0,0,0,0.9); padding:25px 40px; border-radius:15px; z-index:99999;
                    border:2px solid var(--accent); box-shadow:0 0 30px rgba(56,189,248,0.5);">
            <div style="color:#38bdf8; font-size:1.3rem; font-weight:800; text-align:center;">
                🤖 IA ANALIZANDO...
            </div>
            <div style="color:#94a3b8; font-size:0.8rem; margin-top:8px; text-align:center;">
                Calculando la mejor jugada
            </div>
        </div>
    `);

    $('body').append(indicator);
    setTimeout(() => $('#ai-thinking').fadeOut(300, function () { $(this).remove(); }), 3000);
}

// --- 9. REEMPLAZO DE FUNCIONES ORIGINALES ---
// Solo reemplazamos después de que el DOM esté listo
$(document).ready(function () {
    console.log('🚀 Optimizaciones cargadas');

    // Reemplazar funciones globales
    window.makeAIMove = makeAIMoveSecure;
    window.updateUI = updateUIOptimized;
    window.cleanupGame = cleanupGame;

    // Iniciar sincronización global
    if (isAuth) startGlobalSync();

    // Reemplazar handler de auth
    $('#btn-auth-submit').off('click').on('click', handleAuthSubmit);

    // Cleanup al cambiar de modo
    const originalSetMode = window.setMode;
    window.setMode = function (mode, addToHistory) {
        cleanupGame();
        if (originalSetMode) originalSetMode.call(this, mode, addToHistory);

        // Mostrar indicador cuando IA piensa
        if (mode === 'ai' || mode === 'maestro') {
            if (!gameStarted && myColor === 'b') {
                showThinkingIndicator();
            }
        }
    };

    // Cleanup al salir
    window.addEventListener('beforeunload', cleanupGame);

    console.log('✅ Sistema optimizado activo');
});

// --- 10. SISTEMA DE TELEMETRÍA BÁSICO (OPCIONAL) ---
class GameAnalytics {
    constructor() {
        this.sessionId = Date.now();
        this.events = [];
        this.maxEvents = 50;
    }

    track(category, action, label) {
        this.events.push({
            ts: Date.now(),
            cat: category,
            act: action,
            lbl: label
        });

        if (this.events.length >= this.maxEvents) {
            this.flush();
        }
    }

    flush() {
        try {
            const key = 'analytics_' + this.sessionId;
            localStorage.setItem(key, JSON.stringify(this.events));
            this.events = [];

            // Limpiar analytics antiguos (más de 7 días)
            const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith('analytics_')) {
                    const ts = parseInt(k.split('_')[1]);
                    if (ts < weekAgo) localStorage.removeItem(k);
                }
            });
        } catch (e) {
            console.warn('Analytics flush error:', e);
        }
    }
}

// Instancia global (solo si no existe)
if (typeof window.analytics === 'undefined') {
    window.analytics = new GameAnalytics();
}

// Tracking automático de eventos clave
$(document).ready(function () {
    // Track inicio de partida
    const originalStartAI = $('#btn-start-ai').click;
    $('#btn-start-ai').on('click', function () {
        if (window.analytics) {
            window.analytics.track('game', 'start_ai', $('#diff-sel').val());
        }
    });

    // Track puzzles completados
    const originalNextPuzzle = window.loadRandomPuzzle;
    window.loadRandomPuzzle = function (...args) {
        if (window.analytics && currentPuzzle) {
            window.analytics.track('puzzle', 'complete', currentPuzzle.rating);
        }
        return originalNextPuzzle.apply(this, args);
    };
});

// EXPORT PARA DEBUGGING
if (typeof window.chessOptimizations === 'undefined') {
    window.chessOptimizations = {
        version: '1.0.0',
        analyzePositionDebounced,
        cleanupGame,
        analytics: window.analytics
    };
    console.log('📊 Chess Optimizations v1.0.0 cargado');
}

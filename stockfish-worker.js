// ===== STOCKFISH WEB WORKER - VERSIÓN MEJORADA =====
// Auto-inicializar worker cuando se cargue

let stockfish = null;
let isReady = false;

// Intentar inicializar automáticamente al cargar
try {
  initStockfish();
} catch (e) {
  console.error("Error inicializando Stockfish:", e.message);
}

self.onmessage = function(event) {
  const { cmd, data } = event.data;

  // Si no está listo pero no es un init, encolar o esperar
  if (!isReady && cmd !== 'init') {
    // Reintentar inicialización si falla
    if (cmd === 'eval') {
      console.warn("Stockfish no está listo. Intentando inicializar...");
      initStockfish();
    }
    self.postMessage({ error: 'Stockfish not initialized', ready: false });
    return;
  }

  switch(cmd) {
    case 'init':
      initStockfish();
      break;
    case 'eval':
      evalPosition(data);
      break;
    case 'stop':
      if (stockfish) stockfish.postMessage('stop');
      break;
    default:
      console.warn("Comando desconocido:", cmd);
  }
};

function initStockfish() {
  try {
    // Intentar cargar Stockfish desde CDN
    importScripts('https://cdn.jsdelivr.net/npm/stockfish@10.0.2/stockfish.js');

    if (typeof STOCKFISH === 'undefined') {
      self.postMessage({ 
        error: 'Stockfish library not found', 
        ready: false 
      });
      return;
    }

    // Inicializar la instancia
    stockfish = STOCKFISH();
    isReady = true;

    console.log("✅ Stockfish inicializado correctamente");
    self.postMessage({ ready: true, message: 'Stockfish initialized' });

  } catch (e) {
    console.error("❌ Error al inicializar Stockfish:", e.message);
    self.postMessage({ 
      error: e.message, 
      ready: false,
      details: 'Failed to load Stockfish library'
    });
  }
}

function evalPosition(data) {
  const { fen, depth = 20 } = data;

  if (!stockfish) {
    console.error("Stockfish no disponible");
    self.postMessage({ error: 'Stockfish not available' });
    return;
  }

  try {
    // Resetear posición
    stockfish.postMessage('ucinewgame');
    stockfish.postMessage(`position fen ${fen}`);
    stockfish.postMessage(`go depth ${depth}`);

    let lastEval = null;
    let bestMove = null;

    // Procesar salida de Stockfish
    stockfish.onupdate = function(output) {
      const str = output.toString();

      // Extraer evaluación en centipawns
      const cpMatch = str.match(/score cp (-?\d+)/);
      if (cpMatch) {
        lastEval = (parseInt(cpMatch[1]) / 100).toFixed(2);
      }

      // Extraer mate en N
      const mateMatch = str.match(/score mate (-?\d+)/);
      if (mateMatch) {
        lastEval = 'M' + mateMatch[1];
      }

      // Extraer mejor movimiento
      const moveMatch = str.match(/bestmove (\S+)/);
      if (moveMatch) {
        bestMove = moveMatch[1];
      }

      // Si encontró mejor movimiento, enviar resultado
      if (str.includes('bestmove')) {
        self.postMessage({
          cmd: 'eval',
          result: { 
            eval: lastEval, 
            bestmove: bestMove,
            fen: fen 
          }
        });
      }
    };
  } catch (e) {
    console.error("Error evaluando posición:", e.message);
    self.postMessage({ 
      error: 'Evaluation error: ' + e.message 
    });
  }
}

// ===== FIN WORKER =====

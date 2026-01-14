// ===== STOCKFISH WEB WORKER (SOLUCIÓN #2) =====
let stockfish = null;
let isReady = false;

self.onmessage = function(event) {
  const { cmd, data } = event.data;
  
  if (!isReady && cmd !== 'init') {
    self.postMessage({ error: 'Stockfish not initialized' });
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
  }
};

function initStockfish() {
  try {
    importScripts('https://cdn.jsdelivr.net/npm/stockfish@10.0.2/stockfish.js');
    
    if (typeof STOCKFISH === 'undefined') {
      self.postMessage({ error: 'Stockfish not found', ready: false });
      return;
    }
    
    stockfish = STOCKFISH();
    isReady = true;
    self.postMessage({ ready: true });
  } catch (e) {
    self.postMessage({ error: e.message, ready: false });
  }
}

function evalPosition(data) {
  const { fen, depth = 20 } = data;
  if (!stockfish) return;
  
  stockfish.postMessage(`position fen ${fen}`);
  stockfish.postMessage(`go depth ${depth}`);
  
  let lastEval = null;
  
  stockfish.onupdate = function(output) {
    const str = output.toString();
    
    const cpMatch = str.match(/score cp (-?\d+)/);
    if (cpMatch) {
      lastEval = (parseInt(cpMatch[1]) / 100).toFixed(2);
    }
    
    const mateMatch = str.match(/score mate (-?\d+)/);
    if (mateMatch) {
      lastEval = 'M' + mateMatch[1];
    }
    
    if (str.includes('bestmove')) {
      self.postMessage({
        cmd: 'eval',
        result: { eval: lastEval, fen: fen }
      });
    }
  };
}

// ===== FIN WORKER =====
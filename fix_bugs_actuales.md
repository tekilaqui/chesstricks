# 🚨 DIAGNÓSTICO DE BUGS - VERSIÓN ACTUAL

## Analizando tu código de archivo: `client.js` (149KB), `server.js` (18KB), `style.css` (52KB)

---

## ❌ BUGS DETECTADOS Y SOLUCIONES

### 🔴 BUG #1: Modo IA - Rival puede mover manualmente
**Ubicación:** `client.js` línea ~4450 en función `onDragStart`
**Problema:** La validación no chequea `myColor` antes de permitir arrastrar piezas

**CÓDIGO ACTUAL (ROTO):**
```javascript
function onDragStart(source, piece, position, orientation) {
    if (game.gameover) return false;
    if (typeof aiThinking !== 'undefined' && aiThinking) return false;
    // FALTA: validación de myColor
    if (game.turn !== piece.charAt(0)) return false;
    return true;
}
```

**SOLUCIÓN (COPIAR EXACTAMENTE):**
```javascript
function onDragStart(source, piece, position, orientation) {
    if (game.gameover) return false;
    if (typeof aiThinking !== 'undefined' && aiThinking) return false;
    
    // ✅ NUEVA VALIDACIÓN: En modo AI/Maestro, solo permite mover TUS piezas
    const isLocalPure = currentMode === 'pass-and-play' || (!gameId && currentMode === 'local');
    
    if (!isLocalPure && piece.charAt(0) !== myColor) {
        showToast('🚫 No puedes mover piezas del rival en línea', 'error');
        return false;
    }
    
    // En modo AI/Maestro con auto-move activado, bloquear turno del rival
    if (currentMode === 'ai' || currentMode === 'maestro') {
        if (opponentAutoMode && game.turn !== myColor) {
            showToast('Es el turno de la IA', 'info');
            return false;
        }
    }
    
    if (game.turn !== piece.charAt(0)) return false;
    return true;
}
```

**✅ VERIFICAR:** Ahora intenta mover una pieza negra cuando juegas blancas en modo AI. Debe bloquearse.

---

### 🔴 BUG #2: Flecha de mejor jugada NO aparece
**Ubicación:** `client.js` línea ~4950, función `drawBestMoveArrow`
**Problema:** El canvas `arrowCanvas` existe pero no se inicializa con tamaño correcto

**CÓDIGO ACTUAL (ROTO):**
```javascript
function drawBestMoveArrow(moveLAN) {
    if (!hintsActive || !moveLAN) return;
    
    const cvs = document.getElementById('arrowCanvas');
    if (!cvs) return;
    
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    // El canvas NO tiene dimensiones = dibuja en void
}
```

**SOLUCIÓN (COPIAR EXACTAMENTE):**
```javascript
function drawBestMoveArrow(moveLAN) {
    if (!hintsActive || !moveLAN) return;
    
    const cvs = document.getElementById('arrowCanvas');
    if (!cvs) return;
    
    // ✅ INICIALIZAR CANVAS CON TAMAÑO
    const boardDiv = document.getElementById('myBoard');
    if (!boardDiv) return;
    
    const rect = boardDiv.getBoundingClientRect();
    cvs.width = rect.width;
    cvs.height = rect.height;
    cvs.style.position = 'absolute';
    cvs.style.top = rect.top + 'px';
    cvs.style.left = rect.left + 'px';
    cvs.style.pointerEvents = 'none';
    
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    
    // Calcular cuadrados
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
    
    // Dibujar flecha
    ctx.beginPath();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.8;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Punta de flecha
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.fillStyle = '#fbbf24';
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 15 * Math.cos(angle - Math.PI / 6), y2 - 15 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - 15 * Math.cos(angle + Math.PI / 6), y2 - 15 * Math.sin(angle + Math.PI / 6));
    ctx.fill();
}

// ✅ NUEVO: Inicializar canvas en updateUI
function initializeArrowCanvas() {
    const cvs = document.getElementById('arrowCanvas');
    if (!cvs) return;
    
    const boardDiv = document.getElementById('myBoard');
    if (!boardDiv) return;
    
    const rect = boardDiv.getBoundingClientRect();
    cvs.width = rect.width;
    cvs.height = rect.height;
}

// ✅ Llamar en updateUI (línea ~3900)
function updateUI(moved = false) {
    // ... código existente ...
    
    // AGREGAR ESTA LÍNEA al principio:
    initializeArrowCanvas();
    
    // ... resto del código ...
}
```

**✅ VERIFICAR:** Activa hints (botón), debe aparecer flecha amarilla sobre el tablero.

---

### 🔴 BUG #3: Botón flip en PC no funciona o gira dos veces
**Ubicación:** `client.js` línea ~5100 (múltiples handlers)
**Problema:** Hay handlers duplicados que llaman `board.flip()` dos veces

**CÓDIGO ACTUAL (ROTO):**
```javascript
// Hay múltiples:
$('.btn-flip, .btn-flip-mobile, .btn-flip-board, .btn-flip-small, .btn-flip-pc-sidebar, .btn-flip-pc-local')
    .off('click')
    .onclick(function() {
        if (typeof board !== 'undefined') {
            board.flip();
        }
    });

// Y luego otro más:
btn-flip.click(board.flip);
btn-flip-mobile.click(board.flip);
// etc...
```

**SOLUCIÓN (COPIAR EXACTAMENTE):**
```javascript
// ✅ UNIVERSAL FLIP HANDLER - UN SOLO LUGAR
function handleFlipBoard() {
    if (typeof board !== 'undefined') {
        board.flip();
        showToast('📋 Tablero girado');
    }
}

// ✅ Usar este handler ÚNICO para TODOS los botones de flip
const flipSelectors = [
    'btn-flip',
    'btn-flip-mobile', 
    'btn-flip-board',
    'btn-flip-small',
    'btn-flip-pc-sidebar',
    'btn-flip-pc-local'
];

flipSelectors.forEach(selector => {
    const element = document.getElementById(selector);
    if (element) {
        // Remover listeners antiguos
        element.off('click');
        
        // Agregar nuevo listener único
        element.addEventListener('click', handleFlipBoard);
    }
});
```

**✅ VERIFICAR:** Click en btn-flip. Debe girar UNA SOLA VEZ.

---

### 🔴 BUG #4: Coordenadas (a-h, 1-8) sin colores
**Ubicación:** `style.css` (NO EXISTE el CSS para coordenadas)
**Problema:** Las letras y números al borde del tablero son invisibles

**SOLUCIÓN (COPIAR AL FINAL DE `style.css`):**
```css
/* ✅ NUEVAS COORDENADAS CON COLOR */

/* Notación archivo (a-h) */
.notation-file {
    font-size: 10px !important;
    font-weight: 700 !important;
    color: var(--accent) !important;
    opacity: 0.9 !important;
    text-shadow: 0 0 5px rgba(56, 189, 248, 0.3);
    letter-spacing: 2px;
}

/* Notación rango (1-8) */
.notation-rank {
    font-size: 10px !important;
    font-weight: 700 !important;
    color: var(--accent) !important;
    opacity: 0.9 !important;
    text-shadow: 0 0 5px rgba(56, 189, 248, 0.3);
    letter-spacing: 2px;
}

/* Dark theme override */
@media (prefers-color-scheme: dark) {
    .notation-file,
    .notation-rank {
        color: #38bdf8 !important;
        opacity: 1 !important;
    }
}
```

**✅ VERIFICAR:** Recarga la página. Letras a-h y números 1-8 deben verse azules y claros.

---

### 🔴 BUG #5: Hints aparecen en modos incorrectos (puzzles/análisis histórico)
**Ubicación:** `client.js` línea ~4850, función `toggleHints`
**Problema:** No valida el modo antes de mostrar hints

**CÓDIGO ACTUAL (ROTO):**
```javascript
function toggleHints() {
    hintsActive = !hintsActive;
    if (hintsActive) {
        // Muestra hints SIN VALIDAR MODO
        bestMoveDisplay.show();
    }
}
```

**SOLUCIÓN (COPIAR EXACTAMENTE):**
```javascript
function toggleHints() {
    // ✅ VALIDAR MODO: solo permitir en juegos normales
    const allowedModes = ['local', 'ai', 'maestro', 'study'];
    
    if (!allowedModes.includes(currentMode)) {
        showToast('⚠️ Hints no disponibles en este modo', 'warning');
        return;
    }
    
    hintsActive = !hintsActive;
    
    if (hintsActive) {
        bestMoveDisplay.show();
        $('.btn-hint-main, .btn-toggle-hints-study, .btn-hint-mobile-bar').addClass('active');
        showToast('💡 Sugerencias ACTIVADAS');
        
        // Inicializar análisis inmediatamente
        if (stockfish) {
            stockfish.postMessage('stop');
            stockfish.postMessage('position fen ' + game.fen());
            stockfish.postMessage('go depth 20');
        }
    } else {
        bestMoveDisplay.hide();
        $('.btn-hint-main, .btn-toggle-hints-study, .btn-hint-mobile-bar').removeClass('active');
        showToast('💡 Sugerencias DESACTIVADAS');
        clearArrowCanvas();
    }
}

// ✅ Agregar función para limpiar canvas
function clearArrowCanvas() {
    const cvs = document.getElementById('arrowCanvas');
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);
}
```

**✅ VERIFICAR:** 
- En modos `local`, `ai`, `maestro`, `study`: hints funcionan ✅
- En modos `exercises`: muestra mensaje "no disponible" ⚠️
- En análisis histórico: muestra mensaje "no disponible" ⚠️

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Paso 1: Backup
```bash
cp client.js client.js.backup
cp style.css style.css.backup
cp server.js server.js.backup
```

### Paso 2: Implementar cada bug (5-15 min cada uno)

**BUG #1 - onDragStart (5 min):**
- [ ] Buscar función `onDragStart` en `client.js` (~línea 4450)
- [ ] Reemplazar COMPLETAMENTE con código de la solución
- [ ] Test: Intenta mover pieza negra en AI con blancas = debe bloquearse

**BUG #2 - drawBestMoveArrow (15 min):**
- [ ] Buscar función `drawBestMoveArrow` en `client.js` (~línea 4950)
- [ ] Reemplazar COMPLETAMENTE con código de la solución
- [ ] Buscar función `updateUI` (~línea 3900)
- [ ] Agregar llamada `initializeArrowCanvas();` al principio
- [ ] Test: Activa hints, debe aparecer flecha amarilla

**BUG #3 - Flip Handlers (3 min):**
- [ ] Buscar todos los handlers de flip (~línea 5100)
- [ ] Eliminar handlers duplicados
- [ ] Agregar nuevo handler unificado `handleFlipBoard()`
- [ ] Test: Click en flip, gira UNA sola vez

**BUG #4 - Coordenadas CSS (5 min):**
- [ ] Ir al final de `style.css`
- [ ] Copiar bloque CSS para `.notation-file` y `.notation-rank`
- [ ] Guardar, recarga página
- [ ] Test: Letras a-h y números 1-8 deben verse azules

**BUG #5 - toggleHints (10 min):**
- [ ] Buscar función `toggleHints` en `client.js` (~línea 4850)
- [ ] Reemplazar COMPLETAMENTE con código de la solución
- [ ] Test: 
  - En AI/local: hints funcionan
  - En puzzles: muestra "no disponible"

### Paso 3: Testing completo (10 min)
```javascript
// Abre consola (F12) y ejecuta:
console.log('=== TESTING BUGS ===');

// Test #1: Intenta mover negra en AI
// Esperado: showToast('No puedes mover...')

// Test #2: Activa hints
// Esperado: Flecha amarilla visible sobre tablero

// Test #3: Click flip
// Esperado: Tablero gira 1 vez, no 2

// Test #4: Mira coordenadas
// Esperado: a-h (azul), 1-8 (azul)

// Test #5: Intenta hints en puzzles
// Esperado: showToast('no disponible')
```

### Paso 4: Validación final
```bash
# Recarga sin cache
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Abre Inspector (F12)
# Verifica Console: sin errores rojos
# Verifica Network: sin fallos 404/500
```

---

## 🎯 RESUMEN RÁPIDO

| Bug | Línea | Solución | Tiempo |
|-----|-------|----------|--------|
| #1 Rival mueve | 4450 | Agregar validación myColor | 5 min |
| #2 Sin flecha | 4950 | Inicializar canvas + initializeArrowCanvas() | 15 min |
| #3 Flip x2 | 5100 | Unificar handlers en handleFlipBoard() | 3 min |
| #4 Coordenadas | CSS fin | Agregar .notation-file/rank | 5 min |
| #5 Hints modos | 4850 | Validar allowedModes | 10 min |
| **TOTAL** | | | **38 min** |

---

## ⚠️ PUNTOS CRÍTICOS

❌ **NO HAGAS:**
- Copiar a mitad del código
- Dejar dos versiones de `drawBestMoveArrow`
- Comentar código sin testear
- Asumir que funciona sin recargar

✅ **SÍ HAZ:**
- Copia FUNCIÓN COMPLETA (desde `function` hasta último `}`)
- Verifica en consola: `typeof drawBestMoveArrow` → `function`
- Prueba cada bug INMEDIATAMENTE después
- Usa los tests de arriba

---

## 📞 SI ALGO FALLA

1. **"Flecha no aparece":**
   - Abre F12 → Console
   - Escribe: `document.getElementById('arrowCanvas')`
   - Si retorna `null` → HTML no tiene elemento
   - Si retorna `canvas` → verifica que hintsActive = true

2. **"Flip gira 2 veces":**
   - Busca en código todos los `.flip()`
   - Elimina duplicados
   - Asegúrate de solo UN evento por botón

3. **"Hints no funcionan":**
   - Verifica `currentMode` está correcto
   - Verifica `stockfish` está inicializado
   - Abre consola, ejecuta `toggleHints()` manualmente

4. **"Coordenadas todavía invisibles":**
   - Verifica que agregaste CSS al **FINAL** de style.css
   - Recarga SIN cache (Ctrl+Shift+R)
   - Verifica elemento en Inspector: debe tener `color: #38bdf8`

---

**Tu app estará lista en 40 minutos ⏱️**

# 🔧 GUÍA DE IMPLEMENTACIÓN - SOLUCIONES PASO A PASO

## PARTE 1: FIXES INMEDIATOS (Esta Semana)

### FIX #1: Autenticación JWT (Día 1-2)

#### PASO 1: Instalar dependencias
```bash
npm install jsonwebtoken bcrypt dotenv
npm install --save-dev @types/jsonwebtoken
```

#### PASO 2: Crear .env
```
JWT_SECRET=tu_secreto_super_largo_aqui_32_caracteres_minimo
JWT_REFRESH_SECRET=otro_secreto_diferente
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@localhost/chess
```

#### PASO 3: Backend - Login seguro (server.js)
```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Actualizar registro de usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    // 1. Validar input
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    
    // 2. Verificar si existe
    const existing = users.find(u => u.email === email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // 3. Hash password
    const hash = await bcrypt.hash(password, 10);
    
    // 4. Guardar usuario
    const newUser = {
      id: Date.now().toString(),
      email,
      username,
      passwordHash: hash,
      elo: 1200,
      createdAt: new Date()
    };
    
    users.push(newUser);
    saveUsers(); // Función que guarda en DB
    
    // 5. Generar tokens
    const accessToken = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      accessToken,
      refreshToken,
      user: { id: newUser.id, email, username, elo: newUser.elo }
    });
    
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, username: user.username, elo: user.elo }
    });
    
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Refresh token
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ accessToken: newAccessToken });
    
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Aplicar a rutas protegidas
app.get('/api/games', authMiddleware, (req, res) => {
  const userGames = games.filter(g => g.players.includes(req.user.userId));
  res.json(userGames);
});
```

#### PASO 4: Frontend - Usar JWT (client.js)
```javascript
let accessToken = null;
let refreshToken = null;

// Login form
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      showToast('Invalid credentials', 'error');
      return;
    }
    
    const data = await response.json();
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
    
    // Guardar en memory, NO localStorage
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
    
    // Conectar Socket con token
    connectSocket();
    
    // Abrir modal juego
    openGameModal();
    
  } catch (err) {
    console.error('Login error:', err);
    showToast('Connection error', 'error');
  }
});

// Función para hacer requests autenticados
async function fetchWithAuth(url, options = {}) {
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`
  };
  
  let response = await fetch(url, { ...options, headers });
  
  // Si token expiró
  if (response.status === 401) {
    // Intentar refrescar
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      accessToken = data.accessToken;
      
      // Reintentar request original
      headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(url, { ...options, headers });
    } else {
      // Refresh falló, logout
      logoutUser();
      return null;
    }
  }
  
  return response;
}

// Socket con token
function connectSocket() {
  socket = io(socketUrl, {
    auth: {
      token: accessToken
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });
  
  socket.on('auth_error', (err) => {
    console.error('Auth error:', err);
    logoutUser();
  });
}

// Logout
function logoutUser() {
  accessToken = null;
  refreshToken = null;
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  socket?.disconnect();
  window.location.href = '/';
}
```

---

### FIX #2: Validación de Movimientos en Servidor

#### En server.js:
```javascript
const Chess = require('chess.js').Chess;

// Validar movimiento antes de ejecutar
socket.on('move', (data) => {
  const game = games[data.gameId];
  
  if (!game) {
    socket.emit('error', { msg: 'Game not found' });
    return;
  }
  
  // 1. Validar que es su turno
  if (game.turn !== data.playerColor) {
    socket.emit('error', { msg: 'Not your turn' });
    return;
  }
  
  // 2. Crear instancia de Chess con posición actual
  const chessGame = new Chess(game.fen);
  
  // 3. Validar movimiento legalmente
  const move = chessGame.move({
    from: data.from,
    to: data.to,
    promotion: data.promotion || undefined
  });
  
  if (!move) {
    socket.emit('error', { msg: 'Illegal move' });
    return;
  }
  
  // 4. Actualizar estado del juego
  game.fen = chessGame.fen();
  game.moves.push(move.san);
  game.turn = chessGame.turn() === 'w' ? 'white' : 'black';
  
  // 5. Broadcast a ambos jugadores
  io.to(data.gameId).emit('opponent_move', {
    from: data.from,
    to: data.to,
    san: move.san,
    fen: game.fen
  });
  
  // 6. Verificar si es fin de juego
  if (chessGame.in_checkmate()) {
    const winner = game.turn === 'white' ? 'black' : 'white';
    io.to(data.gameId).emit('game_end', { reason: 'checkmate', winner });
  } else if (chessGame.in_draw()) {
    io.to(data.gameId).emit('game_end', { reason: 'draw', winner: null });
  }
});
```

---

### FIX #3: Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
// server.js
const rateLimit = require('express-rate-limit');

// Limiter general
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter para login (más restrictivo)
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 intentos
  skipSuccessfulRequests: true,
  message: 'Too many login attempts'
});

app.use('/api/', apiLimiter);
app.post('/api/auth/login', loginLimiter, (req, res) => {
  // ... login logic
});
```

---

### FIX #4: HTTPS Enforcement

```javascript
// server.js
app.use((req, res, next) => {
  // Redirect HTTP to HTTPS
  if (process.env.NODE_ENV === 'production' && req.protocol !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
  }
  
  // HSTS header
  res.setHeader('Strict-Transport-Security', 
    'max-age=31536000; includeSubDomains; preload');
  
  // CSP header
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  next();
});
```

---

### FIX #5: XSS Protection

```bash
npm install dompurify
```

```javascript
// client.js
import DOMPurify from 'dompurify';

// En lugar de:
// coach-txt.innerHTML = explanation;

// Hacer:
coach-txt.innerHTML = DOMPurify.sanitize(explanation, {
  ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'br', 'p', 'span'],
  ALLOWED_ATTR: ['style', 'class']
});

// O más seguro, usar textContent para texto puro:
coach-txt.textContent = explanation;
```

---

## PARTE 2: MIGRACIONES BASE DE DATOS (Próximas 2 semanas)

### Setup PostgreSQL + Prisma

```bash
npm install @prisma/client
npm install -D prisma

npx prisma init
```

#### .env
```
DATABASE_URL="postgresql://user:password@localhost:5432/chess_tricks"
```

#### schema.prisma
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  username  String  @unique
  passwordHash String
  elo       Int     @default(1200)
  puzzleElo Int     @default(1200)
  
  games     Game[]
  puzzleSolves PuzzleSolve[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Game {
  id        String  @id @default(cuid())
  player1Id Int
  player2Id Int
  
  player1   User    @relation(fields: [player1Id], references: [id])
  player2   User    @relation(fields: [player2Id], references: [id])
  
  fen       String
  moves     String[] // Array de moves en SAN
  result    String?  // 'white', 'black', 'draw'
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Puzzle {
  id        Int     @id
  fen       String
  solution  String[] // Array de moves correctos
  themes    String[]
  rating    Int
  
  solves    PuzzleSolve[]
}

model PuzzleSolve {
  id        Int     @id @default(autoincrement())
  userId    Int
  puzzleId  Int
  
  user      User    @relation(fields: [userId], references: [id])
  puzzle    Puzzle  @relation(fields: [puzzleId], references: [id])
  
  solved    Boolean
  timeSpent Int     // segundos
  
  createdAt DateTime @default(now())
}
```

#### Crear migration
```bash
npx prisma migrate dev --name init
```

#### Usar en servidor
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Crear usuario
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    username: 'player1',
    passwordHash: hashedPassword,
    elo: 1200
  }
});

// Guardar movimiento
await prisma.game.update({
  where: { id: gameId },
  data: {
    fen: newFen,
    moves: { push: 'e4' }
  }
});
```

---

## PARTE 3: REFACTORING CÓDIGO (Próximas 3 semanas)

### Modularizar client.js

#### Estructura nueva:
```
src/
├─ index.js (entrada)
├─ game/
│  ├─ controller.js
│  ├─ state.js
│  └─ validator.js
├─ ui/
│  ├─ board.js
│  ├─ coach.js
│  └─ timer.js
├─ analysis/
│  ├─ engine.js
│  └─ evaluator.js
├─ socket/
│  ├─ manager.js
│  └─ handlers.js
└─ utils/
   ├─ constants.js
   └─ helpers.js
```

#### Ejemplo: game/controller.js
```javascript
// game/controller.js
import { ChessGame } from './state.js';
import { validateMove } from './validator.js';

export class GameController {
  constructor() {
    this.game = new ChessGame();
    this.currentMode = 'local';
  }
  
  async move(from, to, promotion) {
    if (!validateMove(this.game, from, to)) {
      throw new Error('Illegal move');
    }
    
    this.game.move(from, to, promotion);
    
    if (this.currentMode === 'online') {
      await this.broadcastMove();
    }
  }
  
  async broadcastMove() {
    // Enviar a servidor
  }
}
```

#### Ejemplo: analysis/engine.js
```javascript
// analysis/engine.js
export class AnalysisEngine {
  constructor() {
    this.worker = new Worker('stockfish-worker.js');
    this.isThinking = false;
  }
  
  async analyze(fen, depth = 20, time = 5000) {
    this.isThinking = true;
    
    return new Promise((resolve) => {
      this.worker.postMessage({ fen, depth, time });
      
      this.worker.onmessage = (event) => {
        this.isThinking = false;
        resolve(event.data);
      };
    });
  }
}
```

#### Ejemplo: main entry (index.js)
```javascript
// index.js
import { GameController } from './game/controller.js';
import { AnalysisEngine } from './analysis/engine.js';
import { BoardUI } from './ui/board.js';

class ChessApp {
  constructor() {
    this.game = new GameController();
    this.analysis = new AnalysisEngine();
    this.ui = new BoardUI();
    
    this.init();
  }
  
  async init() {
    this.ui.render(this.game.getState());
    this.attachEvents();
  }
  
  attachEvents() {
    this.ui.on('move', (move) => this.handleMove(move));
    this.ui.on('hint', () => this.getHint());
  }
  
  async handleMove({ from, to, promotion }) {
    try {
      await this.game.move(from, to, promotion);
      this.ui.updateBoard(this.game.getFEN());
      
      // Análisis en background
      const eval = await this.analysis.analyze(this.game.getFEN());
      this.ui.showEval(eval);
      
    } catch (err) {
      this.ui.showError(err.message);
    }
  }
  
  async getHint() {
    this.ui.showLoading();
    const analysis = await this.analysis.analyze(this.game.getFEN(), 25);
    this.ui.drawArrow(analysis.bestMove);
    this.ui.hideLoading();
  }
}

// Iniciar app
const app = new ChessApp();
export default app;
```

---

## CHECKLIST IMPLEMENTACIÓN

- [ ] **Semana 1:** JWT + Bcrypt + Rate Limiting
- [ ] **Semana 2:** Validación servidor + HTTPS
- [ ] **Semana 3:** PostgreSQL + Prisma setup
- [ ] **Semana 4:** Migraciones de datos
- [ ] **Semana 5:** Modularización código
- [ ] **Semana 6:** Testing + QA
- [ ] **Semana 7:** Deployment y monitoring

---

**Total estimado:** 7 semanas / 200 horas

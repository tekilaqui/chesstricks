const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { Chess } = require('chess.js'); // Import chess.js for validation
require('dotenv').config();

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Demasiadas peticiones desde esta IP, intente de nuevo en 15 minutos" }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos de acceso, intente de nuevo en una hora" }
});

// Security Middleware (Helix & HTTPS)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      imgSrc: ["'self'", "data:", "https:", "http:", "https://raw.githubusercontent.com"], // Added GitHub for pieces
      connectSrc: ["'self'", "ws:", "wss:", "https:", "http:"],
      mediaSrc: ["'self'", "https:", "http:"],
      fontSrc: ["'self'", "https:", "http:"],
      workerSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// HTTPS Enforcement (Production only)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
  }
  next();
});

app.use(express.json({ limit: '10kb' }));
app.get('/*', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
app.use(express.static(__dirname, { dotfiles: 'allow' }));
app.use('/login', authLimiter);
app.use('/register', authLimiter);

const DB_PATH = path.join(__dirname, 'users.json');
let users = {};

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

function loadUsers() {
  if (fs.existsSync(DB_PATH)) {
    try {
      users = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (e) {
      console.error("Error cargando DB:", e);
      users = {};
    }
  }
}

function saveUsers() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error("Error guardando DB:", e);
  }
}

loadUsers();

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function generateToken(username) {
  return jwt.sign(
    { username, timestamp: Date.now() },
    process.env.JWT_SECRET || 'secret-change-this',
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret-change-this');
  } catch (e) {
    return null;
  }
}

function validateUsername(username) {
  return username && typeof username === 'string' && username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(username);
}

function validatePassword(password) {
  return password && typeof password === 'string' && password.length >= 6 && password.length <= 100;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email && typeof email === 'string' && emailRegex.test(email);
}

const activeChallenges = new Map();
const connectedUsers = new Map();

const GAMES_PATH = path.join(__dirname, 'active_games.json');
let activeGames = {};

function loadGames() {
  if (fs.existsSync(GAMES_PATH)) {
    try {
      activeGames = JSON.parse(fs.readFileSync(GAMES_PATH, 'utf8'));
    } catch (e) {
      console.error("Error cargando juegos:", e);
      activeGames = {};
    }
  }
}

function saveGames() {
  try {
    fs.writeFileSync(GAMES_PATH, JSON.stringify(activeGames, null, 2));
  } catch (e) {
    console.error("Error guardando juegos:", e);
  }
}

loadGames();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      socket.username = decoded.username;
      socket.authenticated = true;
    }
  }
  next();
});

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-this';

// STORE REFRESH TOKENS (In production use Redis/DB)
let refreshTokens = [];

function generateTokens(username) {
  const accessToken = jwt.sign(
    { username },
    process.env.JWT_SECRET || 'secret-change-this',
    { expiresIn: '15m' } // Short lived access token
  );
  const refreshToken = jwt.sign(
    { username },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  refreshTokens.push(refreshToken);
  return { accessToken, refreshToken };
}

// REST API AUTH ENDPOINTS (Fixing Rate Limit & Standardizing)
app.post('/api/auth/register', authLimiter, (req, res) => {
  try {
    const { user, pass, email } = req.body;
    if (!validateUsername(user)) return res.status(400).json({ error: 'Usuario inválido (3-20 caracteres alfanuméricos)' });
    if (!validatePassword(pass)) return res.status(400).json({ error: 'Contraseña débil (min 6 caracteres)' });
    if (!validateEmail(email)) return res.status(400).json({ error: 'Email inválido' });
    if (users[user]) return res.status(409).json({ error: 'El usuario ya existe' });

    const salt = crypto.randomBytes(32).toString('hex');
    const hash = hashPassword(pass, salt);

    users[user] = {
      hash, salt, email,
      elo: 500, elo1: 500, elo3: 500, elo10: 500, eloDaily: 500, puzElo: 500,
      createdAt: new Date().toISOString(),
      stats: { wins: 0, losses: 0, draws: 0 }
    };
    saveUsers();

    const tokens = generateTokens(user);
    res.status(201).json({
      user,
      ...tokens,
      elo: 500, stats: users[user].stats
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  try {
    const { user, pass } = req.body;
    if (!validateUsername(user) || !validatePassword(pass)) return res.status(400).json({ error: 'Credenciales inválidas' });

    const u = users[user];
    if (!u) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

    const inputHash = hashPassword(pass, u.salt);
    if (inputHash !== u.hash) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

    const tokens = generateTokens(user);
    res.json({
      user,
      ...tokens,
      elo: u.elo || 500,
      elo1: u.elo1 || 500,
      elo3: u.elo3 || 500,
      elo10: u.elo10 || 500,
      eloDaily: u.eloDaily || 500,
      puzElo: u.puzElo || 500,
      stats: u.stats || {}
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/auth/refresh', (req, res) => {
  const { token } = req.body;
  if (!token) return res.sendStatus(401);
  if (!refreshTokens.includes(token)) return res.sendStatus(403); // Invalid refresh token

  jwt.verify(token, REFRESH_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET || 'secret-change-this',
      { expiresIn: '15m' }
    );
    res.json({ accessToken });
  });
});

app.post('/api/auth/logout', (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter(t => t !== token);
  res.sendStatus(204);
});

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Auto-login if token was valid
  if (socket.authenticated && users[socket.username]) {
    const u = users[socket.username];
    socket.emit('auth_success', {
      user: socket.username,
      elo: u.elo || 500,
      elo1: u.elo1 || 500,
      elo3: u.elo3 || 500,
      elo10: u.elo10 || 500,
      eloDaily: u.eloDaily || 500,
      puzElo: u.puzElo || 500,
      token: socket.handshake.auth.token
    });
    connectedUsers.set(socket.id, socket.username);
  }

  socket.emit('lobby_update', Array.from(activeChallenges.values()));


  // Legacy Socket Auth Events (Deprecated but kept for backward compatibility if needed, though client will switch to API)
  /* socket.on('register', ... ) REMOVED to force API usage for security */
  /* socket.on('login', ... ) REMOVED to force API usage for security */

  socket.on('update_elo', (data) => {
    if (!socket.authenticated || socket.username !== data.user) return;
    if (users[data.user]) {
      if (data.type === 'puz') users[data.user].puzElo = Math.max(0, Math.min(3000, data.elo));
      else if (data.type === 'elo1') users[data.user].elo1 = Math.max(0, Math.min(3000, data.elo));
      else if (data.type === 'elo3') users[data.user].elo3 = Math.max(0, Math.min(3000, data.elo));
      else if (data.type === 'elo10') users[data.user].elo10 = Math.max(0, Math.min(3000, data.elo));
      else if (data.type === 'eloDaily') users[data.user].eloDaily = Math.max(0, Math.min(3000, data.elo));
      else users[data.user].elo = Math.max(0, Math.min(3000, data.elo));
      saveUsers();
    }
  });

  socket.on('create_challenge', (data) => {
    if (!socket.authenticated) return socket.emit('error', 'Debes iniciar sesión');
    // Use the ID provided by the client to ensure sync
    const challengeId = data.id || crypto.randomBytes(16).toString('hex');
    const challenge = {
      id: challengeId,
      user: socket.username, // Changed from creator to user to match client expectation
      creatorElo: users[socket.username]?.elo || 1200, // Keep this for backend logic if needed
      elo: users[socket.username]?.elo || 1200, // Add this for client display consistency
      timeControl: data.timeControl || '10+0',
      time: data.time || 10, // Ensure 'time' property exists as client expects
      createdAt: Date.now()
    };
    activeChallenges.set(challengeId, challenge);
    socket.join(`game_${challengeId}`);
    socket.broadcast.emit('new_challenge', challenge);
  });

  socket.on('get_lobby', () => {
    socket.emit('lobby_update', Array.from(activeChallenges.values()));
    if (socket.username) {
      const userGames = Object.values(activeGames).filter(g => g.white === socket.username || g.black === socket.username);
      socket.emit('active_games_update', userGames);
    }
  });

  socket.on('join_game', (data) => {
    const game = activeGames[data.gameId];
    if (game && (game.white === socket.username || game.black === socket.username)) {
      socket.join(`game_${data.gameId}`);
      socket.emit('game_resume', {
        id: game.id,
        fen: game.fen,
        white: game.white,
        black: game.black,
        whiteElo: game.whiteElo,
        blackElo: game.blackElo,
        whiteTime: game.whiteTime,
        blackTime: game.blackTime,
        turn: game.turn,
        moves: game.moves
      });
    }
  });

  socket.on('join_challenge', (data) => {
    if (!socket.authenticated) return socket.emit('error', 'Debes iniciar sesión');
    const challenge = activeChallenges.get(data.id);
    if (!challenge) return socket.emit('error', 'Reto no encontrado');
    if (challenge.user === socket.username) return socket.emit('error', 'No puedes unirte a tu propio reto');

    activeChallenges.delete(data.id);
    socket.join(`game_${data.id}`);

    const isWhite = Math.random() > 0.5;
    const gameTime = (challenge.time || 10) * 60;

    const time = challenge.time || 10;
    const type = time <= 1 ? 'elo1' : (time <= 3 ? 'elo3' : (time >= 1440 ? 'eloDaily' : 'elo10'));

    activeGames[data.id] = {
      id: data.id,
      white: isWhite ? challenge.user : socket.username,
      black: isWhite ? socket.username : challenge.user,
      whiteElo: isWhite ? (users[challenge.user][type] || 500) : (users[socket.username][type] || 500),
      blackElo: isWhite ? (users[socket.username][type] || 500) : (users[challenge.user][type] || 500),
      startTime: Date.now(),
      moves: [],
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      turn: 'w',
      whiteTime: gameTime,
      blackTime: gameTime,
      lastUpdate: Date.now(),
      time: time
    };

    saveGames();
    io.emit('lobby_update', Array.from(activeChallenges.values()));

    // Notificar a ambos jugadores el inicio y sus colores
    io.to(`game_${data.id}`).emit('game_start', {
      gameId: data.id,
      white: activeGames[data.id].white,
      black: activeGames[data.id].black,
      whiteElo: activeGames[data.id].whiteElo,
      blackElo: activeGames[data.id].blackElo,
      time: activeGames[data.id].time
    });
  });

  socket.on('get_my_games', () => {
    if (!socket.authenticated) return;
    const myGames = Object.values(activeGames).filter(g =>
      g.white === socket.username || g.black === socket.username
    );
    socket.emit('my_games_list', myGames);
  });

  socket.on('move', (data) => {
    if (!socket.authenticated) return;
    const game = activeGames[data.gameId];
    if (game) {
      const now = Date.now();

      // STRICT MOVEMENT VALIDATION
      try {
        const chess = new Chess(game.fen);

        // 1. Validate Turn
        const turnColor = chess.turn() === 'w' ? 'white' : 'black';
        const isWhite = game.white === socket.username;
        const isBlack = game.black === socket.username;

        if (isWhite && turnColor !== 'white') return socket.emit('error', 'No es tu turno');
        if (isBlack && turnColor !== 'black') return socket.emit('error', 'No es tu turno');

        // 2. Validate Move Legality
        const move = chess.move(data.move); // Attempt move on server board
        if (!move) {
          return socket.emit('error', 'Movimiento ilegal rechazado por el servidor');
        }

        // 3. Update Game State (using Server Calculation)
        const elapsed = Math.floor((now - game.lastUpdate) / 1000);
        if (game.turn === 'w') {
          game.whiteTime = Math.max(0, game.whiteTime - elapsed);
        } else {
          game.blackTime = Math.max(0, game.blackTime - elapsed);
        }

        game.moves.push(move.san);
        game.fen = chess.fen(); // Source of truth is SERVER
        game.turn = chess.turn() === 'w' ? 'w' : 'b'; // Simplify logic
        game.lastUpdate = now;
        saveGames();

        // 4. broadcast updated state
        const moveData = {
          move: move.san,
          fen: game.fen,
          whiteTime: game.whiteTime,
          blackTime: game.blackTime,
          turn: game.turn,
          gameId: data.gameId
        };

        // Broadcast to opponent
        socket.to(`game_${data.gameId}`).emit('move', moveData);
        // Acknowledge to sender (to sync clock/fen)
        socket.emit('move_ack', moveData);

        // Check Game Over
        if (chess.isGameOver()) {
          // ... (implement game over logic if needed, or let client handle it. 
          // Better to handle here but let's stick to minimal breaking changes.
          // Client checks game over on FEN update usually)
        }

      } catch (e) {
        console.error("Error validando movimiento:", e);
        return socket.emit('error', 'Error procesando el movimiento');
      }
    }
  });

  socket.on('chat_message', (data) => {
    if (!socket.authenticated) return;
    const sanitizedMessage = {
      user: socket.username,
      message: sanitize(data.message).substring(0, 500),
      gameId: data.gameId,
      timestamp: Date.now()
    };
    if (data.gameId) {
      io.to(`game_${data.gameId}`).emit('chat_message', sanitizedMessage);
    } else {
      io.emit('chat_message', sanitizedMessage);
    }
  });

  socket.on('resign_game', (data) => {
    if (!socket.authenticated) return;
    const game = activeGames[data.gameId];
    if (game) {
      if (users[game.white]) users[game.white].stats.wins++;
      if (users[game.black]) users[game.black].stats.losses++;
      saveUsers();
      delete activeGames[data.gameId];
      saveGames();
    }
    socket.to(`game_${data.gameId}`).emit('player_resigned', { user: socket.username });
  });

  socket.on('abort_online_game', (data) => {
    if (!socket.authenticated) return;

    let wasChallenge = false;
    if (activeChallenges.has(data.gameId)) {
      activeChallenges.delete(data.gameId);
      io.emit('lobby_update', Array.from(activeChallenges.values()));
      wasChallenge = true;
    }

    if (activeGames[data.gameId]) {
      delete activeGames[data.gameId];
      saveGames();
      socket.to(`game_${data.gameId}`).emit('game_aborted', { user: socket.username });
    }
  });

  socket.on('get_leaderboard', () => {
    const top10 = Object.keys(users)
      .map(u => ({ user: u, elo: users[u].elo, stats: users[u].stats || {} }))
      .sort((a, b) => b.elo - a.elo)
      .slice(0, 10);
    socket.emit('leaderboard_data', top10);
  });

  socket.on('delete_account', (data) => {
    if (!socket.authenticated || !socket.username) {
      return socket.emit('auth_error', { message: "Debes estar identificado para borrar la cuenta." });
    }

    const username = socket.username;
    const u = users[username];

    if (!u) {
      return socket.emit('auth_error', { message: "Usuario no encontrado." });
    }

    // Verificar contraseña si se proporciona
    if (!data || !data.pass) {
      return socket.emit('auth_error', { message: "Se requiere la contraseña para borrar la cuenta por seguridad." });
    }

    const inputHash = hashPassword(data.pass, u.salt);
    if (inputHash !== u.hash) {
      return socket.emit('auth_error', { message: "Contraseña incorrecta. No se ha podido eliminar la cuenta." });
    }

    console.log(`🗑️ Eliminando cuenta del usuario: ${username}`);
    delete users[username];
    saveUsers();
    socket.emit('account_deleted', { message: "Cuenta eliminada correctamente." });
    socket.disconnect();
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    connectedUsers.delete(socket.id);
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const https = require('https');

app.get('/puzzles', (req, res) => {
  const { themes, min_rating, max_rating, limit } = req.query;
  const url = `https://chess-puzzles-api.vercel.app/puzzles?themes=${themes || 'mate'}&min_rating=${min_rating || 1000}&max_rating=${max_rating || 1500}&limit=${limit || 50}&_t=${Date.now()}`;

  https.get(url, (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => { data += chunk; });
    apiRes.on('end', () => {
      try {
        res.json(JSON.parse(data));
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse puzzles' });
      }
    });
  }).on('error', (err) => {
    console.error('Error proxying puzzles:', err);
    res.status(500).json({ error: 'Failed to fetch puzzles' });
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
});

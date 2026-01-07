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
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
const server = http.createServer(app);
const io = new Server(server);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: "Demasiadas peticiones" }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { error: "Demasiados intentos de acceso" }
});

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: blob:; " +
    "script-src-attr 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https: http:; " +
    "img-src 'self' data: https: http: blob: raw.githubusercontent.com; " +
    "connect-src 'self' wss: ws: https: http:; " +
    "media-src 'self' https: http: raw.githubusercontent.com; " +
    "font-src 'self' https: http:; " +
    "worker-src 'self' blob: http: https:; " +
    "object-src 'none';"
  );
  next();
});

app.use(helmet({
  contentSecurityPolicy: false, // Turn off helmet's CSP so our manual one works
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json({ limit: '10kb' }));
app.get('/*', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Explicitly serve critical static files
app.get('/style.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/client.js', (req, res) => {
  res.setHeader('Content-Type', 'text/javascript');
  res.sendFile(path.join(__dirname, 'client.js'));
});

// Serve images explicitly too if needed
app.get('/logo.jpg', (req, res) => {
  res.sendFile(path.join(__dirname, 'logo.jpg'));
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

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Auto-login if token was valid
  if (socket.authenticated && users[socket.username]) {
    const u = users[socket.username];
    socket.emit('auth_success', {
      user: socket.username,
      elo: u.elo || 500, // Ensure updated to 500 default
      puzElo: u.puzElo || 500,
      token: socket.handshake.auth.token // Echo back
    });
    connectedUsers.set(socket.id, socket.username);
  }

  socket.emit('lobby_update', Array.from(activeChallenges.values()));

  socket.on('register', (data) => {
    try {
      if (!validateUsername(data.user)) return socket.emit('auth_error', 'Usuario inválido');
      if (!validatePassword(data.pass)) return socket.emit('auth_error', 'Contraseña inválida');
      if (!validateEmail(data.email)) return socket.emit('auth_error', 'Email inválido');
      if (users[data.user]) return socket.emit('auth_error', 'El usuario ya existe');

      const salt = crypto.randomBytes(32).toString('hex');
      const hash = hashPassword(data.pass, salt);

      users[data.user] = {
        hash, salt, email: data.email,
        elo: 500, puzElo: 500,
        createdAt: new Date().toISOString(),
        stats: { wins: 0, losses: 0, draws: 0 }
      };

      saveUsers();
      const token = generateToken(data.user);
      socket.username = data.user;
      socket.authenticated = true;
      connectedUsers.set(socket.id, data.user);

      socket.emit('auth_success', { user: data.user, elo: 1200, puzElo: 1200, token });
    } catch (error) {
      console.error('Error en registro:', error);
      socket.emit('auth_error', 'Error en el servidor');
    }
  });

  socket.on('login', (data) => {
    try {
      if (!validateUsername(data.user) || !validatePassword(data.pass)) return socket.emit('auth_error', 'Credenciales inválidas');
      const u = users[data.user];
      if (!u) return socket.emit('auth_error', 'Usuario no encontrado');

      const inputHash = hashPassword(data.pass, u.salt);
      if (inputHash === u.hash) {
        const token = generateToken(data.user);
        socket.username = data.user;
        socket.authenticated = true;
        connectedUsers.set(socket.id, data.user);
        socket.emit('auth_success', { user: data.user, elo: u.elo, puzElo: u.puzElo, token, stats: u.stats || {} });
      } else {
        socket.emit('auth_error', 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Error en login:', error);
      socket.emit('auth_error', 'Error en el servidor');
    }
  });

  socket.on('update_elo', (data) => {
    if (!socket.authenticated || socket.username !== data.user) return;
    if (users[data.user]) {
      users[data.user].elo = Math.max(0, Math.min(3000, data.elo));
      users[data.user].puzElo = Math.max(0, Math.min(3000, data.puzElo));
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
    // Special handling for 24h games: 1440 minutes = 24 hours
    // For 24h games, we want 24 hours per move, not total time
    let gameTime;
    if (challenge.time === 1440) {
      // 24 hour game: 24 hours per move = 86400 seconds
      gameTime = 24 * 60 * 60; // 86400 seconds
    } else {
      // Regular games: time in minutes converted to seconds
      gameTime = (challenge.time || 10) * 60;
    }

    activeGames[data.id] = {
      id: data.id,
      white: isWhite ? challenge.user : socket.username,
      black: isWhite ? socket.username : challenge.user,
      startTime: Date.now(),
      moves: [],
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      turn: 'w',
      whiteTime: gameTime,
      blackTime: gameTime,
      lastUpdate: Date.now()
    };

    saveGames();
    io.emit('lobby_update', Array.from(activeChallenges.values()));

    // Notificar a ambos jugadores el inicio y sus colores
    io.to(`game_${data.id}`).emit('game_start', {
      gameId: data.id,
      white: activeGames[data.id].white,
      black: activeGames[data.id].black,
      time: challenge.time || 10
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
      const elapsed = Math.floor((now - game.lastUpdate) / 1000);

      // Update time of the player who just moved
      if (game.turn === 'w') {
        game.whiteTime = Math.max(0, game.whiteTime - elapsed);
      } else {
        game.blackTime = Math.max(0, game.blackTime - elapsed);
      }

      game.moves.push(data.move);
      game.fen = data.fen || game.fen;
      game.turn = game.turn === 'w' ? 'b' : 'w';
      game.lastUpdate = now;
      saveGames();

      // Emit with updated server times to keep clients in sync
      const moveData = {
        ...data,
        whiteTime: game.whiteTime,
        blackTime: game.blackTime,
        turn: game.turn
      };
      socket.to(`game_${data.gameId}`).emit('move', moveData);
      socket.emit('move_ack', moveData); // Confirm to the sender too
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
});

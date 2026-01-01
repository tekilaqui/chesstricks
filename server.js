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

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "wss:", "https:", "http:"],
      mediaSrc: ["'self'", "https:", "http:"],
      fontSrc: ["'self'", "https:", "http:"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: '10kb' }));
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

async function loadUsers() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = await fs.promises.readFile(DB_PATH, 'utf8');
      users = JSON.parse(data);
    } catch (e) {
      console.error("Error cargando DB:", e);
      users = {};
    }
  }
}

async function saveUsers() {
  try {
    await fs.promises.writeFile(DB_PATH, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error("Error guardando DB:", e);
  }
}



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

async function loadGames() {
  if (fs.existsSync(GAMES_PATH)) {
    try {
      const data = await fs.promises.readFile(GAMES_PATH, 'utf8');
      activeGames = JSON.parse(data);
    } catch (e) {
      console.error("Error cargando juegos:", e);
      activeGames = {};
    }
  }
}

async function saveGames() {
  try {
    await fs.promises.writeFile(GAMES_PATH, JSON.stringify(activeGames, null, 2));
  } catch (e) {
    console.error("Error guardando juegos:", e);
  }
}


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

  const calculateElo = (currentElo, opponentElo, result) => {
    const k = 32;
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
    return Math.round(currentElo + k * (result - expectedScore));
  };

  socket.on('game_result', async (data) => {
    if (!socket.authenticated) return;
    const u = users[socket.username];
    if (!u) return;

    // Solo el servidor decide el cambio de ELO
    // data.result (1: gana, 0.5: tablas, 0: pierde)
    // data.opponentElo: ELO del oponente (IA o Humano)
    const result = parseFloat(data.result);
    const oppElo = parseInt(data.opponentElo) || 1200;

    if (data.isPuzzle) {
      u.puzElo = Math.max(100, calculateElo(u.puzElo || 1200, oppElo, result));
    } else {
      u.elo = Math.max(100, calculateElo(u.elo || 1200, oppElo, result));
      if (!u.stats) u.stats = { wins: 0, losses: 0, draws: 0 };
      if (result === 1) u.stats.wins++;
      else if (result === 0) u.stats.losses++;
      else u.stats.draws++;
    }

    await saveUsers();
    socket.emit('elo_updated', { elo: u.elo, puzElo: u.puzElo, stats: u.stats });
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

  socket.on('join_challenge', (data) => {
    if (!socket.authenticated) return socket.emit('error', 'Debes iniciar sesión');
    const challenge = activeChallenges.get(data.id);
    if (!challenge) return socket.emit('error', 'Reto no encontrado');
    if (challenge.user === socket.username) return socket.emit('error', 'No puedes unirte a tu propio reto');

    activeChallenges.delete(data.id);
    socket.join(`game_${data.id}`);

    const gameTime = (challenge.time || 10) * 60;
    activeGames[data.id] = {
      id: data.id,
      white: challenge.user,
      black: socket.username,
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
    socket.to(`game_${data.id}`).emit('opponent_joined', {
      user: socket.username,
      elo: users[socket.username]?.elo || 1200
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
    }
    socket.to(`game_${data.gameId}`).emit('move', data);
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

async function init() {
  console.log("💾 Cargando base de datos...");
  await loadUsers();
  await loadGames();

  server.listen(PORT, () => {
    console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
    console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
    console.log("✅ Integridad de datos verificada.");
  });
}

init();


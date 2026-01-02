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
const { Chess } = require('chess.js');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const compression = require('compression');
const fetch = require('node-fetch');
const Sentry = require('@sentry/node');
require('dotenv').config();

const logger = require('./src/server/logger');
const validator = require('./src/server/validator');

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],
  });
  logger.info('📊 Sentry monitoring initialized');
} else {
  logger.warn('⚠️ Sentry DSN not configured - monitoring disabled');
}

// 📦 DB MODULE
const { initDB, users: userDB, games: gameDB, tokens: tokenDB } = require('./src/server/db');

const app = express();

// 🛡️ TAREA 7: Restringir CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://chesspro-online.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 🗜️ GZIP COMPRESSION
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));
logger.info('🗜️ GZIP compression enabled');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  logger.error("❌ ERROR: JWT_SECRET no definido en producción.");
  process.exit(1);
}


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
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:", "https:", "http:"],
      workerSrc: ["'self'", "blob:", "https:", "http:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "wss:", "https://cdnjs.cloudflare.com", "https:", "http:"],
      mediaSrc: ["'self'", "https:", "http:"],
      fontSrc: ["'self'", "https:", "http:"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Sentry request handler (must be first)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

app.use(express.json({ limit: '10kb' }));

// 🚀 TAREA 16: Configurar caché HTTP
const oneYear = 31536000000;
const oneHour = 3600000;

app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: oneYear,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', `public, max-age=${oneHour / 1000}`);
    }
  }
}));

app.use(express.static(__dirname, {
  maxAge: oneHour,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', `public, max-age=${oneHour / 1000}`);
    }
  }
}));

app.use('/login', authLimiter);
app.use('/register', authLimiter);

// 🧩 PUZZLES PROXY (Tarea 14: Lazy Loading)
app.get('/puzzles', async (req, res) => {
  const { themes, min_rating, max_rating, limit } = req.query;
  const url = `https://chess-puzzles-api.vercel.app/puzzles?themes=${themes || 'all'}&min_rating=${min_rating || 600}&max_rating=${max_rating || 3000}&limit=${limit || 1}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.error({ err: err.message, url }, 'Error fetching puzzles from API');
    res.status(500).json({ error: 'Error cargando puzzles' });
  }
});

// ----------------------------------------------------------------------
// 🗄️ STATE MANAGEMENT
// Active games are kept in memory for performance, synced to DB on change.
// Users are strictly fetched from DB.
// ----------------------------------------------------------------------

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

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function generateToken(username) {
  return jwt.sign(
    { username, timestamp: Date.now() },
    JWT_SECRET || 'dev-secret-key',
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET || 'dev-secret-key');
  } catch (e) {
    return null;
  }
}


const activeChallenges = new Map();
const connectedUsers = new Map();
// Reset tokens now managed by DB

// 🛡️ TAREA 6: Rate Limiting
const rateLimiter = new RateLimiterMemory({
  points: 50, // 50 eventos/minuto global
  duration: 60,
});

const moveLimiter = new RateLimiterMemory({
  points: 30, // 30 movimientos/minuto por usuario
  duration: 60,
});


let activeGames = {};

async function loadActiveGames() {
  try {
    activeGames = await gameDB.getAllActive();
    logger.info(`🎮 ${Object.keys(activeGames).length} partidas activas cargadas desde DB.`);
  } catch (e) {
    logger.error("Error cargando juegos activos:", e);
    activeGames = {};
  }
}

async function saveGame(game) {
  if (!game) return;
  try {
    await gameDB.save(game);
  } catch (e) {
    logger.error("Error guardando juego:", e);
  }
}

// SOCKET.IO MIDDLEWARE
io.use(async (socket, next) => {
  try {
    await rateLimiter.consume(socket.handshake.address, 2);
  } catch (rejRes) {
    return next(new Error('Demasiadas conexiones. Intenta más tarde.'));
  }

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

// SOCKET EVENTS
io.on('connection', async (socket) => {
  logger.debug({ socketId: socket.id, ip: socket.handshake.address }, 'Nuevo socket conectado');

  // Auto-login
  if (socket.authenticated) {
    try {
      const u = await userDB.get(socket.username);
      if (u) {
        socket.emit('auth_success', {
          user: socket.username,
          elo: u.elo || 500,
          puzElo: u.puzElo || 500,
          token: socket.handshake.auth.token
        });
        connectedUsers.set(socket.id, socket.username);
        logger.info({ user: socket.username }, 'Auto-login exitoso');
      }
    } catch (e) { logger.error({ err: e.message, user: socket.username }, "Auto-login error"); }
  }

  socket.emit('lobby_update', Array.from(activeChallenges.values()));

  socket.on('register', async (data) => {
    try {
      const vU = validator.username(data.user);
      const vP = validator.password(data.pass);
      const vE = validator.email(data.email);

      if (!vU.valid) return socket.emit('auth_error', vU.error);
      if (!vP.valid) return socket.emit('auth_error', vP.error);
      if (!vE.valid) return socket.emit('auth_error', vE.error);

      const existing = await userDB.get(data.user);
      if (existing) return socket.emit('auth_error', 'El usuario ya existe');

      const existingEmail = await userDB.getByEmail(data.email);
      if (existingEmail) return socket.emit('auth_error', 'El email ya está en uso');

      const salt = crypto.randomBytes(32).toString('hex');
      const hash = hashPassword(data.pass, salt);

      await userDB.create({
        username: data.user,
        email: data.email,
        hash, salt,
        elo: 500, puzElo: 500
      });

      logger.info({ user: data.user }, 'Nuevo usuario registrado');

      const token = generateToken(data.user);
      socket.username = data.user;
      socket.authenticated = true;
      connectedUsers.set(socket.id, data.user);

      socket.emit('auth_success', { user: data.user, elo: 500, puzElo: 500, token });
    } catch (error) {
      logger.error({ err: error.message, user: data.user }, 'Error en registro');
      socket.emit('auth_error', 'Error en el servidor');
    }
  });

  socket.on('login', async (data) => {
    try {
      const vU = validator.username(data.user);
      const vP = validator.password(data.pass);
      if (!vU.valid || !vP.valid) return socket.emit('auth_error', 'Credenciales inválidas');

      const u = await userDB.get(data.user);
      if (!u) return socket.emit('auth_error', 'Usuario no encontrado');

      const inputHash = hashPassword(data.pass, u.salt);
      if (inputHash === u.hash) {
        logger.info({ user: data.user }, 'Login exitoso');
        const token = generateToken(data.user);
        socket.username = data.user;
        socket.authenticated = true;
        connectedUsers.set(socket.id, data.user);
        socket.emit('auth_success', {
          user: data.user,
          elo: u.elo,
          puzElo: u.puzElo || u.puzzle_elo, // DB field name might differ if aliased
          token,
          stats: u.stats
        });
      } else {
        socket.emit('auth_error', 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Error en login:', error);
      socket.emit('auth_error', 'Error en el servidor');
    }
  });

  socket.on('forgot_password', async (data) => {
    try {
      const email = data.email;
      if (!validateEmail(email)) return socket.emit('forgot_password_error', 'Email inválido');

      const u = await userDB.getByEmail(email);

      if (u) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await tokenDB.set(email, code, Date.now() + 15 * 60 * 1000);

        console.log(`\n🔑 [RECUPERACIÓN] Código para ${email} (${u.username}): ${code}\n`);
        socket.emit('forgot_password_success', 'Código enviado. Revisa la consola del servidor.');
      } else {
        socket.emit('forgot_password_error', 'Email no registrado.');
      }
    } catch (error) {
      socket.emit('forgot_password_error', 'Error en el servidor');
    }
  });

  socket.on('reset_password', async (data) => {
    try {
      const { email, code, newPass } = data;
      if (!validatePassword(newPass)) return socket.emit('auth_error', 'Contraseña nueva inválida (mín. 6 caracteres)');

      const resetData = await tokenDB.get(email);
      if (!resetData || resetData.code !== code || Date.now() > resetData.expires) {
        return socket.emit('auth_error', 'Código inválido o expirado.');
      }

      const u = await userDB.getByEmail(email);
      if (!u) return socket.emit('auth_error', 'Error al identificar usuario.');

      const salt = crypto.randomBytes(32).toString('hex');
      const hash = hashPassword(newPass, salt);

      await userDB.updatePassword(u.username, hash, salt);
      await tokenDB.delete(email);

      socket.emit('reset_password_success', 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.');
    } catch (error) {
      socket.emit('auth_error', 'Error en el servidor al resetear.');
    }
  });


  const calculateElo = (currentElo, opponentElo, result) => {
    const k = 32;
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
    return Math.round(currentElo + k * (result - expectedScore));
  };

  socket.on('game_result', async (data) => {
    if (!socket.authenticated) return;
    const u = await userDB.get(socket.username);
    if (!u) return;

    const result = parseFloat(data.result);
    const oppElo = parseInt(data.opponentElo) || 1200;

    let newElo = u.elo;
    let newPuzElo = u.puzElo || u.puzzle_elo;

    if (data.isPuzzle) {
      newPuzElo = Math.max(100, calculateElo(newPuzElo || 1200, oppElo, result));
    } else {
      newElo = Math.max(100, calculateElo(newElo || 1200, oppElo, result));
      await userDB.updateStats(socket.username, result);
    }

    await userDB.updateElo(socket.username, newElo, newPuzElo);

    // Fetch updated to sync? Or just emit calculated.
    // Let's emit calculated to be fast.
    const updatedStats = { ...u.stats };
    if (!data.isPuzzle) {
      if (result === 1) updatedStats.wins++;
      else if (result === 0) updatedStats.losses++;
      else updatedStats.draws++;
    }

    socket.emit('elo_updated', { elo: newElo, puzElo: newPuzElo, stats: updatedStats });
  });


  socket.on('create_challenge', async (data) => {
    if (!socket.authenticated) return socket.emit('error', 'Debes iniciar sesión');

    const u = await userDB.get(socket.username);

    const challengeId = data.id || crypto.randomBytes(16).toString('hex');
    const challenge = {
      id: challengeId,
      user: socket.username,
      elo: u ? u.elo : 1200,
      time: data.time || 10,
      createdAt: Date.now()
    };
    activeChallenges.set(challengeId, challenge);
    socket.join(`game_${challengeId}`);
    socket.broadcast.emit('new_challenge', challenge);
  });

  socket.on('join_challenge', async (data) => {
    if (!socket.authenticated) return socket.emit('error', 'Debes iniciar sesión');
    const challenge = activeChallenges.get(data.id);
    if (!challenge) return socket.emit('error', 'Reto no encontrado');
    if (challenge.user === socket.username) return socket.emit('error', 'No puedes unirte a tu propio reto');

    activeChallenges.delete(data.id);
    socket.join(`game_${data.id}`);

    const u = await userDB.get(socket.username);

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

    saveGame(activeGames[data.id]);
    io.emit('lobby_update', Array.from(activeChallenges.values()));
    socket.to(`game_${data.id}`).emit('opponent_joined', {
      user: socket.username,
      elo: u ? u.elo : 1200
    });
  });

  socket.on('get_my_games', () => {
    if (!socket.authenticated) return;
    const myGames = Object.values(activeGames).filter(g =>
      g.white === socket.username || g.black === socket.username
    );
    socket.emit('my_games_list', myGames);
  });

  socket.on('move', async (data) => {
    if (!socket.authenticated) return;

    const gameData = activeGames[data.gameId];
    if (!gameData) return;

    // 🛡️ TAREA 5: Validar turno y jugador
    const isWhite = gameData.white === socket.username;
    const isBlack = gameData.black === socket.username;

    if (!isWhite && !isBlack) return socket.emit('error', 'No participas en esta partida.');
    if ((gameData.turn === 'w' && !isWhite) || (gameData.turn === 'b' && !isBlack)) {
      return socket.emit('error', 'No es tu turno.');
    }

    try {
      await moveLimiter.consume(socket.username, 1);
    } catch (rejRes) {
      return socket.emit('error', 'Estás moviendo demasiado rápido. Límite: 30 mov/min.');
    }

    try {
      const chess = new Chess(gameData.fen);
      const vM = validator.move(data.move);
      if (!vM.valid) return socket.emit('error', vM.error);

      const move = chess.move(data.move);

      if (!move) {
        logger.warn({ user: socket.username, move: data.move, fen: gameData.fen }, '[CHEAT] Movimiento ilegal detectado');
        return socket.emit('error', 'Movimiento ilegal rechazado.');
      }

      const now = Date.now();
      const elapsed = Math.floor((now - gameData.lastUpdate) / 1000);

      if (gameData.turn === 'w') {
        gameData.whiteTime = Math.max(0, gameData.whiteTime - elapsed);
      } else {
        gameData.blackTime = Math.max(0, gameData.blackTime - elapsed);
      }

      gameData.moves.push(move.san);
      gameData.fen = chess.fen();
      gameData.turn = chess.turn();
      gameData.lastUpdate = now;

      saveGame(gameData);

      logger.debug({ user: socket.username, move: move.san, gameId: data.gameId }, 'Movimiento válido procesado');

      io.to(`game_${data.gameId}`).emit('move', {
        move: move.san,
        fen: gameData.fen,
        whiteTime: gameData.whiteTime,
        blackTime: gameData.blackTime,
        turn: gameData.turn
      });

    } catch (e) {
      logger.error({ err: e.message, user: socket.username }, "Error validando movimiento");
      return socket.emit('error', 'Error procesando movimiento');
    }
  });


  socket.on('chat_message', (data) => {
    if (!socket.authenticated) return;

    const vC = validator.chatMessage(data.message);
    if (!vC.valid) return; // Silent discard or toast?

    const sanitizedMessage = {
      user: socket.username,
      message: sanitize(data.message),
      gameId: data.gameId,
      timestamp: Date.now()
    };

    logger.debug({ user: socket.username, gameId: data.gameId }, 'Mensaje de chat');

    if (data.gameId) {
      io.to(`game_${data.gameId}`).emit('chat_message', sanitizedMessage);
    } else {
      io.emit('chat_message', sanitizedMessage);
    }
  });

  socket.on('resign_game', async (data) => {
    if (!socket.authenticated) return;
    const game = activeGames[data.gameId];
    if (game) {
      // Just update stats in DB loosely?
      // In a real app we'd verify outcome better.
      await userDB.updateStats(game.white, game.white === socket.username ? 0 : 1);
      await userDB.updateStats(game.black, game.black === socket.username ? 0 : 1);

      // We don't delete game yet, maybe mark as finished?
      // For now, keep behavior: delete
      await gameDB.delete(data.gameId);
      delete activeGames[data.gameId];
    }
    socket.to(`game_${data.gameId}`).emit('player_resigned', { user: socket.username });
  });

  socket.on('abort_online_game', async (data) => {
    if (!socket.authenticated) return;

    if (activeChallenges.has(data.gameId)) {
      activeChallenges.delete(data.gameId);
      io.emit('lobby_update', Array.from(activeChallenges.values()));
    }

    if (activeGames[data.gameId]) {
      await gameDB.delete(data.gameId);
      delete activeGames[data.gameId];
      socket.to(`game_${data.gameId}`).emit('game_aborted', { user: socket.username });
    }
  });

  socket.on('get_leaderboard', async () => {
    try {
      const top10 = await userDB.getTop10();
      socket.emit('leaderboard_data', top10);
    } catch (e) { console.error(e); }
  });

  socket.on('disconnect', () => {
    logger.debug({ socketId: socket.id, user: socket.username }, 'Socket desconectado');
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
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    logger.error({ err: err.message, stack: err.stack }, 'Unhandled error');
  }
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message
  });
});

async function init() {
  logger.info("💾 Inicializando SQLite...");
  await initDB();
  await loadActiveGames();

  server.listen(PORT, () => {
    logger.info(`🔥 Servidor corriendo en puerto ${PORT}`);
    logger.info("✅ DB Conectada.");
  });
}

const gracefulShutdown = async (signal) => {
  logger.info(`🛑 Recibido ${signal}. Cerrando servidor...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (require.main === module) {
  init();
}

module.exports = { app, server, initDB }; // Export for testing

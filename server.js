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
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Log de inicio para depuración en Render
console.log("🚀 Iniciando servidor...");
console.log("📁 Directorio actual:", __dirname);
console.log("🌍 Entorno:", process.env.NODE_ENV || 'development');

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
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://unpkg.com",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://code.jquery.com",
        "https://cdn.socket.io",
        "blob:"
      ],
      scriptSrcAttr: ["'unsafe-inline'"], // Permitir event handlers inline
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "http:",
        "https://raw.githubusercontent.com"
      ],
      connectSrc: [
        "'self'",
        "wss:",
        "ws:",
        "https:",
        "http:",
        "https://explorer.lichess.ovh",
        "https://unpkg.com"
      ],
      mediaSrc: [
        "'self'",
        "https:",
        "http:",
        "https://github.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      workerSrc: [
        "'self'",
        "blob:",
        "https://unpkg.com",
        "https:"
      ],
      childSrc: [
        "'self'",
        "blob:",
        "https://unpkg.com",
        "https:"
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: null, // Desactivar para permitir carga en redes locales sin HTTPS
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));
app.use(express.json({ limit: '10kb' }));
app.get('/*', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // Permitir que el navegador cargue recursos de otros orígenes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

// El servidor ahora solo maneja Autenticación, ELO y un Proxy para Puzzles.
// Se ha eliminado toda la lógica de partidas online (Socket.IO multiplayer).

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

  if (socket.authenticated && users[socket.username]) {
    const u = users[socket.username];
    socket.emit('auth_success', {
      user: socket.username,
      elo: u.elo || 500,
      puzElo: u.puzElo || 500,
      token: socket.handshake.auth.token
    });
  }

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
      socket.emit('auth_success', { user: data.user, elo: 500, puzElo: 500, token });
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
        socket.emit('auth_success', {
          user: data.user,
          elo: u.elo || 500,
          puzElo: u.puzElo || 500,
          token, stats: u.stats || {}
        });
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
      users[data.user].elo = Math.max(0, Math.min(3000, data.elo || 500));
      users[data.user].puzElo = Math.max(0, Math.min(3000, data.puzElo || 500));
      saveUsers();
    }
  });

  socket.on('get_leaderboard', () => {
    const top10 = Object.keys(users)
      .map(u => ({ user: u, elo: users[u].elo || 500, puzElo: users[u].puzElo || 500 }))
      .sort((a, b) => b.elo - a.elo)
      .slice(0, 10);
    socket.emit('leaderboard_data', top10);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
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

// Manejo de errores globales para evitar "Status 1" sin info
process.on('uncaughtException', (err) => {
  console.error('❌ ERROR NO CAPTURADO:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ PROMESA RECHAZADA NO MANEJADA:', reason);
});

server.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});

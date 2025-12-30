const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS || "*",
    methods: ["GET", "POST"]
  }
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.static(__dirname));

const DB_PATH = path.join(__dirname, 'users.json');
let users = {};

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
const activeGames = new Map();
const connectedUsers = new Map();

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
        elo: 1200, puzElo: 1200,
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
    const challengeId = crypto.randomBytes(16).toString('hex');
    const challenge = {
      id: challengeId,
      creator: socket.username,
      creatorElo: users[socket.username]?.elo || 1200,
      timeControl: data.timeControl || '10+0',
      createdAt: Date.now()
    };
    activeChallenges.set(challengeId, challenge);
    socket.join(`game_${challengeId}`);
    io.emit('new_challenge', challenge);
  });

  socket.on('join_challenge', (data) => {
    if (!socket.authenticated) return socket.emit('error', 'Debes iniciar sesión');
    const challenge = activeChallenges.get(data.id);
    if (!challenge) return socket.emit('error', 'Reto no encontrado');
    if (challenge.creator === socket.username) return socket.emit('error', 'No puedes unirte a tu propio reto');

    activeChallenges.delete(data.id);
    socket.join(`game_${data.id}`);
    activeGames.set(data.id, {
      white: challenge.creator,
      black: socket.username,
      startTime: Date.now(),
      moves: []
    });
    
    io.emit('lobby_update', Array.from(activeChallenges.values()));
    socket.to(`game_${data.id}`).emit('opponent_joined', { user: socket.username, elo: users[socket.username]?.elo || 1200 });
  });

  socket.on('move', (data) => {
    if (!socket.authenticated) return;
    const game = activeGames.get(data.gameId);
    if (game) game.moves.push({ from: data.from, to: data.to, timestamp: Date.now() });
    socket.to(`game_${data.gameId}`).emit('move', data);
  });

  socket.on('chat_message', (data) => {
    if (!socket.authenticated) return;
    const sanitizedMessage = {
      user: socket.username,
      message: data.message.substring(0, 500),
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
    const game = activeGames.get(data.gameId);
    if (game) {
      if (users[game.white]) users[game.white].stats.wins++;
      if (users[game.black]) users[game.black].stats.losses++;
      saveUsers();
      activeGames.delete(data.gameId);
    }
    socket.to(`game_${data.gameId}`).emit('player_resigned', { user: socket.username });
  });

  socket.on('abort_online_game', (data) => {
    if (!socket.authenticated) return;
    activeGames.delete(data.gameId);
    socket.to(`game_${data.gameId}`).emit('game_aborted', { user: socket.username });
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
});

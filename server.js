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

/* app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "wss:", "https:", "http:"],
      mediaSrc: ["'self'", "https:", "http:"],
      fontSrc: ["'self'", "https:", "http:"],
      workerSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); */
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
    const gameTime = (challenge.time || 10) * 60;

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

  // AI GATEWAY VIA SOCKETS (CORS-FREE)
  socket.on('ai_request', async (data) => {
    const { provider, apiKey, prompt } = data;
    if (!provider || !apiKey || !prompt) {
      return socket.emit('ai_response', { error: 'Missing data' });
    }

    console.log(`🤖 AI Request received from ${socket.username || 'Guest'} via Socket`);
    const result = await processAIRequest(provider, apiKey, prompt);
    socket.emit('ai_response', result);
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

// AI PROXY ENDPOINT - Resolve CORS issues
app.post('/api/ai-proxy', express.json(), async (req, res) => {
  try {
    const { provider, apiKey, prompt } = req.body;

    if (!provider || !apiKey || !prompt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let response;
    const aiData = await processAIRequest(provider, apiKey, prompt);

    if (aiData.error) {
      return res.status(aiData.status || 500).json({ error: aiData.error });
    }

    return res.json({ text: aiData.text });

  } catch (error) {
    console.error('AI Proxy Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Función centralizada para procesar IA (compartida por HTTP y Sockets)
async function processAIRequest(provider, apiKey, prompt) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 segundos máximo

  try {
    console.log(`📡 Llamando a ${provider}...`);
    let response;

    switch (provider) {
      case 'openai':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Eres un maestro de ajedrez experto y didáctico. Explica la posición de forma muy breve (2 frases).' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 150,
            temperature: 0.7
          })
        });

        clearTimeout(timeoutId);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ OpenAI Error: ${response.status}`, errorText);
          return { error: `OpenAI: ${response.status} - Verifica tu clave y saldo.` };
        }

        const openaiData = await response.json();
        return { text: openaiData.choices[0].message.content };

      case 'claude':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 150,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        clearTimeout(timeoutId);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Claude Error: ${response.status}`, errorText);
          return { error: `Claude: ${response.status} - Verifica tu configuración.` };
        }

        const claudeData = await response.json();
        return { text: claudeData.content[0].text };

      case 'perplexity':
        response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'sonar', // Modelo más estable y actual
            messages: [
              { role: 'system', content: 'Eres un maestro de ajedrez experto.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 150
          })
        });

        clearTimeout(timeoutId);
        if (!response.ok) {
          const errorMsg = await response.text();
          let parsedError;
          try { parsedError = JSON.parse(errorMsg); } catch (e) { parsedError = { error: { message: errorMsg } }; }

          const detail = parsedError.error?.message || errorMsg;
          console.error(`❌ Perplexity Error Detail:`, detail);
          return { error: `Perplexity: ${detail}` };
        }

        const perplexityData = await response.json();
        return { text: perplexityData.choices[0].message.content };

      default:
        clearTimeout(timeoutId);
        return { error: 'Proveedor no reconocido' };
    }
  } catch (e) {
    clearTimeout(timeoutId);
    console.error(`❌ Error en el proceso de IA:`, e.message);
    if (e.name === 'AbortError') return { error: 'La IA tardó demasiado en responder (Timeout).' };
    return { error: `Error de conexión: ${e.message}` };
  }
}



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
});

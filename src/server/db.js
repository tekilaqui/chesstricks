const { db } = require('./database');
const User = require('./models/User');

function initDB() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Users Table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                elo INTEGER DEFAULT 600,
                puzzle_elo INTEGER DEFAULT 600,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                wins INTEGER DEFAULT 0,
                losses INTEGER DEFAULT 0,
                draws INTEGER DEFAULT 0
            )`);

            // Games Table
            db.run(`CREATE TABLE IF NOT EXISTS games (
                id TEXT PRIMARY KEY,
                white_user TEXT,
                black_user TEXT,
                fen TEXT,
                white_time INTEGER,
                black_time INTEGER,
                start_time INTEGER,
                last_update INTEGER,
                moves TEXT, -- JSON array
                status TEXT DEFAULT 'active'
            )`);

            // Reset Tokens Table
            db.run(`CREATE TABLE IF NOT EXISTS reset_tokens (
                email TEXT PRIMARY KEY,
                code TEXT NOT NULL,
                expires INTEGER NOT NULL
            )`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

// USER METHODS (Backward compatibility proxying to User model)
const users = {
    get: (username) => User.findByUsername(username).then(u => u ? { ...u, hash: u.password_hash, stats: { wins: u.wins, losses: u.losses, draws: u.draws } } : null),
    getByEmail: (email) => User.findByEmail(email).then(u => u ? { ...u, hash: u.password_hash, stats: { wins: u.wins, losses: u.losses, draws: u.draws } } : null),
    create: (data) => {
        // Compatibility with server.js which hashes before calling db.create (sometimes)
        // Actually server.js currently hashes then calls userDB.create({ username, email, hash, salt, ... })
        return new Promise((resolve, reject) => {
            const stmt = db.prepare(`INSERT INTO users (username, email, password_hash, salt, elo, puzzle_elo) VALUES (?, ?, ?, ?, ?, ?)`);
            stmt.run(data.username, data.email, data.hash || data.password_hash, data.salt, data.elo || 600, data.puzElo || 600, function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
            stmt.finalize();
        });
    },
    updateElo: (username, elo, puzElo) => {
        return User.findByUsername(username).then(u => u ? u.updateElo(elo, puzElo) : null);
    },
    updateStats: (username, result) => {
        return User.findByUsername(username).then(u => u ? u.addResult(result) : null);
    },
    updatePassword: (username, hash, salt) => {
        return new Promise((resolve, reject) => {
            db.run("UPDATE users SET password_hash = ?, salt = ? WHERE username = ?", [hash, salt, username], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },
    getTop10: () => User.getTop(10)
};

// GAME METHODS (Keeping for now)
const games = {
    save: (game) => {
        return new Promise((resolve, reject) => {
            db.get("SELECT id FROM games WHERE id = ?", [game.id], (err, row) => {
                if (err) return reject(err);
                const movesStr = JSON.stringify(game.moves);
                if (row) {
                    db.run(`UPDATE games SET fen = ?, white_time = ?, black_time = ?, last_update = ?, moves = ? WHERE id = ?`,
                        [game.fen, game.whiteTime, game.blackTime, game.lastUpdate, movesStr, game.id], (err) => err ? reject(err) : resolve());
                } else {
                    db.run(`INSERT INTO games (id, white_user, black_user, fen, white_time, black_time, start_time, last_update, moves, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [game.id, game.white, game.black, game.fen, game.whiteTime, game.blackTime, game.startTime, game.lastUpdate, movesStr, 'active'], (err) => err ? reject(err) : resolve());
                }
            });
        });
    },
    getAllActive: () => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM games WHERE status = 'active'", [], (err, rows) => {
                if (err) reject(err);
                else {
                    const gamesMap = {};
                    rows.forEach(r => {
                        gamesMap[r.id] = {
                            id: r.id, white: r.white_user, black: r.black_user, fen: r.fen,
                            whiteTime: r.white_time, blackTime: r.black_time, startTime: r.start_time,
                            lastUpdate: r.last_update, moves: JSON.parse(r.moves), turn: r.fen.split(' ')[1]
                        };
                    });
                    resolve(gamesMap);
                }
            });
        });
    },
    delete: (gameId) => {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM games WHERE id = ?", [gameId], (err) => err ? reject(err) : resolve());
        });
    }
};

const tokens = {
    set: (email, code, expires) => {
        return new Promise((resolve, reject) => {
            db.run("INSERT OR REPLACE INTO reset_tokens (email, code, expires) VALUES (?, ?, ?)", [email, code, expires], (err) => err ? reject(err) : resolve());
        });
    },
    get: (email) => {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM reset_tokens WHERE email = ?", [email], (err, row) => err ? reject(err) : resolve(row));
        });
    },
    delete: (email) => {
        return new Promise((resolve, reject) => {
            db.run("DELETE FROM reset_tokens WHERE email = ?", [email], (err) => err ? reject(err) : resolve());
        });
    }
};

module.exports = { initDB, users, games, tokens, db, User };

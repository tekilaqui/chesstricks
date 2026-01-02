const { db } = require('../database');
const crypto = require('crypto');

class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.password_hash = data.password_hash;
        this.salt = data.salt;
        this.elo = data.elo || 600;
        this.puzzle_elo = data.puzzle_elo || 600;
        this.wins = data.wins || 0;
        this.losses = data.losses || 0;
        this.draws = data.draws || 0;
        this.created_at = data.created_at;
    }

    // --- Static Methods (Collection level) ---

    static findByUsername(username) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
                if (err) return reject(err);
                if (!row) return resolve(null);
                resolve(new User(row));
            });
        });
    }

    static findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
                if (err) return reject(err);
                if (!row) return resolve(null);
                resolve(new User(row));
            });
        });
    }

    static create({ username, email, password }) {
        return new Promise((resolve, reject) => {
            const salt = crypto.randomBytes(32).toString('hex');
            const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

            const stmt = db.prepare(`INSERT INTO users (username, email, password_hash, salt, elo, puzzle_elo) VALUES (?, ?, ?, ?, ?, ?)`);
            stmt.run(username, email, hash, salt, 600, 600, function (err) {
                if (err) return reject(err);
                resolve(new User({
                    id: this.lastID,
                    username,
                    email,
                    password_hash: hash,
                    salt,
                    elo: 600,
                    puzzle_elo: 600
                }));
            });
            stmt.finalize();
        });
    }

    static getTop(limit = 10) {
        return new Promise((resolve, reject) => {
            db.all("SELECT username, elo, wins, losses, draws FROM users ORDER BY elo DESC LIMIT ?", [limit], (err, rows) => {
                if (err) return reject(err);
                resolve(rows.map(r => ({
                    user: r.username,
                    elo: r.elo,
                    stats: { wins: r.wins, losses: r.losses, draws: r.draws }
                })));
            });
        });
    }

    // --- Instance Methods ---

    verifyPassword(password) {
        const hash = crypto.pbkdf2Sync(password, this.salt, 100000, 64, 'sha512').toString('hex');
        return this.password_hash === hash;
    }

    updateElo(newElo, newPuzzleElo) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE users SET elo = ?, puzzle_elo = ? WHERE id = ?", [newElo, newPuzzleElo, this.id], (err) => {
                if (err) return reject(err);
                this.elo = newElo;
                this.puzzle_elo = newPuzzleElo;
                resolve(this);
            });
        });
    }

    addResult(result) { // 1: win, 0: loss, 0.5: draw
        let field = result === 1 ? 'wins' : (result === 0 ? 'losses' : 'draws');
        return new Promise((resolve, reject) => {
            db.run(`UPDATE users SET ${field} = ${field} + 1 WHERE id = ?`, [this.id], (err) => {
                if (err) return reject(err);
                this[field]++;
                resolve(this);
            });
        });
    }

    toJSON() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            elo: this.elo,
            puzzle_elo: this.puzzle_elo,
            stats: {
                wins: this.wins,
                losses: this.losses,
                draws: this.draws
            }
        };
    }
}

module.exports = User;

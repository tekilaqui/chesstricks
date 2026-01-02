const fs = require('fs');
const path = require('path');
const { initDB, users, games } = require('./db');
const { db } = require('./db'); // Direct access if needed for batching

const USERS_PATH = path.join(__dirname, '../../users.json');
const GAMES_PATH = path.join(__dirname, '../../active_games.json');

async function migrate() {
    console.log("🚀 Iniciando migración de JSON a SQLite...");

    await initDB();

    // 1. Migrate Users
    if (fs.existsSync(USERS_PATH)) {
        try {
            const usersData = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
            const userNames = Object.keys(usersData);

            console.log(`📂 Encontrados ${userNames.length} usuarios.`);

            for (const username of userNames) {
                const u = usersData[username];
                try {
                    // Check if exists
                    const exists = await users.get(username);
                    if (!exists) {
                        await users.create({
                            username: username,
                            email: u.email,
                            hash: u.hash,
                            salt: u.salt,
                            elo: u.elo,
                            puzElo: u.puzElo
                            // stats are default 0 in create, we might need to update them if they exist
                        });

                        // Update stats manually if needed
                        if (u.stats) {
                            db.run("UPDATE users SET wins=?, losses=?, draws=? WHERE username=?",
                                [u.stats.wins || 0, u.stats.losses || 0, u.stats.draws || 0, username]);
                        }
                        process.stdout.write('.');
                    }
                } catch (e) {
                    console.error(`\n❌ Error migrando usuario ${username}:`, e.message);
                }
            }
            console.log("\n✅ Usuarios migrados.");
        } catch (e) {
            console.error("Error leyendo users.json", e);
        }
    }

    // 2. Migrate Games
    if (fs.existsSync(GAMES_PATH)) {
        try {
            const gamesData = JSON.parse(fs.readFileSync(GAMES_PATH, 'utf8'));
            const gameIds = Object.keys(gamesData);

            console.log(`📂 Encontrados ${gameIds.length} juegos activos.`);

            for (const gid of gameIds) {
                const g = gamesData[gid];
                try {
                    await games.save(g);
                    process.stdout.write('.');
                } catch (e) {
                    console.error(`\n❌ Error migrando juego ${gid}:`, e.message);
                }
            }
            console.log("\n✅ Juegos migrados.");
        } catch (e) {
            console.error("Error leyendo active_games.json", e);
        }
    }

    console.log("🎉 Migración completada.");
    process.exit(0);
}

migrate();

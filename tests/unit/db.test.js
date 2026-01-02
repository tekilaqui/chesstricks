const { initDB, users, games, tokens } = require('../../../src/server/db');
const path = require('path');
const fs = require('fs');

// Use in-memory database for testing
const TEST_DB_PATH = path.join(__dirname, '../../test-database.sqlite');

describe('Database Module', () => {

    beforeAll(async () => {
        // Initialize test database
        await initDB();
    });

    afterAll(() => {
        // Clean up test database
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }
    });

    describe('Users', () => {
        const testUser = {
            username: 'testuser',
            email: 'test@example.com',
            hash: 'testhash123',
            salt: 'testsalt123',
            elo: 1200,
            puzElo: 1100
        };

        test('should create a new user', async () => {
            const userId = await users.create(testUser);
            expect(userId).toBeDefined();
            expect(typeof userId).toBe('number');
        });

        test('should retrieve user by username', async () => {
            const user = await users.get(testUser.username);
            expect(user).toBeDefined();
            expect(user.username).toBe(testUser.username);
            expect(user.email).toBe(testUser.email);
            expect(user.elo).toBe(testUser.elo);
        });

        test('should retrieve user by email', async () => {
            const user = await users.getByEmail(testUser.email);
            expect(user).toBeDefined();
            expect(user.username).toBe(testUser.username);
        });

        test('should return null for non-existent user', async () => {
            const user = await users.get('nonexistent');
            expect(user).toBeUndefined();
        });

        test('should update user ELO', async () => {
            await users.updateElo(testUser.username, 1300, 1200);
            const user = await users.get(testUser.username);
            expect(user.elo).toBe(1300);
            expect(user.puzzle_elo).toBe(1200);
        });

        test('should update user stats on win', async () => {
            await users.updateStats(testUser.username, 1);
            const user = await users.get(testUser.username);
            expect(user.wins).toBe(1);
        });

        test('should update user stats on loss', async () => {
            await users.updateStats(testUser.username, 0);
            const user = await users.get(testUser.username);
            expect(user.losses).toBe(1);
        });

        test('should update user stats on draw', async () => {
            await users.updateStats(testUser.username, 0.5);
            const user = await users.get(testUser.username);
            expect(user.draws).toBe(1);
        });

        test('should get top 10 users', async () => {
            const top10 = await users.getTop10();
            expect(Array.isArray(top10)).toBe(true);
            expect(top10.length).toBeGreaterThan(0);
            expect(top10.length).toBeLessThanOrEqual(10);
        });
    });

    describe('Games', () => {
        const testGame = {
            id: 'test-game-123',
            white: 'player1',
            black: 'player2',
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            whiteTime: 600,
            blackTime: 600,
            startTime: Date.now(),
            lastUpdate: Date.now(),
            moves: ['e4', 'e5']
        };

        test('should save a new game', async () => {
            await games.save(testGame);
            // No error means success
            expect(true).toBe(true);
        });

        test('should update existing game', async () => {
            const updatedGame = {
                ...testGame,
                moves: ['e4', 'e5', 'Nf3'],
                whiteTime: 590
            };
            await games.save(updatedGame);

            const allGames = await games.getAllActive();
            expect(allGames[testGame.id]).toBeDefined();
            expect(allGames[testGame.id].moves).toHaveLength(3);
        });

        test('should get all active games', async () => {
            const activeGames = await games.getAllActive();
            expect(typeof activeGames).toBe('object');
            expect(activeGames[testGame.id]).toBeDefined();
        });

        test('should delete a game', async () => {
            await games.delete(testGame.id);
            const activeGames = await games.getAllActive();
            expect(activeGames[testGame.id]).toBeUndefined();
        });
    });

    describe('Reset Tokens', () => {
        const testEmail = 'reset@example.com';
        const testCode = '123456';
        const testExpires = Date.now() + 15 * 60 * 1000;

        test('should set a reset token', async () => {
            await tokens.set(testEmail, testCode, testExpires);
            expect(true).toBe(true);
        });

        test('should get a reset token', async () => {
            const token = await tokens.get(testEmail);
            expect(token).toBeDefined();
            expect(token.code).toBe(testCode);
            expect(token.email).toBe(testEmail);
        });

        test('should return null for non-existent token', async () => {
            const token = await tokens.get('nonexistent@example.com');
            expect(token).toBeUndefined();
        });

        test('should delete a reset token', async () => {
            await tokens.delete(testEmail);
            const token = await tokens.get(testEmail);
            expect(token).toBeUndefined();
        });
    });
});

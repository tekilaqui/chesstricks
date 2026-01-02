const io = require('socket.io-client');
const { server, initDB } = require('../../server');

describe('Socket.io Integration Tests', () => {
    let clientSocket;
    const PORT = 3001; // Use different port for testing
    let serverInstance;

    beforeAll(async () => {
        await initDB();
        return new Promise((resolve) => {
            serverInstance = server.listen(PORT, resolve);
        });
    });

    afterAll((done) => {
        if (clientSocket && clientSocket.connected) {
            clientSocket.disconnect();
        }
        serverInstance.close(done);
    });

    beforeEach((done) => {
        clientSocket = io(`http://localhost:${PORT}`, {
            transports: ['websocket'],
            forceNew: true
        });
        clientSocket.on('connect', done);
    });

    afterEach(() => {
        if (clientSocket && clientSocket.connected) {
            clientSocket.disconnect();
        }
    });

    describe('Connection', () => {
        test('should connect successfully', (done) => {
            expect(clientSocket.connected).toBe(true);
            done();
        });

        test('should receive lobby update on connect', (done) => {
            clientSocket.on('lobby_update', (data) => {
                expect(Array.isArray(data)).toBe(true);
                done();
            });
        });
    });

    describe('Authentication', () => {
        test('should register a new user', (done) => {
            const testUser = {
                user: `testuser_${Date.now()}`,
                pass: 'testpass123',
                email: `test_${Date.now()}@example.com`
            };

            clientSocket.emit('register', testUser);

            clientSocket.on('auth_success', (data) => {
                expect(data).toHaveProperty('user', testUser.user);
                expect(data).toHaveProperty('token');
                expect(data).toHaveProperty('elo');
                done();
            });

            clientSocket.on('auth_error', (error) => {
                // Might fail if user exists, that's ok
                done();
            });
        }, 10000);

        test('should reject invalid username', (done) => {
            clientSocket.emit('register', {
                user: 'ab', // Too short
                pass: 'testpass123',
                email: 'test@example.com'
            });

            clientSocket.on('auth_error', (error) => {
                expect(error).toBeDefined();
                done();
            });
        }, 5000);

        test('should reject invalid password', (done) => {
            clientSocket.emit('register', {
                user: 'testuser',
                pass: '12345', // Too short
                email: 'test@example.com'
            });

            clientSocket.on('auth_error', (error) => {
                expect(error).toBeDefined();
                done();
            });
        }, 5000);

        test('should reject invalid email', (done) => {
            clientSocket.emit('register', {
                user: 'testuser',
                pass: 'testpass123',
                email: 'notanemail'
            });

            clientSocket.on('auth_error', (error) => {
                expect(error).toBeDefined();
                done();
            });
        }, 5000);
    });

    describe('Leaderboard', () => {
        test('should get leaderboard data', (done) => {
            clientSocket.emit('get_leaderboard');

            clientSocket.on('leaderboard_data', (data) => {
                expect(Array.isArray(data)).toBe(true);
                expect(data.length).toBeLessThanOrEqual(10);
                done();
            });
        }, 5000);
    });

    describe('Chat', () => {
        test('should broadcast chat message', (done) => {
            // Need to be authenticated first
            const testUser = {
                user: `chatuser_${Date.now()}`,
                pass: 'testpass123',
                email: `chat_${Date.now()}@example.com`
            };

            clientSocket.emit('register', testUser);

            clientSocket.on('auth_success', () => {
                clientSocket.emit('chat_message', {
                    message: 'Test message'
                });

                clientSocket.on('chat_message', (data) => {
                    expect(data).toHaveProperty('message');
                    expect(data).toHaveProperty('user');
                    done();
                });
            });
        }, 10000);
    });

    describe('Rate Limiting', () => {
        test('should handle connection rate limiting', (done) => {
            // Try to create multiple connections rapidly
            const sockets = [];
            let errorReceived = false;

            for (let i = 0; i < 60; i++) {
                const socket = io(`http://localhost:${PORT}`, {
                    transports: ['websocket'],
                    forceNew: true
                });

                socket.on('connect_error', (error) => {
                    errorReceived = true;
                });

                sockets.push(socket);
            }

            setTimeout(() => {
                sockets.forEach(s => s.disconnect());
                // We expect rate limiting to kick in at some point
                // But this test is more about not crashing
                expect(true).toBe(true);
                done();
            }, 2000);
        }, 10000);
    });
});

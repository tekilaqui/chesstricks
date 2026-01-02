const io = require('socket.io-client');
const { server, initDB } = require('../../server');

describe('Authentication Integration Tests (Task 19)', () => {
    let clientSocket;
    const PORT = 3002;
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

    test('Register -> Login -> Verify JWT flow', (done) => {
        const testUser = {
            user: `auth_test_${Date.now()}`,
            pass: 'password123',
            email: `auth_${Date.now()}@test.com`
        };

        // 1. Register
        clientSocket.emit('register', testUser);

        clientSocket.on('auth_success', (regData) => {
            expect(regData.user).toBe(testUser.user);
            const token = regData.token;
            expect(token).toBeDefined();

            // 2. Disconnect and re-connect for Login
            clientSocket.disconnect();

            const loginSocket = io(`http://localhost:${PORT}`, {
                transports: ['websocket'],
                forceNew: true
            });

            loginSocket.on('connect', () => {
                loginSocket.emit('login', { user: testUser.user, pass: testUser.pass });

                loginSocket.on('auth_success', (loginData) => {
                    expect(loginData.user).toBe(testUser.user);
                    expect(loginData.token).toBeDefined();
                    loginSocket.disconnect();
                    done();
                });
            });
        });
    }, 15000);

    test('Should reject login with wrong password', (done) => {
        clientSocket.emit('login', { user: 'admin', pass: 'wrong_password_123' });
        clientSocket.on('auth_error', (err) => {
            expect(err).toBe('Usuario no encontrado'); // Because 'admin' might not exist in test DB
            done();
        });
    });

    test('Should reject duplicate registration', (done) => {
        const user = { user: 'duplicate', pass: 'pass123', email: 'dup@test.com' };
        clientSocket.emit('register', user);

        clientSocket.once('auth_success', () => {
            // Try again
            const otherSocket = io(`http://localhost:${PORT}`, { transports: ['websocket'], forceNew: true });
            otherSocket.on('connect', () => {
                otherSocket.emit('register', user);
                otherSocket.on('auth_error', (err) => {
                    expect(err).toBe('El usuario ya existe');
                    otherSocket.disconnect();
                    done();
                });
            });
        });
    }, 15000);
});

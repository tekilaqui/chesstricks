
// 🔌 SOCKET MODULE
// Handles connection and base events

let socket = null;

export const getSocket = () => {
    return socket;
};

export const initSocket = (callbacks) => {
    // Auto-detect server URL
    const socketUrl = (window.location.protocol === 'file:')
        ? 'http://localhost:3000'
        : window.location.origin;

    const storedToken = localStorage.getItem('chess_token');

    try {
        if (typeof window.io !== 'undefined') {
            socket = window.io(socketUrl, {
                auth: { token: storedToken },
                transports: ['websocket', 'polling']
            });
        } else {
            console.warn("Socket.io not loaded. Offline mode forced.");
            socket = {
                on: function () { },
                emit: function () { },
                connected: false
            };
        }
    } catch (e) {
        console.error("Socket Init Error:", e);
    }

    if (socket) {
        socket.on('connect', () => {
            console.log("✅ Socket conectado:", socket.id);
        });

        socket.on('reconnect', () => {
            console.log("🔄 Reconexión exitosa.");
            if (callbacks.onReconnect) callbacks.onReconnect();
        });

        socket.on('connect_error', (err) => {
            console.error("❌ Error de conexión socket:", err.message);
        });
    }

    return socket;
};

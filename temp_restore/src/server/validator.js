/**
 * 🛡️ VALIDATION MODULE
 */

const VALID_USER_REGEX = /^[a-zA-Z0-9_-]+$/;
const VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FEN_REGEX = /^([rnbqkpRNBQKP1-8]+\/){7}([rnbqkpRNBQKP1-8]+)\s[bw]\s(-|K?Q?k?q?)\s(-|[a-h][36])\s\d+\s\d+$/;

const validator = {
    username: (u) => {
        if (!u || typeof u !== 'string') return { valid: false, error: 'Usuario es requerido' };
        if (u.length < 3) return { valid: false, error: 'Usuario demasiado corto (mínimo 3)' };
        if (u.length > 20) return { valid: false, error: 'Usuario demasiado largo (máximo 20)' };
        if (!VALID_USER_REGEX.test(u)) return { valid: false, error: 'Usuario contiene caracteres inválidos' };
        return { valid: true };
    },

    password: (p) => {
        if (!p || typeof p !== 'string') return { valid: false, error: 'Contraseña es requerida' };
        if (p.length < 6) return { valid: false, error: 'Contraseña demasiado corta (mínimo 6)' };
        if (p.length > 100) return { valid: false, error: 'Contraseña demasiado larga' };
        return { valid: true };
    },

    email: (e) => {
        if (!e || typeof e !== 'string') return { valid: false, error: 'Email es requerido' };
        if (!VALID_EMAIL_REGEX.test(e)) return { valid: false, error: 'Formato de email inválido' };
        return { valid: true };
    },

    move: (m) => {
        // Basic SAN validation (approximate, chess.js does the heavy lifting)
        if (!m || typeof m !== 'string') return { valid: false, error: 'Movimiento inválido' };
        if (m.length < 2 || m.length > 10) return { valid: false, error: 'Formato de movimiento sospechoso' };
        return { valid: true };
    },

    fen: (f) => {
        if (!f || typeof f !== 'string') return { valid: false, error: 'FEN es requerido' };
        if (!FEN_REGEX.test(f)) return { valid: false, error: 'Formato FEN inválido' };
        return { valid: true };
    },

    chatMessage: (msg) => {
        if (!msg || typeof msg !== 'string') return { valid: false, error: 'Mensaje vacío' };
        if (msg.length > 200) return { valid: false, error: 'Mensaje demasiado largo (máximo 200)' };
        return { valid: true };
    }
};

module.exports = validator;

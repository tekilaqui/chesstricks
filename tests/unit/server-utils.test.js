const crypto = require('crypto');

// Import functions to test from server.js
// Since server.js exports app, we need to extract utility functions
// For now, we'll test them by importing or recreating them here

describe('Server Utility Functions', () => {

    describe('sanitize', () => {
        // Recreate function for testing
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

        test('should sanitize HTML special characters', () => {
            expect(sanitize('<script>alert("xss")</script>'))
                .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        });

        test('should handle empty string', () => {
            expect(sanitize('')).toBe('');
        });

        test('should handle non-string input', () => {
            expect(sanitize(null)).toBe('');
            expect(sanitize(undefined)).toBe('');
            expect(sanitize(123)).toBe('');
        });

        test('should not modify safe strings', () => {
            expect(sanitize('Hello World')).toBe('Hello World');
        });
    });

    describe('hashPassword', () => {
        function hashPassword(password, salt) {
            return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
        }

        test('should generate consistent hash for same password and salt', () => {
            const password = 'testpass123';
            const salt = 'testsalt';
            const hash1 = hashPassword(password, salt);
            const hash2 = hashPassword(password, salt);
            expect(hash1).toBe(hash2);
        });

        test('should generate different hashes for different salts', () => {
            const password = 'testpass123';
            const salt1 = 'salt1';
            const salt2 = 'salt2';
            const hash1 = hashPassword(password, salt1);
            const hash2 = hashPassword(password, salt2);
            expect(hash1).not.toBe(hash2);
        });

        test('should generate 128 character hex string', () => {
            const hash = hashPassword('password', 'salt');
            expect(hash).toHaveLength(128); // 64 bytes * 2 (hex)
        });
    });

    describe('validateUsername', () => {
        function validateUsername(username) {
            return username && typeof username === 'string' &&
                username.length >= 3 && username.length <= 20 &&
                /^[a-zA-Z0-9_-]+$/.test(username);
        }

        test('should accept valid usernames', () => {
            expect(validateUsername('user123')).toBe(true);
            expect(validateUsername('test_user')).toBe(true);
            expect(validateUsername('user-name')).toBe(true);
        });

        test('should reject too short usernames', () => {
            expect(validateUsername('ab')).toBe(false);
        });

        test('should reject too long usernames', () => {
            expect(validateUsername('a'.repeat(21))).toBe(false);
        });

        test('should reject invalid characters', () => {
            expect(validateUsername('user@123')).toBe(false);
            expect(validateUsername('user 123')).toBe(false);
            expect(validateUsername('user.name')).toBe(false);
        });

        test('should reject non-string input', () => {
            expect(validateUsername(null)).toBe(false);
            expect(validateUsername(undefined)).toBe(false);
            expect(validateUsername(123)).toBe(false);
        });
    });

    describe('validatePassword', () => {
        function validatePassword(password) {
            return password && typeof password === 'string' &&
                password.length >= 6 && password.length <= 100;
        }

        test('should accept valid passwords', () => {
            expect(validatePassword('pass123')).toBe(true);
            expect(validatePassword('a'.repeat(50))).toBe(true);
        });

        test('should reject too short passwords', () => {
            expect(validatePassword('12345')).toBe(false);
        });

        test('should reject too long passwords', () => {
            expect(validatePassword('a'.repeat(101))).toBe(false);
        });

        test('should reject non-string input', () => {
            expect(validatePassword(null)).toBe(false);
            expect(validatePassword(undefined)).toBe(false);
        });
    });

    describe('validateEmail', () => {
        function validateEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return email && typeof email === 'string' && emailRegex.test(email);
        }

        test('should accept valid emails', () => {
            expect(validateEmail('test@example.com')).toBe(true);
            expect(validateEmail('user.name@domain.co.uk')).toBe(true);
        });

        test('should reject invalid emails', () => {
            expect(validateEmail('notanemail')).toBe(false);
            expect(validateEmail('@example.com')).toBe(false);
            expect(validateEmail('test@')).toBe(false);
            expect(validateEmail('test@domain')).toBe(false);
        });

        test('should reject non-string input', () => {
            expect(validateEmail(null)).toBe(false);
            expect(validateEmail(undefined)).toBe(false);
        });
    });

    describe('calculateElo', () => {
        function calculateElo(currentElo, opponentElo, result) {
            const k = 32;
            const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
            return Math.round(currentElo + k * (result - expectedScore));
        }

        test('should increase ELO on win', () => {
            const newElo = calculateElo(1200, 1200, 1);
            expect(newElo).toBeGreaterThan(1200);
        });

        test('should decrease ELO on loss', () => {
            const newElo = calculateElo(1200, 1200, 0);
            expect(newElo).toBeLessThan(1200);
        });

        test('should not change much on draw', () => {
            const newElo = calculateElo(1200, 1200, 0.5);
            expect(newElo).toBe(1200);
        });

        test('should gain more ELO beating stronger opponent', () => {
            const gainVsWeak = calculateElo(1200, 1000, 1) - 1200;
            const gainVsStrong = calculateElo(1200, 1400, 1) - 1200;
            expect(gainVsStrong).toBeGreaterThan(gainVsWeak);
        });
    });
});

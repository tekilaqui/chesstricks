const validator = require('../../src/server/validator');

describe('Validation Unit Tests (Task 20)', () => {

    describe('Username Validation', () => {
        test('should accept valid username', () => {
            expect(validator.username('chesstricks').valid).toBe(true);
            expect(validator.username('user_123').valid).toBe(true);
        });

        test('should reject too short/long username', () => {
            expect(validator.username('ab').valid).toBe(false);
            expect(validator.username('a'.repeat(21)).valid).toBe(false);
        });

        test('should reject invalid characters', () => {
            expect(validator.username('user!name').valid).toBe(false);
            expect(validator.username('user space').valid).toBe(false);
        });
    });

    describe('Email Validation', () => {
        test('should accept valid email', () => {
            expect(validator.email('test@example.com').valid).toBe(true);
        });

        test('should reject invalid email', () => {
            expect(validator.email('not-an-email').valid).toBe(false);
            expect(validator.email('test@com').valid).toBe(false); // Simple regex might allow this, but let's check
        });
    });

    describe('FEN Validation', () => {
        test('should accept valid FEN', () => {
            const startPos = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            expect(validator.fen(startPos).valid).toBe(true);
        });

        test('should reject malformed FEN', () => {
            expect(validator.fen('invalid fen string').valid).toBe(false);
        });
    });

    describe('Chat Message Validation', () => {
        test('should reject long messages', () => {
            expect(validator.chatMessage('a'.repeat(201)).valid).toBe(false);
        });
    });
});

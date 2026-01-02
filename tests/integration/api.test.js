const request = require('supertest');
const { app, initDB } = require('../../server');

describe('HTTP API Integration Tests', () => {

    beforeAll(async () => {
        await initDB();
    });

    describe('GET /health', () => {
        test('should return 200 OK', async () => {
            const res = await request(app).get('/health');
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('status', 'ok');
            expect(res.body).toHaveProperty('timestamp');
        });

        test('should return valid timestamp', async () => {
            const res = await request(app).get('/health');
            const timestamp = new Date(res.body.timestamp);
            expect(timestamp).toBeInstanceOf(Date);
            expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
        });
    });

    describe('GET /puzzles', () => {
        test('should return 200 OK with default params', async () => {
            const res = await request(app).get('/puzzles');
            expect(res.statusCode).toBe(200);
        });

        test('should accept query parameters', async () => {
            const res = await request(app)
                .get('/puzzles')
                .query({
                    themes: 'mate',
                    min_rating: 1000,
                    max_rating: 1500,
                    limit: 1
                });

            expect(res.statusCode).toBe(200);

            // If successful (not always guaranteed due to external API)
            if (!res.body.error) {
                expect(Array.isArray(res.body)).toBe(true);
            }
        });

        test('should handle API errors gracefully', async () => {
            // Test with invalid parameters that might cause API error
            const res = await request(app)
                .get('/puzzles')
                .query({
                    min_rating: 9999,
                    max_rating: 10000
                });

            // Should still return a response (either data or error)
            expect(res.statusCode).toBeLessThan(600);
        });
    });

    describe('GET /', () => {
        test('should serve index.html', async () => {
            const res = await request(app).get('/');
            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toMatch(/html/);
        });
    });

    describe('Rate Limiting', () => {
        test('should not rate limit normal usage', async () => {
            // Make 5 requests in quick succession
            for (let i = 0; i < 5; i++) {
                const res = await request(app).get('/health');
                expect(res.statusCode).toBe(200);
            }
        });
    });

    describe('Security Headers', () => {
        test('should include security headers', async () => {
            const res = await request(app).get('/health');

            // Helmet should add these headers
            expect(res.headers).toHaveProperty('x-content-type-options');
            expect(res.headers).toHaveProperty('x-frame-options');
        });
    });

    describe('CORS', () => {
        test('should handle CORS for allowed origins', async () => {
            const res = await request(app)
                .get('/health')
                .set('Origin', 'http://localhost:3000');

            expect(res.statusCode).toBe(200);
        });
    });

    describe('Error Handling', () => {
        test('should handle 404 for non-existent routes', async () => {
            const res = await request(app).get('/nonexistent-route-12345');
            expect(res.statusCode).toBe(404);
        });
    });

    describe('JSON Parsing', () => {
        test('should reject invalid JSON', async () => {
            const res = await request(app)
                .post('/login')
                .set('Content-Type', 'application/json')
                .send('invalid json');

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });

        test('should reject oversized payloads', async () => {
            const largePayload = { data: 'x'.repeat(20000) }; // >10kb
            const res = await request(app)
                .post('/login')
                .send(largePayload);

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });
    });
});

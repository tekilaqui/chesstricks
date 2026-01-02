module.exports = {
    testEnvironment: 'node',
    verbose: true,
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/tests/"
    ],
    testTimeout: 15000, // 15 seconds for integration tests
    coverageThreshold: {
        global: {
            branches: 10,
            functions: 10,
            lines: 10,
            statements: 10
        }
    }
};

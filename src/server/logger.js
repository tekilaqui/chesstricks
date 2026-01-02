const pino = require('pino');

const transport = pino.transport({
    targets: [
        {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        },
        {
            target: 'pino/file',
            options: { destination: './logs/app.log', mkdir: true },
            level: 'info',
        }
    ],
});

const logger = pino(
    {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        base: {
            env: process.env.NODE_ENV || 'development'
        },
    },
    transport
);

module.exports = logger;

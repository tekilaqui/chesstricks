// 🎯 SENTRY BROWSER MONITORING
// Initialize Sentry for client-side error tracking

import * as Sentry from '@sentry/browser';

// Check if Sentry DSN is configured (can be set via build-time env or inline)
const SENTRY_DSN = 'YOUR_SENTRY_DSN_HERE'; // Replace with actual DSN or use env variable

if (SENTRY_DSN && SENTRY_DSN !== 'YOUR_SENTRY_DSN_HERE') {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: window.location.hostname === 'localhost' ? 'development' : 'production',
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
            }),
        ],
        // Performance Monitoring
        tracesSampleRate: 0.1, // 10% of transactions
        // Session Replay
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

        // Filter out common non-critical errors
        beforeSend(event, hint) {
            // Don't send errors from browser extensions
            if (event.exception) {
                const error = hint.originalException;
                if (error && error.message && error.message.includes('chrome-extension://')) {
                    return null;
                }
            }
            return event;
        },
    });

    console.log('📊 Sentry browser monitoring initialized');
} else {
    console.log('⚠️ Sentry DSN not configured - client monitoring disabled');
}

// Export Sentry for manual error reporting if needed
export { Sentry };

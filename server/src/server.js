/**
 * src/server.js
 *
 * Responsibility: Bootstrap the application.
 *
 * This is the only file that:
 *   1. Loads environment variables from .env (via dotenv).
 *   2. Imports the configured Express app from app.js.
 *   3. Binds an HTTP server to a port.
 *   4. Handles unrecoverable startup errors cleanly.
 *
 * Keeping these concerns here (and NOT in app.js) means:
 *   - Tests import app.js directly without triggering a real listen() call.
 *   - The startup sequence is explicit and easy to trace.
 *   - Future integrations (e.g. HTTPS, graceful shutdown) live in one place.
 */

import 'dotenv/config'; // Must be the first import so env vars are loaded
                        // before config/index.js reads process.env.

import app from './app.js';
import config from './config/index.js';

const { port, nodeEnv } = config;

const server = app.listen(port, () => {
  console.log(`Server running on port ${port} in [${nodeEnv}] mode`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});

// ── Startup Error Handling ────────────────────────────────────────────────────

/**
 * Handle errors that occur before or during the server's listen call
 * (e.g. EADDRINUSE – port already in use).
 */
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Exiting.`);
  } else {
    console.error('Server startup error:', err);
  }
  process.exit(1);
});

/**
 * Handle unhandled promise rejections globally.
 * Logs the reason and exits so a process manager (e.g. PM2, Docker) can restart.
 */
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  server.close(() => process.exit(1));
});

/**
 * Handle uncaught synchronous exceptions globally.
 */
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});

export default server;

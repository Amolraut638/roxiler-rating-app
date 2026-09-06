/**
 * src/app.js
 *
 * Responsibility: Create and configure the Express application instance.
 *
 * This file is intentionally separated from server.js so that the configured
 * Express app can be imported by integration tests without starting a real HTTP
 * server (supertest pattern).  Nothing in this file starts listening on a port.
 *
 * Middleware registration order matters:
 *   1. Body parsing       – makes req.body available to all subsequent handlers.
 *   2. CORS               – sets cross-origin headers before routes can respond.
 *   3. Routes             – the domain logic of the application.
 *   4. 404 handler        – catches requests that didn't match any route.
 *   5. Error handler      – last in chain; formats all errors uniformly.
 */

import express from 'express';
import cors from 'cors';

import apiRouter from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// ── 1. Body Parsing ───────────────────────────────────────────────────────────
// Parse incoming JSON request bodies into req.body.
app.use(express.json());

// Parse URL-encoded form bodies (e.g. application/x-www-form-urlencoded).
app.use(express.urlencoded({ extended: true }));

// ── 2. CORS ───────────────────────────────────────────────────────────────────
// Allow requests from any origin during development.
// In production, replace the origin option with the specific frontend URL.
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── 3. Routes ─────────────────────────────────────────────────────────────────
// All API routes are prefixed with /api.
app.use('/api', apiRouter);

// ── 4. 404 Handler ────────────────────────────────────────────────────────────
// Catches any request that fell through all registered routes.
app.use(notFound);

// ── 5. Centralised Error Handler ─────────────────────────────────────────────
// Must be registered last. Express recognises it by its four-argument signature.
app.use(errorHandler);

export default app;

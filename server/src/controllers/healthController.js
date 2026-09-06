/**
 * src/controllers/healthController.js
 * Responsibility: Handle HTTP concerns for the health-check route.
 * A controller receives the parsed request from Express, delegates any work
 * (here trivial) to a service, then writes the HTTP response.  Keeping this
 * separate from the route definition means:
 *   - Routes stay thin declarative maps of (verb, path) → handler.
 *   - Controllers can be independently unit-tested by mocking req/res.
 *   - Business logic lives in services, not here.
 */

import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/health
 * Returns a small status payload confirming the API process is alive.
 * Does NOT ping the database yet (that will be added in a later phase).
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const healthCheck = (req, res) => {
  sendSuccess(
    res,
    {
      status: 'ok',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    },
    200,
    'API is running'
  );
};

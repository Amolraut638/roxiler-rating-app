/**
 * src/routes/healthRoutes.js
 * Responsibility: Declaratively map HTTP verbs and paths to controller handlers
 * for the /api/health endpoint.
 * Routes are the entry points of the request lifecycle.  They should contain
 * ONLY middleware chains and controller references — never business logic.
 * Future additions to this router (e.g. a deep-health check that pings the DB)
 * would only add a new route line and a new controller method.
 */

import { Router } from 'express';
import { healthCheck } from '../controllers/healthController.js';

const router = Router();

/**
 * GET /api/health
 * Returns a JSON status payload confirming the API is alive.
 */
router.get('/', healthCheck);

export default router;

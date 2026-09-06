/**
 * src/routes/ownerRoutes.js
 * Responsibility: Declare all Store Owner API routes.
 *
 * Authorization is applied per-route so future routes can have independent
 * role or middleware requirements without affecting each other.
 *
 * Route chain:
 *   GET /api/owner/dashboard
 *     → protect                        (verify JWT, attach req.user)
 *     → authorizeRoles('STORE_OWNER')  (reject USER / ADMIN with 403)
 *     → validateOwnerDashboardQuery    (validate sortBy/sortOrder, 422 on error)
 *     → ownerController.getDashboard
 */

import { Router } from 'express';
import protect from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/authorizeRoles.js';
import { validateOwnerDashboardQuery } from '../validators/ownerValidator.js';
import * as ownerController from '../controllers/ownerController.js';

const router = Router();

// GET /api/owner/dashboard — STORE_OWNER only
router.get(
  '/dashboard',
  protect,
  authorizeRoles('STORE_OWNER'),
  validateOwnerDashboardQuery,
  ownerController.getDashboard
);

export default router;

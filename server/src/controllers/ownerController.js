/**
 * src/controllers/ownerController.js
 * Responsibility: Handle HTTP concerns for Store Owner routes.
 *
 * Rules (same as every other controller in this project):
 *   - No business logic here — delegate everything to ownerService.
 *   - No role checks here — authorizeRoles middleware handles that upstream.
 *   - No Prisma queries here — service layer owns database access.
 */

import * as ownerService from '../services/ownerService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/owner/dashboard
 * Middleware chain: protect → authorizeRoles('STORE_OWNER')
 *                  → validateOwnerDashboardQuery → this handler
 *
 * The owner ID is read exclusively from req.user.userId (set by protect
 * middleware from the JWT). It is never read from req.body or req.query.
 */
export const getDashboard = async (req, res, next) => {
  try {
    const result = await ownerService.getDashboard({
      ownerId:   req.user.userId,    // JWT identity — never from client params
      sortBy:    req.query.sortBy,
      sortOrder: req.query.sortOrder,
    });
    sendSuccess(res, result, 200, 'Store owner dashboard retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

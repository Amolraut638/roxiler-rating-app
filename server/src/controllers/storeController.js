/**
 * src/controllers/storeController.js
 * Responsibility: Handle HTTP concerns for Normal-User store routes.
 *
 * Rules (same as every other controller in this project):
 *   - No business logic here — delegate everything to storeService.
 *   - No role checks here — authorizeRoles middleware handles that upstream.
 *   - No Prisma queries here — service layer owns database access.
 */

import * as storeService from '../services/storeService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/stores
 * Middleware chain: protect → authorizeRoles('USER') → validateListStores → this handler
 *
 * Passes validated query parameters plus the authenticated user's ID
 * (from req.user.userId set by protect middleware) to the service.
 * Never trusts a userId from the query string or request body.
 */
export const listStores = async (req, res, next) => {
  try {
    const result = await storeService.listStores({
      userId: req.user.userId,   // comes from JWT via protect middleware
      ...req.query,
    });
    sendSuccess(res, result, 200, 'Stores retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/stores/:storeId/rating
 * Middleware chain: protect → authorizeRoles('USER') → validateStoreIdParam
 *                  → validateRating → this handler
 *
 * userId comes from req.user (JWT) — never from req.body.
 * Returns 201 on success.
 */
export const submitRating = async (req, res, next) => {
  try {
    const rating = await storeService.submitRating({
      userId:  req.user.userId,
      storeId: req.params.storeId,
      rating:  req.body.rating,
    });
    sendSuccess(res, { rating }, 201, 'Rating submitted successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/stores/:storeId/rating
 * Middleware chain: protect → authorizeRoles('USER') → validateStoreIdParam
 *                  → validateRating → this handler
 *
 * Modifies the existing rating. Does NOT create one if it does not exist.
 * userId comes from req.user (JWT) — never from req.body.
 * Returns 200 on success.
 */
export const updateRating = async (req, res, next) => {
  try {
    const rating = await storeService.updateRating({
      userId:  req.user.userId,
      storeId: req.params.storeId,
      rating:  req.body.rating,
    });
    sendSuccess(res, { rating }, 200, 'Rating updated successfully.');
  } catch (err) {
    next(err);
  }
};


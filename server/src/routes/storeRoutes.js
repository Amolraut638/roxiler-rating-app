/**
 * src/routes/storeRoutes.js
 * Responsibility: Declare all Normal-User store API routes.
 *
 * Authorization is applied per-route (not router.use) so each route
 * can independently specify its required role.
 *
 * Route chains:
 *   GET /api/stores
 *     → protect → authorizeRoles('USER') → validateListStores → listStores
 *
 *   POST /api/stores/:storeId/rating
 *     → protect → authorizeRoles('USER') → validateStoreIdParam
 *     → validateRating → submitRating
 *
 *   PATCH /api/stores/:storeId/rating
 *     → protect → authorizeRoles('USER') → validateStoreIdParam
 *     → validateRating → updateRating
 */

import { Router } from 'express';
import protect from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/authorizeRoles.js';
import {
  validateListStores,
  validateStoreIdParam,
  validateRating,
} from '../validators/storeValidator.js';
import * as storeController from '../controllers/storeController.js';

const router = Router();

// GET /api/stores — list stores with search, sort, pagination, ratings
router.get(
  '/',
  protect,
  authorizeRoles('USER'),
  validateListStores,
  storeController.listStores
);

// POST /api/stores/:storeId/rating — submit a new rating (1–5)
router.post(
  '/:storeId/rating',
  protect,
  authorizeRoles('USER'),
  validateStoreIdParam,
  validateRating,
  storeController.submitRating
);

// PATCH /api/stores/:storeId/rating — modify an existing rating
router.patch(
  '/:storeId/rating',
  protect,
  authorizeRoles('USER'),
  validateStoreIdParam,
  validateRating,
  storeController.updateRating
);

export default router;


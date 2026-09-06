/**
 * src/routes/adminRoutes.js
 * Responsibility: Declare all Admin-only API routes.
 *
 * Every route here must be behind:
 *   protect            → verifies JWT, attaches req.user
 *   authorizeRoles('ADMIN') → rejects non-ADMIN roles with 403
 *
 * Controllers must stay thin; no business logic or role checks inside them.
 */

import { Router } from 'express';
import protect from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/authorizeRoles.js';
import { validateAdminCreateUser, validateListUsers, validateUuidParam, validateAdminCreateStore, validateListStores } from '../validators/adminValidator.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// Apply protect + authorizeRoles to every route in this file at once.
// Any route added below automatically requires a valid ADMIN JWT.
router.use(protect, authorizeRoles('ADMIN'));

// GET /api/admin/dashboard
router.get('/dashboard', adminController.getDashboard);

// POST /api/admin/users  — Admin creates any-role user account
router.post('/users', validateAdminCreateUser, adminController.createUser);

// GET /api/admin/users  — List users with filtering, sorting, pagination
router.get('/users', validateListUsers, adminController.listUsers);

// GET /api/admin/users/:id  — Single user details (+ store ratings for STORE_OWNER)
router.get('/users/:id', validateUuidParam('id'), adminController.getUserById);

// POST /api/admin/stores  — Admin creates a store and assigns it to a STORE_OWNER
router.post('/stores', validateAdminCreateStore, adminController.createStore);

// GET /api/admin/stores  — List stores with filtering, sorting, pagination
router.get('/stores', validateListStores, adminController.listStores);

export default router;

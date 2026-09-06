/**
 * src/routes/authRoutes.js
 * Responsibility: Declare all authentication API routes.
 *
 * Middleware chain per route:
 *   Public routes  → validator → controller
 *   Private routes → protect  → (validator) → controller
 *
 * Endpoints:
 *   POST  /api/auth/register   Register a new user
 *   POST  /api/auth/login      Authenticate and receive a JWT
 *   GET   /api/auth/me         Get own profile (protected)
 *   PATCH /api/auth/password   Update own password (protected)
 */

import { Router } from 'express';
import protect from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin, validatePasswordUpdate } from '../validators/authValidator.js';
import * as authController from '../controllers/authController.js';

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// ── Protected routes (JWT required) ──────────────────────────────────────────

// GET /api/auth/me
router.get('/me', protect, authController.getMe);

// PATCH /api/auth/password
router.patch('/password', protect, validatePasswordUpdate, authController.updatePassword);

export default router;

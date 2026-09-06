/**
 * src/controllers/authController.js
 * Responsibility: Handle HTTP concerns for authentication routes.
 *
 * Controllers must stay thin:
 *   - Read req.body / req.user
 *   - Call the appropriate authService function
 *   - Write the HTTP response via sendSuccess / sendError
 *   - Zero business logic lives here
 */

import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';


/**
 * POST /api/auth/register
 * Registers a new user. Validated by validateRegister middleware upstream.
 */
export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 201, 'Registration successful.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT.
 */
export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 200, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns the authenticated user's own profile.
 * Requires: protect middleware (req.user is populated).
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.userId);
    sendSuccess(res, { user }, 200, 'Profile retrieved.');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/password
 * Updates the authenticated user's password.
 * Requires: protect middleware (req.user is populated).
 */
export const updatePassword = async (req, res, next) => {
  try {
    await authService.updatePassword(req.user.userId, req.body);
    sendSuccess(res, null, 200, 'Password updated successfully.');
  } catch (err) {
    next(err);
  }
};

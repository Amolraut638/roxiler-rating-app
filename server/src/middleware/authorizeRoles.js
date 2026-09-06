/**
 * src/middleware/authorizeRoles.js
 * Responsibility: Role-based authorization — answers "Are you allowed to do this?"
 *
 * Must be used AFTER the protect middleware (authMiddleware.js), which is
 * responsible for authentication. This middleware assumes req.user is already
 * populated by protect().
 *
 * Usage in a route file:
 *   import protect from '../middleware/authMiddleware.js';
 *   import authorizeRoles from '../middleware/authorizeRoles.js';
 *
 *   router.get('/admin/users', protect, authorizeRoles('ADMIN'), controller);
 *   router.post('/ratings',    protect, authorizeRoles('USER'),  controller);
 *
 * Multiple roles can be permitted for a single route:
 *   router.get('/dashboard',   protect, authorizeRoles('ADMIN', 'STORE_OWNER'), controller);
 */

import { sendError } from '../utils/response.js';

/**
 * Factory that returns a middleware allowing only the specified roles.
 *
 * @param {...string} allowedRoles - One or more Role enum values ('ADMIN', 'USER', 'STORE_OWNER').
 * @returns {import('express').RequestHandler}
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // protect() must have run first — req.user is guaranteed if it did.
    if (!req.user) {
      return sendError(res, 'Authentication required before authorization.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}.`,
        403
      );
    }

    next();
  };
};

export default authorizeRoles;

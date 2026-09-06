/**
 * src/middleware/authMiddleware.js
 * Responsibility: Verify the JWT on every protected route.
 *
 * Answers the question: "Who are you?"
 * Does NOT answer: "Are you allowed to do this?" (that is authorizeRoles.js)
 *
 * Flow:
 *   1. Read the Authorization header.
 *   2. Confirm it starts with "Bearer ".
 *   3. Extract and verify the token via the JWT utility.
 *   4. Attach decoded identity (userId, role) to req.user.
 *   5. Call next() so the route handler can proceed.
 *
 * Important:
 *   - No database query is made here. The JWT is self-contained.
 *   - If the token is expired or tampered, verifyToken() throws and we
 *     return 401 — we never call next().
 */

import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

/**
 * Protect a route: require a valid Bearer JWT.
 * Attaches { userId, role } to req.user on success.
 */
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Header must exist and start with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. Please provide a Bearer token.', 401);
    }

    // 2. Extract the token (everything after "Bearer ")
    const token = authHeader.split(' ')[1];

    if (!token) {
      return sendError(res, 'Token is missing from the Authorization header.', 401);
    }

    // 3. Verify the token — throws on expiry or invalid signature
    const decoded = verifyToken(token);

    // 4. Attach minimum identity to the request object
    //    Controllers/services can read req.user.userId and req.user.role.
    req.user = {
      userId: decoded.userId,
      role:   decoded.role,
    };

    // 5. Proceed to the next middleware or controller
    next();
  } catch (err) {
    // jsonwebtoken throws TokenExpiredError or JsonWebTokenError
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Your session has expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid token. Authentication failed.', 401);
  }
};

export default protect;

/**
 * src/utils/jwt.js
 * Responsibility: Sign and verify JSON Web Tokens.
 *
 * Design decisions:
 *   - The signing secret is always read from config, never from a hardcoded
 *     string. If JWT_SECRET is empty the application will throw at startup
 *     rather than silently issuing weak tokens.
 *   - Payload contains ONLY the minimum identity fields required by protected
 *     routes: userId and role.
 *   - Sensitive fields (password, email, address) are deliberately excluded
 *     from the payload because JWTs are base64-encoded, not encrypted.
 *   - verifyToken returns the decoded payload or throws — callers decide how
 *     to handle the error (the auth middleware translates it to a 401).
 */

import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Sign a new JWT containing the minimum identity claims.
 *
 * @param {{ userId: string, role: string }} payload
 * @returns {string} Signed JWT string.
 * @throws {Error} When JWT_SECRET is not configured.
 */
export const generateToken = ({ userId, role }) => {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not configured. Set it in your .env file.');
  }

  return jwt.sign(
    { userId, role },       // Minimum payload — no sensitive personal data
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

/**
 * Verify and decode a JWT string.
 *
 * @param {string} token - The raw JWT string (without "Bearer " prefix).
 * @returns {object} The decoded payload ({ userId, role, iat, exp }).
 * @throws {jwt.JsonWebTokenError}  When the token is malformed or has an invalid signature.
 * @throws {jwt.TokenExpiredError}  When the token has expired.
 */
export const verifyToken = (token) => {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not configured. Set it in your .env file.');
  }

  return jwt.verify(token, config.jwtSecret);
};

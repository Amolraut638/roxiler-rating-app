/**
 * src/validators/authValidator.js
 * Responsibility: Define validation rules for authentication-related endpoints
 * and expose them as reusable Express middleware.
 *
 * Assignment requirements enforced here:
 *   Name    : min 20 chars, max 60 chars
 *   Address : max 400 chars
 *   Password: 8–16 chars, ≥1 uppercase letter, ≥1 special character
 *   Email   : standard email format (RFC 5322 simplified)
 *
 * Strategy: Custom middleware without external libraries.
 * Each exported validator is an array of middleware functions — Express
 * runs them in order. Validation errors are collected and returned as a
 * single 422 response so the client receives all problems at once.
 *
 * Usage in a route file:
 *   import { validateRegister, validateLogin } from '../validators/authValidator.js';
 *   router.post('/register', validateRegister, authController.register);
 */

import { sendError } from '../utils/response.js';

// ─── Primitive validators ───────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// ≥1 uppercase, ≥1 special char, 8–16 chars total
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,16}$/;

/**
 * Run all field checks and collect error messages.
 * Returns an array of error strings (empty if everything is valid).
 */
const collectErrors = (checks) =>
  checks.flatMap((check) => (check.condition ? [check.message] : []));

// ─── Middleware factory ─────────────────────────────────────────────────────

/**
 * Build an Express middleware that validates req.body fields.
 * @param {Function} checkFn - Receives req.body, returns array of error strings.
 */
const makeValidator = (checkFn) => (req, res, next) => {
  const errors = checkFn(req.body);
  if (errors.length > 0) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }
  next();
};

// ─── Exported validators ────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Validates: name, email, address, password
 */
export const validateRegister = makeValidator(({ name, email, address, password }) =>
  collectErrors([
    {
      condition: !name || typeof name !== 'string' || name.trim().length < 20,
      message: 'name must be at least 20 characters.',
    },
    {
      condition: name && name.trim().length > 60,
      message: 'name must not exceed 60 characters.',
    },
    {
      condition: !email || !EMAIL_RE.test(email),
      message: 'email must be a valid email address.',
    },
    {
      condition: !address || typeof address !== 'string' || address.trim().length === 0,
      message: 'address is required.',
    },
    {
      condition: address && address.trim().length > 400,
      message: 'address must not exceed 400 characters.',
    },
    {
      condition: !password || !PASSWORD_RE.test(password),
      message:
        'password must be 8–16 characters and contain at least one uppercase letter and one special character.',
    },
  ])
);

/**
 * POST /api/auth/login
 * Validates: email, password presence only (no format check for security)
 */
export const validateLogin = makeValidator(({ email, password }) =>
  collectErrors([
    {
      condition: !email || !EMAIL_RE.test(email),
      message: 'email must be a valid email address.',
    },
    {
      condition: !password || typeof password !== 'string' || password.length === 0,
      message: 'password is required.',
    },
  ])
);

/**
 * PATCH /api/auth/password
 * Validates: currentPassword, newPassword
 */
export const validatePasswordUpdate = makeValidator(({ currentPassword, newPassword }) =>
  collectErrors([
    {
      condition: !currentPassword || typeof currentPassword !== 'string',
      message: 'currentPassword is required.',
    },
    {
      condition: !newPassword || !PASSWORD_RE.test(newPassword),
      message:
        'newPassword must be 8–16 characters and contain at least one uppercase letter and one special character.',
    },
    {
      condition: currentPassword && newPassword && currentPassword === newPassword,
      message: 'newPassword must be different from currentPassword.',
    },
  ])
);

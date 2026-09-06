/**
 * src/services/authService.js
 * Responsibility: Authentication business logic.
 *
 * Layer rules:
 *   - This file must NOT import express, req, or res.
 *   - All database access goes through the shared Prisma client.
 *   - Passwords are always hashed/compared via the password utility.
 *   - JWTs are always generated via the jwt utility.
 *
 * Implemented:
 *   register      
 *   login         
 *   getMe         
 *   updatePassword 
 */

import prisma from '../config/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Strip the password hash from a Prisma user record before sending it
 * to the client. Called by every function that returns user data.
 *
 * @param {object} user - Raw Prisma user record.
 * @returns {object} Safe user object without the password field.
 */
const safeUser = ({ password: _pw, ...rest }) => rest;

// ─── register ─────────────────────────────────────────────────────────────────

/**
 * Register a new user account.
 *
 * Security invariants:
 *   1. Role is ALWAYS hardcoded to 'USER' — client input cannot escalate
 *      privilege even if it sends { "role": "ADMIN" }.
 *   2. Plain-text password is hashed before the Prisma call; it never
 *      reaches the database.
 *   3. The returned object never contains the password hash.
 *
 * @param {{ name: string, email: string, password: string, address: string }} data
 *   Only these four fields are read; any other fields sent by the client
 *   (including `role`) are silently ignored through destructuring.
 * @returns {Promise<{ token: string, user: object }>}
 * @throws {{ statusCode: 409, message: string }} When the email is already registered.
 */
export const register = async ({ name, email, password, address }) => {
  // 1. Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('An account with this email address already exists.');
    err.statusCode = 409;
    throw err;
  }

  // 2. Hash the plain-text password — hash is all that reaches the DB
  const hashedPassword = await hashPassword(password);

  // 3. Create the user
  //    Role is HARDCODED to 'USER' — destructuring above already dropped any
  //    client-supplied role. We explicitly set it here for clarity.
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      address,
      role: 'USER',
    },
  });

  // 4. Issue a JWT with minimum identity claims
  const token = generateToken({ userId: user.id, role: user.role });

  // 5. Return safe user (no password hash) + token
  return { token, user: safeUser(user) };
};

// ─── login ────────────────────────────────────────────────────────────────────

/**
 * Authenticate a user and return a JWT.
 *
 * Security invariant — generic error message:
 *   Both "email not found" and "wrong password" return the SAME 401 error.
 *   This prevents user-enumeration attacks where an attacker probes which
 *   emails are registered by reading different error messages.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ token: string, user: object }>}
 * @throws {{ statusCode: 401, message: string }} For any authentication failure.
 */
export const login = async ({ email, password }) => {
  // Single generic error used for all auth failures (prevents enumeration)
  const authError = new Error('Invalid email or password.');
  authError.statusCode = 401;

  // 1. Look up the user — use the same error whether found or not
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw authError;

  // 2. Compare the supplied plain-text password against the stored hash
  const passwordMatch = await comparePassword(password, user.password);
  if (!passwordMatch) throw authError;

  // 3. Issue JWT with minimum identity claims
  const token = generateToken({ userId: user.id, role: user.role });

  // 4. Return token + safe user record (password field stripped)
  return { token, user: safeUser(user) };
};

// ─── getMe ───────────────────────────────────────────────────────────────────

/**
 * Return the authenticated user's safe profile.
 *
 * We always re-query the database even though the JWT carries the userId.
 * This detects edge cases where the user account was deleted after the token
 * was issued — rather than serving stale or ghost identity data.
 *
 * @param {string} userId - Comes from req.user.userId (verified JWT claim).
 * @returns {Promise<object>} Safe user record (no password field).
 * @throws {{ statusCode: 401 }} When the user no longer exists.
 */
export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    const err = new Error('User account not found. Please log in again.');
    err.statusCode = 401;
    throw err;
  }

  return safeUser(user);
};

// ─── updatePassword ───────────────────────────────────────────────────────────

/**
 * Change the authenticated user's password after verifying the current one.
 *
 * Security invariants:
 *   1. userId comes from req.user (verified JWT) — never from req.body.
 *   2. currentPassword is verified against the stored hash before any change.
 *   3. newPassword is hashed before reaching the database.
 *   4. Neither password is returned or logged.
 *
 * Token invalidation note:
 *   Existing JWTs remain valid after a password change until their natural
 *   expiry (JWT_EXPIRES_IN). Server-side session invalidation (Redis, etc.)
 *   is out of scope for this assignment. The frontend should discard the
 *   old token and use the session naturally.
 *
 * @param {string} userId - From req.user.userId (verified JWT claim).
 * @param {{ currentPassword: string, newPassword: string }} passwords
 * @returns {Promise<void>}
 * @throws {{ statusCode: 401 }} When the user is not found or currentPassword is wrong.
 */
export const updatePassword = async (userId, { currentPassword, newPassword }) => {
  // 1. Fetch user — must exist (token could be from a deleted account)
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User account not found. Please log in again.');
    err.statusCode = 401;
    throw err;
  }

  // 2. Verify current password against stored hash
  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) {
    const err = new Error('Current password is incorrect.');
    err.statusCode = 401;
    throw err;
  }

  // 3. Hash the new password — plain text must not reach the database
  const hashedNew = await hashPassword(newPassword);

  // 4. Persist the new hash
  await prisma.user.update({
    where: { id: userId },
    data:  { password: hashedNew },
  });

  // Return nothing — the controller sends its own success response
};

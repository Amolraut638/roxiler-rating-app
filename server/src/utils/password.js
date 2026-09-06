/**
 * src/utils/password.js
 * Responsibility: Thin wrapper around bcryptjs for password hashing and comparison.
 *
 * Rules:
 *   - This file ONLY hashes and compares. It has no knowledge of users,
 *     databases, HTTP, or business logic.
 *   - Plain-text passwords must never leave this module — callers pass a
 *     plain-text string in and receive a hash or boolean back.
 *   - Salt rounds (10) is the bcrypt default and a reasonable cost factor for
 *     most deployments. Increase to 12–14 for higher security at the cost of
 *     latency. Do not lower below 10.
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password.
 * @param {string} plainText - The password to hash.
 * @returns {Promise<string>} The bcrypt hash string.
 */
export const hashPassword = (plainText) => bcrypt.hash(plainText, SALT_ROUNDS);

/**
 * Compare a plain-text password against a stored bcrypt hash.
 * @param {string} plainText  - The incoming password attempt.
 * @param {string} hash       - The stored bcrypt hash.
 * @returns {Promise<boolean>} True when the password matches.
 */
export const comparePassword = (plainText, hash) => bcrypt.compare(plainText, hash);

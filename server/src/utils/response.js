/**
 * src/utils/response.js
 *
 * Responsibility: Provide helper functions that build consistent JSON response
 * envelopes across all controllers.  Centralising the shape here means that if
 * the API contract ever changes (e.g. adding a `requestId` field) there is
 * exactly one place to update it.
 *
 * Usage (in a controller):
 *   import { sendSuccess, sendError } from '../utils/response.js';
 *   sendSuccess(res, { user }, 201);
 *   sendError(res, 'Not found', 404);
 */

/**
 * Send a successful JSON response.
 *
 * @param {import('express').Response} res
 * @param {*}      data       - The payload to embed in the `data` field.
 * @param {number} statusCode - HTTP status code (default 200).
 * @param {string} message    - Optional human-readable message.
 */
export const sendSuccess = (res, data = null, statusCode = 200, message = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error JSON response.
 *
 * @param {import('express').Response} res
 * @param {string} message    - Human-readable error description.
 * @param {number} statusCode - HTTP status code (default 500).
 */
export const sendError = (res, message = 'Internal Server Error', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

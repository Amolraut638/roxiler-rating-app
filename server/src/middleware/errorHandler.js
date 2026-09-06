/**
 * src/middleware/errorHandler.js
 *
 * Responsibility: Centralised Express error-handling middleware.
 *
 * Express identifies error-handling middleware by its four-argument signature
 * (err, req, res, next).  This middleware must be registered LAST in app.js so
 * that errors thrown or passed via next(err) from any route or middleware land
 * here and receive a consistent JSON response.
 *
 * Future extensions:
 *   - Map Prisma error codes to HTTP status codes.
 *   - Integrate a logger (e.g. Winston, Pino) to write structured error logs.
 *   - Expose stack traces only in development.
 */

import config from '../config/index.js';

/**
 * Global error handler.
 * @param {Error}                       err
 * @param {import('express').Request}   req
 * @param {import('express').Response}  res
 * @param {import('express').NextFunction} next  - Required by Express even if unused.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  const isDev = config.nodeEnv !== 'production';

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
  });
};

export default errorHandler;

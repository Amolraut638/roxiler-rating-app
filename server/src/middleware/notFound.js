/**
 * src/middleware/notFound.js
 * Responsibility: Catch every request that did not match any registered route
 * and forward a structured 404 error to the centralised error handler.
 * This middleware must be registered AFTER all routes but BEFORE the error
 * handler in app.js.  By using next(err) instead of res.json() directly, the
 * 404 response travels through the same error-handler pipeline, guaranteeing a
 * uniform response envelope across all error scenarios.
 */

/**
 * 404 Not-Found handler.
 * @param {import('express').Request}      req
 * @param {import('express').Response}     res
 * @param {import('express').NextFunction} next
 */
const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

export default notFound;

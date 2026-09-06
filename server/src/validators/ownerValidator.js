/**
 * src/validators/ownerValidator.js
 * Responsibility: Validation rules for Store Owner API requests.
 *
 * Follows the identical pattern used in adminValidator.js and storeValidator.js:
 *   - makeQueryValidator wraps a check function into Express middleware (req.query).
 *   - collectErrors gathers all failing checks into an error array.
 *   - 422 is returned on any validation failure.
 */

const ALLOWED_SORT_FIELDS = ['name', 'averageRating', 'ratingCount', 'createdAt'];
const ALLOWED_SORT_ORDERS = ['asc', 'desc'];

/** Collect all failing checks into an array of error strings. */
const collectErrors = (checks) =>
  checks.flatMap((c) => (c.condition ? [c.message] : []));

/** Wrap a check function into Express middleware operating on req.query. */
const makeQueryValidator = (checkFn) => (req, res, next) => {
  const errors = checkFn(req.query);
  if (errors.length > 0) {
    return res.status(422).json({ success: false, message: 'Validation failed.', errors });
  }
  next();
};

/**
 * GET /api/owner/dashboard
 * Validates optional sortBy and sortOrder query parameters.
 *
 * sortBy whitelist: name | averageRating | ratingCount | createdAt
 *   NOTE: averageRating and ratingCount are derived values — they are not
 *   database columns. Sorting is applied in memory within the service
 *   on the authenticated owner's stores only (safe and efficient).
 *
 * sortOrder: asc | desc
 */
export const validateOwnerDashboardQuery = makeQueryValidator(
  ({ sortBy, sortOrder }) =>
    collectErrors([
      {
        condition: sortBy !== undefined && !ALLOWED_SORT_FIELDS.includes(sortBy),
        message:   `sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}.`,
      },
      {
        condition: sortOrder !== undefined && !ALLOWED_SORT_ORDERS.includes(sortOrder),
        message:   `sortOrder must be one of: ${ALLOWED_SORT_ORDERS.join(', ')}.`,
      },
    ])
);

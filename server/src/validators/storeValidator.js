/**
 * src/validators/storeValidator.js
 * Responsibility: Validation rules for Normal-User store and rating requests.
 *
 * Follows the same pattern as adminValidator.js:
 *   - makeQueryValidator wraps a check function into Express middleware (req.query).
 *   - makeBodyValidator wraps a check function into Express middleware (req.body).
 *   - collectErrors gathers all failing checks into an error array.
 *   - 422 is returned on any validation failure.
 *
 * This file is intentionally kept separate from adminValidator.js so that
 * the Normal-User and Admin validator concerns remain independent.
 */

const ALLOWED_STORE_SORT_FIELDS = ['name', 'address', 'email', 'createdAt', 'averageRating'];
const ALLOWED_SORT_ORDERS       = ['asc', 'desc'];
const MAX_LIMIT                 = 100;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

/** Wrap a check function into Express middleware operating on req.body. */
const makeBodyValidator = (checkFn) => (req, res, next) => {
  const errors = checkFn(req.body);
  if (errors.length > 0) {
    return res.status(422).json({ success: false, message: 'Validation failed.', errors });
  }
  next();
};

// ─── GET /api/stores ──────────────────────────────────────────────────────────

/**
 * GET /api/stores
 * Validates optional query parameters for listing/filtering/sorting/pagination.
 * All parameters are optional — only validate when they are present.
 *
 * Whitelisted sortBy values: name | address | email | createdAt | averageRating
 */
export const validateListStores = makeQueryValidator(
  ({ sortBy, sortOrder, page, limit }) => {
    const parsedPage  = page  !== undefined ? Number(page)  : undefined;
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;

    return collectErrors([
      // sortBy — must be a whitelisted field when supplied
      {
        condition: sortBy !== undefined && !ALLOWED_STORE_SORT_FIELDS.includes(sortBy),
        message:   `sortBy must be one of: ${ALLOWED_STORE_SORT_FIELDS.join(', ')}.`,
      },
      // sortOrder — must be asc or desc when supplied
      {
        condition: sortOrder !== undefined && !ALLOWED_SORT_ORDERS.includes(sortOrder),
        message:   `sortOrder must be one of: ${ALLOWED_SORT_ORDERS.join(', ')}.`,
      },
      // page — must be a positive integer when supplied
      {
        condition: page !== undefined && (!Number.isInteger(parsedPage) || parsedPage < 1),
        message:   'page must be a positive integer.',
      },
      // limit — must be a positive integer ≤ MAX_LIMIT when supplied
      {
        condition: limit !== undefined && (!Number.isInteger(parsedLimit) || parsedLimit < 1),
        message:   'limit must be a positive integer.',
      },
      {
        condition: limit !== undefined && Number.isInteger(parsedLimit) && parsedLimit > MAX_LIMIT,
        message:   `limit must not exceed ${MAX_LIMIT}.`,
      },
    ]);
  }
);

// ─── Rating route validators ──────────────────────────────────────────────────

/**
 * Validate that req.params.storeId is a well-formed UUID.
 * Rejects non-UUID values with 422 before they cause a Prisma error.
 *
 * Used by:  POST /api/stores/:storeId/rating
 *           PATCH /api/stores/:storeId/rating
 */
export const validateStoreIdParam = (req, res, next) => {
  const { storeId } = req.params;
  if (!storeId || !UUID_RE.test(storeId)) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors:  ['storeId must be a valid UUID.'],
    });
  }
  next();
};

/**
 * Validate the rating value in req.body.
 *
 * Rules:
 *   - rating is required
 *   - rating must be a Number (not a string, not null, not a float)
 *   - rating must be an integer (no decimal part)
 *   - rating must be between 1 and 5 inclusive
 *
 * Used by:  POST /api/stores/:storeId/rating
 *           PATCH /api/stores/:storeId/rating
 */
export const validateRating = makeBodyValidator(
  ({ rating }) =>
    collectErrors([
      {
        // rating must be present (not undefined, not null)
        condition: rating === undefined || rating === null,
        message:   'rating is required.',
      },
      {
        // rating must be a number type — reject strings, booleans, objects
        condition: rating !== undefined && rating !== null && typeof rating !== 'number',
        message:   'rating must be a number.',
      },
      {
        // rating must be an integer — reject floats like 3.5
        condition: typeof rating === 'number' && !Number.isInteger(rating),
        message:   'rating must be an integer.',
      },
      {
        // rating must be within 1–5
        condition: typeof rating === 'number' && Number.isInteger(rating) && (rating < 1 || rating > 5),
        message:   'rating must be between 1 and 5.',
      },
    ])
);


/**
 * src/validators/adminValidator.js
 * Responsibility: Validation rules for Admin-only request payloads.
 *
 * Reuses the same primitive patterns established in authValidator.js
 * without duplicating the regex constants — they are redeclared here
 * because each validator file is independently importable.
 *
 * Assignment constraints enforced:
 *   Name     : 20–60 chars
 *   Email    : standard format
 *   Address  : max 400 chars
 *   Password : 8–16 chars, ≥1 uppercase, ≥1 special char
 *   Role     : must be one of ADMIN | USER | STORE_OWNER
 */

const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,16}$/;
const VALID_ROLES = ['ADMIN', 'USER', 'STORE_OWNER'];

/** Collect all failing checks into an array of error strings. */
const collectErrors = (checks) =>
  checks.flatMap((c) => (c.condition ? [c.message] : []));

/** Wrap a check function into Express middleware. */
const makeValidator = (checkFn) => (req, res, next) => {
  const errors = checkFn(req.body);
  if (errors.length > 0) {
    return res.status(422).json({ success: false, message: 'Validation failed.', errors });
  }
  next();
};

/**
 * POST /api/admin/users
 * Validates all user fields plus the role (which public registration does not accept).
 */
export const validateAdminCreateUser = makeValidator(
  ({ name, email, address, password, role }) =>
    collectErrors([
      {
        condition: !name || typeof name !== 'string' || name.trim().length < 20,
        message:   'name must be at least 20 characters.',
      },
      {
        condition: name && name.trim().length > 60,
        message:   'name must not exceed 60 characters.',
      },
      {
        condition: !email || !EMAIL_RE.test(email),
        message:   'email must be a valid email address.',
      },
      {
        condition: !address || typeof address !== 'string' || address.trim().length === 0,
        message:   'address is required.',
      },
      {
        condition: address && address.trim().length > 400,
        message:   'address must not exceed 400 characters.',
      },
      {
        condition: !password || !PASSWORD_RE.test(password),
        message:
          'password must be 8–16 characters and contain at least one uppercase letter and one special character.',
      },
      {
        condition: !role || !VALID_ROLES.includes(role),
        message:   `role must be one of: ${VALID_ROLES.join(', ')}.`,
      },
    ])
);

// ─── Query parameter validator (reads req.query, not req.body) ────────────────

const ALLOWED_SORT_FIELDS = ['name', 'email', 'address', 'role', 'createdAt'];
const ALLOWED_SORT_ORDERS = ['asc', 'desc'];
const MAX_LIMIT = 100;

/** Same as makeValidator but operates on req.query. */
const makeQueryValidator = (checkFn) => (req, res, next) => {
  const errors = checkFn(req.query);
  if (errors.length > 0) {
    return res.status(422).json({ success: false, message: 'Validation failed.', errors });
  }
  next();
};

/**
 * GET /api/admin/users
 * Validates optional query parameters for listing/filtering/sorting/pagination.
 * All parameters are optional — only validate when they are present.
 */
export const validateListUsers = makeQueryValidator(
  ({ role, sortBy, sortOrder, page, limit }) => {
    const parsedPage  = page  !== undefined ? Number(page)  : undefined;
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;

    return collectErrors([
      // role — must be a known enum value when supplied
      {
        condition: role !== undefined && !VALID_ROLES.includes(role),
        message:   `role must be one of: ${VALID_ROLES.join(', ')}.`,
      },
      // sortBy — must be a whitelisted field when supplied
      {
        condition: sortBy !== undefined && !ALLOWED_SORT_FIELDS.includes(sortBy),
        message:   `sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}.`,
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

// ─── Route parameter validator ────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate that req.params.id is a well-formed UUID.
 * Rejects non-UUID values with 422 before they cause an ugly Prisma error.
 *
 * Usage:
 *   router.get('/users/:id', validateUuidParam('id'), adminController.getUserById);
 *
 * @param {string} paramName - The req.params key to validate (default: 'id').
 */
export const validateUuidParam = (paramName = 'id') => (req, res, next) => {
  const value = req.params[paramName];
  if (!value || !UUID_RE.test(value)) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors:  [`${paramName} must be a valid UUID.`],
    });
  }
  next();
};

// ─── Store validators ─────────────────────────────────────────────────────────

/**
 * POST /api/admin/stores
 * Validates: name (20–60), email, address (max 400), ownerId (UUID).
 * NOTE: ownerId existence + role check is done in adminService.createStore,
 *       not here — it requires a database lookup.
 */
export const validateAdminCreateStore = makeValidator(
  ({ name, email, address, ownerId }) =>
    collectErrors([
      {
        condition: !name || typeof name !== 'string' || name.trim().length < 20,
        message:   'name must be at least 20 characters.',
      },
      {
        condition: name && name.trim().length > 60,
        message:   'name must not exceed 60 characters.',
      },
      {
        condition: !email || !EMAIL_RE.test(email),
        message:   'email must be a valid email address.',
      },
      {
        condition: !address || typeof address !== 'string' || address.trim().length === 0,
        message:   'address is required.',
      },
      {
        condition: address && address.trim().length > 400,
        message:   'address must not exceed 400 characters.',
      },
      {
        condition: !ownerId || !UUID_RE.test(ownerId),
        message:   'ownerId must be a valid UUID.',
      },
    ])
);

const STORE_SORT_FIELDS = ['name', 'email', 'address', 'averageRating', 'createdAt'];

/**
 * GET /api/admin/stores
 * Validates optional query params: sortBy, sortOrder, page, limit.
 * Text filter params (name, email, address) are optional strings — no format restriction.
 */
export const validateListStores = makeQueryValidator(
  ({ sortBy, sortOrder, page, limit }) => {
    const parsedPage  = page  !== undefined ? Number(page)  : undefined;
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;

    return collectErrors([
      {
        condition: sortBy    !== undefined && !STORE_SORT_FIELDS.includes(sortBy),
        message:   `sortBy must be one of: ${STORE_SORT_FIELDS.join(', ')}.`,
      },
      {
        condition: sortOrder !== undefined && !ALLOWED_SORT_ORDERS.includes(sortOrder),
        message:   `sortOrder must be one of: ${ALLOWED_SORT_ORDERS.join(', ')}.`,
      },
      {
        condition: page  !== undefined && (!Number.isInteger(parsedPage)  || parsedPage  < 1),
        message:   'page must be a positive integer.',
      },
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


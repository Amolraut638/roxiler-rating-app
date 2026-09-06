/**
 * src/services/adminService.js
 * Responsibility: Business logic for Admin-only operations.
 */

import { Prisma } from '@prisma/client';
import prisma from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';


// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip the password hash before returning user data to any caller. */
const safeUser = ({ password: _pw, ...rest }) => rest;

// ─── getDashboard ─────────────────────────────────────────────────────────────

/**
 * Return real dashboard statistics for the Admin dashboard.
 *
 * All three counts are independent, so they run concurrently via
 * Promise.all — one parallel round-trip to the database instead of three
 * sequential ones.  COUNT is executed by PostgreSQL; no records are
 * fetched into JavaScript.
 *
 * @returns {Promise<{ totalUsers: number, totalStores: number, totalRatings: number }>}
 */
export const getDashboard = async () => {
  const [totalUsers, totalStores, totalRatings] = await Promise.all([
    prisma.user.count(),    // all roles: USER | ADMIN | STORE_OWNER
    prisma.store.count(),   // every Store record
    prisma.rating.count(),  // every Rating record (unique per userId+storeId)
  ]);

  return { totalUsers, totalStores, totalRatings };
};

// ─── createUser ───────────────────────────────────────────────────────────────

/**
 * Create a new user account with an Admin-specified role.
 *
 * Security invariants:
 *   1. The role value is already validated by validateAdminCreateUser upstream;
 *      only ADMIN | USER | STORE_OWNER can reach here.
 *   2. The plain-text password is hashed before the Prisma call.
 *   3. The returned object never contains the password hash.
 *   4. The Admin's own identity comes from req.user (JWT), not from req.body.
 *
 * @param {{ name, email, password, address, role }} data
 * @returns {Promise<object>} Safe user record.
 * @throws {{ statusCode: 409 }} When the email is already registered.
 */
export const createUser = async ({ name, email, password, address, role }) => {
  // 1. Duplicate email check — fast path before hashing
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('User with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  // 2. Hash password — plain text must not reach the database
  const hashedPassword = await hashPassword(password);

  // 3. Create user with the Admin-supplied role
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, address, role },
  });

  // 4. Return safe record — password field stripped
  return safeUser(user);
};

// ─── listUsers ────────────────────────────────────────────────────────────────

/**
 * Prisma select that explicitly excludes the password column.
 * Using select (rather than stripping after the fact) means the hash
 * is never fetched from the database at all.
 */
const USER_SAFE_SELECT = {
  id:        true,
  name:      true,
  email:     true,
  address:   true,
  role:      true,
  createdAt: true,
  updatedAt: true,
};

const DEFAULT_SORT_BY    = 'name';
const DEFAULT_SORT_ORDER = 'asc';
const DEFAULT_PAGE       = 1;
const DEFAULT_LIMIT      = 10;

/**
 * List users with optional filtering, sorting, and pagination.
 *
 * All filtering and sorting is pushed to PostgreSQL via Prisma.
 * Nothing is fetched into JS memory just to filter or sort.
 *
 * @param {object} query - Validated req.query params.
 * @returns {Promise<{ users: object[], pagination: object }>}
 */
export const listUsers = async ({
  name, email, address, role,
  sortBy    = DEFAULT_SORT_BY,
  sortOrder = DEFAULT_SORT_ORDER,
  page      = DEFAULT_PAGE,
  limit     = DEFAULT_LIMIT,
} = {}) => {
  // Coerce page/limit to numbers (they arrive as strings from req.query)
  const pageNum  = Number(page);
  const limitNum = Number(limit);
  const skip     = (pageNum - 1) * limitNum;

  // ── Build the WHERE clause dynamically ────────────────────────────────────
  // Only add a condition when the caller supplied that filter.
  // mode: 'insensitive' maps to PostgreSQL ILIKE — works with the existing indexes.
  const where = {
    ...(name    && { name:    { contains: name,    mode: 'insensitive' } }),
    ...(email   && { email:   { contains: email,   mode: 'insensitive' } }),
    ...(address && { address: { contains: address, mode: 'insensitive' } }),
    ...(role    && { role }),   // exact enum match
  };

  // ── Build the ORDER BY clause ─────────────────────────────────────────────
  const orderBy = { [sortBy]: sortOrder };

  // ── Run count and data queries in parallel ────────────────────────────────
  // Avoids two sequential round-trips; both queries share the same WHERE.
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take:   limitNum,
      select: USER_SAFE_SELECT,
    }),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  return {
    users,
    pagination: { page: pageNum, limit: limitNum, total, totalPages },
  };
};

// ─── getUserById ──────────────────────────────────────────────────────────────

/**
 * Retrieve full details for a single user.
 *
 * For STORE_OWNER accounts, each owned store is included with its
 * averageRating and ratingCount, computed from Rating rows via Prisma
 * aggregate queries — never stored as a column.
 *
 * The role value always comes from the database record, never from the
 * request. This prevents a caller from influencing which data is returned
 * by manipulating headers or body fields.
 *
 * @param {string} userId - Validated UUID from req.params.id.
 * @returns {Promise<object>} Safe user detail object.
 * @throws {{ statusCode: 404 }} When no user with that ID exists.
 */
export const getUserById = async (userId) => {
  // Fetch the user without the password column
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: {
      id:        true,
      name:      true,
      email:     true,
      address:   true,
      role:      true,
      createdAt: true,
      updatedAt: true,
      // Include stores only if they exist; the Prisma select below is always
      // executed but the result is an empty array for non-owners.
      stores: {
        select: {
          id:      true,
          name:    true,
          email:   true,
          address: true,
        },
      },
    },
  });

  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  // For non-STORE_OWNER roles, drop the stores array entirely from the response
  // so the shape stays clean and consistent with the assignment spec.
  if (user.role !== 'STORE_OWNER') {
    const { stores: _stores, ...safeFields } = user;
    return safeFields;
  }

  // ── STORE_OWNER: enrich each store with rating aggregates ────────────────
  // Run one aggregate query per store in parallel — not sequentially.
  // A STORE_OWNER is unlikely to own hundreds of stores, so this is fine
  // without batching. It avoids fetching individual rating rows into JS.
  const enrichedStores = await Promise.all(
    user.stores.map(async (store) => {
      const agg = await prisma.rating.aggregate({
        where:   { storeId: store.id },
        _avg:    { rating: true },
        _count:  { rating: true },
      });

      const avg = agg._avg.rating;

      return {
        id:            store.id,
        name:          store.name,
        // Round to 2 decimal places for a clean response; null when no ratings.
        averageRating: avg !== null ? Math.round(avg * 100) / 100 : null,
        ratingCount:   agg._count.rating,
      };
    })
  );

  return { ...user, stores: enrichedStores };
};

// ─── createStore ──────────────────────────────────────────────────────────────

/**
 * Create a new store and assign it to a verified STORE_OWNER.
 *
 * Security invariants:
 *   1. ownerId is already validated as a UUID by validateAdminCreateStore.
 *   2. The service re-checks existence AND role from the database.
 *      The frontend role label is never trusted.
 *
 * @param {{ name, email, address, ownerId }} data
 * @returns {Promise<object>} The created store record (no rating info yet).
 * @throws {{ statusCode: 404 }} When ownerId does not match any User.
 * @throws {{ statusCode: 422 }} When the user exists but is not STORE_OWNER.
 */
export const createStore = async ({ name, email, address, ownerId }) => {
  // 1. Verify the owner exists
  const owner = await prisma.user.findUnique({
    where:  { id: ownerId },
    select: { id: true, role: true },
  });

  if (!owner) {
    const err = new Error('Owner not found. The provided ownerId does not exist.');
    err.statusCode = 404;
    throw err;
  }

  // 2. Verify the owner is actually a STORE_OWNER
  if (owner.role !== 'STORE_OWNER') {
    const err = new Error(
      `The specified user has role '${owner.role}'. Only STORE_OWNER accounts can own stores.`
    );
    err.statusCode = 422;
    throw err;
  }

  // 3. Create the store
  const store = await prisma.store.create({
    data: { name, email, address, ownerId },
    select: {
      id: true, name: true, email: true,
      address: true, ownerId: true,
      createdAt: true, updatedAt: true,
    },
  });

  return store;
};

// ─── listStores ───────────────────────────────────────────────────────────────

// Map of validated sortBy values to the SQL expression for ORDER BY.
// averageRating is a computed aggregate — it cannot use a simple column reference.
// All other values are whitelisted store columns.
const STORE_SORT_SQL = {
  name:          's.name',
  email:         's.email',
  address:       's.address',
  createdAt:     's."createdAt"',
  averageRating: null, // handled separately below
};

/**
 * List stores with optional text filtering, sorting (including averageRating),
 * and pagination. All filtering/sorting/pagination happens in PostgreSQL.
 *
 * Strategy:
 *   - Text filters and non-aggregate sorts → Prisma ORM (count) + raw SQL (data).
 *   - averageRating sort → raw SQL ORDER BY AVG(r.rating).
 *   - count() uses Prisma ORM (same WHERE conditions expressed as Prisma syntax).
 *   - Promise.all runs count and data queries in parallel.
 *
 * @returns {Promise<{ stores: object[], pagination: object }>}
 */
export const listStores = async ({
  name, email, address,
  sortBy    = 'name',
  sortOrder = 'asc',
  page      = 1,
  limit     = 10,
} = {}) => {
  const pageNum  = Number(page);
  const limitNum = Number(limit);
  const skip     = (pageNum - 1) * limitNum;

  // ── Prisma ORM WHERE — used for the count() query ────────────────────────
  const prismaWhere = {
    ...(name    && { name:    { contains: name,    mode: 'insensitive' } }),
    ...(email   && { email:   { contains: email,   mode: 'insensitive' } }),
    ...(address && { address: { contains: address, mode: 'insensitive' } }),
  };

  // ── Raw SQL WHERE fragments — used for the data query ────────────────────
  // Each Prisma.sql fragment is fully parameterized; no string interpolation.
  const conditions = [
    name    && Prisma.sql`s.name    ILIKE ${'%' + name    + '%'}`,
    email   && Prisma.sql`s.email   ILIKE ${'%' + email   + '%'}`,
    address && Prisma.sql`s.address ILIKE ${'%' + address + '%'}`,
  ].filter(Boolean);

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;

  // ── ORDER BY ─────────────────────────────────────────────────────────────
  // sortBy and sortOrder are validated against a whitelist by the middleware.
  // Prisma.raw() is safe here because only whitelisted values reach this point.
  const orderByClause = sortBy === 'averageRating'
    ? (sortOrder === 'asc'
        ? Prisma.sql`ORDER BY AVG(r.rating) ASC  NULLS LAST`
        : Prisma.sql`ORDER BY AVG(r.rating) DESC NULLS LAST`)
    : Prisma.sql`ORDER BY ${Prisma.raw(STORE_SORT_SQL[sortBy])} ${Prisma.raw(sortOrder.toUpperCase())}`;

  // ── Parallel queries ──────────────────────────────────────────────────────
  const [total, stores] = await Promise.all([
    // Count uses Prisma ORM — clean and type-safe
    prisma.store.count({ where: prismaWhere }),

    // Data uses raw SQL — necessary to compute AVG in SELECT + ORDER BY
    prisma.$queryRaw(Prisma.sql`
      SELECT
        s.id,
        s.name,
        s.email,
        s.address,
        s."ownerId",
        s."createdAt",
        s."updatedAt",
        ROUND(AVG(r.rating)::numeric, 2)        AS "averageRating",
        CAST(COUNT(r.id) AS INTEGER)             AS "ratingCount"
      FROM stores s
      LEFT JOIN ratings r ON r."storeId" = s.id
      ${whereClause}
      GROUP BY s.id
      ${orderByClause}
      LIMIT ${limitNum} OFFSET ${skip}
    `),
  ]);

  return {
    stores,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};


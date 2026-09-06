/**
 * src/services/storeService.js
 * Responsibility: Business logic for Normal-User store operations.
 *
 * Phase 4A: listStores — browse stores with search, sort, pagination,
 *           overall average rating, and the current user's submitted rating.
 *
 * Query strategy (no N+1):
 *   Three parallel queries via Promise.all:
 *     1. prisma.store.count()          — total matching stores (for pagination)
 *     2. prisma.$queryRaw()            — paginated stores with AVG(rating)
 *                                        and current user's rating in one SQL
 *     Both joined in a single SELECT, so no per-store extra round-trips.
 *
 * The raw SQL approach is identical to the existing adminService.listStores
 * pattern, extended with a second LEFT JOIN for the current user's rating.
 */

import { Prisma } from '@prisma/client';
import prisma from '../config/prisma.js';

// ─── Whitelisted sort-column SQL map ─────────────────────────────────────────
// averageRating is a computed aggregate and is handled separately in ORDER BY.
// All other values map directly to a safe, whitelisted SQL column reference.
const STORE_SORT_SQL = {
  name:          's.name',
  email:         's.email',
  address:       's.address',
  createdAt:     's."createdAt"',
  averageRating: null, // handled via AVG(r.rating) in ORDER BY
};

// ─── listStores ───────────────────────────────────────────────────────────────

/**
 * List stores for an authenticated Normal User.
 *
 * Returns paginated stores enriched with:
 *   - averageRating: AVG of all ratings for the store (null if unrated)
 *   - userSubmittedRating: the calling user's own rating (null if not rated)
 *
 * No N+1: a single raw SQL query fetches all stores with both aggregates.
 * The count query runs in parallel for pagination metadata.
 *
 * @param {object} params
 * @param {string}  params.userId    - ID of the currently authenticated user (from req.user)
 * @param {string}  [params.name]    - ILIKE filter on store name
 * @param {string}  [params.address] - ILIKE filter on store address
 * @param {string}  [params.sortBy='name']
 * @param {string}  [params.sortOrder='asc']
 * @param {number}  [params.page=1]
 * @param {number}  [params.limit=10]
 * @returns {Promise<{ stores: object[], pagination: object }>}
 */
export const listStores = async ({
  userId,
  name,
  address,
  sortBy    = 'name',
  sortOrder = 'asc',
  page      = 1,
  limit     = 10,
} = {}) => {
  const pageNum  = Number(page);
  const limitNum = Number(limit);
  const skip     = (pageNum - 1) * limitNum;

  // ── Prisma ORM WHERE — used for the parallel count() query ───────────────
  const prismaWhere = {
    ...(name    && { name:    { contains: name,    mode: 'insensitive' } }),
    ...(address && { address: { contains: address, mode: 'insensitive' } }),
  };

  // ── Raw SQL WHERE fragments — used for the data query ────────────────────
  // Fully parameterized via Prisma.sql — no string interpolation.
  const conditions = [
    name    && Prisma.sql`s.name    ILIKE ${'%' + name    + '%'}`,
    address && Prisma.sql`s.address ILIKE ${'%' + address + '%'}`,
  ].filter(Boolean);

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;

  // ── ORDER BY ─────────────────────────────────────────────────────────────
  // sortBy and sortOrder are already validated by the validator middleware.
  // Prisma.raw() is safe here because only whitelisted values reach this point.
  const orderByClause = sortBy === 'averageRating'
    ? (sortOrder === 'asc'
        ? Prisma.sql`ORDER BY AVG(r.rating) ASC  NULLS LAST`
        : Prisma.sql`ORDER BY AVG(r.rating) DESC NULLS LAST`)
    : Prisma.sql`ORDER BY ${Prisma.raw(STORE_SORT_SQL[sortBy])} ${Prisma.raw(sortOrder.toUpperCase())}`;

  // ── Parallel queries ──────────────────────────────────────────────────────
  // Both queries run concurrently — count for pagination, data for the page.
  const [total, stores] = await Promise.all([

    // 1. Count matching stores (Prisma ORM — clean and type-safe)
    prisma.store.count({ where: prismaWhere }),

    // 2. Fetch paginated stores with:
    //      - AVG(r.rating)        → overall averageRating (all users)
    //      - ur.rating            → this user's own submitted rating
    //    Two LEFT JOINs; no per-store extra queries.
    prisma.$queryRaw(Prisma.sql`
      SELECT
        s.id,
        s.name,
        s.email,
        s.address,
        ROUND(AVG(r.rating)::numeric, 2)   AS "averageRating",
        ur.rating                           AS "userSubmittedRating"
      FROM stores s
      LEFT JOIN ratings r  ON r."storeId" = s.id
      LEFT JOIN ratings ur ON ur."storeId" = s.id
                          AND ur."userId"  = ${userId}
      ${whereClause}
      GROUP BY s.id, ur.rating
      ${orderByClause}
      LIMIT ${limitNum} OFFSET ${skip}
    `),
  ]);

  // PostgreSQL returns averageRating as a Decimal object; coerce to JS number or null.
  const normalizedStores = stores.map((store) => ({
    ...store,
    averageRating:       store.averageRating       != null ? Number(store.averageRating)       : null,
    userSubmittedRating: store.userSubmittedRating  != null ? Number(store.userSubmittedRating) : null,
  }));

  return {
    stores: normalizedStores,
    pagination: {
      page:       pageNum,
      limit:      limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// ─── submitRating ─────────────────────────────────────────────────────────────

/**
 * Submit a new rating (1–5) from the authenticated user for a store.
 *
 * Business rules:
 *   1. The store must exist               → 404 if not
 *   2. The user must not have rated yet   → 409 if duplicate
 *   3. The rating value is already validated by the middleware
 *
 * The database unique constraint (userId + storeId) is a final safety net;
 * we also catch Prisma's P2002 unique-violation error so that concurrent
 * POST requests cannot cause an unhandled 500.
 *
 * @param {{ userId: string, storeId: string, rating: number }} params
 * @returns {Promise<object>} The created Rating record (safe fields only).
 * @throws {{ statusCode: 404 }} Store not found.
 * @throws {{ statusCode: 409 }} Duplicate rating.
 */
export const submitRating = async ({ userId, storeId, rating }) => {
  // 1. Verify the store exists
  const store = await prisma.store.findUnique({
    where:  { id: storeId },
    select: { id: true },
  });

  if (!store) {
    const err = new Error('Store not found.');
    err.statusCode = 404;
    throw err;
  }

  // 2. Check for an existing rating by this user for this store
  const existing = await prisma.rating.findUnique({
    where: { userId_storeId: { userId, storeId } },
  });

  if (existing) {
    const err = new Error(
      'You have already rated this store. Use the update endpoint to modify your rating.'
    );
    err.statusCode = 409;
    throw err;
  }

  // 3. Create the rating — wrap Prisma to handle any race-condition unique violation
  try {
    const created = await prisma.rating.create({
      data: { userId, storeId, rating },
      select: {
        id:        true,
        storeId:   true,
        rating:    true,
        createdAt: true,
      },
    });

    return created;
  } catch (err) {
    // P2002 = Prisma unique constraint violation (race condition safety net)
    if (err.code === 'P2002') {
      const conflict = new Error(
        'You have already rated this store. Use the update endpoint to modify your rating.'
      );
      conflict.statusCode = 409;
      throw conflict;
    }
    throw err; // re-throw anything else to the centralized error handler
  }
};

// ─── updateRating ─────────────────────────────────────────────────────────────

/**
 * Modify the currently authenticated user's existing rating for a store.
 *
 * Business rules:
 *   1. The store must exist                         → 404 if not
 *   2. The user must have an existing rating        → 404 if not found
 *   3. PATCH must NOT create a new rating           → findUnique, not upsert
 *   4. A user cannot modify another user's rating   → userId always from req.user
 *
 * @param {{ userId: string, storeId: string, rating: number }} params
 * @returns {Promise<object>} The updated Rating record.
 * @throws {{ statusCode: 404 }} Store not found or no existing rating.
 */
export const updateRating = async ({ userId, storeId, rating }) => {
  // 1. Verify the store exists
  const store = await prisma.store.findUnique({
    where:  { id: storeId },
    select: { id: true },
  });

  if (!store) {
    const err = new Error('Store not found.');
    err.statusCode = 404;
    throw err;
  }

  // 2. Find the user's existing rating (not another user's)
  const existing = await prisma.rating.findUnique({
    where: { userId_storeId: { userId, storeId } },
  });

  if (!existing) {
    const err = new Error('You have not rated this store yet.');
    err.statusCode = 404;
    throw err;
  }

  // 3. Update the existing rating record — do NOT use upsert
  const updated = await prisma.rating.update({
    where: { id: existing.id },
    data:  { rating },
    select: {
      id:        true,
      storeId:   true,
      rating:    true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
};


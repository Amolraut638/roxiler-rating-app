/**
 * src/services/ownerService.js
 * Responsibility: Business logic for Store Owner dashboard.
 *
 * Phase 4C: getDashboard
 *   - Retrieves all stores owned by the authenticated STORE_OWNER.
 *   - For each store, includes all ratings and the user who submitted each rating.
 *   - Calculates averageRating and ratingCount in the service layer.
 *   - Applies optional in-memory sorting on the owner's own stores.
 *   - No pagination (spec: optional, not required for owner dashboard).
 *
 * Query strategy — NO N+1:
 *   A single Prisma findMany with nested includes:
 *     Store → ratings → user
 *   This produces one SQL JOIN query, not one query per store.
 *
 * Sorting strategy:
 *   averageRating and ratingCount are derived values, not database columns.
 *   Prisma cannot ORDER BY them directly.
 *   Because this query is scoped to ONE owner's stores (not all stores in the
 *   database), sorting the resulting JS array is safe and efficient.
 *   Only database-column sorts (name, createdAt) could use Prisma orderBy —
 *   but we use in-memory for all to keep the logic uniform and simple.
 */

import prisma from '../config/prisma.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Given a rating value, return it as a rounded JS number or null.
 * Defensive in case of unexpected Decimal objects from Prisma/PG.
 */
const toNumberOrNull = (val) => (val != null ? Number(val) : null);

// ─── getDashboard ─────────────────────────────────────────────────────────────

/**
 * Retrieve the Store Owner dashboard data.
 *
 * Returns all stores owned by the authenticated owner, with:
 *   - averageRating (null if no ratings)
 *   - ratingCount
 *   - ratings[] — each with user info (id, name, email, address) and rating value
 *
 * Supports optional sorting on name | averageRating | ratingCount | createdAt.
 * Sorting is applied in-memory on the owner's stores only.
 *
 * @param {object} params
 * @param {string}  params.ownerId    - JWT userId of the authenticated STORE_OWNER
 * @param {string}  [params.sortBy='name']
 * @param {string}  [params.sortOrder='asc']
 * @returns {Promise<{ stores: object[] }>}
 */
export const getDashboard = async ({
  ownerId,
  sortBy    = 'name',
  sortOrder = 'asc',
} = {}) => {

  // ── Single Prisma query — one JOIN, no N+1 ────────────────────────────────
  // findMany scoped to ownerId ensures owner isolation at the query level.
  // Nested includes: ratings → user.
  // select inside includes limits columns to exactly what is needed.
  const rawStores = await prisma.store.findMany({
    where: { ownerId },                   // owner sees ONLY their stores
    select: {
      id:        true,
      name:      true,
      email:     true,
      address:   true,
      createdAt: true,
      ratings: {
        select: {
          rating:    true,
          createdAt: true,
          user: {
            select: {
              id:      true,
              name:    true,
              email:   true,
              address: true,
              // password is intentionally NOT selected
            },
          },
        },
        orderBy: { createdAt: 'asc' },    // ratings inside each store: oldest first
      },
    },
  });

  // ── Compute derived fields per store ─────────────────────────────────────
  const stores = rawStores.map((store) => {
    const ratingCount = store.ratings.length;

    // Calculate average manually from the already-fetched ratings array.
    // This is correct and efficient — the ratings are already in memory.
    const avgRaw = ratingCount > 0
      ? store.ratings.reduce((sum, r) => sum + r.rating, 0) / ratingCount
      : null;

    const averageRating = avgRaw !== null
      ? Math.round(avgRaw * 100) / 100   // 2 decimal places
      : null;

    return {
      id:            store.id,
      name:          store.name,
      email:         store.email,
      address:       store.address,
      averageRating,
      ratingCount,
      ratings: store.ratings.map((r) => ({
        user:      r.user,
        rating:    r.rating,
        createdAt: r.createdAt,
      })),
    };
  });

  // ── In-memory sort on the owner's stores ─────────────────────────────────
  // Safe because this array contains only the current owner's stores,
  // not the entire Store table. The spec explicitly allows this approach.
  const direction = sortOrder === 'desc' ? -1 : 1;

  stores.sort((a, b) => {
    switch (sortBy) {
      case 'averageRating': {
        // Null-safe: null sorts after any number (NULLS LAST semantics)
        if (a.averageRating === null && b.averageRating === null) return 0;
        if (a.averageRating === null) return 1;
        if (b.averageRating === null) return -1;
        return direction * (a.averageRating - b.averageRating);
      }
      case 'ratingCount':
        return direction * (a.ratingCount - b.ratingCount);
      case 'createdAt':
        return direction * (new Date(a.createdAt) - new Date(b.createdAt));
      case 'name':
      default:
        return direction * a.name.localeCompare(b.name);
    }
  });

  return { stores };
};

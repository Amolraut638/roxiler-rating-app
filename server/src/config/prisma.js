/**
 * src/config/prisma.js
 * Responsibility: Export a single shared PrismaClient instance.
 *
 * Why a singleton?
 *   PrismaClient manages a connection pool internally. Instantiating it once
 *   at startup and sharing the instance across all service modules avoids
 *   exhausting the database connection pool under load.
 *
 * Usage:
 *   import prisma from '../config/prisma.js';
 *   const user = await prisma.user.findUnique({ where: { id } });
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  // Log slow queries and errors in development; suppress in production.
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;

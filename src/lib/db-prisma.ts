/**
 * Prisma Client Database Connection
 * 
 * This file provides a singleton Prisma Client instance for database operations.
 * Use this instead of the raw pg Pool for type-safe database queries.
 * 
 * Usage:
 *   import prisma from '@/lib/db-prisma';
 *   const users = await prisma.publisher.findMany();
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
// (Next.js hot reload can create multiple instances)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma Client with logging in development
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });

// In development, store the instance globally to prevent multiple connections
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;


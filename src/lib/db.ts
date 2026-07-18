/**
 * db.ts — Prisma Client singleton
 *
 * LOCAL DEV:  uses SQLite via PrismaBetterSqlite3 adapter (DATABASE_URL=file:./dev.db)
 * PRODUCTION: uses PostgreSQL (Supabase) — set DATABASE_URL to your Supabase connection string
 *
 * The adapter is chosen at runtime based on the DATABASE_URL prefix.
 */

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function buildPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');

  if (isPostgres) {
    // PostgreSQL / Supabase — standard PrismaClient, no adapter needed
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  // SQLite for local development — use the better-sqlite3 adapter
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? (globalThis.__prisma = buildPrismaClient());

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

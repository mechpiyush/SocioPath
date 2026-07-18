import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function buildPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');
  if (process.env.NODE_ENV === 'production' && !isPostgres) {
    throw new Error('DATABASE_URL environment variable is missing or invalid. A PostgreSQL connection string (like Supabase) is required in production.');
  }

  const commonOptions = {
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  };

  if (isPostgres) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require('pg');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require('@prisma/adapter-pg');
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ ...commonOptions, adapter } as any);
  }

  // SQLite for local development
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database('dev.db');
  const adapter = new PrismaBetterSqlite3(db);
  return new PrismaClient({ ...commonOptions, adapter } as any);
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? (globalThis.__prisma = buildPrismaClient());

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

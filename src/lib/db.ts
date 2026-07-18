import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import fs from 'fs';
import path from 'path';

let databaseUrl = 'file:./dev.db';

const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  const tmpDbPath = '/tmp/dev.db';
  const bundledDbPath = path.join(process.cwd(), 'public', 'dev.db');

  if (!fs.existsSync(tmpDbPath)) {
    try {
      if (fs.existsSync(bundledDbPath)) {
        fs.copyFileSync(bundledDbPath, tmpDbPath);
        console.log(`Database template copied from ${bundledDbPath} to ${tmpDbPath}`);
      } else {
        console.warn(`Pre-seeded database template not found at: ${bundledDbPath}`);
      }
    } catch (err) {
      console.error('Error copying SQLite database to /tmp:', err);
    }
  }
  databaseUrl = `file:${tmpDbPath}`;
} else {
  databaseUrl = 'file:./dev.db';
}

const adapter = new PrismaBetterSqlite3({
  url: databaseUrl,
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'pg', 'ioredis', '@prisma/adapter-pg', '@prisma/adapter-better-sqlite3'],
};

export default nextConfig;

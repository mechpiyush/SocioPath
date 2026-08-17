import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'pg', 'ioredis', '@prisma/adapter-pg', '@prisma/adapter-better-sqlite3'],
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
    ],
  },
};

export default nextConfig;

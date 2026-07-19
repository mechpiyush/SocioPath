import { defineConfig } from '@prisma/config';
import process from 'process';

export default defineConfig({
  earlyAccess: true,
  studio: {
    port: 5555,
  },

  datasource: {
    url: process.env.DATABASE_URL,
  },
});

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/database/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
});
import { defineConfig } from 'drizzle-kit';

/**
 * `drizzle-kit generate` only diffs the schema against previous migrations and
 * needs no database, so a placeholder keeps it usable offline and in CI. The
 * commands that do connect (`migrate`, `push`, `studio`) will fail loudly
 * against this placeholder, which is the intended behaviour.
 */
const url = process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/none';

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  strict: true,
  verbose: true,
});

import 'server-only';

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

/**
 * Neon's HTTP driver issues each query as a stateless fetch, which is the right
 * shape for serverless: no connection pool to exhaust and no socket to leak
 * between invocations.
 *
 * Why the client is built eagerly, and why the URL is read straight from
 * `process.env` rather than through `getEnv()`:
 *
 *   `next build` imports every route module to collect page data, so anything
 *   evaluated at module scope runs without production secrets. Validating the
 *   whole environment here would make the build require real credentials.
 *
 *   Constructing eagerly is nonetheless safe because `neon()` only parses the
 *   connection string — it opens no socket until a query runs. The placeholder
 *   below therefore lets the build complete, and any real query against it
 *   fails immediately with an unresolvable host rather than silently working.
 *
 *   `getEnv()` still validates the full environment; it is simply called from
 *   request-time code paths instead of at import.
 */
const PLACEHOLDER_URL = 'postgresql://unset:unset@unset.invalid/unset';

const connectionString = process.env.DATABASE_URL ?? PLACEHOLDER_URL;

if (connectionString === PLACEHOLDER_URL && process.env.NODE_ENV === 'development') {
  console.warn(
    '[db] DATABASE_URL is not set. Copy .env.example to .env.local — any query will fail until you do.',
  );
}

export const db = drizzle(neon(connectionString), { schema });

export { schema };

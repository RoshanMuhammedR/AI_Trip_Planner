import 'server-only';

import { z } from 'zod';

/**
 * Server-side environment contract.
 *
 * The legacy app read `import.meta.env.VITE_*` directly at each call site with
 * no validation and no `.env.example`, so a fresh clone built fine and then
 * failed at runtime with `undefined` keys. Here the shape is declared once and
 * validated on first access, so a misconfigured deployment fails loudly.
 *
 * Nothing in this module may ever be imported from a Client Component — the
 * `server-only` import above turns that into a build error rather than a leak.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required (generate: npx auth secret)'),
  AUTH_GOOGLE_ID: z.string().min(1, 'AUTH_GOOGLE_ID is required'),
  AUTH_GOOGLE_SECRET: z.string().min(1, 'AUTH_GOOGLE_SECRET is required'),

  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, 'GOOGLE_GENERATIVE_AI_API_KEY is required'),

  MAPBOX_ACCESS_TOKEN: z.string().min(1, 'MAPBOX_ACCESS_TOKEN is required'),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/**
 * Parses and caches `process.env`. Called lazily so that merely importing a
 * module that touches env does not crash a build running without secrets.
 */
export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Invalid environment configuration:\n${issues}\n\n` +
        'Copy .env.example to .env.local and fill in the missing values.',
    );
  }

  cached = parsed.data;
  return cached;
}

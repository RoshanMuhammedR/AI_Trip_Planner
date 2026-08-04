import {
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
  uuid,
  jsonb,
  doublePrecision,
  pgEnum,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import type { AdapterAccountType } from 'next-auth/adapters';
import {
  BUDGETS,
  TRAVELERS,
  MAX_TRIP_DAYS,
  MIN_TRIP_DAYS,
  type Itinerary,
} from '@/lib/schemas/trip';

// ---------------------------------------------------------------------------
// Auth.js tables
//
// These replace the previous "session" model entirely, which was an unsigned
// JSON blob in localStorage that any visitor could edit to impersonate another
// user. Sessions now live here and are referenced by an httpOnly cookie.
// ---------------------------------------------------------------------------

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date', withTimezone: true }),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
    index('account_user_id_idx').on(account.userId),
  ],
);

export const sessions = pgTable(
  'session',
  {
    sessionToken: text('sessionToken').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
  },
  (session) => [index('session_user_id_idx').on(session.userId)],
);

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// ---------------------------------------------------------------------------
// Application tables
// ---------------------------------------------------------------------------

export const budgetEnum = pgEnum('budget', BUDGETS);
export const travelersEnum = pgEnum('travelers', TRAVELERS);

/**
 * `generating` exists so a run that dies mid-flight is still represented.
 * The legacy app had no such state: a failed generation left the button
 * spinning forever and wrote `undefined` into the document.
 */
export const tripStatusEnum = pgEnum('trip_status', ['generating', 'ready', 'failed']);

export const trips = pgTable(
  'trip',
  {
    // Random UUID, not `Date.now()`. The old IDs were guessable millisecond
    // timestamps, so any trip could be enumerated by a stranger, and two users
    // generating in the same millisecond overwrote each other.
    id: uuid('id').primaryKey().defaultRandom(),

    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // NULL until the owner explicitly shares. Presence of a slug is the only
    // thing that makes a trip readable by anyone other than its owner.
    shareSlug: text('share_slug').unique(),

    destination: text('destination').notNull(),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),

    days: integer('days').notNull(),
    budget: budgetEnum('budget').notNull(),
    travelers: travelersEnum('travelers').notNull(),

    status: tripStatusEnum('status').notNull().default('generating'),
    /** Human-readable reason, set when status is 'failed'. */
    error: text('error'),

    /** Validated against `itinerarySchema` before it is ever written. */
    itinerary: jsonb('itinerary').$type<Itinerary>(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (trip) => [
    index('trip_user_created_idx').on(trip.userId, trip.createdAt.desc()),
    uniqueIndex('trip_share_slug_idx').on(trip.shareSlug),
    // sql.raw is required here: interpolating the constants directly would emit
    // bind parameters ($1, $2), which are not legal inside a DDL CHECK clause.
    check(
      'trip_days_range',
      sql`${trip.days} BETWEEN ${sql.raw(String(MIN_TRIP_DAYS))} AND ${sql.raw(String(MAX_TRIP_DAYS))}`,
    ),
  ],
);

/**
 * Resolved imagery and coordinates for a place, keyed by a normalised name.
 *
 * The legacy app re-fetched a photo from Google Places inside four separately
 * copy-pasted `useEffect`s, on every render of every card, with the API key in
 * the image URL. Lookups now happen once server-side and are reused forever.
 */
export const placeCache = pgTable(
  'place_cache',
  {
    key: text('key').primaryKey(),
    imageUrl: text('image_url'),
    attribution: text('attribution'),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (place) => [index('place_cache_fetched_at_idx').on(place.fetchedAt)],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  trips: many(trips),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const tripsRelations = relations(trips, ({ one }) => ({
  user: one(users, { fields: [trips.userId], references: [users.id] }),
}));

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;
export type PlaceCacheRow = typeof placeCache.$inferSelect;

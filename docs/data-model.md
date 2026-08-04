# Data model

Schema lives in [`src/server/db/schema.ts`](../src/server/db/schema.ts). Migrations are generated
from it and committed under [`drizzle/`](../drizzle).

## Tables

```
        ┌────────────────────┐
        │  user              │
        │────────────────────│
        │ id           PK    │◀──────┬──────────────┬─────────────────┐
        │ name               │       │              │                 │
        │ email      UNIQUE  │       │              │                 │
        │ emailVerified      │       │              │                 │
        │ image              │       │              │                 │
        │ created_at         │       │              │                 │
        └────────────────────┘       │              │                 │
                                     │              │                 │
   ┌─────────────────┐  ┌────────────┴──────┐  ┌────┴──────────┐      │
   │ account         │  │ session           │  │ trip          │      │
   │─────────────────│  │───────────────────│  │───────────────│      │
   │ provider     PK │  │ sessionToken  PK  │  │ id         PK │      │
   │ providerAcctId  │  │ userId        FK  │  │ user_id    FK │──────┘
   │ userId       FK │  │ expires           │  │ share_slug UQ │
   │ tokens…         │  └───────────────────┘  │ destination   │
   └─────────────────┘                         │ lat, lng      │
                                               │ days   CHECK  │   ┌──────────────────┐
   ┌─────────────────┐                         │ budget  ENUM  │   │ place_cache      │
   │ verificationToken│                        │ travelers ENUM│   │──────────────────│
   │─────────────────│                         │ status  ENUM  │   │ key          PK  │
   │ identifier   PK │                         │ error         │   │ image_url        │
   │ token        PK │                         │ itinerary JSONB   │ attribution      │
   │ expires         │                         │ created_at    │   │ lat, lng         │
   └─────────────────┘                         │ updated_at    │   │ fetched_at       │
                                               └───────────────┘   └──────────────────┘
                                                                    (no FK — global cache)
```

`user`, `account`, `session` and `verificationToken` are the shapes the Auth.js Drizzle adapter
requires. Their mixed-case column names (`userId`, `sessionToken`) are the adapter's convention and
are kept exactly as specified — renaming them breaks the adapter.

## `trip`

The central table.

| Column                | Type          | Notes                                                     |
| --------------------- | ------------- | --------------------------------------------------------- |
| `id`                  | `uuid`        | `gen_random_uuid()`. Not enumerable.                       |
| `user_id`             | `text` FK     | `ON DELETE CASCADE` — deleting a user deletes their trips. |
| `share_slug`          | `text` UNIQUE | `NULL` until the owner opts in to sharing.                 |
| `destination`         | `text`        | Display label, e.g. "Kyoto, Kansai, Japan".                |
| `lat`, `lng`          | `double`      | Destination centre, used to frame the map.                 |
| `days`                | `integer`     | `CHECK (days BETWEEN 1 AND 7)`.                            |
| `budget`              | enum          | `cheap` / `moderate` / `luxury`.                           |
| `travelers`           | enum          | `solo` / `couple` / `family` / `friends`.                  |
| `status`              | enum          | `generating` / `ready` / `failed`.                         |
| `error`               | `text`        | Human-readable reason, set when `status = 'failed'`.       |
| `itinerary`           | `jsonb`       | Validated against `itinerarySchema` before every write.    |
| `created_at`          | `timestamptz` | —                                                          |
| `updated_at`          | `timestamptz` | Maintained by Drizzle's `$onUpdate`.                       |

### Indexes

- `trip_user_created_idx` on `(user_id, created_at DESC)` — serves the dashboard query directly.
- `trip_share_slug_idx` — unique, serves public share lookups.

### Why the itinerary is `jsonb` rather than normalised tables

An itinerary is written once and read whole. Nothing queries "all activities rated above 4.5 across
all trips", and nothing updates a single stop in isolation. Normalising into `day` and `activity`
tables would add two joins to the only read path that exists, in exchange for query capability the
product does not use.

The safety that normalisation would provide is instead supplied by `itinerarySchema`: the JSON is
parsed and validated by Zod on the way in (`completeTrip`) and typed on the way out via
`jsonb().$type<Itinerary>()`. If the shape ever needs to be queried relationally, the data is
already uniform enough to migrate out.

### Editing the itinerary in place

Because the whole itinerary is one column, an edit that reads it into JavaScript, changes a day and
writes it back will silently discard a concurrent edit — both requests read version N, both write
N+1, one change is lost.

All three edit paths (regenerate a day, reorder a stop, remove a stop) therefore write with a single
atomic statement rather than a read-modify-write:

```sql
UPDATE trip
SET    itinerary = jsonb_set(itinerary, '{days,<idx>}', $newDay::jsonb, false)
WHERE  id = $1 AND user_id = $2;
```

The day fragment is validated against `daySchema` before it is written, so a malformed document
cannot be produced even though the whole itinerary is not re-parsed on the way out. See
`replaceItineraryDay` and `replaceDayActivities` in `src/server/trips/mutations.ts`.

Note that `dayIndex` is the **array position**, not the human day number. The caller resolves it
from the loaded document (`days.findIndex(d => d.day === n)`) rather than assuming `day - 1`, so a
gap in numbering cannot cause the wrong day to be overwritten.

## `place_cache`

Global, not per-user, and intentionally has no foreign key. Keyed by a normalised
`"place name|destination"` string so `"Colosseum "` and `"colosseum"` share one entry, while
`"Central Park"` in New York and in another city do not collide.

Negative results are cached too — `image_url IS NULL` means "looked up, no article found", which
stops a hotel with no Wikipedia page from being re-queried on every page view.

## Invariants

These are enforced somewhere concrete rather than by convention:

| Invariant                                          | Enforced by                                              |
| -------------------------------------------------- | -------------------------------------------------------- |
| A trip belongs to exactly one existing user         | FK with `ON DELETE CASCADE`                               |
| Trip length is 1–7 days                             | `CHECK` constraint **and** `tripInputSchema`              |
| A stored itinerary matches the schema               | `itinerarySchema.parse()` inside `completeTrip`           |
| An edited day matches the schema                    | `daySchema.parse()` inside `replaceItineraryDay`          |
| A day always keeps at least one stop                | `MIN_ACTIVITIES_PER_DAY`, used by `daySchema` *and* the remove action |
| Concurrent edits do not clobber each other          | `jsonb_set` in one statement, never read-modify-write     |
| Only the owner can read or modify a private trip    | Ownership predicate in the SQL `WHERE` of every query     |
| A shared trip is complete                           | `getSharedTrip` filters `status = 'ready'`                |
| Share slugs are unique                              | `UNIQUE` constraint + unique index                        |
| A user id is never taken from the client            | Mutations accept `userId` only from `requireUser()`/`auth()` |

## Migrations

```bash
npm run db:generate    # diff schema.ts against drizzle/ and emit SQL
npm run db:migrate     # apply pending migrations
npm run db:push        # push directly, development only
npm run db:studio      # browse data
```

Generated SQL is committed. Review it before applying — `drizzle-kit` cannot always infer intent
(a column rename looks identical to a drop plus an add).

One trap worth knowing, because it bit during development: interpolating a value into a `sql`
template emits a **bind parameter**, which is not legal in DDL. The `CHECK` constraint therefore
uses `sql.raw`:

```ts
check(
  'trip_days_range',
  sql`${trip.days} BETWEEN ${sql.raw(String(MIN_TRIP_DAYS))} AND ${sql.raw(String(MAX_TRIP_DAYS))}`,
);
```

Without `sql.raw` this generates `CHECK ("trip"."days" BETWEEN $1 AND $2)` and the migration fails.

## Legacy data

The previous Firestore `AITrips` collection was **not** migrated. Its documents carried an
unverified, client-supplied `userEmail` with no authenticated identity to map onto real accounts,
and its `tripData` had no guaranteed shape. Starting clean was the deliberate choice.

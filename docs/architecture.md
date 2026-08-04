# Architecture

## Shape of the system

One Next.js application deployed to Vercel, talking to three managed services and two keyless public
APIs.

```
                      ┌──────────────────────────────────────────┐
   Browser            │            Vercel (Next.js 16)           │
 ┌──────────┐         │                                          │
 │  React   │  HTTPS  │  ┌────────────┐   ┌───────────────────┐  │
 │  client  │────────▶│  │  proxy.ts  │──▶│  Server Components│  │
 │components│         │  │ CSP nonce  │   │  Route Handlers   │  │
 └──────────┘         │  │ redirects  │   │  Server Actions   │  │
      ▲               │  └────────────┘   └─────────┬─────────┘  │
      │               │                             │            │
      │  streamed     │                   ┌─────────┴─────────┐  │
      │  itinerary    │                   │  src/server/*     │  │
      └───────────────│───────────────────│  (server-only)    │  │
                      │                   └─────────┬─────────┘  │
                      └─────────────────────────────┼────────────┘
                                                    │
                 ┌──────────────┬───────────────────┼────────────────────────────────┐
                 ▼              ▼                   ▼                                ▼
         ┌──────────────┐ ┌──────────────┐  ┌──────────────────┐          ┌──────────────┐
         │ Neon Postgres│ │ Gemini 2.5   │  │ Mapbox Search Box│          │  Wikimedia   │
         │ trips, users │ │ Flash        │  │ suggest/retrieve │          │  (imagery)   │
         │ sessions     │ │ generate +   │  │ session-billed   │          │  keyless     │
         │ place_cache  │ │ day re-rolls │  │                  │          │              │
         └──────────────┘ └──────────────┘  └──────────────────┘          └──────────────┘
```

The browser talks to exactly two external origins directly: the app itself, and
`tiles.openfreemap.org` for map tiles. Everything else — Gemini, Mapbox, Wikimedia — is reached
server-side. This is enforced, not merely intended: the `connect-src` directive in the CSP lists
only those two, so adding a client-side call to a third-party API would fail at runtime rather than
quietly shipping a credential to the browser.

## Trust boundaries

There is one boundary that matters: **the network edge between the browser and the server.**

Everything on the browser side is attacker-controlled. Request bodies, headers, cookies, and the
values of any form field can be anything. The application therefore treats the following as
untrusted at all times:

- request bodies (validated by Zod at every route handler and server action)
- any user identifier supplied by a client (never used — see below)
- search parameters, path parameters, and redirect targets (`isSafePath` on the sign-in page)

The single most important rule in the codebase: **the owning user id always comes from the server
session, never from the request.** Every query and mutation on trips takes `userId` as an argument
and filters on it in SQL:

```ts
// src/server/trips/queries.ts
export async function getOwnedTrip(tripId: string, userId: string) {
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)));
  return trip ?? null;
}
```

There is deliberately no `getTripById(id)` that returns a row without an ownership predicate. The
legacy application called exactly that shape of function and rendered whatever came back, which is
what made every trip in the system readable by anyone.

### Why `src/server/` is a real boundary

Every module under `src/server/` begins with `import 'server-only'`. If a client component ever
imports one — directly or transitively — the build fails. This turns "don't leak the database client
into the browser" from a code-review convention into a compiler-enforced rule.

### Middleware is not a security boundary

`src/proxy.ts` redirects signed-out visitors away from `/plan` and `/trips`, but it only checks that
a session **cookie exists** — not that it is valid, because validating means a database round trip
on every request including static assets.

Real enforcement is `requireUser()` in `src/server/auth-guards.ts`, called by every protected page,
plus the ownership predicate in every query. If the proxy were deleted entirely, nothing would
become accessible; the only change would be that signed-out users reach a redirect one step later.

## Request lifecycle: generating a trip

This is the path that carries all the cost and all the risk, so it is worth following end to end.

```
POST /api/trips/generate
  │
  ├─ 1. auth()                          → 401 if no valid session
  │       Session is looked up in Postgres from an httpOnly cookie.
  │
  ├─ 2. tripInputSchema.safeParse(body)  → 400 with field errors
  │       Destination, coordinates, 1–7 days, budget enum, travellers enum.
  │
  ├─ 3. createPendingTrip()             → row with status='generating'
  │       Reserved BEFORE the model call, so a crash mid-generation is
  │       still visible to the user instead of vanishing.
  │
  ├─ 4. streamItinerary()               → streamObject(), Zod-constrained
  │       Response returns immediately with X-Trip-Id header;
  │       body streams partial JSON as the model writes.
  │
  └─ 5. on completion (detached)
          ├─ success → itinerarySchema.parse() → status='ready'
          └─ failure → status='failed', error message stored
```

Step 5 runs detached from the response, so a client that disconnects mid-stream still gets its trip
persisted or marked failed.

### There is no rate limit here

Steps 1 and 2 are the only gates. An earlier revision placed rate limiting between step 2 and step
3; it has been removed, so a signed-in user can call this endpoint as often as they like and consume
the Gemini free-tier quota. See [decisions.md §7](decisions.md#7-rate-limiting-removed) for the
reasoning and for what reinstating it would involve.

### Editing an existing trip

Three further paths mutate an itinerary after it exists:

```
POST /api/trips/[id]/days/[day]/regenerate     route handler (calls Gemini)
     auth → getOwnedTrip → collect other days' places as an exclusion list
          → generateObject(daySchema) → jsonb_set that one day → revalidate

moveActivityAction / removeActivityAction      server actions (no model call)
     requireUser → getOwnedTrip → permute or filter the day's activities
          → daySchema.parse → jsonb_set → revalidate
```

Both shapes load the trip through `getOwnedTrip(id, userId)`, so a caller cannot edit a trip they do
not own by supplying its id. Writes use `jsonb_set` rather than read-modify-write, so two concurrent
edits cannot silently discard one another.

### Failure is a modelled state

`trips.status` is an enum of `generating | ready | failed`, and `trips.error` holds a human-readable
reason. The trip page renders a different screen for each. The legacy app modelled only success, so
a failure and a slow response were indistinguishable — both looked like a spinner that never
stopped.

## Rendering strategy

| Route          | Rendering | Notes                                                  |
| -------------- | --------- | ------------------------------------------------------ |
| `/`            | Dynamic   | Auth-aware header; content itself is static            |
| `/signin`      | Dynamic   | Redirects if already signed in                         |
| `/plan`        | Dynamic   | Session-gated; form is a client component              |
| `/trips`       | Dynamic   | Per-user data, with `loading.tsx` streaming a skeleton |
| `/trips/[id]`  | Dynamic   | Per-user data                                          |
| `/t/[slug]`    | Dynamic   | Public but per-trip                                    |
| `/opengraph-image`, `/icon.svg`, `/robots.txt`, `/sitemap.xml` | Static | Prerendered |

Every page is dynamic because the header resolves the session. The auth-dependent portion is wrapped
in `<Suspense>` so the static shell streams immediately rather than blocking on a database round
trip.

The map is loaded through `next/dynamic` with `ssr: false`. MapLibre touches `window` at import time
and is a large dependency; keeping it out of the server render also keeps it out of the initial JS
payload for every page that does not show a map.

## Data flow for images

The legacy app fetched a photo from Google Places inside four separately copy-pasted `useEffect`
hooks, one per card component, on every mount — with the API key in the image URL.

Now:

1. The trip page loads the itinerary from Postgres.
2. `enrichItinerary()` collects **every** place name across all days and hotels into one array.
3. `resolvePlaceImages()` reads the `place_cache` table for all of them in a single query.
4. Only cache misses hit Wikimedia, in parallel, bounded to 40 lookups.
5. Results — including negatives — are written back to `place_cache`.

A place is therefore looked up once, ever. Places with no article (most hotels) resolve to `null`,
and the UI renders a CSS gradient with the place's initial rather than downloading anything.

## Security summary

| Concern            | Control                                                                      |
| ------------------ | ---------------------------------------------------------------------------- |
| Secret exposure    | No secret is `NEXT_PUBLIC_`; `server-only` makes leakage a build error        |
| Session forgery    | Opaque httpOnly cookie → session row in Postgres; no client-readable identity |
| Broken access control | Ownership predicate in SQL on every read and write                        |
| Enumeration        | UUID v4 trip ids; ~40 bits of entropy in share slugs                          |
| Cost abuse         | **Not mitigated.** Authentication is the only gate on the generate endpoint   |
| XSS                | Per-request nonce CSP with `strict-dynamic`; no `unsafe-inline` for scripts   |
| Clickjacking       | `frame-ancestors 'none'` + `X-Frame-Options: DENY`                            |
| Transport          | HSTS with preload                                                             |
| Open redirect      | Sign-in `callbackUrl` restricted to same-site paths                           |
| Data exposure via share | Slug-gated and additionally filtered to `status = 'ready'`               |

### CSP specifics

The CSP is emitted per-request from `src/proxy.ts` rather than statically from `next.config.ts`,
because each response needs a fresh nonce. Next.js detects the nonce in the request header and
stamps it onto the scripts it renders.

Two directives are deliberately looser than the rest:

- `style-src` allows `'unsafe-inline'`. Tailwind's runtime style injection and MapLibre's inline
  canvas styles both require it. Style injection is a materially lower risk than script injection,
  which stays nonce-locked.
- `script-src` adds `'unsafe-eval'` **in development only**, for React Refresh.

`next-themes` injects an inline anti-flash script; it receives the same nonce, threaded from the
proxy through `headers()` in the root layout. Without that, `strict-dynamic` would block it and
reintroduce a flash of the wrong theme.

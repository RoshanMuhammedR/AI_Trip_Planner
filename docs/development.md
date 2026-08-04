# Development

## Setup

**Prerequisites:** Node 20.9 or newer, npm 10+.

```bash
npm install
cp .env.example .env.local
```

Then fill in `.env.local`. The application refuses to run with missing configuration rather than
failing later with `undefined` — see `src/lib/env.ts`.

### Getting each credential

**Neon (`DATABASE_URL`).** Create a project at [console.neon.tech](https://console.neon.tech). Copy
the **pooled** connection string — the host contains `-pooler`. The non-pooled string works but
exhausts connections under load.

**Auth secret (`AUTH_SECRET`).**

```bash
npx auth secret
```

**Google OAuth (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`).** In
[Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create
OAuth client ID → Web application. Add as an authorised redirect URI:

```
http://localhost:3000/api/auth/callback/google
```

**Gemini (`GOOGLE_GENERATIVE_AI_API_KEY`).** [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
The free tier is sufficient for development.

**Mapbox (`MAPBOX_ACCESS_TOKEN`).** [console.mapbox.com](https://console.mapbox.com) → Tokens.
Prefer a **secret** token (`sk.…`) — it is only ever used server-side, and a secret token cannot be
replayed from a browser even if it somehow escaped. Search Box is a metered product, so check the
current free-tier allowance before deploying anything public.

### Create the schema

```bash
npm run db:push     # development: push schema.ts straight to the database
npm run db:studio   # optional: browse the result
```

For anything shared, generate a migration instead:

```bash
npm run db:generate
npm run db:migrate
```

### Run

```bash
npm run dev
```

---

## Project layout

```
src/
├── app/                          # routing only — thin, delegates to features/ and server/
│   ├── layout.tsx                # providers, header/footer, CSP nonce plumbing
│   ├── page.tsx                  # landing
│   ├── signin/                   # sign-in
│   ├── plan/                     # generation wizard
│   ├── trips/                    # dashboard, [id] detail, loading skeleton
│   ├── t/[slug]/                 # public shared view
│   └── api/                      # route handlers
├── components/
│   ├── ui/                       # primitives: button, card, input, badge, skeleton
│   └── *.tsx                     # header, footer, theme toggle, user menu
├── features/                     # feature-scoped, may be client or server
│   ├── trip-form/                # destination search, choice cards, streaming preview
│   ├── itinerary/                # day list, hotel card, share toggle, trip view
│   └── map/                      # MapLibre component
├── server/                       # server-only, enforced by `import 'server-only'`
│   ├── ai/                       # prompt.ts, generate.ts, regenerate.ts
│   ├── db/                       # schema.ts, index.ts
│   ├── places/                   # mapbox.ts, images.ts (Wikimedia), popular.ts
│   ├── trips/                    # queries.ts, mutations.ts, enrich.ts
│   ├── actions/                  # server actions (auth, trips, itinerary)
│   └── auth.ts, auth-guards.ts
├── lib/                          # isomorphic
│   ├── schemas/trip.ts           # the shared Zod contract
│   ├── env.ts                    # validated environment (server-only)
│   ├── slug.ts, utils.ts
└── proxy.ts                      # CSP nonce + signed-out redirects
```

### Where does new code go?

| If it…                                       | Put it in                    |
| -------------------------------------------- | ---------------------------- |
| touches a secret, the database, or an API key | `src/server/`                |
| is a route, layout, or metadata file          | `src/app/`                   |
| is UI belonging to one feature                | `src/features/<feature>/`    |
| is UI reused across features                  | `src/components/`            |
| is a pure helper or a schema                  | `src/lib/`                   |

`src/app/` should stay thin. A page's job is to resolve identity, fetch data, and hand it to a
component.

---

## Conventions

**Server-only enforcement.** Every module under `src/server/` starts with `import 'server-only'`.
Importing one from a client component is a build error. Do not remove it to "make an import work" —
that import is the bug.

**Identity comes from the session.** Never accept a user id, email, or ownership claim from a
request body. Use `requireUser()` in pages and `auth()` in route handlers, then pass the id down.

**Ownership lives in the query.** Functions that read or write a trip take `userId` and filter on it
in SQL. Do not add a helper that fetches a trip without an ownership predicate.

**Validate at every boundary.** Route handlers and server actions `safeParse` their input. The
itinerary is validated again immediately before it is persisted, even though the model was already
constrained by the same schema.

**One schema, three consumers.** `src/lib/schemas/trip.ts` is the contract shared by the form, the
model and the database. Change it there and all three follow.

**Types over assertions.** `strict` and `noUncheckedIndexedAccess` are on. `array[0]` is
`T | undefined` — handle it rather than reaching for `!`, except where an adjacent length check
makes it provably safe.

---

## Common tasks

### Change what the model produces

1. Edit `itinerarySchema` in `src/lib/schemas/trip.ts`.
2. Update the editorial instructions in `src/server/ai/prompt.ts` if the change needs explaining
   rather than just declaring.
3. Update the components that render the new field.

Do not add JSON formatting instructions to the prompt — the schema handles shape. The prompt is for
intent: what makes an itinerary good.

Keep the schema flat and fully required. Gemini's structured output supports a subset of JSON Schema
and degrades on union- and optional-heavy shapes.

### Change the trip length limit

`MIN_TRIP_DAYS` / `MAX_TRIP_DAYS` in `src/lib/schemas/trip.ts`. They feed the Zod schema, the form
bounds, the prompt, and the database `CHECK` constraint — the last of which needs a migration:

```bash
npm run db:generate && npm run db:migrate
```

If you raise the maximum above 7, add matching `--day-N` tokens in `globals.css`; `dayColorVar`
wraps around otherwise.

### Change the curated destinations

`CURATED` in `src/server/places/popular.ts`. It is editorial content, not data — twelve places
chosen by hand for geographic spread. Coordinates are the city centre and are used directly, so
picking one skips the Mapbox round trip entirely. Images resolve through the existing
`resolvePlaceImages` cache; nothing else needs changing.

### Work on destination search

`src/server/places/mapbox.ts` wraps the two Search Box endpoints. The thing to be careful about is
the **session token**: Mapbox bills a session, not a request, so all the suggest calls for one piece
of typing must share a token, and the token must be rotated after `/retrieve` (which closes the
session). That rotation lives in `choose()` in `destination-search.tsx`. Breaking it does not break
the feature — it just quietly multiplies the bill.

### Add an itinerary edit operation

Follow `moveActivityAction` in `src/server/actions/itinerary.ts`: `requireUser()`, load through
`getOwnedTrip`, build the new day, then write via `replaceDayActivities`. Never read the itinerary,
mutate it in JavaScript and write the whole document back — that loses concurrent edits. The
`jsonb_set` helpers in `mutations.ts` exist for this reason.

### Add a UI primitive

Follow the existing pattern in `src/components/ui/` — `cva` for variants, `cn` for merging, tokens
rather than literal colours. Never hardcode a hex value; the legacy app scattered `#2C3E50` across
five files and broke its own hover states doing it.

---

## Verification

```bash
npm run format:check
npm run typecheck
npm run lint
npm run build
```

CI runs exactly these, plus a check that no server secret was inlined into the client bundle.

To run that check by hand:

```bash
grep -r "GOOGLE_GENERATIVE_AI\|AUTH_SECRET" .next/static/   # must find nothing
```

### Manual smoke test

Worth doing after any change to auth, search, generation, editing, or sharing:

1. Sign in with Google. In devtools, confirm the session cookie is `HttpOnly` and that
   `localStorage` is empty.
2. Focus the destination field without typing. Recent destinations (if you have any) and the popular
   photo grid should appear. "Surprise me" should fill the field.
3. Type `cambridge`. Rows should carry a flag, a region and a type badge. In the network tab, all
   the suggest calls for that word should share **one** `session=` value; after selecting, the next
   search should use a different one.
4. Generate a trip. Days should appear progressively, not all at once at the end.
5. Press **Regenerate** on one day. Only that day should change, and the new stops should not repeat
   places already scheduled on the other days.
6. Reorder two stops, then reload — the order persists. Remove a stop, then reload — it stays
   removed. Try to remove the only stop in a day — refused with a message.
7. Open the trip URL in a private window. Expect a 404.
8. Toggle sharing on, copy the link, open it in the private window. Expect a read-only view with
   **no edit controls**.
9. Toggle sharing off. The link should 404 again.
10. Temporarily set an invalid Gemini key. The UI should show an error with a way to retry, the trip
    row should be `failed`, and nothing should hang.

---

## Known gaps

**No automated tests.** This was a deliberate scope decision, and the itinerary-editing work widened
the untested surface: there are now three mutation paths and an owner check on the regenerate route
with nothing asserting them. CI verifies that the project compiles, typechecks, lints and does not
leak secrets — nothing verifies behaviour.

Highest-value additions, in order: ownership predicates in `queries.ts` and on the regenerate route;
the reorder/remove index bounds; `generateShareSlug` entropy; and one end-to-end pass over sign-in →
generate → edit → share.

Everything in `src/server/` is a plain function taking its dependencies as arguments, so unit tests
need no special harness.

**No rate limiting.** `/api/trips/generate` and the day-regeneration route are gated by
authentication alone. A signed-in user can consume the Gemini free-tier quota. Deliberate — see
[decisions.md §7](decisions.md#7-rate-limiting-removed).

**Generation is not resumable.** If the serverless function is killed mid-stream, the trip is marked
`failed` and must be regenerated. Making it resumable would need a job queue.

**No itinerary editing.** Trips are regenerate-or-delete. Per-day regeneration is the obvious next
feature.

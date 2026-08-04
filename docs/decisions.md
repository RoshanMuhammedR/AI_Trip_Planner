# Design decisions

Each entry records the problem, what was chosen, what was rejected, and the cost of the choice.

---

## 1. Next.js App Router instead of keeping the Vite SPA

**Problem.** The legacy app was a static single-page app with no server. Its three worst problems —
a billable API key in the public bundle, a forgeable `localStorage` session, and unauthorised access
to every trip — are all consequences of that. None of them can be fixed by refactoring client code,
because a static site has nowhere trustworthy to put a secret or a decision.

**Chosen.** Next.js 16 App Router on Vercel. Route handlers, server components and server actions
give a trusted execution context on the same free deployment, with no second service to run.

**Rejected.**

- _Vite SPA + a separate API service_ (Hono on Cloudflare Workers, or Express on Fly). Works, but
  means two deployments, two configs, CORS, and duplicated types across a network boundary.
- _Keeping the SPA and proxying only the Gemini call._ Fixes one problem and leaves the other two.

**Cost.** Every page is server-rendered on demand rather than served as a static file, because the
header resolves the session. Mitigated by wrapping the auth-dependent part in `<Suspense>`.

---

## 2. Neon Postgres + Drizzle instead of Firestore

**Problem.** The legacy data layer was a single Firestore collection with no schema, written
directly from the browser. Documents carried a client-supplied `userEmail` field, and no security
rules existed in the repository.

**Chosen.** Neon serverless Postgres with Drizzle ORM. A typed schema, real foreign keys with
`ON DELETE CASCADE`, a `CHECK` constraint on trip length, and versioned SQL migrations committed to
git.

**Rejected.**

- _Supabase._ Very capable, and row-level security is a genuinely nice fit for this problem. Ruled
  out because free projects pause after roughly a week of inactivity and need a manual restore — bad
  for a portfolio piece someone may open once a month. Neon auto-suspends but auto-resumes.
- _Firestore done properly_ (Firebase Auth + committed rules). Lowest migration risk and the
  existing data would have survived. Rejected because it keeps a schemaless store for data that is
  strongly relational, and loses migrations entirely.
- _SQLite/Turso._ Fine technically; Postgres is the more transferable choice.

**Cost.** Cold starts. Neon suspends an idle database and the first query after that pays roughly
half a second to wake it.

---

## 3. Auth.js with database sessions instead of localStorage

**Problem.** The legacy "session" was `localStorage.setItem('user', JSON.stringify(profile))`. There
was no token, no signature and no expiry. Typing one line in devtools made you anyone. Because
Firebase Auth was never used, Firestore had no `request.auth` to write a rule against, so the
database could not have enforced anything even if rules had existed.

**Chosen.** Auth.js v5 with the Google provider and the Drizzle adapter, using
`session: { strategy: 'database' }`. The OAuth exchange completes server-side; the browser holds
only an opaque httpOnly cookie.

**Rejected.**

- _JWT session strategy._ One less database round trip per request, but a signed token stays valid
  until it expires. Database sessions mean sign-out and account deletion revoke access immediately.
- _Rolling a session table by hand._ More code, no benefit, and easy to get subtly wrong.

**Cost.** A database read per authenticated request. Acceptable at this scale, and the reason the
header's auth section is Suspense-wrapped.

---

## 4. Structured output instead of regex-scraping the model reply

**Problem.** The legacy prompt described the desired JSON in prose and the response was parsed with
`result.match(/```json([\s\S]*?)```/)`. On a parse failure the function returned `undefined`, the
caller did not check, and `undefined` was written to Firestore.

**Chosen.** `streamObject()` from the Vercel AI SDK, constrained by `itinerarySchema` (Zod). The
model is bound to the schema during generation, and the finished object is validated again before
it is persisted.

**Rejected.**

- _`responseMimeType: 'application/json'` alone._ Guarantees JSON, not the right shape.
- _Retry-on-parse-failure loops._ Treats the symptom and doubles the cost of a bad response.

**Cost.** Gemini's structured output supports a subset of JSON Schema, so the schema stays flat and
fully required — no unions, no optionals. Where a value may genuinely be unknown, the prompt asks
for a descriptive string ("Free") rather than allowing null.

---

## 5. Streaming the itinerary instead of awaiting it

**Problem.** Generation takes 20–60 seconds. The legacy UI showed one spinning icon for the entire
duration, and because the error path was unguarded, a failure left it spinning forever.

**Chosen.** Stream partial objects to the client with `useObject`, rendering each day as the model
finishes writing it, with skeletons standing in for days not yet written.

**Cost.** The client renders deeply-partial objects, so the streaming view treats every field as
possibly-absent. That is why `streaming-preview.tsx` narrows types defensively rather than trusting
the schema — during streaming, the schema is not yet satisfied.

---

## 6. Dropping Google Places entirely

**Problem.** The legacy app used Google Places for three things — destination autocomplete, place
lookup and photos — and leaked the key in all three. `PHOTO_REF_URL` appended it in plaintext to
every `<img src>`, putting it in the DOM, in network logs and in referrer headers.

**Chosen.** Remove the dependency:

| Need                  | Replacement                                        | Key needed         |
| --------------------- | -------------------------------------------------- | ------------------ |
| Destination search    | Mapbox Search Box API, server-proxied (decision 13) | yes, server-side   |
| Coordinates per place | Returned by Gemini, Zod-validated                   | no                 |
| Place imagery         | Wikimedia Commons, cached in Postgres               | no                 |
| Map tiles             | OpenFreeMap vector tiles                            | no                 |

**Rejected.**

- _Keeping Places but proxying it server-side._ Fixes the leak, keeps the metered cost, and Google's
  March 2025 pricing changes made the photo SKU the expensive one.
- _Unsplash for imagery._ Free tier is 50 requests/hour in demo mode — too low, and
  `source.unsplash.com` is deprecated.

**Cost.** Coverage is worse for hotels, which rarely have Wikipedia articles. Those fall back to a
generated gradient. Attribution for OSM and Wikimedia is a licence requirement and appears in the
footer, in the picker, and on the map.

---

## 7. Rate limiting, removed

An earlier revision of this project shipped two layers of rate limiting: Upstash sliding windows
(5/hour/user, 20/day/IP) plus a durable per-user daily counter in Postgres. **All of it has been
removed.**

**Removed.** `src/server/ratelimit.ts`, the `generation_quota` table (dropped in migration
`0001_drop_generation_quota`), the `UPSTASH_*` environment pair, and the `@upstash/ratelimit` and
`@upstash/redis` dependencies.

**Why.** It was judged not worth the operating cost for a personal project: a third service to
provision and keep credentials for, an extra table, an extra write on every generation, and a
failure mode (Redis unreachable) to reason about — all to guard a free-tier quota that a single
user is unlikely to exhaust in normal use.

**What this costs.** `/api/trips/generate` is now gated by **authentication alone**. A signed-in
user can hold down the generate button and consume the Gemini free-tier allowance. Nothing in the
application prevents that.

The residual protections are worth being precise about, because they are not nothing:

- The endpoint requires a valid database-backed session, so it is not reachable anonymously.
- The Gemini key remains server-side, so it cannot be extracted and used elsewhere.
- Sign-up is Google OAuth, so creating many accounts is not free of friction.

If abuse ever becomes real, the cheapest reinstatement is the Postgres daily counter alone — it was
a single table and one atomic upsert, and it needed no external service. Redis was the part that
carried the operational weight.

---

## 8. Private by default, with opt-in share links

**Problem.** Legacy trip ids were `Date.now().toString()`. They were guessable, they collided if two
users generated in the same millisecond, and `ViewTrip` performed no ownership check — so every trip
was readable by anyone.

**Chosen.** UUID v4 primary keys. Trips are owner-only. Sharing is a per-trip toggle that mints a
slug like `sunlit-rome-k4m9p2q7` — a readable prefix for humans plus roughly 40 bits of entropy. The
shared query additionally filters `status = 'ready'`, so a half-generated or failed itinerary can
never be exposed through a link shared earlier.

Turning sharing off and on again reuses the existing slug, so a link already sent to a travelling
companion keeps working.

---

## 9. Native radio inputs for the card pickers

**Problem.** The legacy budget and companion pickers were `<div onClick={...}>` with no `role`, no
`tabIndex`, no key handler and no focus style. They were invisible to assistive technology and
unusable with a keyboard.

**Chosen.** Visually-hidden native `<input type="radio">` inside a `<label>`, with the card styling
driven by `:checked` and `has-[:focus-visible]`. Arrow-key navigation, roving focus, the accessible
name and the checked state all come from the platform.

**Rejected.** A custom `role="radiogroup"` implementation — more code to reimplement behaviour the
browser already provides correctly.

---

## 10. CSS-driven theme toggle

**Problem.** The usual `useEffect(() => setMounted(true), [])` pattern exists because the server
cannot know the visitor's theme. It also trips React's `set-state-in-effect` rule and causes a
visible flip after hydration.

**Chosen.** Render both icons and let CSS choose:
`<Sun className="dark:hidden" /><Moon className="hidden dark:block" />`. The correct icon is painted
immediately, with no state and no effect.

---

## 11. Essentials-only tooling, no test suites (yet)

**Chosen for this pass.** TypeScript `strict`, ESLint 9 with `next/core-web-vitals` and
`next/typescript`, Prettier, and CI running format-check, typecheck, lint and build. CI also greps
the built client bundle for server secrets, which turns the single most important security property
into an automated check.

**Deliberately deferred.** Vitest and Playwright. This was an explicit scope decision, and it is the
main known gap: nothing asserts behaviour, so the streaming pipeline and the ownership predicates
are unguarded against regression.

Adding them later is cheap by construction — everything in `src/server/` is a plain exported
function taking its dependencies as arguments, so unit tests need no framework harness. The obvious
first targets are `getOwnedTrip` / `getSharedTrip` (ownership), `generateShareSlug` (entropy and
slugification), `consumeDailyQuota` (atomicity), and one Playwright pass over sign-in → generate →
share.

---

## 13. Mapbox Search Box for destination search, replacing Photon

**Problem.** Photon (Komoot's OpenStreetMap geocoder) was keyless and free, which is why it was
chosen first. In use it had four problems, and they compounded:

- It is a community service with no SLA, sitting in the request path of the **first field of the
  only flow in the app**. If Photon is slow or down, nobody can start a trip.
- Its ranking carries no popularity signal, so "Paris" could surface the wrong Paris.
- No typo tolerance — "barcelna" returned nothing useful.
- It returned a name and coordinates and nothing else, which is why the old picker could only render
  a flat text list. The UI was limited by the data source.

**Chosen.** Mapbox Search Box API, proxied through `/api/places/search` and `/api/places/retrieve`.

**Why Search Box rather than Mapbox Geocoding v6.** Search Box bills per **session**, not per
request. Typing "barcelona" fires roughly eight debounced suggest calls; sharing one session token
across them makes the whole interaction — including the final `retrieve` — a single billable unit.
Geocoding v6 has no session concept and would bill nine separate requests for the same typing. The
session token is generated client-side (`crypto.randomUUID()`), held for the duration of one search,
and **rotated after each `retrieve`**, because a retrieve closes the session. Getting that rotation
wrong is the one way to make this expensive, so it is commented at the call site.

The API is two-step by design: `/suggest` returns names and context but deliberately no geometry;
`/retrieve` resolves coordinates for the one result the user actually picked. That is also why the
picker has a brief resolving state between selection and commit.

**Cost, stated plainly.** This reintroduces a metered, keyed dependency, which the previous revision
had deliberately eliminated. The project now has two billable credentials rather than one. Both are
server-side — `MAPBOX_ACCESS_TOKEN` has no `NEXT_PUBLIC_` prefix and `src/server/places/mapbox.ts`
is `server-only`, so a client import is a build error. The CSP was not widened: Mapbox is never
called from the browser, so `connect-src` still lists only the app itself and the map tile host.

**Rejected.**

- _GeoNames seeded into Postgres with `pg_trgm`._ Genuinely attractive — sub-10ms local search,
  population-ranked, no external dependency at all. Rejected because a cities-only dataset cannot
  represent small towns, islands or national parks without a network fallback, which reintroduces
  the dependency it was meant to remove.
- _Wikidata `wbsearchentities` + SPARQL._ Keyless with rich metadata, but 300–800ms is too slow for
  typeahead and ranking notable-but-tiny places needs manual tuning.

---

## 14. Editing an itinerary in place

**Problem.** A generated trip was immutable: regenerate the whole thing or delete it. One
disappointing day meant discarding six good ones.

**Chosen.** Three operations — re-roll a day, reorder stops, remove a stop — split by cost:

- **Regenerate** is a **route handler** (`/api/trips/[id]/days/[day]/regenerate`), because it calls
  Gemini and needs an explicit `maxDuration`, which only a route segment can declare.
- **Reorder and remove** are **server actions**, because they are instant pure-data edits and get
  `revalidatePath` without a client fetch.

**Avoiding duplicates.** A re-roll receives every place already scheduled on the *other* days as an
exclusion list. Without it, regenerating day 3 cheerfully suggests the cathedral already on day 1 —
the obvious failure mode of regenerating part of a document in isolation. Temperature is also raised
from 0.7 to 0.9, since a re-roll that returns something near-identical has done nothing.

**Concurrency.** The itinerary is a single `jsonb` column, so read-modify-write in JavaScript loses
a concurrent edit: two requests read version N and both write N+1. Every edit instead writes with
one atomic statement:

```sql
UPDATE trip SET itinerary = jsonb_set(itinerary, '{days,<idx>}', $day::jsonb)
WHERE id = $1 AND user_id = $2;
```

The day fragment is validated against `daySchema` before it is written, so an invalid document
cannot be produced even though the whole itinerary is not re-parsed on the way out.

**Read-only by construction.** `TripView` takes `editableTripId`, not an `editable` boolean. The
public `/t/<slug>` page simply does not pass it, so the controls have no id to act on and are never
rendered — rather than being rendered and hidden. The server-side owner check on every action and on
the regenerate route is what actually enforces it; this just means the two cannot disagree.

**Known rough edge.** `travelFromPrevious` describes the hop from the preceding stop, so reordering
or removing invalidates it. The affected values are reset rather than recomputed — recomputing would
need another model call for what is meant to be an instant edit. Stating "12 min by metro" for a hop
that no longer exists would be worse than saying nothing.

---

## 15. Node version and toolchain pinning

`typescript-eslint` supports TypeScript `>=4.8.4 <6.1.0`, so the project pins **TypeScript 6.0.3**
rather than the newer 7.x, which would silently disable linting.

Similarly, ESLint is pinned to **9.x**: `eslint-plugin-jsx-a11y` (a dependency of
`eslint-config-next`) does not yet declare support for ESLint 10, and forcing it would require
`--legacy-peer-deps` and an unverified resolution. ESLint 10 offers nothing this project needs.

Both are deliberate ceilings, not oversights. Revisit when the plugin ecosystem catches up.

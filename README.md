# Wayfare — AI trip planner

Describe where you want to go and Wayfare writes a day-by-day itinerary with real places, honest
prices, and an interactive map — then keeps it private until you choose to share it.

Built with Next.js 16 (App Router), TypeScript, Neon Postgres, Drizzle ORM, Auth.js and Google
Gemini. Runs entirely on free tiers.

---

## What it does

- **Generates itineraries.** Pick a destination, length, budget and travel party. Gemini writes a
  structured plan: three to five stops per day grouped by area, with travel time between them,
  suggested duration, ticket prices and the best hour to arrive.
- **Streams as it writes.** Days appear one at a time as the model produces them, rather than
  showing a spinner for the whole request.
- **Maps every stop.** Each place is pinned and colour-coded by day. Hovering an entry in the
  itinerary highlights its pin.
- **Suggests places to stay.** Three to five hotels matched to the chosen budget.
- **Lets you edit it.** Re-roll a single day without touching the rest, reorder stops, or drop one
  you do not want. A re-rolled day avoids everything already scheduled on the other days.
- **Keeps trips private.** Trips are visible only to their owner. Sharing is opt-in per trip and
  mints a single unguessable link.

---

## Tech stack

| Concern       | Choice                                            | Why                                                       |
| ------------- | ------------------------------------------------- | --------------------------------------------------------- |
| Framework     | Next.js 16 (App Router), React 19                 | Server components + route handlers on one free deployment |
| Language      | TypeScript, `strict` + `noUncheckedIndexedAccess` | —                                                         |
| Database      | Neon serverless Postgres                          | Free tier; auto-suspends and auto-resumes                 |
| ORM           | Drizzle ORM + drizzle-kit                         | Typed schema, versioned SQL migrations in git             |
| Auth          | Auth.js v5, Google OAuth, database sessions       | httpOnly cookie; revocable server-side                    |
| AI            | Vercel AI SDK + `@ai-sdk/google`, Gemini 2.5 Flash | Structured output validated by Zod                        |
| Map           | MapLibre GL + OpenFreeMap tiles                   | No API key, no billing                                    |
| Place search  | Mapbox Search Box API, server-proxied             | Session-token billing; one session per search             |
| Place imagery | Wikimedia Commons, cached in Postgres             | No API key, no billing                                    |
| Styling       | Tailwind CSS v4, shadcn-style components          | Token-driven, light + dark                                |
| Validation    | Zod 4                                             | One schema shared by form, model and database             |

Both metered credentials — Gemini and Mapbox — are server-side only and sit comfortably inside
their free tiers for personal use.

> **No rate limiting.** `/api/trips/generate` is gated by authentication alone. A signed-in user can
> generate repeatedly and consume the Gemini free-tier quota. This is a deliberate choice, not an
> oversight; see [docs/decisions.md](docs/decisions.md#7-rate-limiting-removed).

---

## Quick start

**Prerequisites:** Node 20.9+, a Neon account, a Google Cloud OAuth client, a Gemini API key.

```bash
git clone https://github.com/RoshanMuhammedR/AI_Trip_Planner.git
cd AI_Trip_Planner
npm install

cp .env.example .env.local   # then fill in the values — see below
npm run db:push              # create the schema in your Neon database
npm run dev                  # http://localhost:3000
```

### Environment variables

Every secret is server-side. Nothing is prefixed `NEXT_PUBLIC_` except the site URL, which contains
no secret.

| Variable                       | Required | Where to get it                                                   |
| ------------------------------ | -------- | ----------------------------------------------------------------- |
| `DATABASE_URL`                 | yes      | Neon → Connection Details → **pooled** connection string          |
| `AUTH_SECRET`                  | yes      | `npx auth secret`                                                 |
| `AUTH_GOOGLE_ID`               | yes      | Google Cloud Console → Credentials → OAuth 2.0 Client ID          |
| `AUTH_GOOGLE_SECRET`           | yes      | same client                                                       |
| `GOOGLE_GENERATIVE_AI_API_KEY` | yes      | <https://aistudio.google.com/apikey>                              |
| `MAPBOX_ACCESS_TOKEN`          | yes      | <https://console.mapbox.com> — prefer a secret (`sk.`) token       |
| `NEXT_PUBLIC_SITE_URL`         | no       | Canonical origin for metadata; defaults to `http://localhost:3000` |

Add `http://localhost:3000/api/auth/callback/google` as an authorised redirect URI on the OAuth
client.

### Scripts

| Command               | Does                                     |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Development server                       |
| `npm run build`       | Production build (runs `tsc`)            |
| `npm run typecheck`   | Types only                               |
| `npm run lint`        | ESLint                                   |
| `npm run format`      | Prettier, write                          |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate`  | Apply pending migrations                 |
| `npm run db:push`     | Push schema directly (development only)  |
| `npm run db:studio`   | Drizzle Studio                           |

---

## Documentation

| Document                              | Contents                                                          |
| ------------------------------------- | ----------------------------------------------------------------- |
| [Architecture](docs/architecture.md)  | System shape, request lifecycle, trust boundaries, security model  |
| [Design decisions](docs/decisions.md) | Why each significant choice was made, and what was rejected        |
| [Data model](docs/data-model.md)      | Tables, relationships, invariants, migrations                      |
| [Development](docs/development.md)    | Local setup, conventions, project layout, common tasks             |
| [Deployment](docs/deployment.md)      | Vercel + Neon setup, environment, post-deploy checks               |

---

## Project layout

```
src/
├── app/                    # routes — pages, layouts, route handlers, metadata
├── components/             # shared presentational components + ui primitives
├── features/               # feature-scoped UI: trip-form, itinerary, map
├── server/                 # everything that must never reach the browser
│   ├── ai/                 # prompt construction, generation, day re-rolls
│   ├── db/                 # Drizzle schema and client
│   ├── places/             # Mapbox search, Wikimedia imagery, curated list
│   ├── trips/              # queries, mutations, enrichment
│   ├── actions/            # server actions
│   └── auth.ts             # Auth.js configuration
├── lib/                    # isomorphic helpers, Zod schemas, env contract
└── proxy.ts                # CSP nonce + signed-out redirects
```

Modules under `src/server/` import `server-only`, so importing one from a client component is a
build error rather than a runtime leak.

---

## About this rewrite

This project began as a Vite single-page app and was rebuilt from scratch. The rewrite was not
cosmetic — the original had no server at all, and several of its problems were unfixable without
one:

- The **Gemini API key was inlined into the public JavaScript bundle**, readable by anyone who
  opened devtools on the deployed site and billable without limit.
- **Authentication was a JSON object in `localStorage`.** Editing it in devtools was enough to
  become another user. Firestore never saw an authenticated principal, so no security rule could
  have been written against it.
- **Every trip was world-readable** at a guessable `Date.now()` identifier, with no ownership check.
- A **failed generation hung forever** — the error path skipped the `setSearching(false)` call and
  wrote `undefined` into the database.
- The **"Trip History" feature could not be reached at all**: a duplicate `path: '/'` meant React
  Router always matched the landing page, while the header linked to a path with no route.
- A **7.7 MB placeholder JPEG** was the image fallback on every card.

[docs/decisions.md](docs/decisions.md) records what replaced each of these, and why.

---

## Author

**Roshan Muhammed R** — [GitHub](https://github.com/RoshanMuhammedR) ·
[LinkedIn](https://linkedin.com/in/roshan2004)

Place data © OpenStreetMap contributors (ODbL). Imagery from Wikimedia Commons. Map tiles by
OpenFreeMap.

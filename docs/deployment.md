# Deployment

Target: **Vercel** (Hobby) + **Neon** (Free) + **Mapbox** (free tier). Recurring cost is zero for
personal use, but two of the credentials are metered — see the ceilings table below.

---

## Before the first deploy

### Rotate the legacy credentials

The previous version of this app shipped its Gemini and Google Places keys inside the public
JavaScript bundle, and the deployed site served them to every visitor. Those keys are also present
in this repository's git history.

**Rewriting the application does not undo that exposure.** Before or immediately after deploying:

1. Google Cloud Console → APIs & Services → Credentials.
2. Delete the old Places API key and the old Gemini key.
3. Issue a fresh Gemini key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and
   use that one for `GOOGLE_GENERATIVE_AI_API_KEY`.

The new architecture keeps the key server-side, but a key that has already been public stays
compromised until it is revoked.

### Provision the services

**Neon.** Create a project. Copy the **pooled** connection string (host contains `-pooler`).

**Mapbox.** Create an access token at [console.mapbox.com](https://console.mapbox.com). Prefer a
**secret** token (`sk.…`): it is only used server-side, and a secret token cannot be replayed from a
browser. Search Box is metered per session — confirm the current free allowance before going public.

**Google OAuth.** Create a Web application OAuth client, or reuse the existing one. Authorised
redirect URIs must include every origin the app runs on:

```
http://localhost:3000/api/auth/callback/google
https://<your-app>.vercel.app/api/auth/callback/google
https://<your-custom-domain>/api/auth/callback/google
```

Preview deployments get a new URL per branch. Either add a wildcard-free entry for the ones you use,
or accept that sign-in works only on production and locally.

---

## Deploy

Import the repository at [vercel.com/new](https://vercel.com/new). Framework preset is detected
automatically; no build settings need changing. There is no `vercel.json` — the defaults are
correct for a Next.js app, and the legacy SPA rewrite it used to contain would now break routing.

### Environment variables

Set these in Vercel → Settings → Environment Variables, for **Production** and **Preview**:

| Variable                       | Notes                                                            |
| ------------------------------ | ---------------------------------------------------------------- |
| `DATABASE_URL`                 | Neon pooled connection string                                     |
| `AUTH_SECRET`                  | `npx auth secret`. Use a different value per environment          |
| `AUTH_GOOGLE_ID`               | OAuth client id                                                   |
| `AUTH_GOOGLE_SECRET`           | OAuth client secret                                               |
| `GOOGLE_GENERATIVE_AI_API_KEY` | The **new** key, not the rotated one                              |
| `MAPBOX_ACCESS_TOKEN`          | Search Box token, preferably secret (`sk.`)                        |
| `NEXT_PUBLIC_SITE_URL`         | e.g. `https://your-app.vercel.app` — used for metadata and sitemap |

None of these except `NEXT_PUBLIC_SITE_URL` is exposed to the browser. Do not add a `NEXT_PUBLIC_`
prefix to any of the others; that is precisely the mistake this rewrite exists to correct.

### Apply the schema

Migrations are not run automatically — an automatic migration on every deploy is a good way to lose
data. Run them from a machine with the production `DATABASE_URL` in its environment:

```bash
DATABASE_URL="postgresql://…-pooler…" npm run db:migrate
```

For a first deploy against an empty database, `db:push` is acceptable. After that, always use
`db:migrate` so the change is recorded.

---

## After deploying

Work through these; several verify properties that are easy to break silently.

**1. No secret in the client bundle.** The most important check.

```bash
curl -s https://<your-app>/ | grep -oE '/_next/static/chunks/[^"]+\.js' | sort -u | \
  while read -r p; do curl -s "https://<your-app>$p"; done | \
  grep -c "AIza"          # expect 0
```

CI performs the equivalent check on every build.

**2. Security headers.**

```bash
curl -sI https://<your-app>/ | grep -iE 'content-security-policy|strict-transport|x-frame'
```

Expect a CSP containing a `nonce-` value that changes between requests.

**3. Sign-in.** Complete a Google sign-in. In devtools, confirm:

- a `__Secure-authjs.session-token` cookie exists, marked `HttpOnly` and `Secure`
- `localStorage` is empty

**4. Generation.** Create a trip. Days should stream in progressively. Then open a day and press
**Regenerate** — only that day should change.

**5. Privacy.** Open a trip URL in a private window. Expect a 404. Enable sharing, retry the `/t/…`
link, expect a read-only page. Disable sharing, expect 404 again.

**6. Search.** Type a destination and confirm in the network tab that the suggest calls for one word
share a single `session=` value. Every extra session token is a separately billed Mapbox session.

---

## Operational notes

### Function duration

`/api/trips/generate` sets `maxDuration = 60`. Vercel Hobby allows up to 60 seconds, so this is at
the ceiling. A seven-day itinerary occasionally approaches it. If timeouts appear in the logs,
either reduce `MAX_TRIP_DAYS` or move to a plan with a longer limit — the trip is marked `failed`
rather than left hanging, so a timeout degrades gracefully.

### Neon cold starts

A free Neon database suspends after several minutes idle and resumes on the next query, costing
roughly half a second. It resumes automatically — no manual step, which is the main reason Neon was
chosen over Supabase for this project.

### Free-tier ceilings worth watching

| Service         | Limit                              | What happens at the ceiling                    |
| --------------- | ---------------------------------- | ---------------------------------------------- |
| Vercel Hobby    | 100 GB bandwidth/month             | Deployment is throttled                        |
| Neon Free       | 0.5 GB storage                     | Writes fail; itineraries are small, so distant |
| Gemini Free     | Rate and daily request caps        | Generation returns an error; trip marked failed |
| Mapbox          | Metered Search Box sessions        | Billed, or requests rejected, depending on plan |

**There is no application-level rate limit.** Nothing in the app stops a signed-in user from
generating repeatedly until the Gemini quota is spent. If that becomes a problem, the cheapest fix
is a per-user daily counter in Postgres — see [decisions.md §7](decisions.md#7-rate-limiting-removed).

### Rolling back

Vercel keeps every deployment. Promote a previous one from the dashboard. If the rollback crosses a
migration, roll the database back first — Drizzle does not generate down-migrations, so this means
applying a hand-written reverse migration. Prefer additive, backward-compatible schema changes so
this situation does not arise.

### Custom domain

Add it in Vercel → Settings → Domains, then update `NEXT_PUBLIC_SITE_URL` and add the new callback
URL to the Google OAuth client. Forgetting the second step breaks sign-in with a
`redirect_uri_mismatch` error.

import 'server-only';

import { z } from 'zod';
import { inArray } from 'drizzle-orm';
import { db } from '@/server/db';
import { placeCache } from '@/server/db/schema';

/**
 * Place imagery, via the Wikipedia/Wikimedia API.
 *
 * Replaces Google Places Photos. What was wrong before:
 *   • the API key was appended in plaintext to every `<img src>`, leaking it
 *     into the DOM, network logs and referrers;
 *   • the same fetch effect was copy-pasted into four components and re-ran on
 *     every mount, so one itinerary triggered dozens of billable calls;
 *   • it indexed `places[0].photos[3]` unguarded, so any place with fewer than
 *     four photos threw an unhandled rejection and silently fell back to a
 *     7.7 MB placeholder JPEG.
 *
 * Wikimedia needs no key, is free, and has excellent coverage of exactly the
 * landmarks itineraries are made of. Results are cached in Postgres, so a given
 * place is looked up once ever rather than on every render. Places with no
 * article (most hotels) resolve to `null` and the UI draws a CSS gradient.
 */

const WIKI_ENDPOINT = 'https://en.wikipedia.org/w/api.php';

const wikiResponseSchema = z.object({
  query: z
    .object({
      pages: z.record(
        z.string(),
        z.object({
          title: z.string().optional(),
          index: z.number().optional(),
          thumbnail: z
            .object({
              source: z.string().url(),
              width: z.number(),
              height: z.number(),
            })
            .optional(),
        }),
      ),
    })
    .optional(),
});

export type PlaceImage = { imageUrl: string; attribution: string } | null;

/** Normalised cache key so "Colosseum " and "colosseum" share one entry. */
function cacheKey(name: string, context: string): string {
  return `${name.trim().toLowerCase()}|${context.trim().toLowerCase()}`;
}

async function fetchFromWikipedia(name: string, context: string): Promise<PlaceImage> {
  const url = new URL(WIKI_ENDPOINT);
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '1',
    generator: 'search',
    // Bias the search toward the destination so "Central Park" resolves in the
    // right city rather than to whichever article ranks highest globally.
    gsrsearch: `${name} ${context}`,
    gsrlimit: '3',
    gsrnamespace: '0',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '800',
    pilicense: 'any',
  }).toString();

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Wayfare/1.0 (hobby trip planner; contact via GitHub)' },
    next: { revalidate: 60 * 60 * 24 * 30 },
  });

  if (!response.ok) return null;

  const parsed = wikiResponseSchema.safeParse(await response.json());
  if (!parsed.success || !parsed.data.query) return null;

  // `generator=search` returns pages keyed by id; `index` preserves rank.
  const pages = Object.values(parsed.data.query.pages)
    .filter((page) => page.thumbnail?.source)
    .sort((a, b) => (a.index ?? 99) - (b.index ?? 99));

  const best = pages[0];
  if (!best?.thumbnail) return null;

  return {
    imageUrl: best.thumbnail.source,
    attribution: best.title ? `Wikimedia Commons — ${best.title}` : 'Wikimedia Commons',
  };
}

/**
 * Resolves images for many places at once, reading the cache first and writing
 * back whatever it had to fetch.
 *
 * Returns a map keyed by the original place name so callers do not need to know
 * about the normalised cache key.
 */
export async function resolvePlaceImages(
  names: readonly string[],
  context: string,
): Promise<Map<string, PlaceImage>> {
  const unique = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  const result = new Map<string, PlaceImage>();
  if (unique.length === 0) return result;

  const keyFor = new Map(unique.map((name) => [name, cacheKey(name, context)]));
  const keys = Array.from(keyFor.values());

  // 1. Cache read.
  let cached: { key: string; imageUrl: string | null; attribution: string | null }[] = [];
  try {
    cached = await db
      .select({
        key: placeCache.key,
        imageUrl: placeCache.imageUrl,
        attribution: placeCache.attribution,
      })
      .from(placeCache)
      .where(inArray(placeCache.key, keys));
  } catch (error) {
    // A cache outage must not break the page; fall through to live fetches.
    console.error('[places] Cache read failed', error);
  }

  const cachedByKey = new Map(cached.map((row) => [row.key, row]));
  const missing: string[] = [];

  for (const name of unique) {
    const key = keyFor.get(name)!;
    const hit = cachedByKey.get(key);

    if (hit) {
      result.set(
        name,
        hit.imageUrl ? { imageUrl: hit.imageUrl, attribution: hit.attribution ?? '' } : null,
      );
    } else {
      missing.push(name);
    }
  }

  if (missing.length === 0) return result;

  // 2. Fetch the misses, bounded so one itinerary cannot fan out unboundedly.
  const fetched = await Promise.all(
    missing.slice(0, 40).map(async (name) => {
      try {
        return [name, await fetchFromWikipedia(name, context)] as const;
      } catch (error) {
        console.error(`[places] Lookup failed for "${name}"`, error);
        return [name, null] as const;
      }
    }),
  );

  for (const [name, image] of fetched) {
    result.set(name, image);
  }

  // 3. Cache write — negatives included, so a place with no article is not
  //    re-queried on every page view.
  try {
    await db
      .insert(placeCache)
      .values(
        fetched.map(([name, image]) => ({
          key: keyFor.get(name)!,
          imageUrl: image?.imageUrl ?? null,
          attribution: image?.attribution ?? null,
        })),
      )
      .onConflictDoNothing({ target: placeCache.key });
  } catch (error) {
    console.error('[places] Cache write failed', error);
  }

  return result;
}

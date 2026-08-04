import 'server-only';

import { z } from 'zod';
import { getEnv } from '@/lib/env';
import type { DestinationSuggestion, ResolvedDestination } from '@/lib/schemas/destination';

/**
 * Destination search, via the Mapbox Search Box API.
 *
 * Replaces Photon (Komoot/OpenStreetMap), which was keyless but sat in the
 * request path of the very first step of the funnel with no SLA, ranked without
 * any population signal (so "Paris" could surface the wrong one), had no typo
 * tolerance, and returned nothing but a name and coordinates — which is why the
 * old picker could only render a plain text list.
 *
 * Search Box is a two-step API, and the split is the point:
 *
 *   /suggest   — cheap, called on every keystroke, returns names and context
 *                but NO coordinates
 *   /retrieve  — called once, when the user picks something, returns geometry
 *
 * Both calls carry a `session_token`. Mapbox bills a *session* rather than a
 * request, so the ~8 debounced suggest calls behind typing "barcelona" plus the
 * final retrieve are billed as one unit. That is the whole reason this API was
 * chosen over Geocoding v6, which has no session concept and would bill nine
 * separate requests for the same interaction.
 *
 * The access token never leaves the server. `MAPBOX_ACCESS_TOKEN` carries no
 * `NEXT_PUBLIC_` prefix, and this module is `server-only`, so a client import is
 * a build error rather than a leak — the same containment as the Gemini key.
 */

const SUGGEST_URL = 'https://api.mapbox.com/search/searchbox/v1/suggest';
const RETRIEVE_URL = 'https://api.mapbox.com/search/searchbox/v1/retrieve';

/** Administrative place types. Excludes addresses and POIs — you plan a trip to
 *  a city or a region, not to a street number. */
const DESTINATION_TYPES = 'country,region,place,locality,district';

// --- Response schemas ------------------------------------------------------
//
// Parsed strictly enough that an upstream shape change fails loudly instead of
// silently degrading to an empty result list.

const contextEntrySchema = z.object({ name: z.string().optional() }).loose();

const suggestionContextSchema = z
  .object({
    country: contextEntrySchema.extend({ country_code: z.string().optional() }).optional(),
    region: contextEntrySchema.optional(),
    place: contextEntrySchema.optional(),
    district: contextEntrySchema.optional(),
  })
  .loose();

const suggestResponseSchema = z.object({
  suggestions: z.array(
    z.object({
      mapbox_id: z.string(),
      name: z.string(),
      name_preferred: z.string().optional(),
      place_formatted: z.string().optional(),
      feature_type: z.string().optional(),
      context: suggestionContextSchema.optional(),
    }),
  ),
});

const retrieveResponseSchema = z.object({
  features: z.array(
    z.object({
      geometry: z.object({
        coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
      }),
      properties: z
        .object({
          name: z.string().optional(),
          name_preferred: z.string().optional(),
          place_formatted: z.string().optional(),
          full_address: z.string().optional(),
          feature_type: z.string().optional(),
          context: suggestionContextSchema.optional(),
        })
        .loose(),
    }),
  ),
});

// --- Helpers ---------------------------------------------------------------

function buildContextLine(context: z.infer<typeof suggestionContextSchema> | undefined): string {
  if (!context) return '';
  return [context.region?.name, context.country?.name].filter(Boolean).join(', ');
}

async function callMapbox(url: URL, signal: AbortSignal | undefined, label: string) {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
    // Personalised by session token; never cache at the fetch layer.
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Mapbox ${label} returned ${response.status}`);
  }

  return response.json();
}

// --- API -------------------------------------------------------------------

/**
 * Typeahead suggestions. Called on every (debounced) keystroke.
 *
 * `sessionToken` must be stable for the whole of one search interaction and
 * rotated after a `retrieve`, or every keystroke is billed separately.
 */
export async function suggestDestinations(
  query: string,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<DestinationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL(SUGGEST_URL);
  url.searchParams.set('q', trimmed);
  url.searchParams.set('access_token', getEnv().MAPBOX_ACCESS_TOKEN);
  url.searchParams.set('session_token', sessionToken);
  url.searchParams.set('types', DESTINATION_TYPES);
  url.searchParams.set('limit', '8');
  url.searchParams.set('language', 'en');

  const parsed = suggestResponseSchema.safeParse(await callMapbox(url, signal, 'suggest'));

  if (!parsed.success) {
    console.error('[mapbox] Unexpected /suggest shape', parsed.error.issues);
    throw new Error('Mapbox returned an unexpected response');
  }

  return parsed.data.suggestions.map((suggestion) => ({
    mapboxId: suggestion.mapbox_id,
    name: suggestion.name_preferred ?? suggestion.name,
    // `place_formatted` is Mapbox's own pretty context string; fall back to
    // assembling one from the context object when it is absent.
    context: suggestion.place_formatted ?? buildContextLine(suggestion.context),
    countryCode: suggestion.context?.country?.country_code?.toUpperCase() ?? null,
    featureType: suggestion.feature_type ?? null,
  }));
}

/**
 * Resolves a chosen suggestion to coordinates. Ends the billing session, so the
 * caller must rotate its session token afterwards.
 */
export async function retrieveDestination(
  mapboxId: string,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<ResolvedDestination | null> {
  const url = new URL(`${RETRIEVE_URL}/${encodeURIComponent(mapboxId)}`);
  url.searchParams.set('access_token', getEnv().MAPBOX_ACCESS_TOKEN);
  url.searchParams.set('session_token', sessionToken);

  const parsed = retrieveResponseSchema.safeParse(await callMapbox(url, signal, 'retrieve'));

  if (!parsed.success) {
    console.error('[mapbox] Unexpected /retrieve shape', parsed.error.issues);
    throw new Error('Mapbox returned an unexpected response');
  }

  const feature = parsed.data.features[0];
  if (!feature) return null;

  const [lng, lat] = feature.geometry.coordinates;
  const { properties } = feature;

  const name = properties.name_preferred ?? properties.name ?? 'Unknown';
  const context = properties.place_formatted ?? buildContextLine(properties.context);

  return {
    name,
    label: context ? `${name}, ${context}` : name,
    countryCode: properties.context?.country?.country_code?.toUpperCase() ?? null,
    lat,
    lng,
  };
}

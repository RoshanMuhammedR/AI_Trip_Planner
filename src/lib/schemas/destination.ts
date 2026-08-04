/**
 * Destination types shared between the server search layer and the client
 * picker.
 *
 * They live here rather than in `src/server/places/mapbox.ts` so client
 * components can import them without reaching into a `server-only` module.
 * A type-only import would be erased anyway, but keeping the dependency
 * direction honest means nobody has to reason about that to be sure.
 */

/** A search result, before the user commits to it. Has no coordinates yet —
 *  Mapbox only returns geometry from `/retrieve`. */
export type DestinationSuggestion = {
  /** Opaque Mapbox id, passed back to `/retrieve`. */
  mapboxId: string;
  /** Primary name, e.g. "Cambridge". */
  name: string;
  /** Region and country, e.g. "England, United Kingdom". */
  context: string;
  /** ISO 3166-1 alpha-2, e.g. "GB". Drives the flag in the UI. */
  countryCode: string | null;
  /** "place" | "region" | "country" | … — rendered as a badge. */
  featureType: string | null;
};

/** A committed destination, with coordinates. This is what the form stores. */
export type ResolvedDestination = {
  /** Full display label, e.g. "Cambridge, England, United Kingdom". */
  label: string;
  /** Primary name alone, e.g. "Cambridge". */
  name: string;
  countryCode: string | null;
  lat: number;
  lng: number;
};

/** A curated or previously-used destination shown before the user types. */
export type DestinationPreset = ResolvedDestination & {
  /** Resolved server-side from Wikimedia; null renders a gradient instead. */
  imageUrl: string | null;
};

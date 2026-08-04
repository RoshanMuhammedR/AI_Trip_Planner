import 'server-only';

import { resolvePlaceImages } from '@/server/places/images';
import type { DestinationPreset, ResolvedDestination } from '@/lib/schemas/destination';

/**
 * Curated destinations shown before the user types anything.
 *
 * Hardcoded on purpose: this is editorial content, not data. Picking twelve
 * places by hand gives a deliberate geographic and character spread — which no
 * "top cities by population" query would produce, since that returns a list of
 * megacities most people are not planning a holiday around.
 *
 * Coordinates are the city centre and are used directly, so choosing one of
 * these skips the Mapbox round trip entirely.
 */
const CURATED: ResolvedDestination[] = [
  { name: 'Kyoto', label: 'Kyoto, Japan', countryCode: 'JP', lat: 35.0116, lng: 135.7681 },
  { name: 'Lisbon', label: 'Lisbon, Portugal', countryCode: 'PT', lat: 38.7223, lng: -9.1393 },
  { name: 'Rome', label: 'Rome, Italy', countryCode: 'IT', lat: 41.9028, lng: 12.4964 },
  { name: 'Oaxaca', label: 'Oaxaca, Mexico', countryCode: 'MX', lat: 17.0732, lng: -96.7266 },
  { name: 'Marrakesh', label: 'Marrakesh, Morocco', countryCode: 'MA', lat: 31.6295, lng: -7.9811 },
  {
    name: 'Reykjavík',
    label: 'Reykjavík, Iceland',
    countryCode: 'IS',
    lat: 64.1466,
    lng: -21.9426,
  },
  { name: 'Hanoi', label: 'Hanoi, Vietnam', countryCode: 'VN', lat: 21.0278, lng: 105.8342 },
  {
    name: 'Edinburgh',
    label: 'Edinburgh, Scotland',
    countryCode: 'GB',
    lat: 55.9533,
    lng: -3.1883,
  },
  {
    name: 'Cape Town',
    label: 'Cape Town, South Africa',
    countryCode: 'ZA',
    lat: -33.9249,
    lng: 18.4241,
  },
  { name: 'Istanbul', label: 'Istanbul, Türkiye', countryCode: 'TR', lat: 41.0082, lng: 28.9784 },
  {
    name: 'Queenstown',
    label: 'Queenstown, New Zealand',
    countryCode: 'NZ',
    lat: -45.0312,
    lng: 168.6626,
  },
  {
    name: 'Buenos Aires',
    label: 'Buenos Aires, Argentina',
    countryCode: 'AR',
    lat: -34.6037,
    lng: -58.3816,
  },
];

/**
 * The curated list with imagery attached.
 *
 * Reuses `resolvePlaceImages`, so the twelve lookups are one batched call
 * against `place_cache` and, after the first render on a fresh database, zero
 * outbound requests. Places without a usable image resolve to `null` and the UI
 * draws a gradient.
 */
export async function getPopularDestinations(): Promise<DestinationPreset[]> {
  try {
    const images = await resolvePlaceImages(
      CURATED.map((destination) => destination.name),
      'city travel destination',
    );

    return CURATED.map((destination) => ({
      ...destination,
      imageUrl: images.get(destination.name)?.imageUrl ?? null,
    }));
  } catch (error) {
    // The picker still works without pictures; an image outage must not take
    // the whole plan page down.
    console.error('[places] Could not resolve popular destination images', error);
    return CURATED.map((destination) => ({ ...destination, imageUrl: null }));
  }
}

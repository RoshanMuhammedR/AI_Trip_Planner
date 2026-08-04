import 'server-only';

import type { Itinerary } from '@/lib/schemas/trip';
import { resolvePlaceImages } from '@/server/places/images';
import type { EnrichedItinerary } from '@/features/itinerary/types';

/**
 * Attaches imagery to an itinerary, server-side, in one batched pass.
 *
 * The legacy app did this in the browser: four separate components each ran
 * their own `useEffect` that called Google Places on mount, so a seven-day trip
 * fired dozens of billable requests with the API key visible in each one — and
 * repeated them on every navigation because nothing was cached.
 *
 * Here every place name across the whole itinerary is resolved in a single
 * call, backed by the `place_cache` table, before the page is sent.
 */
export async function enrichItinerary(
  itinerary: Itinerary,
  destination: string,
): Promise<EnrichedItinerary> {
  const activityNames = itinerary.days.flatMap((day) =>
    day.activities.map((activity) => activity.name),
  );
  const hotelNames = itinerary.hotels.map((hotel) => hotel.name);

  const images = await resolvePlaceImages([...activityNames, ...hotelNames], destination);

  return {
    ...itinerary,
    days: itinerary.days.map((day) => ({
      day: day.day,
      theme: day.theme,
      activities: day.activities.map((activity, index) => {
        const image = images.get(activity.name.trim()) ?? null;
        return {
          ...activity,
          id: `d${day.day}-a${index}`,
          day: day.day,
          order: index + 1,
          imageUrl: image?.imageUrl ?? null,
          attribution: image?.attribution ?? null,
        };
      }),
    })),
    hotels: itinerary.hotels.map((hotel, index) => {
      const image = images.get(hotel.name.trim()) ?? null;
      return {
        ...hotel,
        id: `h${index}`,
        imageUrl: image?.imageUrl ?? null,
        attribution: image?.attribution ?? null,
      };
    }),
  };
}

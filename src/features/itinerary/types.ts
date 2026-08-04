import type { Activity, Hotel, Itinerary } from '@/lib/schemas/trip';

/** An activity with its resolved image, attached server-side. */
export type EnrichedActivity = Activity & {
  /** Stable identifier used to sync list hover with map pins. */
  id: string;
  day: number;
  order: number;
  imageUrl: string | null;
  attribution: string | null;
};

export type EnrichedHotel = Hotel & {
  id: string;
  imageUrl: string | null;
  attribution: string | null;
};

export type EnrichedDay = {
  day: number;
  theme: string;
  activities: EnrichedActivity[];
};

export type EnrichedItinerary = Omit<Itinerary, 'days' | 'hotels'> & {
  days: EnrichedDay[];
  hotels: EnrichedHotel[];
};

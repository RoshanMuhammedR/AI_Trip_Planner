'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Lightbulb } from 'lucide-react';
import { DayList } from './day-list';
import { HotelCard } from './hotel-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { EnrichedItinerary } from './types';
import type { MapPoint } from '@/features/map/trip-map';

/**
 * MapLibre touches `window` at import time and ships a large bundle, so it is
 * loaded only in the browser and only once this view renders. Keeping it out of
 * the server render also keeps it out of the initial JS payload.
 */
const TripMap = dynamic(() => import('@/features/map/trip-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-xl" />,
});

export function TripView({
  itinerary,
  destination,
  center,
  editableTripId,
}: {
  itinerary: EnrichedItinerary;
  destination: string;
  center: { lat: number; lng: number };
  /**
   * Set only when the viewer owns the trip. The public `/t/<slug>` view leaves
   * it undefined, which is what makes that page read-only — there is no
   * "hide the buttons" flag that could be flipped from the client, because the
   * controls are simply not rendered without an id to act on.
   */
  editableTripId?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const points = useMemo<MapPoint[]>(
    () =>
      itinerary.days.flatMap((day) =>
        day.activities.map((activity) => ({
          id: activity.id,
          name: activity.name,
          lat: activity.coordinates.lat,
          lng: activity.coordinates.lng,
          day: day.day,
          order: activity.order,
        })),
      ),
    [itinerary.days],
  );

  return (
    <div className="space-y-12">
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Overview
        </h2>
        <p className="text-lg leading-relaxed text-pretty">{itinerary.summary}</p>
      </section>

      {/* Map beside the itinerary on wide screens, stacked on narrow ones.
          `sticky` keeps the map in view while the day list scrolls past it. */}
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="order-2 lg:order-1">
          <h2 className="mb-5 text-2xl font-bold tracking-tight">Day by day</h2>
          <DayList
            days={itinerary.days}
            destination={destination}
            activeId={activeId}
            onActivate={setActiveId}
            tripId={editableTripId}
          />
        </div>

        <div className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-24">
            <div className="h-[320px] overflow-hidden rounded-xl border lg:h-[560px]">
              {points.length > 0 ? (
                <TripMap
                  points={points}
                  center={center}
                  activeId={activeId}
                  onActivate={setActiveId}
                  className="h-full w-full"
                />
              ) : (
                <div className="text-muted-foreground grid h-full place-items-center text-sm">
                  No mapped stops for this trip.
                </div>
              )}
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Hover a stop to highlight it on the map.
            </p>
          </div>
        </div>
      </div>

      {itinerary.hotels.length > 0 ? (
        <section aria-labelledby="hotels-heading">
          <h2 id="hotels-heading" className="mb-5 text-2xl font-bold tracking-tight">
            Where to stay
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {itinerary.hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </section>
      ) : null}

      {itinerary.tips.length > 0 ? (
        <section aria-labelledby="tips-heading">
          <h2 id="tips-heading" className="mb-5 text-2xl font-bold tracking-tight">
            Good to know
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {itinerary.tips.map((tip) => (
              <li key={tip} className="bg-card flex gap-3 rounded-xl border p-4 text-sm">
                <Lightbulb className="text-accent mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

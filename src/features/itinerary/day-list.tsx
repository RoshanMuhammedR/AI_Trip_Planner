'use client';

import { useState } from 'react';
import { Clock, ExternalLink, Star, Ticket } from 'lucide-react';
import { PlaceImage } from './place-image';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityControls, RegenerateDayButton } from './day-controls';
import { dayColorVar } from '@/lib/schemas/trip';
import { cn } from '@/lib/utils';
import type { EnrichedActivity, EnrichedDay } from './types';

function mapsUrl(name: string, destination: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${destination}`)}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

function ActivityCard({
  activity,
  destination,
  isActive,
  onActivate,
  edit,
}: {
  activity: EnrichedActivity;
  destination: string;
  isActive: boolean;
  onActivate: (id: string | null) => void;
  edit?: { tripId: string; index: number; total: number };
}) {
  return (
    <li
      className={cn(
        'bg-card overflow-hidden rounded-xl border transition-all',
        isActive ? 'ring-primary/40 shadow-md ring-2' : 'hover:shadow-sm',
      )}
      onMouseEnter={() => onActivate(activity.id)}
      onMouseLeave={() => onActivate(null)}
      // Focus mirrors hover so keyboard users get the same map sync. The
      // interactive controls inside remain the real tab stops, so this needs no
      // role of its own.
      onFocus={() => onActivate(activity.id)}
      onBlur={() => onActivate(null)}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[16/10] shrink-0 sm:aspect-square sm:w-40">
          <PlaceImage
            src={activity.imageUrl}
            alt={activity.name}
            name={activity.name}
            className="h-full w-full"
            sizes="(max-width: 640px) 100vw, 160px"
          />
          <span
            className="absolute top-2 left-2 grid size-6 place-items-center rounded-full text-xs font-bold text-white shadow"
            style={{ background: dayColorVar(activity.day) }}
            aria-hidden="true"
          >
            {activity.order}
          </span>
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <h4 className="leading-tight font-semibold">
              <a
                href={mapsUrl(activity.name, destination)}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-visible:ring-ring rounded hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {activity.name}
                <ExternalLink className="ml-1 inline size-3 align-baseline" aria-hidden="true" />
                <span className="sr-only">— opens in Google Maps in a new tab</span>
              </a>
            </h4>
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant="primary">
                <Star className="size-3 fill-current" aria-hidden="true" />
                {activity.rating.toFixed(1)}
              </Badge>

              {edit ? (
                <ActivityControls
                  tripId={edit.tripId}
                  dayNumber={activity.day}
                  index={edit.index}
                  total={edit.total}
                  activityName={activity.name}
                />
              ) : null}
            </div>
          </div>

          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {activity.description}
          </p>

          <dl className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              <dt className="sr-only">Suggested duration</dt>
              <dd>{formatDuration(activity.durationMinutes)}</dd>
            </div>
            <div className="flex items-center gap-1">
              <Ticket className="size-3.5" aria-hidden="true" />
              <dt className="sr-only">Entry</dt>
              <dd>{activity.ticketPrice}</dd>
            </div>
            <div>
              <dt className="sr-only">Best time to visit</dt>
              <dd>Best: {activity.bestTimeToVisit}</dd>
            </div>
          </dl>

          {activity.travelFromPrevious && activity.travelFromPrevious !== '—' ? (
            <p className="text-muted-foreground mt-2 text-xs italic">
              {activity.travelFromPrevious} from the previous stop
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function DayList({
  days,
  destination,
  activeId,
  onActivate,
  tripId,
}: {
  days: EnrichedDay[];
  destination: string;
  activeId: string | null;
  onActivate: (id: string | null) => void;
  /** Present only when the viewer owns the trip; absent on the public view. */
  tripId?: string;
}) {
  // Which day is mid-regeneration. Scoped per day so the rest of the itinerary
  // stays readable and interactive while one day is being rewritten.
  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null);

  return (
    <div className="space-y-10">
      {days.map((day) => {
        const isRegenerating = regeneratingDay === day.day;

        return (
          <section key={day.day} aria-labelledby={`day-${day.day}-heading`}>
            <div className="mb-4 flex items-center gap-3">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                style={{ background: dayColorVar(day.day) }}
                aria-hidden="true"
              >
                {day.day}
              </span>

              <div className="min-w-0 flex-1">
                <h3 id={`day-${day.day}-heading`} className="leading-tight font-semibold">
                  Day {day.day}
                </h3>
                <p className="text-muted-foreground truncate text-sm">{day.theme}</p>
              </div>

              {tripId ? (
                <RegenerateDayButton
                  tripId={tripId}
                  dayNumber={day.day}
                  onPendingChange={(pending) => setRegeneratingDay(pending ? day.day : null)}
                />
              ) : null}
            </div>

            {isRegenerating ? (
              <div className="space-y-3" aria-live="polite">
                <p className="text-muted-foreground text-sm">
                  Finding different places for day {day.day}…
                </p>
                {Array.from({ length: Math.max(day.activities.length, 3) }, (_, index) => (
                  <Skeleton key={index} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {day.activities.map((activity, index) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    destination={destination}
                    isActive={activeId === activity.id}
                    onActivate={onActivate}
                    edit={tripId ? { tripId, index, total: day.activities.length } : undefined}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

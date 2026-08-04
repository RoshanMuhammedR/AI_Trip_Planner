'use client';

import { AlertCircle, Check, Loader2, MapPin, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { dayColorVar, type Itinerary } from '@/lib/schemas/trip';
import { cn } from '@/lib/utils';

/** The hook yields a deeply-partial object while the model is still writing. */
type PartialItinerary =
  | {
      [K in keyof Itinerary]?: unknown;
    }
  | null
  | undefined;

type Props = {
  destination: string;
  requestedDays: number;
  itinerary: PartialItinerary;
  isLoading: boolean;
  error: Error | undefined;
  onCancel: () => void;
};

/**
 * Live view of a generation in progress.
 *
 * The legacy form showed one spinning icon for the whole request and, if the
 * call threw, span forever with no error, no retry and no explanation — because
 * `setSearching(false)` sat after an unguarded `await` and never ran.
 *
 * Here every day appears as the model finishes writing it, the remaining days
 * are shown as skeletons so progress is legible, and failure is an explicit
 * state with a way out.
 */
export function StreamingPreview({
  destination,
  requestedDays,
  itinerary,
  isLoading,
  error,
  onCancel,
}: Props) {
  const summary = typeof itinerary?.summary === 'string' ? itinerary.summary : null;
  const days = Array.isArray(itinerary?.days) ? itinerary.days : [];
  const hotels = Array.isArray(itinerary?.hotels) ? itinerary.hotels : [];

  const pending = Math.max(0, requestedDays - days.length);

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <span className="bg-destructive/10 text-destructive mx-auto flex size-12 items-center justify-center rounded-full">
          <AlertCircle className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-xl font-semibold">That did not work</h2>
        <p className="text-muted-foreground mt-2 text-sm text-pretty">{error.message}</p>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          <RotateCcw /> Start over
        </Button>
      </div>
    );
  }

  return (
    <div aria-live="polite" aria-busy={isLoading}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="text-primary size-5 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="text-primary size-5" aria-hidden="true" />
          )}
          <div>
            <p className="font-semibold">
              {isLoading ? `Planning ${destination}…` : `${destination} is ready`}
            </p>
            <p className="text-muted-foreground text-sm">
              {days.length} of {requestedDays} days written
              {hotels.length > 0 ? ` · ${hotels.length} stays found` : ''}
            </p>
          </div>
        </div>

        {isLoading ? (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>

      {summary ? (
        <p className="text-muted-foreground animate-fade-up mt-6 text-pretty">{summary}</p>
      ) : (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      )}

      <ol className="mt-8 space-y-4">
        {days.map((rawDay, index) => {
          const day = rawDay as
            { day?: number; theme?: string; activities?: unknown[] } | undefined;
          const dayNumber = typeof day?.day === 'number' ? day.day : index + 1;
          const activities = Array.isArray(day?.activities) ? day.activities : [];

          return (
            <li
              key={dayNumber}
              className="bg-card animate-fade-up rounded-xl border p-5"
              style={{ borderLeft: `4px solid ${dayColorVar(dayNumber)}` }}
            >
              <div className="flex items-baseline gap-3">
                <span
                  className="text-xs font-semibold tracking-wide uppercase"
                  style={{ color: dayColorVar(dayNumber) }}
                >
                  Day {dayNumber}
                </span>
                <h3 className="font-semibold">{day?.theme ?? <Skeleton className="h-4 w-40" />}</h3>
              </div>

              <ul className="mt-3 space-y-1.5">
                {activities.map((rawActivity, activityIndex) => {
                  const activity = rawActivity as { name?: string } | undefined;
                  return (
                    <li
                      key={`${dayNumber}-${activityIndex}`}
                      className="text-muted-foreground flex items-center gap-2 text-sm"
                    >
                      <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                      {activity?.name ?? <Skeleton className="h-3.5 w-32" />}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}

        {/* Placeholders for days not yet written, so progress reads as progress
            rather than as a page that has stopped doing anything. */}
        {isLoading &&
          Array.from({ length: pending }, (_, index) => (
            <li
              key={`pending-${index}`}
              className={cn('bg-card rounded-xl border p-5 opacity-60')}
              style={{ borderLeft: `4px solid ${dayColorVar(days.length + index + 1)}` }}
            >
              <Skeleton className="h-4 w-32" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3.5 w-40" />
              </div>
            </li>
          ))}
      </ol>

      {isLoading ? (
        <p className="text-muted-foreground mt-8 text-center text-sm">
          Taking your itinerary somewhere useful — this usually takes under a minute.
        </p>
      ) : null}
    </div>
  );
}

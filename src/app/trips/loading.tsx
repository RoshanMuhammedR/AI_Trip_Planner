import { Skeleton } from '@/components/ui/skeleton';

/**
 * Streamed while the trips query resolves.
 *
 * The legacy dashboard rendered six pulsing cards whenever `trips` was empty,
 * so a user with no trips saw a permanent fake loading state instead of an
 * empty state. Here loading and empty are genuinely different screens.
 */
export default function TripsLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
    </main>
  );
}

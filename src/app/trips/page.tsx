import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, Compass, Loader2, Plus } from 'lucide-react';
import { requireUser } from '@/server/auth-guards';
import { listTripsForUser } from '@/server/trips/queries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BUDGET_LABELS, TRAVELER_LABELS } from '@/lib/schemas/trip';

export const metadata: Metadata = {
  title: 'My trips',
  robots: { index: false, follow: false },
};

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/**
 * The trips dashboard.
 *
 * This page is the one the legacy app advertised in its README as "Trip
 * History" but could never actually show: `main.jsx` registered `<MyTrips/>`
 * against a second `path: '/'`, so React Router always matched the landing page
 * first, while the header linked to `/my-trips`, which matched no route at all.
 */
export default async function TripsPage() {
  const user = await requireUser('/trips');
  const trips = await listTripsForUser(user.id);

  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My trips</h1>
          <p className="text-muted-foreground mt-1">
            {trips.length === 0
              ? 'Nothing planned yet.'
              : `${trips.length} ${trips.length === 1 ? 'trip' : 'trips'} saved.`}
          </p>
        </div>

        <Button asChild>
          <Link href="/plan">
            <Plus /> Plan a trip
          </Link>
        </Button>
      </header>

      {trips.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center">
          <Compass className="text-muted-foreground mx-auto size-10" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold">No trips yet</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm text-pretty">
            Pick a destination and Wayfare will write the itinerary. It takes about a minute.
          </p>
          <Button asChild className="mt-6">
            <Link href="/plan">Plan your first trip</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link
                href={`/trips/${trip.id}`}
                className="bg-card focus-visible:ring-ring block h-full rounded-xl border p-5 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="leading-tight font-semibold">{trip.destination}</h2>
                  {trip.status === 'generating' ? (
                    <Badge>
                      <Loader2 className="size-3 animate-spin" aria-hidden="true" /> Writing
                    </Badge>
                  ) : trip.status === 'failed' ? (
                    <Badge variant="destructive">
                      <AlertCircle className="size-3" aria-hidden="true" /> Failed
                    </Badge>
                  ) : trip.shareSlug ? (
                    <Badge variant="accent">Shared</Badge>
                  ) : null}
                </div>

                <p className="text-muted-foreground mt-2 text-sm">
                  {trip.days} {trip.days === 1 ? 'day' : 'days'} ·{' '}
                  {BUDGET_LABELS[trip.budget].label} · {TRAVELER_LABELS[trip.travelers].label}
                </p>

                <p className="text-muted-foreground mt-4 text-xs">
                  {dateFormatter.format(trip.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

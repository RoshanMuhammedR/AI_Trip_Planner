import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CalendarDays, Loader2, Trash2, Users, Wallet } from 'lucide-react';
import { requireUser } from '@/server/auth-guards';
import { getOwnedTrip } from '@/server/trips/queries';
import { enrichItinerary } from '@/server/trips/enrich';
import { deleteTripAction } from '@/server/actions/trips';
import { TripView } from '@/features/itinerary/trip-view';
import { ShareToggle } from '@/features/itinerary/share-toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BUDGET_LABELS, TRAVELER_LABELS } from '@/lib/schemas/trip';

export const metadata: Metadata = {
  title: 'Trip',
  robots: { index: false, follow: false },
};

/** Day regeneration runs as a server action from this segment's client tree. */
export const maxDuration = 60;

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/trips/${id}`);

  // Ownership is part of the query, not a check afterwards. A trip belonging to
  // someone else is indistinguishable from one that does not exist.
  const trip = await getOwnedTrip(id, user.id);
  if (!trip) notFound();

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link href="/trips">
          <ArrowLeft /> All trips
        </Link>
      </Button>

      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{trip.destination}</h1>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>
              <CalendarDays className="size-3" aria-hidden="true" />
              {trip.days} {trip.days === 1 ? 'day' : 'days'}
            </Badge>
            <Badge>
              <Wallet className="size-3" aria-hidden="true" />
              {BUDGET_LABELS[trip.budget].label}
            </Badge>
            <Badge>
              <Users className="size-3" aria-hidden="true" />
              {TRAVELER_LABELS[trip.travelers].label}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {trip.status === 'ready' ? (
            <ShareToggle tripId={trip.id} initialSlug={trip.shareSlug} />
          ) : null}

          <form action={deleteTripAction.bind(null, trip.id)}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 /> Delete
            </Button>
          </form>
        </div>
      </header>

      <TripStatusBody trip={trip} />
    </main>
  );
}

type TripRow = NonNullable<Awaited<ReturnType<typeof getOwnedTrip>>>;

/**
 * Renders whichever of the three terminal states the trip is in. The legacy app
 * modelled only one, so a failed generation was indistinguishable from a slow
 * one and both looked like a spinner that never stopped.
 */
async function TripStatusBody({ trip }: { trip: TripRow }) {
  if (trip.status === 'generating') {
    return (
      <div className="rounded-xl border border-dashed py-20 text-center">
        <Loader2 className="text-primary mx-auto size-8 animate-spin" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold">Still writing this itinerary</h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm text-pretty">
          Refresh in a moment. If it stays like this, the generation was interrupted — start a new
          trip.
        </p>
      </div>
    );
  }

  if (trip.status === 'failed' || !trip.itinerary) {
    return (
      <div className="rounded-xl border border-dashed py-20 text-center">
        <AlertCircle className="text-destructive mx-auto size-8" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold">This trip could not be generated</h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm text-pretty">
          {trip.error ?? 'Something went wrong while writing the itinerary.'}
        </p>
        <Button asChild className="mt-6">
          <Link href="/plan">Try again</Link>
        </Button>
      </div>
    );
  }

  const enriched = await enrichItinerary(trip.itinerary, trip.destination);

  return (
    <TripView
      itinerary={enriched}
      destination={trip.destination}
      center={{ lat: trip.lat, lng: trip.lng }}
      // Owner view: edit controls are rendered. The public share view omits
      // this prop entirely, so it has nothing to act on.
      editableTripId={trip.id}
    />
  );
}

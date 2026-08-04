import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Compass, Users, Wallet } from 'lucide-react';
import { getSharedTrip } from '@/server/trips/queries';
import { enrichItinerary } from '@/server/trips/enrich';
import { TripView } from '@/features/itinerary/trip-view';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BUDGET_LABELS, TRAVELER_LABELS } from '@/lib/schemas/trip';

/**
 * Public, read-only view of a shared trip.
 *
 * Reachable only via a slug the owner explicitly minted. `getSharedTrip` also
 * filters to `status = 'ready'`, so a half-generated or failed itinerary can
 * never be exposed through a link that was shared earlier.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getSharedTrip(slug);

  if (!trip) return { title: 'Trip not found', robots: { index: false, follow: false } };

  const title = `${trip.days}-day trip to ${trip.destination}`;
  const description =
    trip.itinerary?.summary ??
    `A ${trip.days}-day ${BUDGET_LABELS[trip.budget].label.toLowerCase()} itinerary for ${trip.destination}.`;

  return {
    title,
    description,
    // Shared links are meant to be opened by people, not indexed by search
    // engines — the owner shared one link, not the whole trip publicly.
    robots: { index: false, follow: false },
    openGraph: { title, description, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function SharedTripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trip = await getSharedTrip(slug);

  if (!trip?.itinerary) notFound();

  const enriched = await enrichItinerary(trip.itinerary, trip.destination);

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <p className="text-muted-foreground mb-2 text-sm">Shared itinerary</p>
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
      </header>

      <TripView
        itinerary={enriched}
        destination={trip.destination}
        center={{ lat: trip.lat, lng: trip.lng }}
      />

      <aside className="bg-card mt-14 rounded-xl border p-6 text-center">
        <Compass className="text-primary mx-auto size-6" aria-hidden="true" />
        <h2 className="mt-3 font-semibold">Planning something yourself?</h2>
        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm text-pretty">
          Wayfare writes itineraries like this one in about a minute.
        </p>
        <Button asChild className="mt-5">
          <Link href="/plan">Plan a trip</Link>
        </Button>
      </aside>
    </main>
  );
}

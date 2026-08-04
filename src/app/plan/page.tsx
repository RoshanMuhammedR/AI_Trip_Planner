import type { Metadata } from 'next';
import { requireUser } from '@/server/auth-guards';
import { getPopularDestinations } from '@/server/places/popular';
import { listRecentDestinations } from '@/server/trips/queries';
import { PlanForm } from '@/features/trip-form/plan-form';

export const metadata: Metadata = {
  title: 'Plan a trip',
  description: 'Tell Wayfare where you are going and it will write the itinerary.',
};

export default async function PlanPage() {
  // Real enforcement. The proxy only checks that a cookie exists; this
  // validates the session against the database before rendering anything.
  const user = await requireUser('/plan');

  // Resolved server-side so the picker has something to show the instant it is
  // focused, with no client round trip and no Mapbox call for either list.
  const [popular, recent] = await Promise.all([
    getPopularDestinations(),
    listRecentDestinations(user.id),
  ]);

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Plan a trip</h1>
        <p className="text-muted-foreground mt-2 text-pretty">
          Four questions. The more specific your destination, the better the itinerary.
        </p>
      </header>

      <PlanForm popular={popular} recent={recent} />
    </main>
  );
}

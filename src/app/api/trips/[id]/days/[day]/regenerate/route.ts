import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/server/auth';
import { getOwnedTrip } from '@/server/trips/queries';
import { replaceItineraryDay } from '@/server/trips/mutations';
import { regenerateDay } from '@/server/ai/regenerate';

/** A single day is quick, but still a model call — give it room. */
export const maxDuration = 60;

/**
 * POST /api/trips/[id]/days/[day]/regenerate
 *
 * Re-rolls one day of an itinerary, leaving the rest untouched.
 *
 * This is a route handler rather than a server action for one concrete reason:
 * `maxDuration` can only be declared on a route segment, and an AI call needs an
 * explicit one. The non-AI edits (reorder, remove) are server actions, because
 * they are instant and benefit from `revalidatePath` without a fetch.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; day: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const { id, day } = await params;
  const dayNumber = Number(day);

  if (!Number.isInteger(dayNumber) || dayNumber < 1) {
    return NextResponse.json({ error: 'Invalid day.' }, { status: 400 });
  }

  // Ownership is part of the query. A trip belonging to someone else is
  // indistinguishable from one that does not exist.
  const trip = await getOwnedTrip(id, userId);

  if (!trip?.itinerary) {
    return NextResponse.json({ error: 'Trip not found.' }, { status: 404 });
  }

  const dayIndex = trip.itinerary.days.findIndex((entry) => entry.day === dayNumber);
  const existing = trip.itinerary.days[dayIndex];

  if (dayIndex === -1 || !existing) {
    return NextResponse.json({ error: 'That day is not part of this trip.' }, { status: 404 });
  }

  // Everything already scheduled on the other days, so the re-roll does not
  // hand back a place the traveller is visiting anyway.
  const excludePlaces = trip.itinerary.days
    .filter((entry) => entry.day !== dayNumber)
    .flatMap((entry) => entry.activities.map((activity) => activity.name));

  try {
    const fresh = await regenerateDay(
      {
        destination: trip.destination,
        budget: trip.budget,
        travelers: trip.travelers,
        dayNumber,
        totalDays: trip.days,
        excludePlaces,
        previousTheme: existing.theme,
      },
      request.signal,
    );

    await replaceItineraryDay(trip.id, userId, dayIndex, fresh);

    revalidatePath(`/trips/${trip.id}`);
    return NextResponse.json({ day: fresh });
  } catch (error) {
    if (request.signal.aborted) return new NextResponse(null, { status: 499 });

    console.error('[regenerate] Day regeneration failed', error);
    return NextResponse.json(
      { error: 'Could not rewrite that day. Please try again.' },
      { status: 502 },
    );
  }
}

import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { trips } from '@/server/db/schema';
import type { Trip } from '@/server/db/schema';
import { generateShareSlug } from '@/lib/slug';
import {
  itinerarySchema,
  daySchema,
  type Itinerary,
  type ItineraryDay,
  type TripInput,
} from '@/lib/schemas/trip';

/**
 * All write paths for trips.
 *
 * Two invariants are enforced here rather than at call sites:
 *   • `userId` always comes from the caller's verified session — never from the
 *     request body. The legacy client sent its own `userEmail` field, so a trip
 *     could be attributed to anyone.
 *   • An itinerary is re-validated against `itinerarySchema` immediately before
 *     it is persisted, so a malformed model response cannot reach the database.
 */

/** Reserves a row in `generating` state so the UI has something to poll/render. */
export async function createPendingTrip(userId: string, input: TripInput): Promise<Trip> {
  const [trip] = await db
    .insert(trips)
    .values({
      userId,
      destination: input.destination,
      lat: input.lat,
      lng: input.lng,
      days: input.days,
      budget: input.budget,
      travelers: input.travelers,
      status: 'generating',
    })
    .returning();

  if (!trip) throw new Error('Failed to create trip row');
  return trip;
}

/** Validates and stores a completed itinerary. Throws if the shape is wrong. */
export async function completeTrip(
  tripId: string,
  userId: string,
  itinerary: Itinerary,
): Promise<void> {
  const parsed = itinerarySchema.parse(itinerary);

  await db
    .update(trips)
    .set({ itinerary: parsed, status: 'ready', error: null })
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)));
}

/**
 * Records a generation failure.
 *
 * This state is the direct answer to the legacy hang: there, a thrown error
 * skipped `setSearching(false)`, so the button spun forever and the user was
 * given no way to retry and no indication of what went wrong.
 */
export async function failTrip(tripId: string, userId: string, reason: string): Promise<void> {
  await db
    .update(trips)
    .set({ status: 'failed', error: reason.slice(0, 500) })
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)));
}

/** Turns sharing on (minting a slug once) or off. Returns the current slug. */
export async function setTripSharing(
  tripId: string,
  userId: string,
  shared: boolean,
): Promise<string | null> {
  const [existing] = await db
    .select({ shareSlug: trips.shareSlug, destination: trips.destination })
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .limit(1);

  if (!existing) throw new Error('Trip not found');

  if (!shared) {
    await db
      .update(trips)
      .set({ shareSlug: null })
      .where(and(eq(trips.id, tripId), eq(trips.userId, userId)));
    return null;
  }

  // Keep the existing slug so a link already shared with someone keeps working.
  if (existing.shareSlug) return existing.shareSlug;

  const slug = generateShareSlug(existing.destination);
  await db
    .update(trips)
    .set({ shareSlug: slug })
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)));

  return slug;
}

/** Deletes a trip, scoped to its owner. */
export async function deleteTrip(tripId: string, userId: string): Promise<void> {
  await db.delete(trips).where(and(eq(trips.id, tripId), eq(trips.userId, userId)));
}

// ---------------------------------------------------------------------------
// Itinerary editing
//
// The itinerary is one `jsonb` column, so the naive "read the document, change
// it in JavaScript, write it back" pattern loses a concurrent edit: two
// requests both read version N and both write version N+1, and one change
// disappears.
//
// Each edit below therefore writes with a single `jsonb_set`, which Postgres
// applies atomically against whatever the current value is. The day being
// changed is always validated first, so an invalid fragment can never be
// written even though the whole document is not re-parsed on the way out.
// ---------------------------------------------------------------------------

/**
 * Replaces one day in place.
 *
 * `dayIndex` is the array position, not the human day number — they diverge if
 * a day is ever missing, so the caller resolves it from the loaded document.
 */
export async function replaceItineraryDay(
  tripId: string,
  userId: string,
  dayIndex: number,
  day: ItineraryDay,
): Promise<void> {
  const validated = daySchema.parse(day);

  await db
    .update(trips)
    .set({
      itinerary: sql`jsonb_set(${trips.itinerary}, ${`{days,${dayIndex}}`}::text[], ${JSON.stringify(validated)}::jsonb, false)`,
    })
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)));
}

/**
 * Rewrites a day's activity list — used by both reorder and remove, since both
 * are "this day now has these stops, in this order".
 *
 * Takes the already-loaded day so the new array can be validated against
 * `daySchema` before it touches the database. That validation is what enforces
 * "a day must keep at least one stop", rather than a separate hand-written
 * check that could drift from the schema.
 */
export async function replaceDayActivities(
  tripId: string,
  userId: string,
  dayIndex: number,
  day: ItineraryDay,
  activities: ItineraryDay['activities'],
): Promise<void> {
  await replaceItineraryDay(tripId, userId, dayIndex, { ...day, activities });
}

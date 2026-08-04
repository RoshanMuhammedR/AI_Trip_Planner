'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/server/auth-guards';
import { getOwnedTrip } from '@/server/trips/queries';
import { replaceDayActivities } from '@/server/trips/mutations';
import { MIN_ACTIVITIES_PER_DAY } from '@/lib/schemas/trip';

/**
 * Non-AI itinerary edits: reordering and removing stops.
 *
 * Like every server action in this codebase, these are public HTTP endpoints
 * rather than private function calls, so each one re-establishes identity with
 * `requireUser()` and loads the trip through an owner-scoped query. A caller
 * cannot act on someone else's trip by supplying its id.
 */

const tripIdSchema = z.string().uuid();

export type EditResult = { ok: true } | { ok: false; error: string };

/** Loads a trip the caller owns and locates one of its days. */
async function loadDay(tripId: string, dayNumber: number) {
  const user = await requireUser();

  if (!tripIdSchema.safeParse(tripId).success) return null;

  const trip = await getOwnedTrip(tripId, user.id);
  if (!trip?.itinerary) return null;

  const dayIndex = trip.itinerary.days.findIndex((entry) => entry.day === dayNumber);
  const day = trip.itinerary.days[dayIndex];
  if (dayIndex === -1 || !day) return null;

  return { userId: user.id, trip, day, dayIndex };
}

/**
 * Moves one stop up or down within its day.
 *
 * The index is validated against the day actually stored, so a stale client
 * (one whose page was rendered before another edit) cannot reorder by writing
 * past the end of the array.
 */
export async function moveActivityAction(
  tripId: string,
  dayNumber: number,
  fromIndex: number,
  direction: 'up' | 'down',
): Promise<EditResult> {
  const loaded = await loadDay(tripId, dayNumber);
  if (!loaded) return { ok: false, error: 'That trip could not be found.' };

  const { userId, trip, day, dayIndex } = loaded;
  const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;

  if (
    fromIndex < 0 ||
    fromIndex >= day.activities.length ||
    toIndex < 0 ||
    toIndex >= day.activities.length
  ) {
    return { ok: false, error: 'That stop cannot move any further.' };
  }

  const activities = [...day.activities];
  const [moved] = activities.splice(fromIndex, 1);
  if (!moved) return { ok: false, error: 'That stop could not be moved.' };
  activities.splice(toIndex, 0, moved);

  // Travel times describe the hop from the previous stop, so they are wrong the
  // moment the order changes. Clearing them is honest; inventing new ones would
  // need another model call for what is meant to be an instant edit.
  const renumbered = activities.map((activity, index) => ({
    ...activity,
    travelFromPrevious: index === 0 ? '—' : activity.travelFromPrevious,
  }));

  try {
    await replaceDayActivities(trip.id, userId, dayIndex, day, renumbered);
    revalidatePath(`/trips/${trip.id}`);
    return { ok: true };
  } catch (error) {
    console.error('[itinerary] Reorder failed', error);
    return { ok: false, error: 'Could not save the new order.' };
  }
}

/** Removes a stop, refusing to empty a day. */
export async function removeActivityAction(
  tripId: string,
  dayNumber: number,
  index: number,
): Promise<EditResult> {
  const loaded = await loadDay(tripId, dayNumber);
  if (!loaded) return { ok: false, error: 'That trip could not be found.' };

  const { userId, trip, day, dayIndex } = loaded;

  if (index < 0 || index >= day.activities.length) {
    return { ok: false, error: 'That stop could not be found.' };
  }

  // `daySchema` requires at least one activity, so removing the last one would
  // fail validation on write. Catching it here gives a useful message instead
  // of a schema error.
  if (day.activities.length <= MIN_ACTIVITIES_PER_DAY) {
    return {
      ok: false,
      error: 'A day needs at least one stop. Regenerate the day instead.',
    };
  }

  const activities = day.activities
    .filter((_, position) => position !== index)
    .map((activity, position) => ({
      ...activity,
      travelFromPrevious: position === 0 ? '—' : activity.travelFromPrevious,
    }));

  try {
    await replaceDayActivities(trip.id, userId, dayIndex, day, activities);
    revalidatePath(`/trips/${trip.id}`);
    return { ok: true };
  } catch (error) {
    console.error('[itinerary] Remove failed', error);
    return { ok: false, error: 'Could not remove that stop.' };
  }
}

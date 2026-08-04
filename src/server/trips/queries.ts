import 'server-only';

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { trips } from '@/server/db/schema';
import type { Trip } from '@/server/db/schema';
import type { ResolvedDestination } from '@/lib/schemas/destination';

/**
 * All read paths for trips live here.
 *
 * Every function takes the viewer's identity as an argument and filters in SQL.
 * There is deliberately no `getTripById(id)` that returns a row without an
 * ownership predicate — the legacy `ViewTrip` page called exactly that shape of
 * function (`getDoc(doc(db,'AITrips',tripId))`) and rendered whatever came back,
 * which made every trip in the system world-readable to anyone with an ID.
 */

/** Trips belonging to a user, newest first. */
export async function listTripsForUser(userId: string): Promise<Trip[]> {
  return db.select().from(trips).where(eq(trips.userId, userId)).orderBy(desc(trips.createdAt));
}

/** A trip, only if this user owns it. Returns `null` otherwise — never throws. */
export async function getOwnedTrip(tripId: string, userId: string): Promise<Trip | null> {
  // A malformed UUID would make Postgres raise; treat it as "not found".
  if (!isUuid(tripId)) return null;

  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .limit(1);

  return trip ?? null;
}

/**
 * A trip by its public share slug.
 *
 * Only trips the owner has explicitly shared have a slug at all, so this needs
 * no viewer identity: possession of the slug *is* the grant. Failed and
 * still-generating trips are excluded so a half-written itinerary never leaks.
 */
export async function getSharedTrip(slug: string): Promise<Trip | null> {
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.shareSlug, slug), eq(trips.status, 'ready')))
    .limit(1);

  return trip ?? null;
}

/**
 * Distinct destinations this user has planned before, newest first.
 *
 * Powers the "Recent" row in the destination picker. It needs no new table and
 * no new lookup: the coordinates were already resolved when the trip was
 * created, so re-picking a recent destination costs nothing and skips Mapbox
 * entirely.
 */
export async function listRecentDestinations(
  userId: string,
  limit = 4,
): Promise<ResolvedDestination[]> {
  // DISTINCT ON keeps the newest row per destination; Postgres requires the
  // ORDER BY to lead with the DISTINCT ON expression, hence the two-stage sort.
  const rows = await db
    .selectDistinctOn([trips.destination], {
      destination: trips.destination,
      lat: trips.lat,
      lng: trips.lng,
      createdAt: trips.createdAt,
    })
    .from(trips)
    .where(eq(trips.userId, userId))
    .orderBy(trips.destination, desc(trips.createdAt));

  return rows
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)
    .map((row) => ({
      name: row.destination.split(',')[0]?.trim() || row.destination,
      label: row.destination,
      countryCode: null,
      lat: row.lat,
      lng: row.lng,
    }));
}

/** Count of a user's trips, for empty-state display. */
export async function countTripsForUser(userId: string): Promise<number> {
  const rows = await db.select({ id: trips.id }).from(trips).where(eq(trips.userId, userId));
  return rows.length;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

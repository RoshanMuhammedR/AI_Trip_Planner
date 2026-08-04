'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/server/auth-guards';
import { setTripSharing, deleteTrip } from '@/server/trips/mutations';

/**
 * Server actions are public HTTP endpoints, not private function calls. Each
 * one therefore re-establishes identity with `requireUser()` and passes that id
 * into a mutation that scopes its WHERE clause to the owner — a caller cannot
 * act on someone else's trip by supplying its id.
 */

const tripIdSchema = z.string().uuid();

export type ShareResult = { ok: true; slug: string | null } | { ok: false; error: string };

export async function toggleShareAction(tripId: string, shared: boolean): Promise<ShareResult> {
  const user = await requireUser();

  const parsed = tripIdSchema.safeParse(tripId);
  if (!parsed.success) return { ok: false, error: 'Unknown trip.' };

  try {
    const slug = await setTripSharing(parsed.data, user.id, shared);
    revalidatePath(`/trips/${parsed.data}`);
    return { ok: true, slug };
  } catch (error) {
    console.error('[trips] Failed to update sharing', error);
    return { ok: false, error: 'Could not update sharing. Try again.' };
  }
}

export async function deleteTripAction(tripId: string): Promise<void> {
  const user = await requireUser();

  const parsed = tripIdSchema.safeParse(tripId);
  if (!parsed.success) return;

  await deleteTrip(parsed.data, user.id);
  revalidatePath('/trips');
  redirect('/trips');
}

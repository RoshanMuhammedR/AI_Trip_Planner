import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { tripInputSchema, itinerarySchema } from '@/lib/schemas/trip';
import { streamItinerary } from '@/server/ai/generate';
import { createPendingTrip, completeTrip, failTrip } from '@/server/trips/mutations';

/** Generation can take longer than the default serverless limit. */
export const maxDuration = 60;

/**
 * POST /api/trips/generate
 *
 * The single entry point for AI generation, and the security boundary the old
 * architecture could not have:
 *
 *   1. session          — anonymous callers never reach the model
 *   2. input validation — a malformed body never reaches the model
 *   3. reserve a row    — so a failure is recorded rather than vanishing
 *   4. stream           — partial days render as they arrive
 *   5. persist          — only after re-validating the finished object
 *
 * The trip id is returned in the `X-Trip-Id` response header so the client can
 * link to the saved trip while the body is still streaming.
 *
 * Note: this endpoint is gated by authentication only. There is deliberately no
 * rate limit, so a signed-in user can consume the Gemini free-tier quota by
 * repeatedly generating.
 */
export async function POST(request: NextRequest) {
  // 1. Identity.
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { error: 'You must be signed in to generate a trip.' },
      { status: 401 },
    );
  }

  // 2. Input.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const parsed = tripInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid trip details.', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // 3. Reserve the row before calling the model, so a crash mid-generation is
  //    still visible to the user as a failed trip rather than disappearing.
  let tripId: string;
  try {
    const trip = await createPendingTrip(userId, input);
    tripId = trip.id;
  } catch (error) {
    console.error('[generate] Could not create trip row', error);
    return NextResponse.json({ error: 'Could not start the trip. Try again.' }, { status: 500 });
  }

  // 4 & 5. Stream, then persist on completion.
  try {
    const result = streamItinerary(input, request.signal);

    void result.object
      .then(async (object) => {
        const validated = itinerarySchema.safeParse(object);

        if (!validated.success) {
          console.error('[generate] Model output failed validation', validated.error.issues);
          await failTrip(tripId, userId, 'The generated itinerary was incomplete.');
          return;
        }

        if (validated.data.days.length !== input.days) {
          console.warn(
            `[generate] Expected ${input.days} days, model returned ${validated.data.days.length}`,
          );
        }

        await completeTrip(tripId, userId, validated.data);
      })
      .catch(async (error: unknown) => {
        // Reaches here on abort, provider error, or quota exhaustion. The old
        // code had no equivalent path: the promise rejected, `setSearching(false)`
        // never ran, and the button spun forever.
        const aborted = request.signal.aborted;
        console.error('[generate] Generation failed', error);
        await failTrip(
          tripId,
          userId,
          aborted ? 'Generation was cancelled.' : 'The travel service was unavailable.',
        );
      });

    return result.toTextStreamResponse({
      headers: {
        'X-Trip-Id': tripId,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[generate] Could not start stream', error);
    await failTrip(tripId, userId, 'Could not reach the travel service.');
    return NextResponse.json(
      { error: 'Could not reach the travel service. Try again.' },
      { status: 502 },
    );
  }
}

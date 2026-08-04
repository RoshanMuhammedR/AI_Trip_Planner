import 'server-only';

import { streamObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { itinerarySchema, type TripInput } from '@/lib/schemas/trip';
import { getEnv } from '@/lib/env';
import { buildItineraryPrompt, ITINERARY_SYSTEM_PROMPT } from './prompt';

/**
 * The Gemini call.
 *
 * This module is the reason the whole app moved to a server framework. In the
 * legacy build this ran in the browser with `import.meta.env.VITE_GEMINI_API_KEY`,
 * which Vite inlines into the production bundle — so the key was readable by
 * anyone who opened devtools on the deployed site, and billable without limit.
 *
 * Two further changes:
 *   • `gemini-2.5-flash` replaces `gemini-2.5-pro`. For structured itinerary
 *     text the quality difference is small and flash is far cheaper and faster,
 *     which matters for a project meant to cost nothing to run.
 *   • Output is constrained by `itinerarySchema` instead of being regex-scraped
 *     out of a markdown code fence, so a malformed response is a typed error
 *     rather than `undefined` silently written to the database.
 */

/** Provider instantiated explicitly so the key comes from validated env. */
function model() {
  const google = createGoogleGenerativeAI({
    apiKey: getEnv().GOOGLE_GENERATIVE_AI_API_KEY,
  });

  return google('gemini-2.5-flash');
}

export type ItineraryStream = ReturnType<typeof streamItinerary>;

/**
 * Streams a partial itinerary as the model produces it.
 *
 * Returning the stream rather than an awaited object is what lets the UI render
 * day 1 while day 4 is still being written, instead of showing a spinner for
 * the entire generation the way the old form did.
 */
export function streamItinerary(input: TripInput, signal?: AbortSignal) {
  return streamObject({
    model: model(),
    schema: itinerarySchema,
    system: ITINERARY_SYSTEM_PROMPT,
    prompt: buildItineraryPrompt(input),
    temperature: 0.7,
    abortSignal: signal,
    maxRetries: 2,
  });
}

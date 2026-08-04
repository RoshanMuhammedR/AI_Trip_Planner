import 'server-only';

import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  daySchema,
  BUDGET_LABELS,
  TRAVELER_LABELS,
  type Budget,
  type ItineraryDay,
  type Travelers,
} from '@/lib/schemas/trip';
import { getEnv } from '@/lib/env';
import { ITINERARY_SYSTEM_PROMPT } from './prompt';

/**
 * Re-rolls a single day of an existing itinerary.
 *
 * Deliberately `generateObject` rather than `streamObject`: one day is three to
 * five stops, which the model produces in a few seconds. Streaming would add a
 * partial-object rendering path for no perceptible gain, where the full-trip
 * generation genuinely needs it.
 *
 * The important input is `excludePlaces` — every stop already present in the
 * *other* days. Without it a re-roll happily suggests the cathedral that is
 * already on day 1, which is the obvious failure mode of regenerating one part
 * of a document in isolation.
 */

export type RegenerateDayInput = {
  destination: string;
  budget: Budget;
  travelers: Travelers;
  dayNumber: number;
  totalDays: number;
  /** Place names used on other days; the model must avoid all of them. */
  excludePlaces: string[];
  /** Theme of the day being replaced, used only as a hint to steer away. */
  previousTheme?: string;
};

function model() {
  const google = createGoogleGenerativeAI({
    apiKey: getEnv().GOOGLE_GENERATIVE_AI_API_KEY,
  });
  return google('gemini-2.5-flash');
}

function buildPrompt(input: RegenerateDayInput): string {
  const budget = BUDGET_LABELS[input.budget].label;
  const travelers = TRAVELER_LABELS[input.travelers].label;

  const lines = [
    `Rewrite day ${input.dayNumber} of a ${input.totalDays}-day trip to ${input.destination}.`,
    '',
    `Traveller profile: ${travelers}. Budget: ${budget}.`,
    '',
    'Requirements:',
    `- The result is a single day, numbered exactly ${input.dayNumber}.`,
    '- Give it 3 to 5 stops, ordered so the route is geographically sensible.',
    '- Group the day around one area or theme so travel time between stops stays low.',
    '- Coordinates must be real, accurate to at least 4 decimal places.',
    '- Every place must genuinely exist in or near the destination. Never invent one.',
    '- `travelFromPrevious` states time and mode from the preceding stop. Use "—" for the first.',
  ];

  if (input.previousTheme) {
    lines.push(
      `- The previous version of this day was themed "${input.previousTheme}". Take a different angle.`,
    );
  }

  if (input.excludePlaces.length > 0) {
    lines.push(
      '',
      'These places already appear on other days of this trip. Do not use any of them, and do not suggest anything that would duplicate the experience:',
      ...input.excludePlaces.map((place) => `  - ${place}`),
    );
  }

  return lines.join('\n');
}

export async function regenerateDay(
  input: RegenerateDayInput,
  signal?: AbortSignal,
): Promise<ItineraryDay> {
  const { object } = await generateObject({
    model: model(),
    schema: daySchema,
    system: ITINERARY_SYSTEM_PROMPT,
    prompt: buildPrompt(input),
    temperature: 0.9, // Higher than the full generation: a re-roll should differ.
    abortSignal: signal,
    maxRetries: 2,
  });

  // The model occasionally renumbers; the caller's day index is authoritative.
  return { ...object, day: input.dayNumber };
}

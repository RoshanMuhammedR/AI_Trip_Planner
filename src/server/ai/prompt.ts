import 'server-only';

import { BUDGET_LABELS, TRAVELER_LABELS, type TripInput } from '@/lib/schemas/trip';

/**
 * Prompt construction.
 *
 * The legacy prompt was a ~250-line hardcoded Las Vegas exchange pasted out of
 * AI Studio, which included the model's own internal reasoning transcript
 * ("**Searching Vegas Hotels**…"). That was sent as input tokens on every
 * request, cost real money, and taught the model nothing useful — a
 * thinking transcript is not a useful few-shot exemplar.
 *
 * It is unnecessary now for a more basic reason: the output shape is enforced
 * by `itinerarySchema` through structured output, so the prompt does not need
 * to demonstrate JSON formatting at all. It only has to convey editorial
 * intent — what makes an itinerary good.
 */

const BUDGET_GUIDANCE: Record<TripInput['budget'], string> = {
  cheap:
    'Prioritise free and low-cost attractions, hostels or budget hotels, street food and public transport. Give concrete prices so the traveller can plan.',
  moderate:
    'Balance well-reviewed mid-range hotels with a mix of paid attractions and free wandering. One notable restaurant per day is appropriate.',
  luxury:
    'Favour highly rated hotels, private or skip-the-line experiences, and notable restaurants. Comfort and time efficiency matter more than price.',
};

const TRAVELER_GUIDANCE: Record<TripInput['travelers'], string> = {
  solo: 'Assume one traveller. Favour walkable areas, social or communal spots, and note anywhere that is awkward or unsafe to visit alone after dark.',
  couple:
    'Assume two travellers. Include a few scenic or relaxed moments — a viewpoint at sunset, a long dinner — rather than packing every hour.',
  family:
    'Assume adults with children. Keep walking distances short, avoid long queues, and note which stops have food, toilets and stroller access.',
  friends:
    'Assume a group of five to ten. Favour places that take groups without reservations, and note where booking ahead is genuinely required.',
};

export function buildItineraryPrompt(input: TripInput): string {
  const budget = BUDGET_LABELS[input.budget].label;
  const travelers = TRAVELER_LABELS[input.travelers].label;

  return [
    `Plan a ${input.days}-day trip to ${input.destination}.`,
    '',
    `Traveller profile: ${travelers}. ${TRAVELER_GUIDANCE[input.travelers]}`,
    `Budget: ${budget}. ${BUDGET_GUIDANCE[input.budget]}`,
    '',
    'Requirements:',
    `- Produce exactly ${input.days} day${input.days === 1 ? '' : 's'}, numbered 1 to ${input.days}.`,
    '- Give each day 3 to 5 stops, ordered so the route is geographically sensible; do not zig-zag across the city.',
    '- Group each day around one area or theme so travel time between stops stays low.',
    '- Coordinates must be the real latitude and longitude of each specific place, accurate to at least 4 decimal places.',
    '- Every place must genuinely exist in or near the destination. Never invent a name, an address or a rating.',
    '- Prices and ratings should reflect typical current values. Use a range where exact figures vary.',
    '- `travelFromPrevious` states time and mode from the preceding stop, e.g. "12 min by metro". Use "—" for the first stop of each day.',
    '- Suggest 3 to 5 hotels suited to the budget, spread across useful neighbourhoods rather than clustered on one street.',
    '- Tips must be specific to this destination: transit passes, tipping norms, closing days, scams. No generic travel advice.',
    '',
    'Write in clear, concrete prose. No marketing language and no filler adjectives.',
  ].join('\n');
}

/**
 * A short system instruction. Kept separate from the user prompt so the model
 * treats it as standing policy rather than part of the request.
 */
export const ITINERARY_SYSTEM_PROMPT =
  'You are an experienced travel planner who knows how cities actually fit together. ' +
  'You give precise, verifiable detail and never fabricate places, coordinates or prices. ' +
  'If you are unsure of a value, give a realistic range rather than a false precise number.';

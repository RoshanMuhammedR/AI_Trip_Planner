import { z } from 'zod';

/**
 * The single source of truth for trip shape.
 *
 * This one module is consumed by three places that previously disagreed with
 * each other:
 *   1. the client form (validation + typed state),
 *   2. the Gemini call (as the structured-output schema), and
 *   3. the database write (parsed before it is persisted).
 *
 * The legacy app described its desired JSON in prose inside a prompt string and
 * then regex-scraped a ```json block out of the reply. Anything the model got
 * wrong reached Firestore unchecked, and a parse failure wrote `undefined`.
 */

// --- Enumerations ----------------------------------------------------------

export const BUDGETS = ['cheap', 'moderate', 'luxury'] as const;
export const TRAVELERS = ['solo', 'couple', 'family', 'friends'] as const;

export type Budget = (typeof BUDGETS)[number];
export type Travelers = (typeof TRAVELERS)[number];

/** Hard ceiling on trip length: bounds model cost and matches the day palette. */
export const MAX_TRIP_DAYS = 7;
export const MIN_TRIP_DAYS = 1;

/**
 * A day must keep at least this many stops.
 *
 * Used by `daySchema` below *and* by the remove-stop action, so the rule is
 * declared once — the action can give a helpful message instead of letting a
 * schema error surface, without the two definitions drifting apart.
 */
export const MIN_ACTIVITIES_PER_DAY = 1;

export const BUDGET_LABELS: Record<Budget, { label: string; hint: string; icon: string }> = {
  cheap: { label: 'Budget', hint: 'Hostels, street food, public transport', icon: '🎒' },
  moderate: { label: 'Moderate', hint: 'Comfortable hotels and a few splurges', icon: '🧳' },
  luxury: { label: 'Luxury', hint: 'Top-tier stays and private transfers', icon: '✨' },
};

export const TRAVELER_LABELS: Record<Travelers, { label: string; hint: string; icon: string }> = {
  solo: { label: 'Solo', hint: 'Just me', icon: '🧍' },
  couple: { label: 'Couple', hint: 'Two travellers', icon: '💞' },
  family: { label: 'Family', hint: 'With kids in tow', icon: '👨‍👩‍👧' },
  friends: { label: 'Friends', hint: 'A group trip', icon: '🎉' },
};

// --- Geography -------------------------------------------------------------

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90).describe('Latitude in decimal degrees'),
  lng: z.number().min(-180).max(180).describe('Longitude in decimal degrees'),
});

export type Coordinates = z.infer<typeof coordinatesSchema>;

// --- Trip request (what the user asks for) ---------------------------------

export const tripInputSchema = z.object({
  destination: z.string().trim().min(2, 'Choose a destination').max(120),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  days: z.coerce
    .number()
    .int('Whole days only')
    .min(MIN_TRIP_DAYS, `At least ${MIN_TRIP_DAYS} day`)
    .max(MAX_TRIP_DAYS, `At most ${MAX_TRIP_DAYS} days`),
  budget: z.enum(BUDGETS),
  travelers: z.enum(TRAVELERS),
});

export type TripInput = z.infer<typeof tripInputSchema>;

// --- Itinerary (what the model returns) ------------------------------------
//
// Kept deliberately flat and fully required. Gemini's structured-output mode
// supports only a subset of JSON Schema, and optional/union-heavy schemas are
// where it most often degrades. Where a value may legitimately be unknown the
// model is instructed to return a descriptive string such as "Free" instead.

export const hotelSchema = z.object({
  name: z.string().describe('Hotel name'),
  address: z.string().describe('Full street address'),
  pricePerNight: z.string().describe('Approximate nightly price range, e.g. "$90–140"'),
  rating: z.number().min(0).max(5).describe('Rating out of 5'),
  description: z.string().describe('One or two sentences on why it suits this traveller'),
  coordinates: coordinatesSchema,
});

export const activitySchema = z.object({
  name: z.string().describe('Name of the place or activity'),
  description: z.string().describe('Two or three sentences on what to expect'),
  coordinates: coordinatesSchema,
  ticketPrice: z.string().describe('Entry cost, or "Free"'),
  rating: z.number().min(0).max(5).describe('Rating out of 5'),
  bestTimeToVisit: z.string().describe('e.g. "Early morning", "Sunset"'),
  durationMinutes: z.number().int().min(0).describe('Suggested time on site, in minutes'),
  travelFromPrevious: z
    .string()
    .describe('Travel time and mode from the previous stop, e.g. "12 min by metro". "—" if first'),
});

export const daySchema = z.object({
  day: z.number().int().min(1).describe('1-indexed day number'),
  theme: z.string().describe('Short title for the day, e.g. "Old town and riverside"'),
  activities: z
    .array(activitySchema)
    .min(MIN_ACTIVITIES_PER_DAY)
    .describe('Stops in visiting order'),
});

export const itinerarySchema = z.object({
  summary: z.string().describe('Two or three sentences framing the whole trip'),
  bestTimeToVisit: z.string().describe('Best season or months to make this trip'),
  hotels: z.array(hotelSchema).min(1).describe('Three to five stays matching the budget'),
  days: z.array(daySchema).min(1).describe('One entry per requested day, in order'),
  tips: z.array(z.string()).describe('Three to five practical, destination-specific tips'),
});

export type Hotel = z.infer<typeof hotelSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type ItineraryDay = z.infer<typeof daySchema>;
export type Itinerary = z.infer<typeof itinerarySchema>;

// --- Helpers ---------------------------------------------------------------

/** Stable CSS custom property for a day's colour, shared by list and map. */
export function dayColorVar(day: number): string {
  const index = ((day - 1) % MAX_TRIP_DAYS) + 1;
  return `var(--day-${index})`;
}

/** Every activity across every day, flattened, tagged with its day number. */
export function flattenActivities(itinerary: Pick<Itinerary, 'days'>) {
  return itinerary.days.flatMap((d) =>
    d.activities.map((activity, index) => ({ ...activity, day: d.day, index })),
  );
}

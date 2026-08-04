'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useObject } from '@ai-sdk/react';
import { toast } from 'sonner';
import { ArrowRight, CalendarDays, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DestinationSearch } from './destination-search';
import { ChoiceCards, type Choice } from './choice-cards';
import { StreamingPreview } from './streaming-preview';
import {
  BUDGETS,
  BUDGET_LABELS,
  TRAVELERS,
  TRAVELER_LABELS,
  MAX_TRIP_DAYS,
  MIN_TRIP_DAYS,
  itinerarySchema,
  tripInputSchema,
  type Budget,
  type Travelers,
} from '@/lib/schemas/trip';
import type { DestinationPreset, ResolvedDestination } from '@/lib/schemas/destination';

const BUDGET_CHOICES: readonly Choice<Budget>[] = BUDGETS.map((value) => ({
  value,
  label: BUDGET_LABELS[value].label,
  hint: BUDGET_LABELS[value].hint,
  icon: BUDGET_LABELS[value].icon,
}));

const TRAVELER_CHOICES: readonly Choice<Travelers>[] = TRAVELERS.map((value) => ({
  value,
  label: TRAVELER_LABELS[value].label,
  hint: TRAVELER_LABELS[value].hint,
  icon: TRAVELER_LABELS[value].icon,
}));

type FieldErrors = Partial<Record<'destination' | 'days' | 'budget' | 'travelers', string>>;

export function PlanForm({
  popular,
  recent,
}: {
  popular: DestinationPreset[];
  recent: ResolvedDestination[];
}) {
  const router = useRouter();

  const [place, setPlace] = useState<ResolvedDestination | null>(null);
  const [days, setDays] = useState('3');
  const [budget, setBudget] = useState<Budget | null>(null);
  const [travelers, setTravelers] = useState<Travelers | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const tripIdRef = useRef<string | null>(null);

  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/trips/generate',
    schema: itinerarySchema,

    /*
     * Custom fetch used as a middleware for two things the hook does not expose:
     *   • capturing the `X-Trip-Id` header so we can navigate to the saved trip
     *   • surfacing the server's JSON error message (e.g. a 429 with a
     *     retry-after) instead of a bare status code
     */
    fetch: async (input, init) => {
      const response = await fetch(input, init);

      const tripId = response.headers.get('X-Trip-Id');
      if (tripId) tripIdRef.current = tripId;

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Something went wrong generating your trip.');
      }

      return response;
    },

    onFinish({ error: finishError }) {
      if (finishError) {
        toast.error('The itinerary came back incomplete. Please try again.');
        return;
      }

      const tripId = tripIdRef.current;
      if (!tripId) {
        toast.error('Your trip was generated but could not be opened.');
        return;
      }

      toast.success('Your itinerary is ready.');
      router.push(`/trips/${tripId}`);
    },

    onError(streamError) {
      toast.error(streamError.message || 'Could not generate your trip.');
    },
  });

  function validate() {
    const parsed = tripInputSchema.safeParse({
      destination: place?.label ?? '',
      lat: place?.lat,
      lng: place?.lng,
      days,
      budget,
      travelers,
    });

    if (parsed.success) {
      setErrors({});
      return parsed.data;
    }

    // The legacy check was `form?.noOfDays > 5 || !form?.budget || ...`, which
    // had no lower bound and no presence check — a blank days field passed
    // straight through (`undefined > 5` is false) and reached the model as the
    // literal string "undefined".
    const fieldErrors = parsed.error.flatten().fieldErrors;
    setErrors({
      destination: fieldErrors.destination?.[0] ?? (place ? undefined : 'Choose a destination'),
      days: fieldErrors.days?.[0],
      budget: fieldErrors.budget ? 'Pick a budget' : undefined,
      travelers: fieldErrors.travelers ? 'Pick who is travelling' : undefined,
    });
    return null;
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isLoading) return;

    const input = validate();
    if (!input) {
      toast.error('Please complete the highlighted fields.');
      return;
    }

    tripIdRef.current = null;
    submit(input);
  }

  if (isLoading || object) {
    return (
      <StreamingPreview
        destination={place?.name ?? 'your trip'}
        requestedDays={Number(days) || 0}
        itinerary={object}
        isLoading={isLoading}
        error={error}
        onCancel={stop}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-10">
      <div>
        <h2 className="mb-3 text-lg font-medium">
          <label htmlFor="destination-input">Where are you going?</label>
        </h2>
        <DestinationSearch
          value={place}
          onSelect={setPlace}
          popular={popular}
          recent={recent}
          error={errors.destination}
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">
          <label htmlFor="days">How many days?</label>
        </h2>
        <div className="relative max-w-40">
          <CalendarDays
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="days"
            name="days"
            type="number"
            inputMode="numeric"
            min={MIN_TRIP_DAYS}
            max={MAX_TRIP_DAYS}
            value={days}
            onChange={(event) => setDays(event.target.value)}
            aria-invalid={errors.days ? true : undefined}
            aria-describedby={errors.days ? 'days-error' : 'days-hint'}
            className="pl-9"
          />
        </div>
        {errors.days ? (
          <p id="days-error" role="alert" className="text-destructive mt-2 text-sm">
            {errors.days}
          </p>
        ) : (
          <p id="days-hint" className="text-muted-foreground mt-2 text-sm">
            Between {MIN_TRIP_DAYS} and {MAX_TRIP_DAYS} days.
          </p>
        )}
      </div>

      <ChoiceCards
        name="budget"
        legend="What is your budget?"
        choices={BUDGET_CHOICES}
        value={budget}
        onChange={setBudget}
        error={errors.budget}
      />

      <ChoiceCards
        name="travelers"
        legend="Who is coming?"
        choices={TRAVELER_CHOICES}
        value={travelers}
        onChange={setTravelers}
        error={errors.travelers}
        columns={4}
      />

      <div className="flex justify-end border-t pt-6">
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles /> Generate itinerary <ArrowRight />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Loader2, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import { moveActivityAction, removeActivityAction } from '@/server/actions/itinerary';
import { cn } from '@/lib/utils';

/**
 * Edit controls for a day and its stops.
 *
 * Every control is a real `<button>` with an accessible name, so the whole
 * feature is keyboard-operable without a roving-tabindex implementation. Up and
 * down buttons were chosen over drag-and-drop deliberately: drag needs a
 * library and a parallel keyboard interface to be usable at all, and buttons
 * get both for free.
 */

const controlClass =
  'text-muted-foreground hover:text-foreground hover:bg-secondary focus-visible:ring-ring grid size-7 place-items-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-30';

export function ActivityControls({
  tripId,
  dayNumber,
  index,
  total,
  activityName,
}: {
  tripId: string;
  dayNumber: number;
  index: number;
  total: number;
  activityName: string;
}) {
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        className={controlClass}
        disabled={pending || index === 0}
        onClick={() => run(() => moveActivityAction(tripId, dayNumber, index, 'up'))}
        aria-label={`Move ${activityName} earlier in day ${dayNumber}`}
      >
        <ArrowUp className="size-3.5" aria-hidden="true" />
      </button>

      <button
        type="button"
        className={controlClass}
        disabled={pending || index === total - 1}
        onClick={() => run(() => moveActivityAction(tripId, dayNumber, index, 'down'))}
        aria-label={`Move ${activityName} later in day ${dayNumber}`}
      >
        <ArrowDown className="size-3.5" aria-hidden="true" />
      </button>

      <button
        type="button"
        className={cn(controlClass, 'hover:text-destructive')}
        disabled={pending}
        onClick={() => run(() => removeActivityAction(tripId, dayNumber, index))}
        aria-label={`Remove ${activityName} from day ${dayNumber}`}
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function RegenerateDayButton({
  tripId,
  dayNumber,
  onPendingChange,
}: {
  tripId: string;
  dayNumber: number;
  onPendingChange: (pending: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function regenerate() {
    setPending(true);
    onPendingChange(true);

    try {
      const response = await fetch(`/api/trips/${tripId}/days/${dayNumber}/regenerate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Could not rewrite that day.');
      }

      toast.success(`Day ${dayNumber} rewritten.`);
      // The route already revalidated the path; refresh pulls the new server
      // render, including images resolved for any newly-suggested places.
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not rewrite that day.');
    } finally {
      setPending(false);
      onPendingChange(false);
    }
  }

  return (
    <button
      type="button"
      onClick={regenerate}
      disabled={pending}
      className="text-muted-foreground hover:text-foreground hover:bg-secondary focus-visible:ring-ring flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50"
      aria-label={`Rewrite day ${dayNumber} with different places`}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <RotateCcw className="size-3.5" aria-hidden="true" />
      )}
      {pending ? 'Rewriting…' : 'Regenerate'}
    </button>
  );
}

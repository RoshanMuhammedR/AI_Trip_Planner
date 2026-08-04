'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Route-level error boundary.
 *
 * The legacy app had none, so any thrown render error produced React Router's
 * default stack-trace page — or, in the common case of a rejected promise
 * inside an event handler, no visible feedback at all.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[boundary] Unhandled error', error);
  }, [error]);

  return (
    <main id="main" className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <span className="bg-destructive/10 text-destructive mx-auto flex size-12 items-center justify-center rounded-full">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground mt-2 text-sm text-pretty">
        The page failed to load. Trying again usually fixes it.
      </p>
      {error.digest ? (
        <p className="text-muted-foreground mt-3 font-mono text-xs">Reference: {error.digest}</p>
      ) : null}
      <Button className="mt-7" onClick={reset}>
        <RotateCcw /> Try again
      </Button>
    </main>
  );
}

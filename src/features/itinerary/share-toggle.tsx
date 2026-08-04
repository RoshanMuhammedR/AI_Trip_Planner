'use client';

import { useState, useTransition } from 'react';
import { Check, Copy, Globe, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { toggleShareAction } from '@/server/actions/trips';

/**
 * Private-by-default sharing.
 *
 * The legacy app had no concept of visibility: every trip was readable by
 * anyone who guessed an ID, and the IDs were millisecond timestamps. Here a
 * trip is owner-only until this control mints an unguessable slug, which turns
 * an accidental leak into an intentional feature.
 */
export function ShareToggle({
  tripId,
  initialSlug,
}: {
  tripId: string;
  initialSlug: string | null;
}) {
  const [slug, setSlug] = useState(initialSlug);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const shareUrl =
    slug && typeof window !== 'undefined' ? `${window.location.origin}/t/${slug}` : null;

  function onToggle() {
    startTransition(async () => {
      const result = await toggleShareAction(tripId, !slug);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setSlug(result.slug);
      toast.success(
        result.slug ? 'Anyone with the link can now view this trip.' : 'Sharing turned off.',
      );
    });
  }

  async function onCopy() {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Copy the link from the address bar instead.');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={slug ? 'secondary' : 'outline'}
        size="sm"
        onClick={onToggle}
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : slug ? (
          <Globe aria-hidden="true" />
        ) : (
          <Lock aria-hidden="true" />
        )}
        {slug ? 'Shared' : 'Private'}
      </Button>

      {shareUrl ? (
        <Button variant="ghost" size="sm" onClick={onCopy}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      ) : null}
    </div>
  );
}

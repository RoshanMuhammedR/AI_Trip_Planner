import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <Compass className="text-muted-foreground mx-auto size-10" aria-hidden="true" />
      <h1 className="mt-5 text-2xl font-bold tracking-tight">Nothing here</h1>
      <p className="text-muted-foreground mt-2 text-sm text-pretty">
        This page does not exist, or the trip is private and not shared with you.
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/trips">My trips</Link>
        </Button>
      </div>
    </main>
  );
}

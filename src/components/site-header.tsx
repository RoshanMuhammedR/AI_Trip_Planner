import { Suspense } from 'react';
import Link from 'next/link';
import { Compass, Plus } from 'lucide-react';
import { getCurrentUser } from '@/server/auth-guards';
import { signOutAction } from '@/server/actions/auth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Auth-dependent portion of the header.
 *
 * Split out and wrapped in Suspense so the static shell (logo, theme toggle)
 * streams immediately while the session lookup resolves, instead of blocking
 * the whole page on a database round trip.
 */
async function AuthNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Button asChild size="sm">
        <Link href="/signin">Sign in</Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
        <Link href="/plan">
          <Plus /> Plan a trip
        </Link>
      </Button>
      <UserMenu user={user} signOutAction={signOutAction} />
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
          aria-label="Wayfare home"
        >
          <Compass className="text-primary size-5" aria-hidden="true" />
          <span>Wayfare</span>
        </Link>

        <nav className="flex items-center gap-2" aria-label="Main">
          <ThemeToggle />
          <Suspense fallback={<Skeleton className="size-9 rounded-full" />}>
            <AuthNav />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

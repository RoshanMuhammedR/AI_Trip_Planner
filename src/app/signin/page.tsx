import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Compass } from 'lucide-react';
import { getCurrentUser } from '@/server/auth-guards';
import { signInWithGoogle } from '@/server/actions/auth';
import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/google-icon';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: 'That email is already registered with a different sign-in method.',
  AccessDenied: 'Access was denied. Please try again.',
  Configuration: 'Sign-in is misconfigured. Please try again later.',
  Verification: 'That sign-in link has expired. Please try again.',
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;

  if (await getCurrentUser()) {
    redirect(callbackUrl && isSafePath(callbackUrl) ? callbackUrl : '/trips');
  }

  const message = error ? (ERROR_MESSAGES[error] ?? 'Something went wrong signing you in.') : null;

  return (
    <main id="main" className="mx-auto flex max-w-md flex-col items-center px-4 py-20 sm:px-6">
      <Compass className="text-primary size-9" aria-hidden="true" />
      <h1 className="mt-5 text-2xl font-bold tracking-tight">Sign in to Wayfare</h1>
      <p className="text-muted-foreground mt-2 text-center text-sm text-pretty">
        Your trips are saved to your account so you can come back to them, and stay private until
        you choose to share.
      </p>

      {message ? (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive mt-6 w-full rounded-lg px-4 py-3 text-sm"
        >
          {message}
        </p>
      ) : null}

      <form
        className="mt-8 w-full"
        action={async () => {
          'use server';
          // The redirect target is validated to a same-site path so this cannot
          // be used as an open redirect.
          await signInWithGoogle(callbackUrl && isSafePath(callbackUrl) ? callbackUrl : '/trips');
        }}
      >
        <Button type="submit" size="lg" variant="outline" className="w-full">
          <GoogleIcon /> Continue with Google
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-xs text-pretty">
        We only read your name, email address and profile picture.
      </p>
    </main>
  );
}

/** Same-site, non-protocol-relative paths only. */
function isSafePath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//');
}

import 'server-only';

import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/** The signed-in user, or `null`. Never throws. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * The signed-in user, or a redirect to sign-in.
 *
 * Authorisation is enforced here — at the data boundary — rather than in
 * middleware. Middleware runs before routing and can be bypassed by any code
 * path that reaches a server action or route handler directly, so treating it
 * as the security boundary would be a mistake. It is used only for UX
 * redirects; this function is what actually gates access.
 */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    const target = returnTo ? `/signin?callbackUrl=${encodeURIComponent(returnTo)}` : '/signin';
    redirect(target);
  }

  return user;
}

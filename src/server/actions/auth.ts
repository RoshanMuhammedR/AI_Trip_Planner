'use server';

import { signIn, signOut } from '@/server/auth';

/** Starts the Google OAuth flow. The exchange completes server-side. */
export async function signInWithGoogle(callbackUrl?: string) {
  await signIn('google', { redirectTo: callbackUrl || '/trips' });
}

/** Deletes the session row and clears the cookie. */
export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}

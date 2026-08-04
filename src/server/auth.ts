import 'server-only';

import NextAuth, { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/server/db';
import { users, accounts, sessions, verificationTokens } from '@/server/db/schema';

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user'];
  }
}

/**
 * Authentication.
 *
 * What changed from the legacy app, and why it matters:
 *
 *   Before: `useGoogleLogin` returned an access token, the client swapped it for
 *   a profile, and stored that profile as raw JSON in localStorage. Identity was
 *   whatever the browser said it was — `localStorage.setItem('user', ...)` in
 *   devtools made you anyone. Firestore never saw an authenticated principal, so
 *   no security rule could have been written against it.
 *
 *   Now: the OAuth exchange completes on the server, a session row is written to
 *   Postgres, and the browser holds only an opaque httpOnly cookie. The user id
 *   used for every authorisation decision comes from that row.
 *
 * `strategy: 'database'` (rather than JWT) is chosen so that sign-out and
 * account deletion revoke access immediately, instead of leaving a valid signed
 * token in the wild until it expires.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  session: {
    strategy: 'database',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh the expiry at most once a day
  },

  providers: [
    // Credentials are read from AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET by Auth.js
    // convention, lazily at request time. Reading them here at module scope
    // would make `next build` require real secrets to collect page data.
    Google({
      // Only what is needed to show a name and avatar. The legacy app requested
      // a token it then threw away after a single userinfo call.
      authorization: {
        params: { scope: 'openid email profile', prompt: 'select_account' },
      },
    }),
  ],

  pages: {
    signIn: '/signin',
    error: '/signin',
  },

  callbacks: {
    /** Surface the database user id on the session for authorisation checks. */
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },

  trustHost: true,
});

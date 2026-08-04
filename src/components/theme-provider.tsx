'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

/**
 * The legacy app depended on next-themes via its Sonner wrapper but never
 * mounted a provider, so `useTheme()` always returned "system" and the fully
 * authored `.dark` palette was unreachable. Mounting this makes it work.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Theme switch.
 *
 * Which icon shows is decided by CSS from the `dark` class on <html>, not by
 * React state. That avoids the usual `useEffect(() => setMounted(true))`
 * dance — the server cannot know the visitor's theme, so any state-driven
 * version must either render nothing on the first pass or flip after hydration.
 * Letting CSS resolve it means the correct icon is painted immediately.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle colour theme"
    >
      <Sun className="dark:hidden" aria-hidden="true" />
      <Moon className="hidden dark:block" aria-hidden="true" />
    </Button>
  );
}

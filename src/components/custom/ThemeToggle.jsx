import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant='ghost'
      size='icon'
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {/* Both render; CSS picks one, so there's no flash while the theme resolves. */}
      <Sun className='size-5 dark:hidden' />
      <Moon className='size-5 hidden dark:block' />
    </Button>
  )
}

export default ThemeToggle

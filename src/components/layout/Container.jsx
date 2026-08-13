import { cn } from '@/lib/utils'

/**
 * The single horizontal padding/width scale for the app. Pages used to each
 * declare their own (three different scales existed), which is why section
 * edges never lined up between routes.
 */
const Container = ({ className, children }) => (
  <div className={cn('mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-12', className)}>
    {children}
  </div>
)

export default Container

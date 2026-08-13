import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Hotels from './Hotels'

/**
 * Collapsible wrapper so the hotel grid can be folded away — it sits between
 * the trip header and the map workspace, and pushes the map down the page.
 */
const HotelsSection = ({ trip }) => {
  const [open, setOpen] = useState(true)
  const count = trip?.hotelOptions?.length ?? 0

  if (count === 0) return null

  return (
    <div className='mt-8'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className='flex w-full items-center gap-2 text-left'
      >
        <h2 className='font-bold text-xl'>Hotel Recommendations</h2>
        <span className='text-sm text-muted-foreground'>({count})</span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden='true'
        />
      </button>

      {open && <Hotels trip={trip} hideHeading />}
    </div>
  )
}

export default HotelsSection

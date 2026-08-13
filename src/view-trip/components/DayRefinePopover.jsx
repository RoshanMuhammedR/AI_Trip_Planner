import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const QUICK_CHIPS = [
  'Make it more relaxed',
  'Make it cheaper',
  'More food and local eats',
  'More outdoors, less museums',
  'Better for kids',
]

/**
 * Refine control attached to a day's own header.
 *
 * The day is implied by where the button lives, so there's no day selector —
 * the previous RefineBar made you pick from a <select> while already looking
 * at the day you wanted to change.
 */
const DayRefinePopover = ({ dayNumber, dayIndex, onRefine, busy }) => {
  const [open, setOpen] = useState(false)
  const [instruction, setInstruction] = useState('')

  const submit = (text) => {
    const value = (text ?? instruction).trim()
    if (!value || busy) return
    onRefine(dayIndex, value)
    setInstruction('')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className='gap-1.5 text-muted-foreground hover:text-foreground'
          disabled={busy}
          data-print-hide
        >
          <Sparkles className='size-3.5' />
          Refine
        </Button>
      </PopoverTrigger>

      <PopoverContent align='end' className='w-[280px]'>
        <p className='text-sm font-medium'>Change day {dayNumber}</p>

        <div className='mt-2 flex gap-2'>
          <Input
            autoFocus
            value={instruction}
            placeholder='e.g. swap the museum'
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            disabled={busy}
          />
          <Button size='sm' onClick={() => submit()} disabled={busy || !instruction.trim()}>
            Go
          </Button>
        </div>

        <div className='mt-3 flex flex-wrap gap-1.5'>
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              type='button'
              onClick={() => submit(chip)}
              disabled={busy}
              className='rounded-full border px-2.5 py-1 text-xs hover:bg-accent disabled:opacity-50'
            >
              {chip}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default DayRefinePopover

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const QUICK_CHIPS = [
  'Make it more relaxed',
  'Make it cheaper',
  'More food and local eats',
  'More outdoors, less museums',
  'Better for kids',
]

/**
 * Natural-language edits to a single day. Day-scoped rather than whole-trip
 * because regenerating one day is something a small model does reliably, and
 * it leaves the rest of the itinerary untouched.
 */
const RefineBar = ({ days, onRefine, busy }) => {
  const [instruction, setInstruction] = useState('')
  const [dayIndex, setDayIndex] = useState(0)

  const submit = (text) => {
    const value = (text ?? instruction).trim()
    if (!value || busy) return
    onRefine(dayIndex, value)
    setInstruction('')
  }

  return (
    <div className='mt-8 rounded-xl border p-4 bg-card' data-print-hide>
      <div className='flex items-center gap-2'>
        <Sparkles className='size-4 text-primary' />
        <h3 className='font-medium'>Refine this trip</h3>
      </div>

      <div className='mt-3 flex flex-col sm:flex-row gap-2'>
        <label className='sr-only' htmlFor='refine-day'>Day to change</label>
        <select
          id='refine-day'
          value={dayIndex}
          onChange={(e) => setDayIndex(Number(e.target.value))}
          className='h-9 rounded-md border bg-transparent px-3 text-sm shrink-0'
          disabled={busy}
        >
          {days.map((day, i) => (
            <option key={day.day ?? i} value={i}>
              Day {day.day}
            </option>
          ))}
        </select>

        <label className='sr-only' htmlFor='refine-input'>What should change?</label>
        <Input
          id='refine-input'
          value={instruction}
          placeholder='e.g. swap the museum for something outdoors'
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          disabled={busy}
        />
        <Button onClick={() => submit()} disabled={busy || !instruction.trim()}>
          {busy ? 'Rewriting…' : 'Apply'}
        </Button>
      </div>

      <div className='mt-3 flex flex-wrap gap-2'>
        {QUICK_CHIPS.map((chip) => (
          <button key={chip} type='button' onClick={() => submit(chip)} disabled={busy}>
            <Badge
              variant='outline'
              className='cursor-pointer hover:bg-accent disabled:opacity-50'
            >
              {chip}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  )
}

export default RefineBar

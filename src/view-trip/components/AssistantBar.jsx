import { useEffect, useState } from 'react'
import { Sparkles, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/**
 * Free-form refine bar, pinned to the bottom of the itinerary panel.
 *
 * A day still has to be named for the model, so the scope is shown as a chip
 * that follows the selected day tab — visible and changeable, rather than the
 * hidden <select> this replaces. In normal use you never touch it: you filter
 * to a day, then type.
 */
const AssistantBar = ({ itinerary, selectedDay, onRefine, busy }) => {
  const [instruction, setInstruction] = useState('')
  // Falls back to day 1 when "All days" is active, since a request still needs a target.
  const [override, setOverride] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Picking a day tab re-takes control of the scope, so a stale manual
  // override can't silently keep winning.
  useEffect(() => setOverride(null), [selectedDay])

  const targetIndex = override ?? selectedDay ?? 0
  const targetDay = itinerary?.[targetIndex]

  const submit = () => {
    const value = instruction.trim()
    if (!value || busy) return
    onRefine(targetIndex, value)
    setInstruction('')
  }

  return (
    <div className='sticky bottom-0 border-t bg-card p-2' data-print-hide>
      <div className='flex items-center gap-2'>
        <Sparkles className='size-4 shrink-0 text-primary' />

        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type='button'
              disabled={busy}
              className='shrink-0 rounded-full border px-2.5 py-1 text-xs hover:bg-accent disabled:opacity-50'
            >
              Day {targetDay?.day ?? targetIndex + 1} ▾
            </button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-[160px] p-1'>
            {itinerary?.map((day, i) => (
              <button
                key={day.day ?? i}
                type='button'
                onClick={() => {
                  setOverride(i)
                  setPickerOpen(false)
                }}
                className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent
                  ${i === targetIndex ? 'font-medium' : ''}`}
              >
                Day {day.day ?? i + 1}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <label className='sr-only' htmlFor='assistant-input'>
          Ask to change this trip
        </label>
        <Input
          id='assistant-input'
          value={instruction}
          placeholder='Ask to change anything…'
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          disabled={busy}
          className='h-9'
        />

        <Button
          size='icon'
          className='size-9 shrink-0'
          onClick={submit}
          disabled={busy || !instruction.trim()}
          aria-label='Send'
        >
          <ArrowUp className='size-4' />
        </Button>
      </div>
      {busy && <p className='mt-1.5 px-1 text-xs text-muted-foreground'>Rewriting…</p>}
    </div>
  )
}

export default AssistantBar

import React from 'react'

/**
 * A selectable budget/companion tile.
 *
 * These were plain <div onClick> — not focusable, no role, and selection was
 * conveyed by border colour alone. Now a real radio: keyboard reachable, with
 * state exposed to assistive tech rather than implied visually.
 */
const OptionCard = ({ item, selected, onSelect }) => (
  <button
    type='button'
    role='radio'
    aria-checked={selected}
    onClick={onSelect}
    className={`text-left p-4 border rounded-lg transition-shadow cursor-pointer
      hover:shadow-lg focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-ring focus-visible:ring-offset-2
      ${selected ? 'shadow-lg border-primary ring-1 ring-primary' : ''}`}
  >
    <span className='text-4xl block' aria-hidden='true'>{item.icon}</span>
    <span className='font-bold text-lg block mt-1'>{item.title}</span>
    <span className='text-sm text-muted-foreground block'>{item.desc}</span>
  </button>
)

export default OptionCard

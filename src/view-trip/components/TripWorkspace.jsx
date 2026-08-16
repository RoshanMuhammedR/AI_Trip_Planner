import { useState } from 'react'
import { List, MapIcon } from 'lucide-react'
import TripMap from './TripMap'
import ItineraryPanel from './ItineraryPanel'
import DayFilter from './DayFilter'
import AssistantBar from './AssistantBar'
import { useMapPoints } from '@/hooks/useMapPoints'

const MOBILE_VIEWS = [
  { value: 'list', label: 'Itinerary', icon: List },
  { value: 'map', label: 'Map', icon: MapIcon },
]

/**
 * Split workspace: itinerary scrolls on the left, map fills the rest.
 *
 * Height is calc(100dvh-4rem) against the header's explicit h-16 — dvh so
 * mobile browser chrome doesn't clip it.
 *
 * On mobile the two sides are toggled by hiding one, rather than conditionally
 * rendering: <TripMap> must stay mounted or Google Maps re-initialises on every
 * toggle.
 */
const TripWorkspace = ({
  trip,
  generation,
  refine,
  isOwner,
  activeKey,
  onHoverPlace,
  onActivateKey,
}) => {
  const [mobileView, setMobileView] = useState('list')
  const [selectedDay, setSelectedDay] = useState(null)
  const [showHotels, setShowHotels] = useState(false)
  const { hotelPoints, dayNumbers } = useMapPoints(trip)

  // Marker click: if a different day is filtered in, the target card isn't
  // rendered yet — switch the filter first, then scroll once it exists.
  const handleSelectPlace = (point) => {
    onActivateKey(point.key)
    if (selectedDay !== null && point.dayIndex !== selectedDay) {
      setSelectedDay(point.dayIndex)
    }
    setMobileView('list')
    requestAnimationFrame(() => {
      document
        .getElementById(`place-${point.key}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const canRefine = isOwner && trip?.itinerary?.some((d) => d.plan !== null)

  return (
    <section className='border-y bg-background'>
      {/* Mobile-only view switch. */}
      <div className='flex gap-1 border-b p-2 lg:hidden' data-print-hide>
        {MOBILE_VIEWS.map((view) => {
          const Icon = view.icon
          return (
            <button
              key={view.value}
              type='button'
              onClick={() => setMobileView(view.value)}
              aria-pressed={mobileView === view.value}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors
                ${mobileView === view.value ? 'border-primary bg-accent font-medium' : 'hover:bg-accent'}`}
            >
              <Icon className='size-4' />
              {view.label}
            </button>
          )
        })}
      </div>

      {/* data-print-expand / -full: on screen this is a fixed-height shell with
          an internally scrolling itinerary, which printed as-is clips the PDF to
          one viewport. The print stylesheet releases the height and overflow and
          gives the panel the full page, since the map is hidden anyway. */}
      <div className='flex h-[calc(100dvh-4rem)] min-h-[520px]' data-print-expand>
        <aside
          className={`w-full flex-col border-r lg:flex lg:w-[44%] lg:max-w-[620px] xl:w-[40%]
            ${mobileView === 'map' ? 'hidden' : 'flex'}`}
          data-print-expand
          data-print-full
        >
          <div className='sticky top-0 z-10 border-b bg-card px-4 py-2.5' data-print-hide>
            <DayFilter
              dayNumbers={dayNumbers}
              itinerary={trip?.itinerary}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              hasHotels={hotelPoints.length > 0}
              showHotels={showHotels}
              onToggleHotels={setShowHotels}
            />
          </div>

          <div className='min-h-0 flex-1 overflow-y-auto' data-print-expand>
            <ItineraryPanel
              trip={trip}
              generatingDays={generation.generatingDays}
              failedDays={generation.failedDays}
              onRetryDay={generation.retryDay}
              canRetry={isOwner}
              activeKey={activeKey}
              onHoverPlace={onHoverPlace}
              selectedDay={selectedDay}
              canRefine={canRefine}
              onRefineDay={refine.refineDay}
              refining={refine.busy}
            />
          </div>

          {/* Owner-only in the UI; firestore.rules enforces it server-side too. */}
          {canRefine && (
            <AssistantBar
              itinerary={trip.itinerary}
              selectedDay={selectedDay}
              onRefine={refine.refineDay}
              busy={refine.busy}
            />
          )}
        </aside>

        <div className={`flex-1 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
          <TripMap
            trip={trip}
            activeKey={activeKey}
            onSelectPlace={handleSelectPlace}
            onHoverPlace={onHoverPlace}
            selectedDay={selectedDay}
            showHotels={showHotels}
            bare
            className='h-full'
          />
        </div>
      </div>
    </section>
  )
}

export default TripWorkspace

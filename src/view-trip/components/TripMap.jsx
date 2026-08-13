import { useEffect, useMemo, useState } from 'react'
import { Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { Maximize2, Minimize2, MapPin as MapPinIcon } from 'lucide-react'
import { useMapPoints } from '@/hooks/useMapPoints'
import MapPin from './MapPin'
import MapInfoCard from './MapInfoCard'
import MapLegend from './MapLegend'
import DayRoute from './DayRoute'

const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID

/**
 * Refits the viewport to the visible points.
 *
 * Deliberately its own component with `points` as its only real dependency:
 * previously fitBounds lived in the same effect as marker creation, which also
 * depended on the active marker — so hovering a card yanked the viewport back
 * to fit-all on every mouse move.
 */
function FitBounds({ points }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !window.google?.maps || points.length === 0) return

    const bounds = new window.google.maps.LatLngBounds()
    points.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }))
    map.fitBounds(bounds, 56)

    // A single point otherwise fits to maximum zoom, which looks broken.
    const listener = window.google.maps.event.addListenerOnce(map, 'idle', () => {
      if (map.getZoom() > 15) map.setZoom(15)
    })
    return () => window.google.maps.event.removeListener(listener)
  }, [map, points])

  return null
}

const TripMap = ({ trip, activeKey, onSelectPlace, onHoverPlace, className = '' }) => {
  const { placePoints, hotelPoints, unmappableCount, dayNumbers } = useMapPoints(trip)
  const [selectedDay, setSelectedDay] = useState(null)
  const [showHotels, setShowHotels] = useState(false)
  const [infoPoint, setInfoPoint] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)

  const visiblePlaces = useMemo(
    () => (selectedDay === null ? placePoints : placePoints.filter((p) => p.dayIndex === selectedDay)),
    [placePoints, selectedDay]
  )

  const visiblePoints = useMemo(
    () => (showHotels ? [...visiblePlaces, ...hotelPoints] : visiblePlaces),
    [visiblePlaces, showHotels, hotelPoints]
  )

  // One polyline per day currently on screen.
  // NB: a plain object, not `new Map()` — `Map` is the vis.gl component here.
  const routes = useMemo(() => {
    const byDay = {}
    visiblePlaces.forEach((p) => {
      ;(byDay[p.dayIndex] ??= []).push(p)
    })
    return Object.entries(byDay).map(([dayIndex, pts]) => [Number(dayIndex), pts])
  }, [visiblePlaces])

  // Close a stale info window when its marker gets filtered away.
  useEffect(() => {
    if (infoPoint && !visiblePoints.some((p) => p.key === infoPoint.key)) setInfoPoint(null)
  }, [visiblePoints, infoPoint])

  // Escape should leave fullscreen, as it would for a native fullscreen view.
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e) => e.key === 'Escape' && setFullscreen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  if (placePoints.length === 0 && hotelPoints.length === 0) return null

  if (!MAP_ID) {
    // AdvancedMarker renders nothing without a Map ID, which would look like a
    // blank map. Say so instead.
    return (
      <div className={`rounded-xl border border-dashed p-6 text-center ${className}`} data-print-hide>
        <MapPinIcon className='mx-auto size-5 text-muted-foreground' />
        <p className='mt-2 text-sm font-medium'>Map unavailable</p>
        <p className='mt-1 text-xs text-muted-foreground'>
          Set <code>VITE_GOOGLE_MAPS_MAP_ID</code> to enable the trip map.
        </p>
      </div>
    )
  }

  return (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-50 flex flex-col bg-background'
          : `flex flex-col overflow-hidden rounded-xl border ${className}`
      }
      data-print-hide
    >
      <div className='relative flex-1 min-h-0'>
        <Map
          mapId={MAP_ID}
          defaultCenter={{ lat: visiblePoints[0]?.lat ?? 0, lng: visiblePoints[0]?.lng ?? 0 }}
          defaultZoom={12}
          gestureHandling='cooperative'
          disableDefaultUI
          zoomControl
          className='h-full w-full'
        >
          <FitBounds points={visiblePoints} />

          {routes.map(([dayIndex, dayPoints]) => (
            <DayRoute key={dayIndex} dayIndex={dayIndex} points={dayPoints} />
          ))}

          {visiblePoints.map((point) => (
            <AdvancedMarker
              key={point.key}
              position={{ lat: point.lat, lng: point.lng }}
              zIndex={point.key === activeKey ? 999 : undefined}
              onClick={() => setInfoPoint(point)}
              onMouseEnter={() => point.kind === 'place' && onHoverPlace?.(point.key)}
              onMouseLeave={() => point.kind === 'place' && onHoverPlace?.(null)}
            >
              <MapPin point={point} isActive={point.key === activeKey} />
            </AdvancedMarker>
          ))}

          {infoPoint && (
            <InfoWindow
              position={{ lat: infoPoint.lat, lng: infoPoint.lng }}
              pixelOffset={[0, -36]}
              onCloseClick={() => setInfoPoint(null)}
              headerDisabled
            >
              <MapInfoCard
                point={infoPoint}
                tripLocation={trip?.location}
                onScrollToCard={(p) => {
                  onSelectPlace?.(p)
                  setInfoPoint(null)
                  setFullscreen(false)
                }}
              />
            </InfoWindow>
          )}
        </Map>

        <button
          type='button'
          onClick={() => setFullscreen((v) => !v)}
          aria-label={fullscreen ? 'Exit fullscreen map' : 'Expand map'}
          className='absolute right-2.5 top-2.5 rounded-md border bg-card p-2 shadow-sm hover:bg-accent'
        >
          {fullscreen ? <Minimize2 className='size-4' /> : <Maximize2 className='size-4' />}
        </button>
      </div>

      <MapLegend
        dayNumbers={dayNumbers}
        itinerary={trip?.itinerary}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        hasHotels={hotelPoints.length > 0}
        showHotels={showHotels}
        onToggleHotels={setShowHotels}
      />

      {unmappableCount > 0 && (
        <p className='border-t bg-card px-2 py-1.5 text-xs text-muted-foreground'>
          {unmappableCount} stop{unmappableCount === 1 ? '' : 's'} couldn’t be placed on the map.
        </p>
      )}
    </div>
  )
}

export default TripMap

import { useEffect, useMemo, useRef } from 'react'
import { Map, useMap } from '@vis.gl/react-google-maps'
import { dayColor } from '@/lib/maps'

/**
 * Renders every place with coordinates, numbered and coloured by day.
 *
 * Uses classic google.maps.Marker rather than AdvancedMarker deliberately:
 * AdvancedMarker requires a Map ID created in Google Cloud Console, and this
 * keeps the map working with no extra setup. Swap if a Map ID is ever added.
 */
function Markers({ points, activeKey, onSelect }) {
  const map = useMap()
  const markersRef = useRef([])

  useEffect(() => {
    if (!map || !window.google?.maps) return

    // Clear previous markers before redrawing.
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    if (points.length === 0) return

    const bounds = new window.google.maps.LatLngBounds()

    points.forEach((point) => {
      const isActive = point.key === activeKey
      const color = dayColor(point.dayIndex)

      const marker = new window.google.maps.Marker({
        map,
        position: { lat: point.lat, lng: point.lng },
        title: `Day ${point.day}: ${point.name}`,
        zIndex: isActive ? 999 : point.order,
        label: {
          text: String(point.order),
          color: '#fff',
          fontSize: '12px',
          fontWeight: '700',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: isActive ? 4 : 2,
          scale: isActive ? 16 : 13,
        },
      })

      marker.addListener('click', () => onSelect?.(point))
      markersRef.current.push(marker)
      bounds.extend({ lat: point.lat, lng: point.lng })
    })

    map.fitBounds(bounds, 48)
    // A single marker fits to maximum zoom, which looks broken.
    const listener = window.google.maps.event.addListenerOnce(map, 'idle', () => {
      if (map.getZoom() > 15) map.setZoom(15)
    })

    return () => {
      window.google.maps.event.removeListener(listener)
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []
    }
  }, [map, points, activeKey, onSelect])

  return null
}

const TripMap = ({ trip, activeKey, onSelectPlace, className = '' }) => {
  const points = useMemo(() => {
    const list = []
    trip?.itinerary?.forEach((day, dayIndex) => {
      day.plan?.forEach((place, i) => {
        const coords = place.geoCoordinates
        if (!coords) return // v1 trips or a place the model didn't geocode
        list.push({
          key: `${dayIndex}-${i}`,
          dayIndex,
          day: day.day,
          order: i + 1,
          name: place.placeName,
          lat: coords.latitude,
          lng: coords.longitude,
        })
      })
    })
    return list
  }, [trip])

  if (points.length === 0) return null

  return (
    <div className={`overflow-hidden rounded-xl border ${className}`} data-print-hide>
      <Map
        defaultCenter={{ lat: points[0].lat, lng: points[0].lng }}
        defaultZoom={12}
        gestureHandling='cooperative'
        disableDefaultUI
        zoomControl
        className='h-full w-full'
        style={{ minHeight: '320px' }}
      >
        <Markers points={points} activeKey={activeKey} onSelect={onSelectPlace} />
      </Map>
    </div>
  )
}

export default TripMap

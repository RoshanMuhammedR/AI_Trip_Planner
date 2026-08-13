import { useEffect } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import { dayColor } from '@/lib/maps'

/**
 * Connects one day's stops in visiting order.
 *
 * @vis.gl/react-google-maps exports no Polyline component, so this wraps the
 * imperative API and cleans up on unmount / dependency change.
 *
 * These are straight lines between stored coordinates, not road routes — real
 * routing would require enabling and paying for the Directions API.
 */
const DayRoute = ({ points, dayIndex }) => {
  const map = useMap()

  useEffect(() => {
    if (!map || !window.google?.maps || points.length < 2) return

    const polyline = new window.google.maps.Polyline({
      map,
      path: points.map((p) => ({ lat: p.lat, lng: p.lng })),
      strokeColor: dayColor(dayIndex),
      strokeOpacity: 0.75,
      strokeWeight: 3,
      clickable: false,
      // Below markers, so pins stay clickable.
      zIndex: 1,
    })

    return () => polyline.setMap(null)
  }, [map, points, dayIndex])

  return null
}

export default DayRoute

import { useMemo } from 'react'

/**
 * Flattens a normalized trip into map points.
 *
 * Place keys MUST stay `${dayIndex}-${i}` — PlacesToVisit renders
 * id={`place-${key}`} on each card and the scroll-to-card wiring matches the
 * two strings.
 *
 * @returns {{ points, placePoints, hotelPoints, unmappableCount, dayNumbers }}
 */
export function useMapPoints(trip) {
  return useMemo(() => {
    const placePoints = []
    const hotelPoints = []
    let unmappableCount = 0

    trip?.itinerary?.forEach((day, dayIndex) => {
      day.plan?.forEach((place, i) => {
        const coords = place.geoCoordinates
        // v1 trips, or a place the model didn't geocode. Counted rather than
        // silently dropped so the UI can say so.
        if (!coords) {
          unmappableCount += 1
          return
        }
        placePoints.push({
          key: `${dayIndex}-${i}`,
          kind: 'place',
          dayIndex,
          day: day.day,
          order: i + 1,
          name: place.placeName,
          lat: coords.latitude,
          lng: coords.longitude,
          place,
        })
      })
    })

    trip?.hotelOptions?.forEach((hotel, i) => {
      const coords = hotel.geoCoordinates
      if (!coords) return
      hotelPoints.push({
        key: `hotel-${i}`,
        kind: 'hotel',
        dayIndex: null,
        order: i + 1,
        name: hotel.hotelName,
        lat: coords.latitude,
        lng: coords.longitude,
        place: hotel,
      })
    })

    // Only days that actually put something on the map get a legend entry.
    const dayNumbers = [...new Set(placePoints.map((p) => p.dayIndex))].sort((a, b) => a - b)

    return {
      points: [...placePoints, ...hotelPoints],
      placePoints,
      hotelPoints,
      unmappableCount,
      dayNumbers,
    }
  }, [trip])
}

import { useEffect, useState } from 'react'
import { GetPlaceDetails, PHOTO_REF_URL } from '@/services/GlobalAPI'

export const PLACEHOLDER_IMAGE = '/placeholder.svg'

/**
 * Resolves a Google Place from a free-text query (place name, hotel, city).
 *
 * Returns both the photo and the place id — the id comes back in the same
 * response (it's already in the field mask) and lets Google Maps links point at
 * the exact place instead of its coordinates, at no extra request.
 *
 * `photoUrl` is always a usable src: it falls back to the placeholder when the
 * lookup finds nothing, returns no photos, or fails outright. `placeId` is null
 * until the lookup resolves, so links must work without it.
 */
export function usePlaceLookup(textQuery) {
  const [place, setPlace] = useState(null)

  useEffect(() => {
    if (!textQuery) {
      setPlace(null)
      return
    }

    let cancelled = false

    const fetchPlace = async () => {
      try {
        const result = await GetPlaceDetails({ textQuery })
        if (cancelled) return
        // A query with no match omits `places` entirely, and a matched place may
        // have zero photos — every hop here needs to be optional. A place with
        // no photo is still worth keeping for its id.
        const match = result?.data?.places?.[0]
        if (!match) return
        const photoName = match.photos?.[0]?.name
        setPlace({
          photoUrl: photoName ? PHOTO_REF_URL.replace('{NAME}', photoName) : null,
          placeId: match.id ?? null,
        })
      } catch (error) {
        console.error('Place lookup failed for:', textQuery, error)
      }
    }

    fetchPlace()
    return () => {
      cancelled = true
    }
  }, [textQuery])

  return {
    photoUrl: place?.photoUrl ?? PLACEHOLDER_IMAGE,
    placeId: place?.placeId ?? null,
  }
}

/** Photo-only shorthand for callers that don't link anywhere (city headers, cards). */
export function usePlacePhoto(textQuery) {
  return usePlaceLookup(textQuery).photoUrl
}

/** Swaps in the placeholder when a resolved photo URL fails to load (403, quota, etc). */
export function handleImageError(e) {
  if (e.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) return
  e.currentTarget.src = PLACEHOLDER_IMAGE
}

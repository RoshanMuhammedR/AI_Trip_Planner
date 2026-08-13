import { useEffect, useState } from 'react'
import { GetPlaceDetails, PHOTO_REF_URL } from '@/services/GlobalAPI'

export const PLACEHOLDER_IMAGE = '/placeholder.svg'

/**
 * Resolves a Google Places photo for a free-text query (place name, hotel, city).
 * Always returns a usable src — falls back to the placeholder when the lookup
 * finds nothing, returns no photos, or fails outright.
 */
export function usePlacePhoto(textQuery) {
  const [photoUrl, setPhotoUrl] = useState(null)

  useEffect(() => {
    if (!textQuery) return

    let cancelled = false

    const fetchPhoto = async () => {
      try {
        const result = await GetPlaceDetails({ textQuery })
        // A query with no match omits `places` entirely, and matched places may
        // have zero photos — every hop here needs to be optional.
        const photoName = result?.data?.places?.[0]?.photos?.[0]?.name
        if (!photoName || cancelled) return
        setPhotoUrl(PHOTO_REF_URL.replace('{NAME}', photoName))
      } catch (error) {
        console.error('Place photo lookup failed for:', textQuery, error)
      }
    }

    fetchPhoto()
    return () => {
      cancelled = true
    }
  }, [textQuery])

  return photoUrl ?? PLACEHOLDER_IMAGE
}

/** Swaps in the placeholder when a resolved photo URL fails to load (403, quota, etc). */
export function handleImageError(e) {
  if (e.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) return
  e.currentTarget.src = PLACEHOLDER_IMAGE
}

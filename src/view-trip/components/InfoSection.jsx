import React from 'react'
import { usePlacePhoto, handleImageError } from '@/hooks/usePlacePhoto'
import { Badge } from '@/components/ui/badge'
import { formatDayDate, formatCost } from '@/lib/tripSchema'
import ShareMenu from './ShareMenu'
import TripActionsMenu from './TripActionsMenu'

const InfoSection = ({ trip, isOwner, onDelete, deleting }) => {
  const location = trip?.location
  const photoUrl = usePlacePhoto(location)
  const startDate = formatDayDate(trip?.startDate)
  const total = formatCost(trip?.totalEstimatedCost)

  return (
    <div>
      <img
        src={photoUrl}
        onError={handleImageError}
        alt={location ?? 'Trip destination'}
        className='h-[240px] sm:h-[340px] w-full object-cover rounded-xl'
      />

      <div className='flex justify-between items-start gap-4 mt-5 flex-wrap'>
        <div className='flex flex-col gap-3'>
          <h1 className='font-bold text-2xl sm:text-3xl'>{location}</h1>
          <div className='flex flex-wrap gap-2'>
            <Badge variant='secondary'>📅 {trip?.duration} Day(s)</Badge>
            {startDate && <Badge variant='secondary'>🗓️ From {startDate}</Badge>}
            <Badge variant='secondary'>💰 {trip?.budget} Budget</Badge>
            <Badge variant='secondary'>👤 {trip?.travelerType}</Badge>
            {total && <Badge variant='secondary'>≈ {total} total</Badge>}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <ShareMenu trip={trip} />
          {/* Owner-only: someone viewing a shared link gets no delete control. */}
          {isOwner && (
            <TripActionsMenu trip={trip} onDelete={onDelete} deleting={deleting} />
          )}
        </div>
      </div>
    </div>
  )
}

export default InfoSection

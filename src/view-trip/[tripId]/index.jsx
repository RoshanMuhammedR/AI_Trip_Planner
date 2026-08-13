import { db } from '@/services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner';
import InfoSection from '../components/InfoSection';
import Hotels from '../components/Hotels';
import PlacesToVisit from '../components/PlacesToVisit';
import Container from '@/components/layout/Container';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeTrip } from '@/lib/tripSchema';
import { useTripGeneration } from '@/hooks/useTripGeneration';
import { useAuth } from '@/contexts/AuthContext';
import NotFound from '@/components/layout/NotFound';

const ViewTrip = () => {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const { tripId } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;

    const getTripData = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'AITrips', tripId));
        if (cancelled) return;
        if (!docSnap.exists()) {
          setMissing(true);
          return;
        }
        setTrip(normalizeTrip(docSnap.data()));
      } catch (error) {
        console.error('Failed to load trip:', error);
        if (!cancelled) toast.error('Could not load this trip.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    getTripData();
    return () => { cancelled = true };
  }, [tripId]);

  // Render each day the instant it arrives, without waiting for the write.
  const handleDayGenerated = useCallback((index, plan) => {
    setTrip((prev) => {
      if (!prev) return prev;
      const itinerary = prev.itinerary.map((day, i) =>
        i === index ? { ...day, plan } : day
      );
      return { ...prev, itinerary };
    });
  }, []);

  const isOwner = Boolean(user && trip && (trip.userId === user.uid || trip.userEmail === user.email));

  const { generatingDays, failedDays, retryDay } = useTripGeneration({
    trip,
    tripId,
    isOwner,
    onDayGenerated: handleDayGenerated,
  });

  if (missing) return <NotFound />;

  if (loading) {
    return (
      <Container className='py-10'>
        <Skeleton className='h-[340px] w-full rounded-xl' />
        <Skeleton className='h-8 w-64 mt-6' />
        <Skeleton className='h-5 w-full max-w-md mt-4' />
      </Container>
    );
  }

  if (!trip) {
    return (
      <Container className='py-24 text-center'>
        <h1 className='text-2xl font-bold'>This trip couldn’t be read</h1>
        <p className='mt-3 text-gray-500'>
          Its itinerary data is missing or corrupted.
        </p>
      </Container>
    );
  }

  return (
    <Container className='py-10'>
      <InfoSection trip={trip} />
      <Hotels trip={trip} />
      <PlacesToVisit
        trip={trip}
        generatingDays={generatingDays}
        failedDays={failedDays}
        onRetryDay={retryDay}
        canRetry={isOwner}
      />
    </Container>
  )
}

export default ViewTrip

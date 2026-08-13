import { db } from '@/services/firebaseConfig';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2, MoreVertical } from 'lucide-react';
import UserTripCard from './components/UserTripCard';
import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeTrip } from '@/lib/tripSchema';

const MyTrips = () => {
    const navigate = useNavigate();
    const { user, initializing } = useAuth();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Wait for Firebase to resolve auth before deciding to redirect,
        // otherwise a signed-in user gets bounced on first paint.
        if (initializing) return;
        if (!user) {
            navigate('/');
            return;
        }

        let cancelled = false;

        const getUserTrips = async () => {
            setLoading(true);
            try {
                // Query by email (not uid) so trips saved before the auth
                // migration still belong to their owner.
                const q = query(collection(db, 'AITrips'), where('userEmail', '==', user.email));
                const snapshot = await getDocs(q);
                if (cancelled) return;
                const rows = snapshot.docs
                    .map((d) => ({ raw: d.data(), normalized: normalizeTrip(d.data()) }))
                    // Newest first. createdAt only exists post-migration, so fall
                    // back to leaving older trips at the end.
                    .sort((a, b) => (b.raw.createdAt?.seconds ?? 0) - (a.raw.createdAt?.seconds ?? 0))
                    .map((row) => row.normalized)
                    .filter(Boolean);
                setTrips(rows);
            } catch (error) {
                console.error('Failed to load trips:', error);
                if (!cancelled) toast.error('Could not load your trips.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        getUserTrips();
        return () => { cancelled = true };
    }, [user, initializing, navigate]);

    const handleDelete = async (trip) => {
        if (!window.confirm(`Delete your trip to ${trip.location}? This can't be undone.`)) return;

        const previous = trips;
        setTrips((prev) => prev.filter((t) => t.id !== trip.id));
        try {
            await deleteDoc(doc(db, 'AITrips', trip.id));
            toast.success('Trip deleted');
        } catch (error) {
            console.error('Delete failed:', error);
            setTrips(previous);
            toast.error('Could not delete that trip.');
        }
    };

    return (
        <Container className='mt-10'>
            <h1 className='font-bold text-3xl'>My Trips</h1>

            {loading ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10'>
                    {[...Array(6)].map((_, idx) => (
                        <Skeleton key={idx} className='h-[300px] w-full rounded-xl' />
                    ))}
                </div>
            ) : trips.length === 0 ? (
                <div className='mt-16 text-center'>
                    <p className='text-lg font-medium'>No trips yet</p>
                    <p className='mt-2 text-muted-foreground'>
                        Plan your first one and it’ll show up here.
                    </p>
                    <Link to='/create-trip' className='mt-6 inline-block'>
                        <Button size='lg'>Create a trip</Button>
                    </Link>
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10'>
                    {trips.map((trip) => (
                        <UserTripCard
                            key={trip.id}
                            trip={trip}
                            actions={
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            className='shrink-0'
                                            aria-label={`Actions for ${trip.location}`}
                                        >
                                            <MoreVertical className='size-4' />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align='end'>
                                        <DropdownMenuItem
                                            variant='destructive'
                                            onClick={() => handleDelete(trip)}
                                        >
                                            <Trash2 className='size-4' /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            }
                        />
                    ))}
                </div>
            )}
        </Container>
    )
}

export default MyTrips

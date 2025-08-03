import { db } from '@/services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner';
import InfoSection from '../components/InfoSection';
import Hotels from '../components/Hotels';
import PlacesToVisit from '../components/PlacesToVisit';
import Footer from '@/components/custom/Footer';

const ViewTrip = () => {
  const [trip,setTrip] = useState();
  const {tripId} = useParams();
  
  const getTripData = async ()=>{
    const docRef = doc(db,'AITrips',tripId);
    const docSnap = await getDoc(docRef);

    if(docSnap.exists()){
      setTrip(docSnap.data())
    }else{
      toast('No Trip Found!');
    }
  }

  useEffect(()=>{
    tripId&&getTripData();
  }
    ,[tripId])

  return (
    <div className='p-10 md:px-20 lg:px-44 xl:px-56'>
      {/* info section */}
      <InfoSection trip={trip}/>
      {/* Hotel section */}
      <Hotels trip={trip}/>
      {/* place to visit  */}
      <PlacesToVisit trip={trip} />
      {/* footer */}
      <Footer />
    </div>
  )
}

export default ViewTrip

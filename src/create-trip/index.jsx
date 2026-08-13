import React, { useEffect, useRef, useState } from 'react'
import { loadGoogleScript } from '@/utils/loadGoogleScript.js'
import { Input } from '@/components/ui/input';
import { budgetOptions, companionsOptions } from '@/constants/options';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateTrip } from '@/services/AIModel';

import { AiOutlineLoading3Quarters } from "react-icons/ai";

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import SignInDialog from '@/components/custom/SignInDialog';
import Container from '@/components/layout/Container';
import { useAuth } from '@/contexts/AuthContext';


function CreateTrip() {
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [form, setForm] = useState();
  const [showDialogue, setShowDialogue] = useState(false);
  const [searching, setSearching] = useState(false);
  const sessionTokenRef = useRef(null);
  const debounceRef = useRef(null);
  const handleFormChange = (name, value) => {
    setForm({
      ...form,
      [name]: value
    })
  }

  const fetchSuggestions = async (input) => {
    if (!input || !window.google?.maps?.places?.AutocompleteSuggestion) {
      setSuggestions([]);
      return;
    }
    try {
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      }
      const { suggestions: results } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        sessionToken: sessionTokenRef.current,
      });
      setSuggestions(results || []);
    } catch (error) {
      console.error('Failed to fetch place suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setLocationQuery(value);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    const prediction = suggestion.placePrediction;
    const text = prediction.text.text;
    setLocationQuery(text);
    // Keep the placeId too — it makes photo lookups exact and gives the map a
    // reliable center, instead of re-resolving the display text later.
    setForm((prev) => ({ ...prev, location: text, locationPlaceId: prediction.placeId }));
    setSuggestions([]);
    setShowSuggestions(false);
    sessionTokenRef.current = null;
  };

  const navigate = useNavigate();

  /**
   * @param signedInUser - passed by SignInDialog when generation was blocked on
   *   auth. The `user` from context hasn't propagated yet at that moment, so we
   *   can't rely on the closure value.
   */
  const onGenerate = async (signedInUser) => {
    const currentUser = signedInUser ?? user;
    if (!currentUser) {
      setShowDialogue(true);
      return;
    }

    if (form?.noOfDays > 5 || !form?.budget || !form?.location || !form?.people) {
      toast('Please fill all details correctly')
      return;
    }

    setSearching(true);
    try {
      const tripData = await generateTrip({
        location: form.location,
        noOfDays: form.noOfDays,
        budget: form.budget,
        people: form.people,
      });

      // A failed parse used to still write the doc, leaving tripData undefined
      // and crashing the view page. Bail instead.
      if (!tripData) {
        toast.error('The planner returned an unreadable itinerary. Please try again.');
        return;
      }

      await saveAiTrip(tripData, currentUser);
    } catch (error) {
      toast.error(error.message ?? 'Could not generate your trip.');
    } finally {
      setSearching(false);
    }
  }

  const saveAiTrip = async (tripData, currentUser) => {
    // Random IDs, not Date.now() — sequential IDs are enumerable, and shared
    // trips are readable by link.
    const docID = crypto.randomUUID();
    await setDoc(doc(db, 'AITrips', docID), {
      userSelection: form,
      tripData,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      createdAt: serverTimestamp(),
      id: docID,
    });
    navigate('/view-trip/' + docID);
  }

  useEffect(() => {
    loadGoogleScript()
    const interval = setInterval(() => {
      if (window.google) {
        setIsLoaded(true)
        clearInterval(interval)
      }
    }, 100)
    return () => clearInterval(interval)
  }, []);

  return (
    <Container className='mt-10'>
      <h2 className='font-bold text-3xl'>Tell us your travel preferences 🏕️🌴</h2>
      <p className='mt-3 text-gray-500 text-xl'>
        Just provide some basic information, and our trip planner will generate a customised itinerary based on your preferences.
      </p>
      <div className='mt-20 flex flex-col gap-10'>
        <div className='relative'>
          <h2 className='text-xl my-3 font-medium'>What is the destination of choice?</h2>
          <Input
            value={locationQuery}
            placeholder='Search for a destination'
            disabled={!isLoaded}
            onChange={handleLocationInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className='absolute z-10 w-full bg-white border rounded-md mt-1 max-h-60 overflow-auto shadow-lg'>
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className='px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm'
                  onMouseDown={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion.placePrediction.text.text}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className='text-xl my-3 font-medium'>How many days are you planning your trip?</h2>
          <Input type='number' placeholder={'Ex.3'}
            onChange={(e) => handleFormChange('noOfDays', e.target.value)}
          />
        </div>
      </div>

      <div className='mt-4'>
        <h2 className='text-xl my-5 font-medium'>What is Your Budget?</h2>
        <div className='grid grid-cols-3 gap-5 mt-5'>
          {budgetOptions.map((item, index) => (
            <div key={index}
              className={`p-4 border rounded-lg hover:shadow-lg cursor-pointer ${form?.budget === item.title && 'shadow-lg border-[#2C3E50]'}`}
              onClick={() => handleFormChange('budget', item.title)}
            >
              <h2 className='text-4xl'>{item.icon}</h2>
              <h2 className='font-bold text-lg'>{item.title}</h2>
              <h2 className='text-sm text-gray-500'>{item.desc}</h2>
            </div>
          ))}
        </div>
      </div>

      <div className='mt-4'>
        <h2 className='text-xl my-5 font-medium'>Who do you plan on travelling with on next adventure?</h2>
        <div className='grid grid-cols-3 gap-5 mt-5'>
          {companionsOptions.map((item, index) => (
            <div key={index}
              className={`p-4 border rounded-lg hover:shadow-lg cursor-pointer ${form?.people === item.people && 'shadow-lg border-[#2C3E50]'}`}
              onClick={() => handleFormChange('people', item.people)}
            >
              <h2 className='text-4xl'>{item.icon}</h2>
              <h2 className='font-bold text-lg'>{item.title}</h2>
              <h2 className='text-sm text-gray-500'>{item.desc}</h2>
            </div>
          ))}
        </div>
      </div>
      <div className="my-5 flex justify-end">
        <Button size={'lg'} onClick={() => onGenerate()} disabled={searching}>
          {searching ? <AiOutlineLoading3Quarters className='size-7 animate-spin' /> : 'Generate Trip'}
        </Button>
      </div>

      <SignInDialog
        open={showDialogue}
        onOpenChange={setShowDialogue}
        onSignedIn={onGenerate}
      />
    </Container>
  )
}

export default CreateTrip

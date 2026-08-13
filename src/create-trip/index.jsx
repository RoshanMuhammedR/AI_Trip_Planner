import React, { useRef, useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { Input } from '@/components/ui/input';
import { budgetOptions, companionsOptions } from '@/constants/options';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateSkeleton } from '@/services/AIModel';
import { SCHEMA_VERSION } from '@/lib/tripSchema';

import { AiOutlineLoading3Quarters } from "react-icons/ai";

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import SignInDialog from '@/components/custom/SignInDialog';
import Container from '@/components/layout/Container';
import { useAuth } from '@/contexts/AuthContext';
import OptionCard from './components/OptionCard';


function CreateTrip() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  // Resolves once the Places library is ready — replaces the manual script tag
  // plus a 100ms setInterval polling window.google.
  const placesLib = useMapsLibrary('places');
  const isLoaded = Boolean(placesLib);
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
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
    if (!input || !placesLib?.AutocompleteSuggestion) {
      setSuggestions([]);
      return;
    }
    try {
      // One session token per lookup-then-select cycle keeps autocomplete
      // billed as a single session.
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
      }
      const { suggestions: results } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
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
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  // The dropdown was previously mouse-only — no way to pick a destination
  // from the keyboard at all.
  const handleLocationKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
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
    setActiveIndex(-1);
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
      // Only the shell is generated here — the individual days are filled in on
      // the trip page, so the user gets a real page in seconds rather than
      // staring at a spinner for the whole itinerary.
      const skeleton = await generateSkeleton({
        location: form.location,
        noOfDays: form.noOfDays,
        budget: form.budget,
        people: form.people,
        startDate: form.startDate,
      });

      // A failed parse used to still write the doc, leaving tripData undefined
      // and crashing the view page. Bail instead.
      if (!skeleton) {
        toast.error('The planner returned an unreadable itinerary. Please try again.');
        return;
      }

      await saveAiTrip(skeleton, currentUser);
    } catch (error) {
      toast.error(error.message ?? 'Could not generate your trip.');
    } finally {
      setSearching(false);
    }
  }

  const saveAiTrip = async (skeleton, currentUser) => {
    // Random IDs, not Date.now() — sequential IDs are enumerable, and shared
    // trips are readable by link.
    const docID = crypto.randomUUID();
    await setDoc(doc(db, 'AITrips', docID), {
      userSelection: form,
      tripData: {
        ...skeleton,
        schemaVersion: SCHEMA_VERSION,
        startDate: form.startDate ?? null,
        location: skeleton.location ?? form.location,
        budget: skeleton.budget ?? form.budget,
        travelerType: skeleton.travelerType ?? form.people,
        duration: Number(form.noOfDays),
      },
      userId: currentUser.uid,
      userEmail: currentUser.email,
      createdAt: serverTimestamp(),
      id: docID,
    });
    navigate('/view-trip/' + docID);
  }

  return (
    <Container className='mt-10'>
      <h1 className='font-bold text-3xl'>Tell us your travel preferences 🏕️🌴</h1>
      <p className='mt-3 text-muted-foreground text-lg sm:text-xl'>
        Just provide some basic information, and our trip planner will generate a customised itinerary based on your preferences.
      </p>
      <div className='mt-12 flex flex-col gap-10'>
        <div className='relative'>
          <h2 className='text-xl my-3 font-medium' id='destination-label'>What is the destination of choice?</h2>
          <Input
            value={locationQuery}
            placeholder={isLoaded ? 'Search for a destination' : 'Loading places…'}
            disabled={!isLoaded}
            onChange={handleLocationInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleLocationKeyDown}
            role='combobox'
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls='destination-listbox'
            aria-autocomplete='list'
            aria-labelledby='destination-label'
            aria-activedescendant={
              activeIndex >= 0 ? `destination-option-${activeIndex}` : undefined
            }
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul
              id='destination-listbox'
              role='listbox'
              className='absolute z-10 w-full bg-popover text-popover-foreground border rounded-md mt-1 max-h-60 overflow-auto shadow-lg'
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.placePrediction.placeId ?? index}
                  id={`destination-option-${index}`}
                  role='option'
                  aria-selected={index === activeIndex}
                  className={`px-4 py-2 cursor-pointer text-sm ${
                    index === activeIndex ? 'bg-accent' : 'hover:bg-accent'
                  }`}
                  onMouseDown={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion.placePrediction.text.text}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className='grid gap-6 sm:grid-cols-2'>
          <div>
            <h2 className='text-xl my-3 font-medium'>How many days?</h2>
            <Input
              type='number'
              min={1}
              max={7}
              placeholder='Ex. 3'
              value={form?.noOfDays ?? ''}
              onChange={(e) => handleFormChange('noOfDays', e.target.value)}
            />
          </div>
          <div>
            <h2 className='text-xl my-3 font-medium'>
              When do you leave? <span className='text-sm text-gray-500 font-normal'>(optional)</span>
            </h2>
            <Input
              type='date'
              min={today}
              value={form?.startDate ?? ''}
              onChange={(e) => handleFormChange('startDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className='mt-8'>
        <h2 className='text-xl my-5 font-medium' id='budget-label'>What is Your Budget?</h2>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-5' role='radiogroup' aria-labelledby='budget-label'>
          {budgetOptions.map((item) => (
            <OptionCard
              key={item.id}
              item={item}
              selected={form?.budget === item.title}
              onSelect={() => handleFormChange('budget', item.title)}
            />
          ))}
        </div>
      </div>

      <div className='mt-8'>
        <h2 className='text-xl my-5 font-medium' id='companions-label'>Who are you travelling with?</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5' role='radiogroup' aria-labelledby='companions-label'>
          {companionsOptions.map((item) => (
            <OptionCard
              key={item.id}
              item={item}
              selected={form?.people === item.people}
              onSelect={() => handleFormChange('people', item.people)}
            />
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

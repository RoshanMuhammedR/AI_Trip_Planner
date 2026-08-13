import React, { useState } from 'react'
import { Button } from '../ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Link } from 'react-router-dom';
import SignInDialog from './SignInDialog';
import { useAuth } from '@/contexts/AuthContext';


const Header = () => {
  const [showDialogue, setShowDialogue] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className='p-3 border-b flex justify-between items-center gap-2'>
      <Link to='/'>
        <img src='/logo.svg' alt='AI Trip Planner' className='h-10' />
      </Link>
      <div className='flex items-center gap-2'>
        {user ?
        <>
          <Link to='/create-trip' className='hidden md:block'>
            <Button variant='outline' className='rounded-full '>+ Create Trip</Button>
          </Link>
          <Link to='/my-trips' className='hidden md:block'>
            <Button variant='outline' className='rounded-full'>My Trips</Button>
          </Link>
          <Popover>
            <PopoverTrigger aria-label='Account menu'>
              <img
                src={user?.photoURL}
                alt={user?.displayName ?? 'Your account'}
                className='size-[35px] rounded-full'
              />
            </PopoverTrigger>
            <PopoverContent>
              <div className='flex flex-col gap-3'>
                <Link to='/create-trip'>Create Trip</Link>
                <Link to='/my-trips'>My Trips</Link>
                <button
                  type='button'
                  className='text-left cursor-pointer'
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </>
        :
        <Button onClick={() => setShowDialogue(true)}>Sign In</Button>
      }
      </div>
      <SignInDialog open={showDialogue} onOpenChange={setShowDialogue} />
    </header>
  )
}

export default Header

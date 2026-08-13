import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Single source of truth for Google sign-in.
 *
 * @param onSignedIn - called after sign-in succeeds, so callers can resume
 *                     whatever action triggered the prompt (e.g. generate trip).
 */
const SignInDialog = ({ open, onOpenChange, onSignedIn }) => {
  const { signIn } = useAuth()
  const [busy, setBusy] = useState(false)

  const handleSignIn = async () => {
    setBusy(true)
    try {
      const user = await signIn()
      onOpenChange?.(false)
      onSignedIn?.(user)
    } catch (error) {
      // Closing the popup is a normal user action, not an error worth shouting about.
      if (error?.code !== 'auth/popup-closed-by-user') {
        console.error('Sign-in failed:', error)
        toast.error('Sign-in failed. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <img src='/logo.svg' alt='' className='h-10' />
          <DialogTitle className='mt-7'>Sign in with Google</DialogTitle>
          <DialogDescription>
            Sign in to save your trips and pick up where you left off.
          </DialogDescription>
        </DialogHeader>

        <Button
          className='w-full flex gap-4 items-center'
          onClick={handleSignIn}
          disabled={busy}
        >
          <FcGoogle className='size-7' />
          {busy ? 'Signing in…' : 'Sign in With Google'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default SignInDialog

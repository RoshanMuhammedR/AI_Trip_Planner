import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * The share popup: shows the trip URL in a selectable field with a copy button.
 *
 * This replaces going straight to navigator.share, which was the reason the
 * Share button appeared to "do nothing": on desktop the native sheet either
 * doesn't exist or is dismissed, and a dismissal throws AbortError — which the
 * old handler swallowed silently. A visible link the user can read and copy
 * always works; the native sheet is now an extra button, not the only path.
 */
const SHARE_INPUT_ID = 'share-url'

const ShareDialog = ({ open, onOpenChange, trip, shareUrl }) => {
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)

  const selectLink = () => inputRef.current?.select()

  // Reset the button back to "Copy" whenever the dialog is reopened, so it
  // never opens already showing a stale "Copied" state.
  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        // navigator.clipboard is undefined outside a secure context (plain
        // http on a LAN IP, for instance). Selecting the field and using the
        // legacy command still works there.
        selectLink()
        document.execCommand('copy')
      }
      setCopied(true)
      toast.success('Link copied')
    } catch (error) {
      console.error('Copy failed:', error)
      // Not a dead end — the link is on screen and selectable.
      selectLink()
      toast.error('Could not copy automatically. Select the link and copy it.')
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title: `Trip to ${trip?.location}`, url: shareUrl })
    } catch (error) {
      // Dismissing the sheet is a normal user action, not a failure.
      if (error?.name !== 'AbortError') console.error('Native share failed:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this trip</DialogTitle>
          <DialogDescription>
            Anyone with this link can view {trip?.location ? `your trip to ${trip.location}` : 'this trip'}.
            They can’t edit or delete it.
          </DialogDescription>
        </DialogHeader>

        <div className='flex gap-2'>
          <label className='sr-only' htmlFor={SHARE_INPUT_ID}>
            Trip link
          </label>
          <Input
            id={SHARE_INPUT_ID}
            ref={inputRef}
            value={shareUrl}
            readOnly
            // Selecting everything on focus makes manual copy one gesture.
            onFocus={(e) => e.currentTarget.select()}
            className='font-mono text-xs'
          />
          <Button onClick={copy} className='shrink-0 gap-1.5'>
            {copied ? <Check className='size-4' /> : <Copy className='size-4' />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        {/* Only offered where the browser actually implements it — mostly mobile. */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <Button variant='outline' onClick={nativeShare} className='w-full gap-2'>
            <Share2 className='size-4' />
            Share via…
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ShareDialog

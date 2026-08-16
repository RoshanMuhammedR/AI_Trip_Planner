import React, { useState } from 'react'
import { toast } from 'sonner'
import { Share2, Link as LinkIcon, Printer, CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { downloadIcs } from '@/lib/calendar'
import ShareDialog from './ShareDialog'

const ShareMenu = ({ trip }) => {
  const [shareOpen, setShareOpen] = useState(false)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const copyLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied')
    } catch (error) {
      console.error('Copy failed:', error)
      // Rather than dead-ending on a toast, fall back to the dialog — the link
      // is visible and selectable there, so copying is still one gesture away.
      setShareOpen(true)
    }
  }

  const exportCalendar = () => {
    if (!downloadIcs(trip)) {
      toast('Add a start date to this trip to export a calendar.')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' className='gap-2' data-print-hide>
            <Share2 className='size-4' />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {/* Opens the popup rather than calling navigator.share directly: the
              native sheet is missing on most desktops, and dismissing it threw
              an AbortError the old handler swallowed — so the button looked
              like it did nothing at all. */}
          <DropdownMenuItem onClick={() => setShareOpen(true)}>
            <Share2 className='size-4' /> Share trip
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyLink}>
            <LinkIcon className='size-4' /> Copy link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportCalendar}>
            <CalendarPlus className='size-4' /> Add to calendar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.print()}>
            <Printer className='size-4' /> Print / Save as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        trip={trip}
        shareUrl={shareUrl}
      />
    </>
  )
}

export default ShareMenu

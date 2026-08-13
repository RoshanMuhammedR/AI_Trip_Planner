import React from 'react'
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

const ShareMenu = ({ trip }) => {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  const share = async () => {
    // Web Share gives the native sheet on mobile; fall back to copying.
    if (navigator.share) {
      try {
        await navigator.share({ title: `Trip to ${trip?.location}`, url: shareUrl })
        return
      } catch (error) {
        if (error?.name === 'AbortError') return
      }
    }
    copyLink()
  }

  const exportCalendar = () => {
    if (!downloadIcs(trip)) {
      toast('Add a start date to this trip to export a calendar.')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' className='gap-2'>
          <Share2 className='size-4' />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={share}>
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
  )
}

export default ShareMenu

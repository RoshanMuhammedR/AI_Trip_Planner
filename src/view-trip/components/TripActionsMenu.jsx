import { MoreVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * The ⋮ menu beside Share on the trip page, mirroring the one on My Trips cards.
 *
 * Destructive actions are kept out of the Share menu deliberately — Share is
 * something you hand to other people, and Delete sitting one row below "Copy
 * link" is an easy mis-click.
 *
 * Rendered only for the trip's owner. That's a UI decision; firestore.rules is
 * what actually stops anyone else deleting the document.
 */
const TripActionsMenu = ({ trip, onDelete, deleting }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant='outline'
        size='icon'
        disabled={deleting}
        aria-label={`More actions for ${trip?.location ?? 'this trip'}`}
        data-print-hide
      >
        <MoreVertical className='size-4' />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align='end'>
      <DropdownMenuItem variant='destructive' onClick={onDelete} disabled={deleting}>
        <Trash2 className='size-4' />
        {deleting ? 'Deleting…' : 'Delete trip'}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

export default TripActionsMenu

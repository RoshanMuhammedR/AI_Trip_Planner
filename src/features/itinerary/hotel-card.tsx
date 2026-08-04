import { ExternalLink, Star } from 'lucide-react';
import { PlaceImage } from './place-image';
import { Badge } from '@/components/ui/badge';
import type { EnrichedHotel } from './types';

/** Google Maps deep link. A search URL needs no API key and always resolves. */
function mapsUrl(name: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`;
}

export function HotelCard({ hotel }: { hotel: EnrichedHotel }) {
  return (
    <article className="bg-card group overflow-hidden rounded-xl border transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/10] overflow-hidden">
        <PlaceImage
          src={hotel.imageUrl}
          alt={`${hotel.name}`}
          name={hotel.name}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="leading-tight font-semibold">{hotel.name}</h3>
          <Badge variant="primary" className="shrink-0">
            <Star className="size-3 fill-current" aria-hidden="true" />
            {hotel.rating.toFixed(1)}
          </Badge>
        </div>

        <p className="text-muted-foreground mt-1.5 text-sm">{hotel.address}</p>
        <p className="mt-3 text-sm leading-relaxed">{hotel.description}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{hotel.pricePerNight}</span>
          <a
            href={mapsUrl(hotel.name, hotel.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 focus-visible:ring-ring inline-flex items-center gap-1 rounded text-sm focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            Map <ExternalLink className="size-3.5" aria-hidden="true" />
            <span className="sr-only">— opens {hotel.name} in Google Maps in a new tab</span>
          </a>
        </div>
      </div>
    </article>
  );
}

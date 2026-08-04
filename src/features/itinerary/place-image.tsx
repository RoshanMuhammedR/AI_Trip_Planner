import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Image for a place, with a generated fallback.
 *
 * The legacy fallback was `public/placeholder.jpg` — a 7.7 MB JPEG served on
 * every card whose photo lookup failed, which was most of them. This falls back
 * to a CSS gradient plus the place's initial: zero bytes over the wire, and it
 * looks deliberate rather than broken.
 */
export function PlaceImage({
  src,
  alt,
  name,
  className,
  sizes = '(max-width: 768px) 100vw, 33vw',
  priority = false,
}: {
  src: string | null;
  alt: string;
  name: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          'placeholder-gradient text-primary/50 flex items-center justify-center',
          className,
        )}
        aria-hidden="true"
      >
        <span className="text-3xl font-bold select-none">{name.trim().charAt(0) || '?'}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
    />
  );
}

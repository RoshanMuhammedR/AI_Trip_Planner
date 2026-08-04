const ADJECTIVES = [
  'sunlit',
  'winding',
  'coastal',
  'amber',
  'quiet',
  'golden',
  'hidden',
  'northern',
  'wandering',
  'crisp',
  'slow',
  'salt',
] as const;

/** URL-safe alphabet without look-alike characters (0/O, 1/l/I). */
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

/** Unicode nonspacing marks (accents), left over after NFKD normalisation. */
const COMBINING_MARKS = /\p{Mn}/gu;

/** Lowercase, hyphenated, ASCII-only form of an arbitrary place name. */
export function slugifyDestination(value: string): string {
  return (
    value
      // Decompose "ñ" into "n" + combining tilde, then drop the mark, so
      // "Cañón" becomes "canon" rather than "can-on".
      .normalize('NFKD')
      .replace(COMBINING_MARKS, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .split('-')
      .filter(Boolean)
      .slice(0, 2)
      .join('-') || 'trip'
  );
}

/**
 * A share slug such as `sunlit-rome-k4m9p2q7`.
 *
 * The readable prefix is cosmetic; the security property comes from the random
 * suffix. 8 characters over a 31-symbol alphabet is ~40 bits, so slugs are not
 * enumerable — unlike the legacy `Date.now()` document IDs, where knowing
 * roughly when a trip was created was enough to find it.
 */
export function generateShareSlug(destination: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  const suffix = Array.from(bytes.subarray(1), (b) => ALPHABET[b % ALPHABET.length]).join('');
  const adjective = ADJECTIVES[bytes[0]! % ADJECTIVES.length];

  return `${adjective}-${slugifyDestination(destination)}-${suffix}`;
}

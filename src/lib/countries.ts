/**
 * Country helpers for the destination picker.
 *
 * Both are computed rather than looked up — no data file, no bundle weight, and
 * nothing to keep in sync when borders change.
 */

/** Offset between ASCII 'A' and the first REGIONAL INDICATOR SYMBOL LETTER. */
const REGIONAL_INDICATOR_A = 0x1f1e6;
const ASCII_A = 'A'.charCodeAt(0);

/**
 * Flag emoji for an ISO 3166-1 alpha-2 code, e.g. "JP" → 🇯🇵.
 *
 * A flag emoji is just its two letters written as regional indicator symbols,
 * so this is arithmetic rather than a 250-entry lookup table.
 *
 * Returns an empty string for anything that is not two ASCII letters, including
 * `null` — callers can render the result unconditionally.
 */
export function flagEmoji(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return '';

  const code = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '';

  return String.fromCodePoint(
    ...[...code].map((letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - ASCII_A),
  );
}

let displayNames: Intl.DisplayNames | undefined;

/** English country name for an ISO code, e.g. "JP" → "Japan". */
export function countryName(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return '';

  // Built into the platform; constructed once and reused.
  displayNames ??= new Intl.DisplayNames(['en'], { type: 'region' });

  try {
    return displayNames.of(countryCode.toUpperCase()) ?? '';
  } catch {
    return '';
  }
}

/** Human label for a Mapbox `feature_type`, used as a badge on each result. */
export function featureTypeLabel(featureType: string | null | undefined): string | null {
  switch (featureType) {
    case 'country':
      return 'Country';
    case 'region':
      return 'Region';
    case 'district':
      return 'District';
    case 'place':
      return 'City';
    case 'locality':
      return 'Town';
    default:
      return null;
  }
}

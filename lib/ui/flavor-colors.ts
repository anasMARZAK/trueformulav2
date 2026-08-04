/**
 * Maps a flavor name to a swatch color so the dots on a product card carry real
 * information instead of being identical decorative circles.
 *
 * Matching is keyword-based rather than a lookup of exact names, so flavors added
 * later through the admin panel still resolve to something sensible.
 */

export interface FlavorSwatch {
  /** Fill for the swatch dot. */
  color: string;
  /** Ring color — keeps pale swatches visible on the cream background. */
  ring: string;
}

const NEUTRAL: FlavorSwatch = { color: '#D8D2C4', ring: '#B9B1A0' };

const KEYWORD_SWATCHES: Array<{ match: RegExp; swatch: FlavorSwatch }> = [
  { match: /matcha/i, swatch: { color: '#7A9A5B', ring: '#5F7C45' } },
  { match: /hazelnut|caramel|peanut|butter/i, swatch: { color: '#B07A3C', ring: '#8A5C29' } },
  { match: /chocolate|cocoa|mocha/i, swatch: { color: '#4A2C1D', ring: '#331E13' } },
  { match: /vanilla|cream(?!.*straw)/i, swatch: { color: '#EFE3C4', ring: '#C9B98F' } },
  { match: /strawberry|berry|raspberry(?!.*blue)/i, swatch: { color: '#C24E63', ring: '#9A3A4C' } },
  { match: /blue/i, swatch: { color: '#3B6EA5', ring: '#2A5280' } },
  { match: /watermelon/i, swatch: { color: '#E0566E', ring: '#B23E53' } },
  { match: /lemon|lime|citrus|yuzu/i, swatch: { color: '#C9C24A', ring: '#9C9633' } },
  { match: /peach|mango|apricot/i, swatch: { color: '#E29A62', ring: '#B87545' } },
  { match: /obsidian|black|charcoal/i, swatch: { color: '#1F2430', ring: '#0D111A' } },
  { match: /sage|green|mint/i, swatch: { color: '#2E5A44', ring: '#1F3F30' } },
  { match: /porcelain|white|coconut/i, swatch: { color: '#F7F5F0', ring: '#C9C4B8' } },
  { match: /unflavou?red|natural|plain/i, swatch: NEUTRAL },
];

export function getFlavorSwatch(flavor: string): FlavorSwatch {
  const entry = KEYWORD_SWATCHES.find(({ match }) => match.test(flavor));
  return entry ? entry.swatch : NEUTRAL;
}

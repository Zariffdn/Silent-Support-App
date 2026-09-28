// Spacing rhythm on a 4pt base. Screens compose from these and nothing else.
export const space = {
  hair: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const layout = {
  /** The one left edge every screen shares. */
  edge: 24,
  /** Reading column cap so tablets and landscape never stretch a line. */
  column: 560,
  /** Minimum touch target. */
  touch: 44,
} as const;

// Shape is edge-less: light has no corners, there are no cards, and the one
// text input is an underline. There are no radius tokens because nothing is
// rounded.

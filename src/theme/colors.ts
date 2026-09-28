// The room. One dark canvas, one readable ink scale, and two tints that exist
// only as LIGHT (never as text). Every text token clears WCAG AA on the canvas:
// ink 15:1, ink2 7.4:1, ink3 4.6:1, alert 5.3:1.
export const colors = {
  canvas: '#0E0F1A',

  // Text. ink = the words that meet you and the feelings; ink2 = prose and
  // actions; ink3 = whispers, asides, day-parts — the dimmest text allowed to
  // carry meaning.
  ink: '#ECE7DC',
  ink2: '#A9A6B2',
  ink3: '#7E7B88',

  // Light. moon = the app's own presence (pools under a feeling, the breath);
  // lamp = the warmth behind words being read. Used only through <Pool />.
  moon: '#C9D4F0',
  lamp: '#E9CDAA',

  // The one rule between things, and the one edge (text inputs).
  hairline: '#2A2C44',
  edge: '#7E7B88',

  // Destructive actions and errors only. Never emphasis.
  alert: '#A87B7B',
} as const;

export type ColorToken = keyof typeof colors;

// One voice. Literata (SIL Open Font License, assets/fonts/LICENSE-OFL.txt) is
// the only typeface in the app — the words that meet you and the words the
// interface says are set in the same face, so chrome stops reading as chrome.
//
// The family names below equal the fonts' PostScript names AND their file
// names, so the expo-font config plugin (app.json) registers the same names
// natively at build time (available at frame 0), while useFonts in
// app/_layout.tsx loads the same bundled files at runtime for Expo Go.

export const fonts = {
  light: 'Literata-Light',
  regular: 'Literata-Regular',
  medium: 'Literata-Medium',
  italic: 'Literata-Italic',
} as const;

export const fontSources = {
  [fonts.light]: require('../../assets/fonts/Literata-Light.ttf'),
  [fonts.regular]: require('../../assets/fonts/Literata-Regular.ttf'),
  [fonts.medium]: require('../../assets/fonts/Literata-Medium.ttf'),
  [fonts.italic]: require('../../assets/fonts/Literata-Italic.ttf'),
};

// Type roles. Size / leading pairs are the whole scale; nothing is set outside
// these. `voice` is the response and everything else the app "says" in its own
// voice (reflections, the breath cue, grounding lines). `field` is sized so the
// longest feeling word fits a half-width cell on a 360dp phone.
export const type = {
  question: { fontFamily: fonts.light, fontSize: 30, lineHeight: 38 },
  title: { fontFamily: fonts.regular, fontSize: 26, lineHeight: 32 },
  field: { fontFamily: fonts.regular, fontSize: 20, lineHeight: 26 },
  voice: { fontFamily: fonts.regular, fontSize: 21, lineHeight: 33 },
  heading: { fontFamily: fonts.medium, fontSize: 18, lineHeight: 26 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 25 },
  label: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 20 },
  whisper: { fontFamily: fonts.italic, fontSize: 14, lineHeight: 21 },
} as const;

export type TypeRole = keyof typeof type;

// How far OS accessibility text sizes may scale each role before layouts
// break. Reading roles scale generously; the emotion field and titles less
// (above 1.2x the field also drops to one column — see app/index.tsx).
export const maxScale: Record<TypeRole, number> = {
  question: 1.4,
  title: 1.5,
  field: 1.35,
  voice: 1.6,
  heading: 1.6,
  body: 1.8,
  label: 1.6,
  whisper: 1.8,
};

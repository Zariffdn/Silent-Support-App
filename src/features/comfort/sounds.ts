import type { ComfortAudio } from '../../lib/preferences';

// Ambient audio is bundled LOCALLY (no streaming, no network). This registry is
// the single source of truth for sound sources.
//
// ⚠️ The files in assets/audio/ are SILENT PLACEHOLDERS so the app builds. To
// ship real ambient sound, replace each file with a royalty-free, loop-friendly
// recording (CC0 / public-domain, e.g. from Pixabay or freesound). Keep the same
// filenames, or update the require paths below. For seamless looping, use a clip
// that is trimmed to loop cleanly (no silence/clicks at the seam).
export const SOUND_SOURCES: Partial<Record<ComfortAudio, number>> = {
  ocean: require('../../../assets/audio/ocean.wav'),
  rain: require('../../../assets/audio/rain.wav'),
  forest: require('../../../assets/audio/forest.wav'),
  brown: require('../../../assets/audio/brown.wav'),
};

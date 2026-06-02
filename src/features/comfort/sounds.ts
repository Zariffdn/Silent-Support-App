import type { ComfortAudio } from '../../lib/preferences';

// Ambient audio is bundled LOCALLY (no streaming, no network). This registry is
// the single source of truth for sound sources. Replace files in assets/audio/
// with royalty-free, loop-friendly recordings; for seamless looping, trim each
// clip so it loops cleanly (no silence/clicks at the seam).
export const SOUND_SOURCES: Partial<Record<ComfortAudio, number>> = {
  ocean: require('../../../assets/audio/ocean.mp3'),
  rain: require('../../../assets/audio/rain.mp3'),
  forest: require('../../../assets/audio/forest.mp3'),
  brown: require('../../../assets/audio/brown.mp3'),
};

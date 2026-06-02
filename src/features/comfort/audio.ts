import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { SOUND_SOURCES } from './sounds';
import type { ComfortAudio } from '../../lib/preferences';

// A single ambient player, owned by Comfort Mode. Audio only ever exists while
// Comfort Mode is on screen: start when it opens, stop + release when it closes.
// Every call is best-effort and never throws — if audio fails, Comfort Mode
// simply continues in silence.

let player: AudioPlayer | null = null;

export async function startAmbient(sound: ComfortAudio, volume: number): Promise<void> {
  await stopAmbient();
  const source = SOUND_SOURCES[sound];
  if (!source) return; // silent / haptics / missing asset → no audio

  try {
    // Respect the hardware silent switch (don't force audio through it) and do
    // not keep audio alive in the background.
    await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false });
    const p = createAudioPlayer(source);
    p.loop = true;
    p.volume = Math.min(1, Math.max(0, volume));
    p.play();
    player = p;
  } catch {
    player = null; // silent fallback
  }
}

export async function stopAmbient(): Promise<void> {
  if (!player) return;
  const p = player;
  player = null;
  try {
    p.pause();
    p.remove();
  } catch {
    // ignore — resource may already be gone
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

// Local-only preferences. Never synced, never tracked — just stored on the
// device so Comfort Mode can remember how you like to be guided.

export type ComfortAudio = 'silent' | 'haptics' | 'ocean' | 'rain' | 'forest' | 'brown';

const AUDIO_KEY = 'silentsupport.pref.comfortAudio';
const VOLUME_KEY = 'silentsupport.pref.comfortVolume';
const LEGACY_GUIDANCE_KEY = 'silentsupport.pref.breathingGuidance'; // Day 9 (silent | haptics)

const VALID: ComfortAudio[] = ['silent', 'haptics', 'ocean', 'rain', 'forest', 'brown'];
const SOUND_CHOICES: ComfortAudio[] = ['ocean', 'rain', 'forest', 'brown'];

export const DEFAULT_VOLUME = 0.4;

/** True if the choice is an ambient sound (as opposed to silent / haptics). */
export function isAmbientSound(a: ComfortAudio): boolean {
  return SOUND_CHOICES.includes(a);
}

export async function getComfortAudio(): Promise<ComfortAudio> {
  try {
    const v = await AsyncStorage.getItem(AUDIO_KEY);
    if (v && (VALID as string[]).includes(v)) return v as ComfortAudio;
    // Migrate the Day 9 haptics choice if it exists.
    const legacy = await AsyncStorage.getItem(LEGACY_GUIDANCE_KEY);
    return legacy === 'haptics' ? 'haptics' : 'silent';
  } catch {
    return 'silent';
  }
}

export async function setComfortAudio(value: ComfortAudio): Promise<void> {
  try {
    await AsyncStorage.setItem(AUDIO_KEY, value);
  } catch {
    // best-effort; a failed write just means the default stands
  }
}

export async function getComfortVolume(): Promise<number> {
  try {
    const v = await AsyncStorage.getItem(VOLUME_KEY);
    const n = v == null ? DEFAULT_VOLUME : Number(v);
    if (!Number.isFinite(n)) return DEFAULT_VOLUME;
    return Math.min(1, Math.max(0, n));
  } catch {
    return DEFAULT_VOLUME;
  }
}

export async function setComfortVolume(value: number): Promise<void> {
  try {
    const clamped = Math.min(1, Math.max(0, value));
    await AsyncStorage.setItem(VOLUME_KEY, String(clamped));
  } catch {
    // best-effort
  }
}

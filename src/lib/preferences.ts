import AsyncStorage from '@react-native-async-storage/async-storage';

// Local-only preferences. Never synced, never tracked — just stored on the
// device so Comfort Mode can remember how you like to be guided.

export type BreathingGuidance = 'silent' | 'haptics';

const BREATHING_KEY = 'silentsupport.pref.breathingGuidance';

export async function getBreathingGuidance(): Promise<BreathingGuidance> {
  try {
    const v = await AsyncStorage.getItem(BREATHING_KEY);
    return v === 'haptics' ? 'haptics' : 'silent'; // silent is the default
  } catch {
    return 'silent';
  }
}

export async function setBreathingGuidance(value: BreathingGuidance): Promise<void> {
  try {
    await AsyncStorage.setItem(BREATHING_KEY, value);
  } catch {
    // best-effort; a failed write just means the default stands
  }
}

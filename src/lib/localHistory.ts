import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EmotionId } from '../emotions/catalog';

// Emotion history lives ON THE DEVICE, never read over the network. This keeps
// emotional data private (the Supabase table has no read policy by design) and
// removes any dependency on auth for the history screen. The Supabase write
// remains separately for a future, auth-gated server migration.
const KEY = 'silentsupport.history.v1';

export type LocalLog = {
  id: string;
  emotion: EmotionId;
  createdAt: string; // ISO 8601
};

export async function getLocalLogs(): Promise<LocalLog[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalLog[]) : [];
  } catch {
    return [];
  }
}

export async function appendLocalLog(log: LocalLog): Promise<void> {
  try {
    const logs = await getLocalLogs();
    logs.push(log);
    await AsyncStorage.setItem(KEY, JSON.stringify(logs));
  } catch {
    // History is best-effort — it must never interrupt the experience.
  }
}

export async function clearLocalLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

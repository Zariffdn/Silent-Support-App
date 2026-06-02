import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EmotionId } from '../emotions/catalog';

// Emotion history is local-first. Signed-out check-ins live under the anon key;
// signed-in check-ins live under a per-user key (so two accounts on one device
// never see each other's data). The local store is always the primary read
// source; the server is a backup/sync target only when signed in.
const ANON_KEY = 'silentsupport.history.v1';

export type LocalLog = {
  id: string;
  emotion: EmotionId;
  createdAt: string; // ISO 8601
};

export function historyKey(userId: string | null): string {
  return userId ? `silentsupport.history.${userId}` : ANON_KEY;
}

// Not security-sensitive — just a unique local row id.
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function readKey(key: string): Promise<LocalLog[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalLog[]) : [];
  } catch {
    return [];
  }
}

export async function getLocalLogs(userId: string | null): Promise<LocalLog[]> {
  return readKey(historyKey(userId));
}

export async function appendLocalLog(
  userId: string | null,
  emotion: EmotionId,
  createdAt?: string,
): Promise<LocalLog> {
  const log: LocalLog = { id: uuidv4(), emotion, createdAt: createdAt ?? new Date().toISOString() };
  try {
    const key = historyKey(userId);
    const logs = await readKey(key);
    logs.push(log);
    await AsyncStorage.setItem(key, JSON.stringify(logs));
  } catch {
    // best-effort — never block the experience
  }
  return log;
}

export async function writeLocalLogs(userId: string | null, logs: LocalLog[]): Promise<void> {
  try {
    await AsyncStorage.setItem(historyKey(userId), JSON.stringify(logs));
  } catch {
    // ignore
  }
}

export async function clearLocalLogs(userId: string | null): Promise<void> {
  try {
    await AsyncStorage.removeItem(historyKey(userId));
  } catch {
    // ignore
  }
}

export async function getAnonLogs(): Promise<LocalLog[]> {
  return readKey(ANON_KEY);
}

export async function clearAnonLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ANON_KEY);
  } catch {
    // ignore
  }
}

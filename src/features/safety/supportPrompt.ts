import AsyncStorage from '@react-native-async-storage/async-storage';

// Frequency cap for the soft support-resources nudge (Day 11B). This is the ONLY
// new stored state the layer adds, and it holds NO medical label, NO score, and
// NO emotion — just two timestamps recording when a generic resource note was
// last shown / dismissed. It is device-local, never sent anywhere, and cleared
// with history. Reads/writes are fire-and-forget and never throw.

const KEY = 'silentsupport.support.v1';
const DAY = 86_400_000;
const SHOW_COOLDOWN = 7 * DAY; // at most once per week
const DISMISS_COOLDOWN = 14 * DAY; // longer rest after a "Not now"

type SupportPromptState = { lastShownMs?: number; lastDismissedMs?: number };

async function read(): Promise<SupportPromptState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as SupportPromptState) : {};
  } catch {
    return {};
  }
}

async function write(next: SupportPromptState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort — the cap is a courtesy, never critical
  }
}

/** True if the nudge is allowed to appear now (respects both cooldowns). */
export async function canShowSupport(nowMs: number): Promise<boolean> {
  const s = await read();
  if (s.lastShownMs && nowMs - s.lastShownMs < SHOW_COOLDOWN) return false;
  if (s.lastDismissedMs && nowMs - s.lastDismissedMs < DISMISS_COOLDOWN) return false;
  return true;
}

export async function markSupportShown(nowMs: number): Promise<void> {
  await write({ ...(await read()), lastShownMs: nowMs });
}

export async function markSupportDismissed(nowMs: number): Promise<void> {
  await write({ ...(await read()), lastDismissedMs: nowMs });
}

export async function clearSupportPrompt(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

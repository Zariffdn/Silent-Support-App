import type { EmotionId, Strength } from '../../emotions/catalog';
import type { LocalLog } from '../../lib/localHistory';

// Emotion Memory: surface at most ONE soft, abstract acknowledgement that the app
// has noticed a PATTERN — never what the feeling was about. Pure and local: the
// result is computed on-device and shown on-device only. It is NEVER sent to the
// AI or the server, and NOTHING new is stored — it is derived entirely from the
// existing {emotion, createdAt} log.
//
// Memory acknowledges PATTERNS (returning, easing, consistency, variety, balance).
// Recurrence of a single emotion is deliberately NOT a memory signal — the
// response-strength system (strength.ts) already deepens the response when a
// feeling recurs, and doubling that here would read as observant, not present.

const DAY = 86_400_000;
const RECENT_DAYS = 7;
const PRIOR_DAYS = 21; // prior baseline = days 8..21 (the fortnight before the recent week)
const CONSISTENT_DAYS = 10;

// Established-relationship gate: no memory until the app has a little history.
const MIN_CHECKINS = 5;

// Positive emotions: see catalog.ts. `eased` is suppressed for these — "this good
// feeling has shown up less" reads as quietly sad, the opposite of the intent.
const POSITIVE: string[] = ['happy', 'grateful', 'calm', 'hopeful', 'proud', 'excited'];

export type MemoryKind = 'eased' | 'returning' | 'consistent' | 'varied' | 'balanced';

export type MemorySignal = { kind: MemoryKind; phrase: string };

const PHRASES: Record<MemoryKind, string> = {
  eased: 'This feeling has been showing up less than it used to.',
  returning: 'It’s been a little while since this feeling came up.',
  consistent: 'You’ve been checking in consistently lately.',
  varied: 'Your emotions have looked more varied recently.',
  balanced: 'A lot of different feelings have had space lately.',
};

const dayKey = (iso: string) => new Date(iso).toDateString();

/**
 * Derive at most ONE abstract memory signal from recent local history, or null
 * (silence is the default, not a fallback). Assumes the CURRENT check-in is
 * already present in `logs` (append, then compute), mirroring computeStrength.
 *
 * Safeguards: established history (>=5 check-ins), never at deep-support depth
 * (Level 3), and at most once per local day (only the first check-in of the day).
 */
export function deriveMemory(
  logs: LocalLog[],
  emotionId: EmotionId,
  strength: Strength,
  nowMs: number,
): MemorySignal | null {
  // Deep-support depth should stand alone — no memory aside layered on top.
  if (strength >= 3) return null;
  // Not enough history to "remember" anything yet.
  if (logs.length < MIN_CHECKINS) return null;

  // Once per day: surface only on the first check-in of the local day.
  const todayKey = new Date(nowMs).toDateString();
  const todayCount = logs.filter((l) => dayKey(l.createdAt) === todayKey).length;
  if (todayCount > 1) return null;

  const recentSince = nowMs - RECENT_DAYS * DAY;
  const priorSince = nowMs - PRIOR_DAYS * DAY;
  const recent = logs.filter((l) => new Date(l.createdAt).getTime() >= recentSince);
  const prior = logs.filter((l) => {
    const t = new Date(l.createdAt).getTime();
    return t >= priorSince && t < recentSince;
  });

  // 1. eased — this feeling appears less in the recent week than in the prior
  //    fortnight. Hopeful; suppressed for positive emotions.
  if (!POSITIVE.includes(emotionId)) {
    const recentSame = recent.filter((l) => l.emotion === emotionId).length;
    const priorSame = prior.filter((l) => l.emotion === emotionId).length;
    if (priorSame >= 2 && recentSame < priorSame) {
      return { kind: 'eased', phrase: PHRASES.eased };
    }
  }

  // 2. returning — appears today after a gap: its previous occurrence was over
  //    two weeks ago. Comments on the emotion's pattern, never on the user's
  //    absence from the app.
  const priorOccurrences = logs
    .filter((l) => l.emotion === emotionId && dayKey(l.createdAt) !== todayKey)
    .map((l) => new Date(l.createdAt).getTime());
  if (priorOccurrences.length > 0) {
    const lastSeen = Math.max(...priorOccurrences);
    if (nowMs - lastSeen > 14 * DAY) {
      return { kind: 'returning', phrase: PHRASES.returning };
    }
  }

  // 3. consistent — checked in on several distinct days recently. Affirming.
  const consistentSince = nowMs - CONSISTENT_DAYS * DAY;
  const recentDistinctDays = new Set(
    logs
      .filter((l) => new Date(l.createdAt).getTime() >= consistentSince)
      .map((l) => dayKey(l.createdAt)),
  );
  if (recentDistinctDays.size >= 5) {
    return { kind: 'consistent', phrase: PHRASES.consistent };
  }

  // 4. varied — a broad palette of distinct feelings in the recent week.
  const distinct = new Set(recent.map((l) => l.emotion));
  if (distinct.size >= 4) {
    return { kind: 'varied', phrase: PHRASES.varied };
  }

  // 5. balanced — fewer kinds than `varied`, but no single feeling dominates the
  //    recent check-ins (none claims half or more).
  if (recent.length >= 5 && distinct.size >= 2) {
    const counts = new Map<EmotionId, number>();
    for (const l of recent) counts.set(l.emotion, (counts.get(l.emotion) ?? 0) + 1);
    const top = Math.max(...counts.values());
    if (top / recent.length < 0.5) {
      return { kind: 'balanced', phrase: PHRASES.balanced };
    }
  }

  return null;
}

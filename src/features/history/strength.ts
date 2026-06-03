import type { EmotionId, Strength } from '../../emotions/catalog';
import type { LocalLog } from '../../lib/localHistory';
import { DIFFICULT, POSITIVE } from './categories';

// Response Strength: derive how much depth a response should carry from recent
// ON-DEVICE history only. No profiles, no text, no memory beyond the local log.
// The level is never shown to the user — it only shapes the response's depth.
//
// Three emotion categories behave differently (see ./categories):
//   • difficult — the full L1→L2→L3 ladder; L3 is intentionally rare.
//   • positive  — capped at L2 ("deep support" never fits joy); L2 only
//                 celebrates that good moments are landing more often.
//   • reaching-out / neutral (need-comfort, need-encouragement) — capped at L2,
//                 reached only when the user leans on it often.

const DAY = 86_400_000;
const WINDOW_DAYS = 7;

const dayKey = (iso: string) => new Date(iso).toDateString();

/**
 * Decide the response strength for this check-in. Assumes the CURRENT check-in
 * is already present in `logs` (append, then compute). Cold/empty history → 1.
 *
 * Tuned so a typical user lands roughly: L1 ≈ 70%, L2 ≈ 25%, L3 ≈ 5%. Level 3 is
 * deliberately hard to reach — it requires a heavy week, not a single bad night.
 */
export function computeStrength(logs: LocalLog[], emotionId: EmotionId, nowMs: number): Strength {
  const since = nowMs - WINDOW_DAYS * DAY;
  const recent = logs.filter((l) => new Date(l.createdAt).getTime() >= since);
  const sameCount = recent.filter((l) => l.emotion === emotionId).length;

  // Positive emotions: never Level 3. L2 only when the good feeling is recurring.
  if (POSITIVE.includes(emotionId)) {
    return sameCount >= 3 ? 2 : 1;
  }

  // Reaching-out / neutral, non-difficult: capped at Level 2, reached only when
  // the user leans on it often.
  const isDifficult = DIFFICULT.includes(emotionId);
  if (!isDifficult) {
    return sameCount >= 4 ? 2 : 1;
  }

  // Difficult emotions — the full ladder.
  const difficult = recent.filter((l) => DIFFICULT.includes(l.emotion));
  const heavyCount = difficult.length;
  const heavyDays = new Set(difficult.map((l) => dayKey(l.createdAt))).size;

  // Level 3 — intentionally rare: a genuinely heavy week. The same difficult
  // feeling repeating (>=3x) AND difficult check-ins spread across several
  // distinct days. A single bad night, or one bad day, never reaches here.
  if (heavyDays >= 3 && heavyCount >= 5 && sameCount >= 3) return 3;
  // Level 2 — this exact feeling repeating, or negatives clearly increasing.
  if (sameCount >= 3 || heavyCount >= 4) return 2;
  // Level 1 — infrequent, stable, first in a while, or a one-off.
  return 1;
}

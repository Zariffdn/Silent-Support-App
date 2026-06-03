import type { LocalLog } from '../../lib/localHistory';
import { DIFFICULT, HEAVY } from '../history/categories';

// Soft Crisis Detection (Day 11B) — a PATTERN-based support nudge, NOT a detector.
//
// This is NOT diagnosis, NOT prediction, NOT assessment. Its only purpose is to
// make the existing support resources (app/help.tsx) easier to find when emotional
// strain looks persistent. The score is computed on-device from the local log,
// is ephemeral (never stored), and is never sent to the AI or server.
//
// It deliberately uses a LONGER window than the strength system (14 vs 7 days) and
// a stricter, rarer threshold: persistence across several days, not a single rough
// night. It is independent of the strength level (different window/score), though
// it will usually co-occur with a Level 3 week.

const DAY = 86_400_000;
const WINDOW_DAYS = 14;
const RECENT_DAYS = 3; // strain must be CURRENT, not a past episode that resolved

// Local-calendar day ordinal (stable across the window, used for streak/spread).
function dayOrdinal(iso: string): number {
  const d = new Date(iso);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
}

export type Strain = {
  weighted: number; // difficult volume, heavy (sadness/loneliness) emotions doubled
  heavyCount: number; // count of HEAVY check-ins in the window
  distinctDays: number; // distinct calendar days with a difficult check-in
  maxStreak: number; // longest run of consecutive difficult days
  recent: boolean; // any difficult check-in in the last few days
  eligible: boolean;
};

/**
 * Read persistent emotional strain over the last 14 days. `eligible` is true only
 * for a sustained, CURRENT pattern that fits one of two shapes:
 *   • a streak of >=5 consecutive difficult days that includes some genuinely
 *     heavy (sadness / loneliness) check-ins; or
 *   • difficult check-ins spread across >=7 distinct days, at least 4 of them heavy.
 *
 * Both require recency (the strain is current, not a past episode that eased). The
 * thresholds favour SENSITIVITY: for a soft, dismissible, capped nudge a missed
 * person (false negative) costs more than an unneeded one. Eligibility is only the
 * trigger — the weekly frequency cap (supportPrompt.ts) is what actually governs
 * how often, if ever, the nudge appears.
 */
export function computeStrain(logs: LocalLog[], nowMs: number): Strain {
  const since = nowMs - WINDOW_DAYS * DAY;
  const difficult = logs.filter(
    (l) => new Date(l.createdAt).getTime() >= since && DIFFICULT.includes(l.emotion),
  );

  const weighted = difficult.reduce((sum, l) => sum + (HEAVY.includes(l.emotion) ? 2 : 1), 0);
  const heavyCount = difficult.filter((l) => HEAVY.includes(l.emotion)).length;

  const uniqueDays = [...new Set(difficult.map((l) => dayOrdinal(l.createdAt)))].sort((a, b) => a - b);
  const distinctDays = uniqueDays.length;

  let maxStreak = 0;
  let run = 0;
  for (let i = 0; i < uniqueDays.length; i++) {
    run = i > 0 && uniqueDays[i] - uniqueDays[i - 1] === 1 ? run + 1 : 1;
    if (run > maxStreak) maxStreak = run;
  }

  const recent = difficult.some((l) => nowMs - new Date(l.createdAt).getTime() <= RECENT_DAYS * DAY);

  // A single heavy day, a purely cognitive streak (e.g. overthinking with no
  // sadness/loneliness), or a past episode that has since eased never qualifies.
  const eligible =
    recent &&
    ((maxStreak >= 5 && heavyCount >= 2) || (distinctDays >= 7 && heavyCount >= 4));

  return { weighted, heavyCount, distinctDays, maxStreak, recent, eligible };
}

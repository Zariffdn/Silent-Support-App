import { getEmotion, type EmotionId } from '../../emotions/catalog';
import type { LocalLog } from '../../lib/localHistory';

// Rule-based reflections only — never medical, never a diagnosis. These read
// like a gentle friend noticing a pattern, not an analytics dashboard.

const LOW_ENERGY: EmotionId[] = ['bad-day', 'feeling-low', 'exhausted'];
const HEAVY: EmotionId[] = [...LOW_ENERGY, 'lonely', 'anxiety-spike'];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type EmotionCount = { emotion: EmotionId; count: number };

type Bucket = 'morning' | 'afternoon' | 'evening' | 'night';

function bucketOfHour(h: number): Bucket {
  if (h >= 5 && h <= 11) return 'morning';
  if (h >= 12 && h <= 16) return 'afternoon';
  if (h >= 17 && h <= 21) return 'evening';
  return 'night';
}

const BUCKET_PHRASE: Record<Bucket, string> = {
  morning: 'Mornings',
  afternoon: 'Afternoons',
  evening: 'Evenings',
  night: 'Late nights',
};

export function countByEmotion(logs: LocalLog[]): EmotionCount[] {
  const map = new Map<EmotionId, number>();
  for (const l of logs) map.set(l.emotion, (map.get(l.emotion) ?? 0) + 1);
  return [...map.entries()]
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count);
}

export function recentLogs(logs: LocalLog[], nowMs: number): LocalLog[] {
  const since = nowMs - WEEK_MS;
  return logs.filter((l) => new Date(l.createdAt).getTime() >= since);
}

/** Up to 2 soft, non-diagnostic reflections drawn from the logs. */
export function buildInsights(logs: LocalLog[], nowMs: number): string[] {
  if (logs.length === 0) return [];
  if (logs.length < 3) return ['This space will fill in gently as you check in.'];

  const recent = recentLogs(logs, nowMs);
  const sample = recent.length >= 3 ? recent : logs;
  const out: string[] = [];

  // Low-energy stretch.
  const lowCount = sample.filter((l) => LOW_ENERGY.includes(l.emotion)).length;
  if (lowCount >= 3 && lowCount / sample.length >= 0.4) {
    out.push('You’ve had more low-energy days lately. Be gentle with yourself.');
  }

  // Time-of-day lean among heavier feelings.
  const buckets: Record<Bucket, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  for (const l of sample) {
    if (HEAVY.includes(l.emotion)) buckets[bucketOfHour(new Date(l.createdAt).getHours())] += 1;
  }
  const heavyTotal = buckets.morning + buckets.afternoon + buckets.evening + buckets.night;
  if (heavyTotal >= 3) {
    const top = (Object.entries(buckets) as [Bucket, number][]).sort((a, b) => b[1] - a[1])[0];
    if (top[1] / heavyTotal >= 0.5) {
      out.push(`${BUCKET_PHRASE[top[0]]} seem a little heavier for you lately.`);
    }
  }

  // Most frequent feeling.
  const counts = countByEmotion(sample);
  if (counts[0] && counts[0].count >= 2) {
    const label = getEmotion(counts[0].emotion)?.label ?? counts[0].emotion;
    out.push(`Lately, “${label}” has come up the most.`);
  }

  // Presence — gentle acknowledgement of showing up.
  if (recent.length >= 1) {
    out.push(`You’ve checked in ${recent.length} ${recent.length === 1 ? 'time' : 'times'} this week.`);
  }

  return out.slice(0, 2);
}

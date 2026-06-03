import type { EmotionId } from '../../emotions/catalog';

// Shared emotion groupings for the adaptive layers (strength, memory, strain).
// Single source of truth — keep in sync with the catalog when emotions change.

// Emotions that count toward an escalating, "difficult" trend. Reaching-out ids
// (need-comfort, need-encouragement) are intentionally excluded — they are
// requests for warmth, not a distress pattern.
export const DIFFICULT: EmotionId[] = [
  'bad-day',
  'feeling-low',
  'exhausted',
  'lonely',
  'anxiety-spike',
  'overthinking',
];

// The heaviest / most isolating difficult emotions — sadness and loneliness.
// Weighted more in the strain score (src/features/safety/strain.ts).
export const HEAVY: EmotionId[] = ['feeling-low', 'lonely'];

// Positive emotions are not in the catalog yet; listed defensively (matched as
// plain strings) so any added later are handled correctly from the first build.
export const POSITIVE: string[] = ['happy', 'grateful', 'calm', 'hopeful', 'proud', 'excited'];

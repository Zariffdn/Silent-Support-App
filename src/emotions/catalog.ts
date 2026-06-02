// The emotional vocabulary of Silent Support.
// Each emotion carries its own small library of curated responses so that a
// gentle, human reply is always available even when the AI is not.
//
// This list is the product source of truth and mirrors the README. If you
// add/rename an emotion, also update the Edge Function's CURATED map
// (supabase/functions/generate-support/index.ts) — they must stay in sync.

export type EmotionId =
  | 'bad-day'
  | 'feeling-low'
  | 'exhausted'
  | 'overthinking'
  | 'need-comfort'
  | 'need-encouragement'
  | 'lonely'
  | 'anxiety-spike';

export type Emotion = {
  id: EmotionId;
  emoji: string;
  label: string;
  /** Curated responses used as an instant fallback when the AI is slow or unreachable. */
  curated: string[];
};

export const EMOTIONS: Emotion[] = [
  {
    id: 'bad-day',
    emoji: '😔',
    label: 'Bad Day',
    curated: [
      'Some days just weigh more. It’s okay to set it down for a moment.',
      'This day doesn’t define you. You made it here, and that is enough.',
    ],
  },
  {
    id: 'feeling-low',
    emoji: '🌧',
    label: 'Feeling Low',
    curated: [
      'It’s okay to feel low right now. You don’t have to lift yourself this second.',
      'Low moments are still part of being human. You’re allowed to just be here.',
    ],
  },
  {
    id: 'exhausted',
    emoji: '😴',
    label: 'Emotionally Exhausted',
    curated: [
      'You’ve been carrying so much. Resting isn’t giving up.',
      'It’s okay to feel empty right now. You don’t have to refill all at once.',
    ],
  },
  {
    id: 'overthinking',
    emoji: '💭',
    label: 'Overthinking',
    curated: [
      'Your mind is only trying to keep you safe. You can let it rest for now.',
      'Not every thought needs an answer tonight. You’re allowed to pause.',
    ],
  },
  {
    id: 'need-comfort',
    emoji: '🫂',
    label: 'Need Comfort',
    curated: [
      'Consider yourself held. You don’t have to carry all of this alone.',
      'Wrapping you in something gentle right now. You’re safe in this moment.',
    ],
  },
  {
    id: 'need-encouragement',
    emoji: '🌱',
    label: 'Need Encouragement',
    curated: [
      'You’re growing, even when it’s slow. Small steps still move you forward.',
      'You’ve survived every hard day so far. That’s quiet proof of your strength.',
    ],
  },
  {
    id: 'lonely',
    emoji: '❤️',
    label: 'Lonely',
    curated: [
      'Even in the quiet, you matter. Someone is glad you exist.',
      'Loneliness is heavy, but it isn’t the whole truth about you.',
    ],
  },
  {
    id: 'anxiety-spike',
    emoji: '⚡',
    label: 'Anxiety Spike',
    curated: [
      'This rush of anxiety is real, and it will pass. You are safe in this moment.',
      'Your body is only trying to protect you. Nothing here needs solving right now.',
    ],
  },
];

const EMOTION_BY_ID: Record<string, Emotion> = Object.fromEntries(
  EMOTIONS.map((e) => [e.id, e]),
);

export function getEmotion(id: string | undefined): Emotion | undefined {
  if (!id) return undefined;
  return EMOTION_BY_ID[id];
}

/** Pick a curated response for an emotion. Deterministic-free variety is fine here. */
export function pickCurated(emotion: Emotion): string {
  const i = Math.floor(Math.random() * emotion.curated.length);
  return emotion.curated[i] ?? emotion.curated[0];
}

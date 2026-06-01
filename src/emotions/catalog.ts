// The emotional vocabulary of Silent Support.
// Each emotion carries its own small library of curated responses so that a
// gentle, human reply is always available even when the AI is not.

export type EmotionId =
  | 'need-a-hug'
  | 'bad-day'
  | 'lonely'
  | 'overthinking'
  | 'exhausted'
  | 'thinking-of-you'
  | 'need-encouragement'
  | 'stay-with-me';

export type Emotion = {
  id: EmotionId;
  emoji: string;
  label: string;
  /** Curated responses used as an instant fallback when the AI is slow or unreachable. */
  curated: string[];
};

export const EMOTIONS: Emotion[] = [
  {
    id: 'need-a-hug',
    emoji: '🫂',
    label: 'Need a Hug',
    curated: [
      'Consider yourself held. You don’t have to carry all of this alone.',
      'Wrapping you in something gentle right now. You’re not alone in this moment.',
    ],
  },
  {
    id: 'bad-day',
    emoji: '🌧',
    label: 'Bad Day',
    curated: [
      'Some days just weigh more. It’s okay to set it down for a moment.',
      'This day doesn’t define you. You made it here, and that is enough.',
    ],
  },
  {
    id: 'lonely',
    emoji: '😔',
    label: 'Feeling Lonely',
    curated: [
      'Even in the quiet, you matter. Someone is glad you exist.',
      'Loneliness is heavy, but it isn’t the whole truth about you.',
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
    id: 'exhausted',
    emoji: '😴',
    label: 'Emotionally Exhausted',
    curated: [
      'You’ve been carrying so much. Resting isn’t giving up.',
      'It’s okay to feel empty right now. You don’t have to refill all at once.',
    ],
  },
  {
    id: 'thinking-of-you',
    emoji: '❤️',
    label: 'Thinking of You',
    curated: [
      'You crossed someone’s mind for a good reason. You are remembered.',
      'Someone, somewhere, is glad you’re here — including this quiet space.',
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
    id: 'stay-with-me',
    emoji: '🤝',
    label: 'Stay With Me',
    curated: [
      'I’m right here. There’s no rush and nowhere else to be.',
      'Staying with you in this moment. You don’t have to face it by yourself.',
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

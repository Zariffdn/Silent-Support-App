// The emotional vocabulary of Silent Support.
// Each emotion carries a small library of curated responses so a gentle, human
// reply is always available even when the AI is not.
//
// Response Engine V2: each curated response is a FOUR-LAYER structured presence,
// with layers separated by a blank line (\n\n):
//   1. grounding   2. recognition   3. reframing   4. gentle guidance + soft close
// Tone is tuned per emotion (anxiety = short/grounding, sadness = soft/validating,
// overwhelm = minimal/one-moment-at-a-time). No emojis, no exclamation marks,
// no questions, no clinical language.
//
// This list is the product source of truth and mirrors the README. If you
// add/rename an emotion, also update the Edge Function's CURATED, EMOTION_GUIDANCE,
// and LABELS maps (supabase/functions/generate-support/index.ts).

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
  /** Four-layer responses (layers separated by \n\n). Instant, offline-safe fallback. */
  curated: string[];
};

export const EMOTIONS: Emotion[] = [
  {
    id: 'bad-day',
    emoji: '😔',
    label: 'Bad Day',
    curated: [
      'You’re here, and that’s enough for now.\n\nSome days press down harder than others, and today has been one of them. That weight is real.\n\nA hard day isn’t a verdict on you. It’s weather passing through, not the whole sky.\n\nYou don’t have to make sense of it tonight. Let this be enough for now.',
      'Take a slow breath. You made it to this moment.\n\nIt sounds like today asked a lot of you. That’s a lot to carry.\n\nHeavy days have a way of feeling permanent, even when they’re only passing through.\n\nThere’s nothing to fix right now. Stay here for a moment.',
    ],
  },
  {
    id: 'feeling-low',
    emoji: '🌧',
    label: 'Feeling Low',
    curated: [
      'You don’t have to lift yourself right now.\n\nThere’s a low, flat feeling in this, and it’s okay that it’s here. It’s okay to feel this.\n\nLow moments aren’t a sign something is wrong with you. They move through everyone, and they move on.\n\nLet yourself just be here. Take this slowly.',
      'I hear you. You can rest in this for a moment.\n\nFeeling low can be quiet and heavy at the same time. You don’t have to explain it to anyone.\n\nThis feeling isn’t the whole of you, even when it fills the room.\n\nNothing needs to change this second. Let this be enough for now.',
    ],
  },
  {
    id: 'exhausted',
    emoji: '😴',
    label: 'Emotionally Exhausted',
    curated: [
      'Rest here a moment. Nothing is required of you.\n\nYou’ve been carrying a lot, and it has left you running on empty. That makes sense.\n\nBeing this tired isn’t failing. It’s a sign of how much you’ve been holding.\n\nJust this one moment, nothing more. Take this slowly.',
      'You can set it down for now.\n\nEmotional tiredness is real tiredness. You don’t have to hold all of this alone.\n\nResting isn’t giving up. It’s part of how you keep going.\n\nOne slow breath, one moment at a time. Let this be enough for now.',
    ],
  },
  {
    id: 'overthinking',
    emoji: '💭',
    label: 'Overthinking',
    curated: [
      'Let’s slow down, just for a moment.\n\nYour mind is moving fast, turning the same things over. That’s a lot to hold.\n\nA racing mind is often trying to solve something that can’t be solved tonight.\n\nYou don’t have to answer it all right now. Stay here for a moment.',
      'Take one slow breath with me.\n\nThere’s a lot of noise in your head right now, and it’s tiring.\n\nSometimes thoughts pile up faster than clarity can keep up. That isn’t a flaw.\n\nYou can let them rest for now. Take this slowly.',
    ],
  },
  {
    id: 'need-comfort',
    emoji: '🫂',
    label: 'Need Comfort',
    curated: [
      'You’re not alone in this.\n\nIt sounds like you need to feel held right now, and that’s a gentle, human thing to want.\n\nReaching for comfort isn’t weakness. It’s how we get through the harder moments.\n\nConsider yourself held here. Stay here for a moment.',
      'Settle in. You’re safe here.\n\nWanting comfort often means you’ve been strong for a long while. That’s a lot to carry.\n\nYou don’t have to earn rest or care. You can simply receive it.\n\nLet this quiet hold you for now. Let this be enough for now.',
    ],
  },
  {
    id: 'need-encouragement',
    emoji: '🌱',
    label: 'Need Encouragement',
    curated: [
      'You’re still here, still trying. That counts.\n\nIt sounds like you could use a little encouragement, and there’s no shame in that.\n\nStrength isn’t doing it all at once. It’s the small step you take next.\n\nYou don’t have to leap. Take this slowly.',
      'Steady. You’ve come further than it feels.\n\nNeeding a push sometimes is part of being human. That makes sense.\n\nYou’ve survived every hard day so far, which is quiet proof you can meet this one.\n\nJust the next small step is enough. You don’t need to rush anything right now.',
    ],
  },
  {
    id: 'lonely',
    emoji: '❤️',
    label: 'Lonely',
    curated: [
      'You’re not as alone as this feels right now.\n\nLoneliness can be a heavy, aching kind of quiet. It’s okay to feel this.\n\nThis feeling isn’t proof that you’re unwanted. It’s a sign of how much connection matters to you.\n\nYou matter, even in the quiet. Stay here for a moment.',
      'I’m here with you, right now.\n\nFeeling alone is one of the hardest things to sit with. That’s a lot to carry.\n\nLoneliness visits everyone, and it isn’t the whole truth about your life.\n\nSomeone is glad you exist. Let this be enough for now.',
    ],
  },
  {
    id: 'anxiety-spike',
    emoji: '⚡',
    label: 'Anxiety Spike',
    curated: [
      'You’re safe right now. Breathe slow.\n\nYour body is on high alert. That’s hard, and it’s real.\n\nThis is a wave. Waves rise, and then they ease.\n\nFeet on the ground, one slow breath. Stay here for a moment.',
      'Right now, in this moment, you are safe.\n\nAnxiety is loud and fast. It makes sense that it feels like a lot.\n\nThis feeling will pass. It always does, even when it doesn’t feel that way.\n\nOne slow breath at a time. Take this slowly.',
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

/**
 * Pick a curated response deterministically: stable within a day (so a given
 * emotion reads the same each time you tap it today), subtly fresh across days.
 * Variability is never exposed in the UI.
 */
export function pickCurated(emotion: Emotion): string {
  const day = Math.floor(Date.now() / 86_400_000);
  const i = ((day % emotion.curated.length) + emotion.curated.length) % emotion.curated.length;
  return emotion.curated[i] ?? emotion.curated[0];
}

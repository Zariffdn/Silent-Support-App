// The emotional vocabulary of Silent Support.
//
// Response Engine V2 + Strength System: each emotion carries curated responses
// at THREE strength levels. The level is chosen from recent on-device history
// (see src/features/history/strength.ts) so depth adapts to context:
//   gentle (Level 1)     — 1–2 lines, light, never assumes distress
//   supportive (Level 2) — grounding + recognition (acknowledges recurrence) + close
//   deep (Level 3)       — full four-layer presence (grounding → recognition →
//                          reframing → gentle guidance + soft close)
// Tone is tuned per emotion. No emojis, exclamation marks, questions, or clinical
// language. Layers are separated by a blank line (\n\n).
//
// Source of truth, mirrors the README. Adding/renaming an emotion also means
// updating the Edge Function's LABELS / EMOTION_GUIDANCE / CURATED maps.

export type EmotionId =
  | 'bad-day'
  | 'feeling-low'
  | 'exhausted'
  | 'overthinking'
  | 'need-comfort'
  | 'need-encouragement'
  | 'lonely'
  | 'anxiety-spike';

/** Response strength, derived from recent local history. Never shown to the user. */
export type Strength = 1 | 2 | 3;

export type CuratedByLevel = {
  gentle: string[];
  supportive: string[];
  deep: string[];
};

export type Emotion = {
  id: EmotionId;
  emoji: string;
  label: string;
  curated: CuratedByLevel;
};

export const EMOTIONS: Emotion[] = [
  {
    id: 'bad-day',
    emoji: '😔',
    label: 'Bad Day',
    curated: {
      gentle: [
        'It’s okay that today felt off. You don’t have to carry it into the next moment.',
        'Some days are just heavier. Let this one be what it was, nothing more.',
      ],
      supportive: [
        'Take a slow breath. You’re still here.\n\nIt seems the hard days have been stacking up lately, and that’s a lot to keep meeting.\n\nShowing up again, even tired, still counts. Take this slowly.',
        'You don’t have to hold it all right now.\n\nThis kind of day has come around more than once recently, and that quietly wears on a person.\n\nYou’re doing more than you give yourself credit for. Stay here for a moment.',
      ],
      deep: [
        'You’re here, and that’s enough for now.\n\nSome days press down harder than others, and lately they’ve kept coming. That weight is real, and carrying it again takes something out of you.\n\nA run of hard days isn’t a verdict on you. It’s weather settling in, not the whole sky, even when it’s hard to see past it.\n\nYou don’t have to make sense of it tonight. Let this be enough for now.',
        'Take a slow breath. You made it to this moment.\n\nIt sounds like the heaviness hasn’t lifted for a while now. That’s a lot to carry, and you’ve been carrying it anyway.\n\nHeavy stretches have a way of feeling permanent, even when they’re still, slowly, passing through.\n\nThere’s nothing to fix right now. Stay here for a moment.',
      ],
    },
  },
  {
    id: 'feeling-low',
    emoji: '🌧',
    label: 'Feeling Low',
    curated: {
      gentle: [
        'It’s okay to feel a little low right now. You don’t have to lift it on your own.',
        'A quieter, heavier mood is allowed. Be easy with yourself for now.',
      ],
      supportive: [
        'You can rest in this for a moment.\n\nThis low feeling has been near for a little while now, and it’s okay that it’s taking its time.\n\nYou don’t have to climb out of it today. Take this slowly.',
        'I hear you.\n\nFeeling low again isn’t a setback or a failure. It’s just been a heavier stretch than usual.\n\nBe gentle with yourself through it. Let this be enough for now.',
      ],
      deep: [
        'You don’t have to lift yourself right now.\n\nThere’s a low, flat feeling that’s been settling in for a while, and it’s okay that it’s here. It’s okay to feel this, again and again if you need to.\n\nLow stretches aren’t a sign something is wrong with you. They move through everyone, and even the long ones move on.\n\nLet yourself just be here. Take this slowly.',
        'I hear you. You can rest in this for a moment.\n\nFeeling low for a while can be quiet and heavy at the same time, and you don’t have to explain it to anyone.\n\nThis feeling isn’t the whole of you, even when it has filled the room for days.\n\nNothing needs to change this second. Let this be enough for now.',
      ],
    },
  },
  {
    id: 'exhausted',
    emoji: '😴',
    label: 'Emotionally Exhausted',
    curated: {
      gentle: [
        'It sounds like you could use a little rest. Let yourself have it.',
        'You don’t have to be at full strength right now. Take it gently.',
      ],
      supportive: [
        'Set it down for a moment.\n\nYou’ve been running low for a while now, and that kind of tired adds up quietly.\n\nResting isn’t falling behind. Take this slowly.',
        'You don’t have to hold all of this alone.\n\nThis tiredness has been with you more than once lately, and that makes complete sense.\n\nLet yourself pause, even briefly. Stay here for a moment.',
      ],
      deep: [
        'Rest here a moment. Nothing is required of you.\n\nYou’ve been carrying a lot for a long stretch, and it has left you running on empty. That makes sense, and it’s allowed.\n\nBeing this tired isn’t failing. It’s a sign of how much you’ve been holding, for how long.\n\nJust this one moment, nothing more. Take this slowly.',
        'You can set it down for now.\n\nEmotional tiredness is real tiredness, and yours has been building for a while. You don’t have to hold all of this alone.\n\nResting isn’t giving up. It’s part of how you keep going, especially now.\n\nOne slow breath, one moment at a time. Let this be enough for now.',
      ],
    },
  },
  {
    id: 'overthinking',
    emoji: '💭',
    label: 'Overthinking',
    curated: {
      gentle: [
        'Your mind’s been busy. You don’t have to follow every thought right now.',
        'It’s okay to let the thinking settle. Nothing needs solving this second.',
      ],
      supportive: [
        'Let’s slow down together.\n\nYour mind has been turning things over a lot lately, and that’s exhausting on its own.\n\nYou don’t have to solve it all tonight. Take this slowly.',
        'One slow breath, for now.\n\nThe overthinking has come back around again, and it’s tiring to keep carrying.\n\nYou’re allowed to set it down for a while. Stay here for a moment.',
      ],
      deep: [
        'Let’s slow down, just for a moment.\n\nYour mind has been moving fast for a while, turning the same things over and over. That’s a lot to hold, day after day.\n\nA racing mind is often trying to solve something that simply can’t be solved tonight, no matter how many times it circles.\n\nYou don’t have to answer any of it right now. Stay here for a moment.',
        'Take one slow breath with me.\n\nThere’s been a lot of noise in your head lately, and it’s genuinely tiring.\n\nSometimes thoughts pile up faster than clarity can keep up, and that isn’t a flaw in you.\n\nYou can let them rest for now. Take this slowly.',
      ],
    },
  },
  {
    id: 'need-comfort',
    emoji: '🫂',
    label: 'Need Comfort',
    curated: {
      gentle: [
        'It’s okay to want a little comfort. Consider yourself gently held.',
        'You don’t have to be strong this moment. Let yourself be cared for.',
      ],
      supportive: [
        'You’re not alone in this.\n\nYou’ve been needing comfort for a little while now, and reaching for it again is okay.\n\nLet yourself be held here. Stay here for a moment.',
        'Settle in. You’re safe here.\n\nIt’s okay to keep needing softness, and it doesn’t make you weak.\n\nReceive a little ease, even now. Let this be enough for now.',
      ],
      deep: [
        'You’re not alone in this.\n\nIt sounds like you’ve needed to feel held for a while now, and that’s a gentle, deeply human thing to want.\n\nReaching for comfort, again and again, isn’t weakness. It’s how we get through the harder stretches.\n\nConsider yourself held here. Stay here for a moment.',
        'Settle in. You’re safe here.\n\nWanting comfort this much often means you’ve been strong for a long while. That’s a lot to carry on your own.\n\nYou don’t have to earn rest or care. You can simply receive it, as often as you need to.\n\nLet this quiet hold you for now. Let this be enough for now.',
      ],
    },
  },
  {
    id: 'need-encouragement',
    emoji: '🌱',
    label: 'Need Encouragement',
    curated: {
      gentle: [
        'A small bit of encouragement is okay to want. You’re doing more than you think.',
        'You don’t need a big leap today. The next small step is plenty.',
      ],
      supportive: [
        'Steady. You’re still going.\n\nYou’ve been needing a push more than once lately, and that’s okay.\n\nThe next small step still counts. Take this slowly.',
        'You’ve come further than it feels.\n\nLeaning on encouragement again isn’t weakness. It’s how people keep going.\n\nJust the next step is enough. You don’t need to rush anything right now.',
      ],
      deep: [
        'You’re still here, still trying. That counts.\n\nIt sounds like you’ve needed encouragement for a while now, and there’s no shame in that at all.\n\nStrength isn’t doing it all at once. It’s the small step you take next, and the one after that.\n\nYou don’t have to leap. Take this slowly.',
        'Steady. You’ve come further than it feels.\n\nNeeding a push more than once is part of being human, especially through a long stretch. That makes sense.\n\nYou’ve survived every hard day so far, which is quiet proof you can meet this one too.\n\nJust the next small step is enough. You don’t need to rush anything right now.',
      ],
    },
  },
  {
    id: 'lonely',
    emoji: '❤️',
    label: 'Lonely',
    curated: {
      gentle: [
        'Feeling a little alone is okay. You’re not as far from others as it seems.',
        'This quiet moment doesn’t mean you’re forgotten. You matter.',
      ],
      supportive: [
        'I’m here with you, right now.\n\nThis loneliness has been lingering, and that’s a hard thing to keep sitting with.\n\nYou matter, even in the quiet. Stay here for a moment.',
        'You’re not as alone as it feels.\n\nThe ache of being alone has come around more than once lately, and that’s heavy.\n\nConnection is still out there for you. Let this be enough for now.',
      ],
      deep: [
        'You’re not as alone as this feels right now.\n\nLoneliness can be a heavy, aching kind of quiet, and yours has lingered for a while. It’s okay to feel this.\n\nThis feeling isn’t proof that you’re unwanted. It’s a sign of how much connection matters to you, and that capacity is still there.\n\nYou matter, even in the quiet. Stay here for a moment.',
        'I’m here with you, right now.\n\nFeeling alone for a stretch is one of the hardest things to sit with, and you’ve been sitting with it. That’s a lot to carry.\n\nLoneliness visits everyone, and even when it stays a while, it isn’t the whole truth about your life.\n\nSomeone is glad you exist. Let this be enough for now.',
      ],
    },
  },
  {
    id: 'anxiety-spike',
    emoji: '⚡',
    label: 'Anxiety Spike',
    curated: {
      gentle: [
        'You’re safe right now. This feeling can pass without you forcing it.',
        'Take one slow breath. There’s nothing you need to fix this second.',
      ],
      supportive: [
        'You’re safe right now. Breathe slow.\n\nThe anxiety has spiked more than once lately, and that’s draining to keep riding out.\n\nThis wave will ease, like the others did. Stay here for a moment.',
        'Feet on the ground. You’re here.\n\nIt’s been an anxious stretch, and that takes a real toll.\n\nYou don’t have to fight it, just let it pass. Take this slowly.',
      ],
      deep: [
        'You’re safe right now. Breathe slow.\n\nYour body has been on high alert, again and again lately. That’s hard, and it’s real, and it tires you out.\n\nEach spike is a wave. Waves rise, and then they ease, even the ones that keep coming back.\n\nFeet on the ground, one slow breath. Stay here for a moment.',
        'Right now, in this moment, you are safe.\n\nAnxiety has been loud and fast for a while now. It makes sense that it feels like a lot to keep meeting.\n\nThis feeling will pass, the way it always has, even when it doesn’t feel that way in the middle of it.\n\nOne slow breath at a time. Take this slowly.',
      ],
    },
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
 * Pick a curated response at the given strength level. Deterministic-by-day
 * within the level (stable per render, subtly fresh across days). Variability
 * is never exposed in the UI.
 */
export function pickCurated(emotion: Emotion, strength: Strength): string {
  const arr =
    strength === 3 ? emotion.curated.deep : strength === 2 ? emotion.curated.supportive : emotion.curated.gentle;
  const day = Math.floor(Date.now() / 86_400_000);
  const i = ((day % arr.length) + arr.length) % arr.length;
  return arr[i] ?? arr[0];
}

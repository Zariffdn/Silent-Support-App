// Silent Support — "generate-support" Edge Function (Deno).
//
//   Request:  { emotionId: string, label?: string, note?: string }
//   Response: { text: string, source: "ai" | "curated" | "safety" }
//
// Response Engine V2: the AI returns a FOUR-LAYER structured presence
//   1. grounding   2. recognition   3. reframing   4. gentle guidance + soft close
// with layers separated by a blank line. Tone is tuned per emotion. The output
// is sanitized/validated (no emojis, no exclamation marks, no questions, no
// clichés) and falls back to curated on any violation.

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const GROQ_MODEL = Deno.env.get('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const AI_TIMEOUT_MS = 4000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ---- Safety layer -----------------------------------------------------------

const CRISIS_PATTERNS = [
  'kill myself', 'killing myself', 'suicide', 'suicidal', 'end my life',
  'want to die', 'wanna die', "don't want to live", 'don’t want to live',
  'no reason to live', 'better off dead', 'hurt myself', 'harm myself',
  'self harm', 'self-harm', 'cut myself', 'cutting myself', 'take my life',
  'ending it all',
];

const SAFETY_RESPONSE =
  'What you’re feeling sounds really heavy, and you don’t have to carry it alone. ' +
  'If you might be in danger or thinking of harming yourself, please reach out right now ' +
  'to a crisis line or your local emergency services. People want to help you through this.';

function detectCrisis(text: string): boolean {
  const t = text.toLowerCase();
  return CRISIS_PATTERNS.some((p) => t.includes(p));
}

// ---- Emotion → label + tone tuning (V2) -------------------------------------

const LABELS: Record<string, string> = {
  'bad-day': 'Bad Day',
  'feeling-low': 'Feeling Low',
  'exhausted': 'Emotionally Exhausted',
  'overthinking': 'Overthinking',
  'need-comfort': 'Need Comfort',
  'need-encouragement': 'Need Encouragement',
  'lonely': 'Lonely',
  'anxiety-spike': 'Anxiety Spike',
};

const EMOTION_GUIDANCE: Record<string, string> = {
  'bad-day': 'They had a hard day. Soft pacing, lots of validation, few instructions. Treat it as heavy weather passing.',
  'feeling-low': 'Sadness. Soften the pace, validate more, instruct less. Meet them where they are.',
  'exhausted': 'Overwhelm. Reduce cognitive load, keep wording minimal, one moment at a time. Rest is allowed.',
  'overthinking': 'Overwhelm. Minimal wording, reduce abstraction, one moment at a time. Permission to pause, not solutions.',
  'need-comfort': 'They want to feel held. Warmth and presence, gentle validation, no pressure.',
  'need-encouragement': 'They want quiet encouragement. Grounded and gentle, never cheerleading.',
  'lonely': 'Sadness. Soft, validating, present. Remind them they matter, without clichés.',
  'anxiety-spike': 'Anxiety. Short sentences. Grounding words (right now, safe, slow). Less abstraction. The wave will pass.',
};

// ---- Curated fallback (server-side last resort; client shows its own) --------

const CURATED: Record<string, string> = {
  'bad-day': 'You’re here, and that’s enough for now. Some days just weigh more. Let this be enough for now.',
  'feeling-low': 'You don’t have to lift yourself right now. It’s okay to feel low. Take this slowly.',
  'exhausted': 'Rest here a moment. You’ve been carrying a lot, and resting isn’t giving up. Take this slowly.',
  'overthinking': 'Let’s slow down for a moment. Not every thought needs an answer tonight. Stay here for a moment.',
  'need-comfort': 'You’re not alone in this. Consider yourself held here. Stay here for a moment.',
  'need-encouragement': 'You’re still here, still trying, and that counts. The next small step is enough. Take this slowly.',
  'lonely': 'You’re not as alone as this feels. You matter, even in the quiet. Stay here for a moment.',
  'anxiety-spike': 'You’re safe right now. This is a wave, and it will ease. One slow breath. Stay here for a moment.',
};

function curatedFor(emotionId: string): string {
  return CURATED[emotionId] ?? 'I’m here with you. You don’t have to explain anything. Stay here for a moment.';
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// ---- Prompt (V2 four-layer) -------------------------------------------------

const SYSTEM_PROMPT = `You are the quiet presence inside "Silent Support," for someone who just tapped a single emotion. Write ONE response made of FOUR short parts, each separated by a blank line, in this exact order:

1. Grounding: one or two short lines offering instant calm and safety. No explanation yet.
2. Recognition: one short paragraph that gently names and validates the feeling. No advice, no diagnosis.
3. Reframing: one short paragraph that softly shifts perspective. No commands, no pressure.
4. Gentle guidance and close: one to three short lines offering a small, optional next step, ending with a soft closing line such as "Stay here for a moment.", "Take this slowly.", "You don’t need to rush anything right now.", or "Let this be enough for now."

Apply the tone tuning provided in the user message.

Strict style rules:
- Calm, warm, human. Short sentences. No part longer than a few lines.
- No emojis. No exclamation marks. No questions of any kind.
- No clinical or diagnostic words, no therapy claims, no advice that reads like an instruction.
- You may use AT MOST ONE of these brief phrases, only if it fits naturally: "I hear you.", "That makes sense.", "That’s a lot to carry.", "You don’t have to hold all of this alone.", "It’s okay to feel this."
- Output ONLY the four parts separated by blank lines. No labels, no numbers, no preamble, no notes about the format.`;

const FEWSHOT: { role: 'user' | 'assistant'; content: string }[] = [
  {
    role: 'user',
    content:
      'The person is feeling: "Overthinking". Tone tuning: Overwhelm. Minimal wording, one moment at a time.',
  },
  {
    role: 'assistant',
    content:
      'Let’s slow down, just for a moment.\n\nYour mind is moving fast, turning the same things over. That’s a lot to hold.\n\nA racing mind is often trying to solve something that can’t be solved tonight.\n\nYou don’t have to answer it all right now. Stay here for a moment.',
  },
];

// ---- Output validation ------------------------------------------------------

const BANNED = [
  'everything happens for a reason', 'stay strong', 'good vibes', 'positive vibes',
  'look on the bright side', 'it could be worse', 'just think positive', 'chin up',
  'silver lining', 'everything will be okay', 'everything will be ok',
];

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{FE0F}]/gu;

/** Enforce the V2 tone contract; preserves the blank-line layer breaks. */
function sanitizeAi(raw: string | null): string | null {
  if (!raw) return null;
  let t = raw
    .replace(EMOJI, '')
    .replace(/[ \t]+/g, ' ') // collapse spaces, keep newlines
    .replace(/ *\n */g, '\n') // trim around newlines
    .replace(/\n{3,}/g, '\n\n') // at most one blank line between layers
    .trim();
  if (!t) return null;
  if (t.includes('?')) return null; // no questions
  if (t.includes('!')) return null; // no exclamation marks
  const lower = t.toLowerCase();
  if (BANNED.some((p) => lower.includes(p))) return null;
  if (t.length < 10 || t.length > 800) return null;
  return t;
}

async function askGroq(emotionId: string): Promise<string | null> {
  if (!GROQ_API_KEY) return null;
  const label = LABELS[emotionId];
  const guidance = EMOTION_GUIDANCE[emotionId];
  if (!label || !guidance) return null; // unknown emotion id → no AI call
  const userContent = `The person is feeling: "${label}". Tone tuning: ${guidance}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.7,
        max_tokens: 220,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...FEWSHOT,
          { role: 'user', content: userContent },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    return text ?? null;
  } catch (_err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  let emotionId = '';
  let note = '';
  try {
    const body = await req.json();
    emotionId = String(body?.emotionId ?? '');
    // `note` is the only free text accepted, used ONLY for crisis detection —
    // it is never sent to the model.
    note = String(body?.note ?? '').slice(0, 500);
  } catch (_err) {
    // malformed body — still respond with comfort
  }

  // 1. Safety pre-check.
  if (note && detectCrisis(note)) {
    return json({ text: SAFETY_RESPONSE, source: 'safety' });
  }

  // 2. AI — four-layer, validated. Prompt built server-side from the emotion id.
  const aiText = sanitizeAi(await askGroq(emotionId));
  if (aiText) return json({ text: aiText, source: 'ai' });

  // 3. Curated fallback.
  return json({ text: curatedFor(emotionId), source: 'curated' });
});

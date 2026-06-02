// Silent Support — "generate-support" Edge Function (Deno).
//
//   Request:  { emotionId: string, label: string, note?: string }
//   Response: { text: string, source: "ai" | "curated" | "safety" }
//
// Three layers, evaluated in order:
//   1. Safety pre-check — crisis keywords route to a fixed safety response and
//      skip the AI entirely. (Placeholder hook: the app sends no free text
//      today, so `note` is normally absent; this activates the moment any text
//      input — e.g. optional journaling — is added. Mirror of
//      src/features/safety/crisis.ts — keep the two in sync.)
//   2. AI — Groq (OpenAI-compatible API) with a tightly constrained prompt +
//      per-emotion guidance, then the output is sanitized/validated for tone.
//   3. Curated fallback — if no key, the AI fails, or validation rejects it.

// Groq is OpenAI-compatible, free, and fast (responses usually well under the
// client's 2.5s swap window). Set GROQ_API_KEY as a Supabase function secret.
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

// NOTE: localize this for your region before launch (add a specific crisis
// line / number). Kept generic so it is never region-wrong.
const SAFETY_RESPONSE =
  'What you’re feeling sounds really heavy, and you don’t have to carry it alone. ' +
  'If you might be in danger or thinking of harming yourself, please reach out right now ' +
  'to a crisis line or your local emergency services. People want to help you through this.';

function detectCrisis(text: string): boolean {
  const t = text.toLowerCase();
  return CRISIS_PATTERNS.some((p) => t.includes(p));
}

// ---- Standardized emotion → AI guidance -------------------------------------

const EMOTION_GUIDANCE: Record<string, string> = {
  'bad-day': 'They had a hard day. Acknowledge the weight without minimizing it.',
  'feeling-low': 'They feel low and flat. Meet them gently; do not try to lift them.',
  'exhausted': 'They are emotionally drained. Reassure them that rest is allowed.',
  'overthinking': 'Their mind will not slow down. Offer permission to pause, not solutions.',
  'need-comfort': 'They want to feel held. Offer warmth and quiet presence.',
  'need-encouragement': 'They want gentle encouragement. Be grounded, never cheerleading.',
  'lonely': 'They feel alone. Softly remind them they matter, without clichés.',
  'anxiety-spike': 'They feel a surge of anxiety. Emphasize safety and that it will pass.',
};

// The emotion label is derived HERE (server-side), keyed by id — never taken
// from the client. This is the core abuse protection: a crafted `label` can't
// reach the model, so the endpoint can't be used as a free LLM proxy. An
// unknown id simply yields no AI call. Mirror of client catalog labels.
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

// ---- Curated fallback (mirror of client catalog) ----------------------------

const CURATED: Record<string, string> = {
  'bad-day': 'Some days just weigh more. It’s okay to set it down for a moment.',
  'feeling-low': 'It’s okay to feel low right now. You don’t have to lift yourself this second.',
  'exhausted': 'You’ve been carrying so much. Resting isn’t giving up.',
  'overthinking': 'Your mind is only trying to keep you safe. You can let it rest for now.',
  'need-comfort': 'Consider yourself held. You don’t have to carry all of this alone.',
  'need-encouragement': 'You’re growing, even when it’s slow. Small steps still move you forward.',
  'lonely': 'Even in the quiet, you matter. Someone is glad you exist.',
  'anxiety-spike': 'This rush of anxiety is real, and it will pass. You are safe in this moment.',
};

function curatedFor(emotionId: string): string {
  return CURATED[emotionId] ?? 'I’m here with you. You don’t have to explain anything.';
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// ---- Prompt -----------------------------------------------------------------

const SYSTEM_PROMPT = `You are the quiet presence inside "Silent Support," an app for people too emotionally exhausted to explain how they feel. Someone has tapped a single emotion. Reply with ONE or TWO short sentences (under 200 characters total) that simply let them feel seen.

Always:
- Validate the feeling first.
- Stay calm, warm, and plain-spoken.

Never:
- Give advice, fixes, steps, or ANY questions.
- Use emojis, hashtags, or the person's name.
- Use clinical or diagnostic words.
- Use motivational-poster language or toxic positivity ("everything happens for a reason", "stay strong", "good vibes", "look on the bright side").
- Write more than two sentences.

Sound like a kind person sitting beside them in the dark — steady, brief, unhurried.`;

const FEWSHOT: { role: 'user' | 'assistant'; content: string }[] = [
  {
    role: 'user',
    content:
      'The person is feeling: "Overthinking". Their mind will not slow down. Offer permission to pause, not solutions.',
  },
  {
    role: 'assistant',
    content:
      'Your mind is working hard to keep you safe. You’re allowed to set it down for a little while.',
  },
  {
    role: 'user',
    content:
      'The person is feeling: "Bad Day". They had a hard day. Acknowledge the weight without minimizing it.',
  },
  {
    role: 'assistant',
    content: 'Some days just weigh more than others. You don’t have to carry this one gracefully.',
  },
];

// ---- Output validation ------------------------------------------------------

const BANNED = [
  'everything happens for a reason', 'stay strong', 'good vibes', 'positive vibes',
  'look on the bright side', 'it could be worse', 'just think positive', 'chin up',
  'silver lining', 'everything will be okay', 'everything will be ok',
];

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{FE0F}]/gu;

/** Enforce the tone contract on the model's output. Returns clean text, or null
 * if it violates a rule (caller then falls back to curated). */
function sanitizeAi(raw: string | null): string | null {
  if (!raw) return null;
  let t = raw.replace(EMOJI, '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (t.includes('?')) return null; // no questions
  const lower = t.toLowerCase();
  if (BANNED.some((p) => lower.includes(p))) return null;
  // Keep at most two sentences.
  const parts = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  t = parts.slice(0, 2).join(' ').trim();
  if (t.length < 3 || t.length > 240) return null;
  return t;
}

async function askGroq(emotionId: string): Promise<string | null> {
  if (!GROQ_API_KEY) return null;
  // Build the prompt entirely from server-side maps — never client free text.
  const label = LABELS[emotionId];
  const guidance = EMOTION_GUIDANCE[emotionId];
  if (!label || !guidance) return null; // unknown emotion id → no AI call
  const userContent = `The person is feeling: "${label}". ${guidance}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.6,
        max_tokens: 70,
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
    // `note` is the only free text accepted, and it is used ONLY for crisis
    // detection — it is never sent to the model. (Client `label` is ignored.)
    note = String(body?.note ?? '').slice(0, 500);
  } catch (_err) {
    // malformed body — still respond with comfort
  }

  // 1. Safety pre-check (fires only when free text is provided).
  if (note && detectCrisis(note)) {
    return json({ text: SAFETY_RESPONSE, source: 'safety' });
  }

  // 2. AI, validated.
  const aiText = sanitizeAi(await askGroq(emotionId));
  if (aiText) return json({ text: aiText, source: 'ai' });

  // 3. Curated fallback.
  return json({ text: curatedFor(emotionId), source: 'curated' });
});

// Silent Support — "generate-support" Edge Function (Deno runtime).
//
// Receives a single emotion and returns ONE short, gentle response.
//   Request:  { emotionId: string, label: string }
//   Response: { text: string, source: "ai" | "curated" }
//
// Two-layer safety: if OPENAI_API_KEY is unset or OpenAI fails, the function
// itself returns a curated response (still HTTP 200) so the client always has
// something calm to show.

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
const OPENAI_TIMEOUT_MS = 4000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are the gentle presence inside "Silent Support," an app for people who are too emotionally exhausted to explain how they feel. A person has tapped a single emotion. Reply with ONE short message (1-3 sentences, under ~220 characters) that simply lets them feel seen.

Rules:
- Be warm, calm, validating, and human.
- Do NOT give advice, instructions, or solutions.
- Do NOT ask any questions.
- Do NOT use the person's name or assume details about their life.
- No emojis. No clinical language. No toxic positivity.
- Sound like a kind person sitting quietly beside them, not a chatbot.`;

// Server-side curated fallbacks, keyed by emotion id. Keep in sync with the
// client catalog (src/emotions/catalog.ts).
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

async function askOpenAI(label: string): Promise<string | null> {
  if (!OPENAI_API_KEY) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.8,
        max_tokens: 90,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `The person is feeling: "${label}". Offer your one short, gentle response.` },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    return text?.trim() || null;
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
  let label = '';
  try {
    const body = await req.json();
    emotionId = String(body?.emotionId ?? '');
    label = String(body?.label ?? '').slice(0, 60);
  } catch (_err) {
    // Malformed body — still respond with a generic comfort.
  }

  const aiText = label ? await askOpenAI(label) : null;
  if (aiText) {
    return json({ text: aiText, source: 'ai' });
  }
  return json({ text: curatedFor(emotionId), source: 'curated' });
});

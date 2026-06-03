import { env } from './env';
import type { Emotion, Strength } from '../emotions/catalog';

/**
 * How long we'll let the AI try before we stop caring. The curated response is
 * already on screen from 0ms, so this is only the window in which a *fast* AI
 * reply is allowed to softly replace it. If the AI is slower than this, we
 * abort and simply leave the curated text standing — presence over intelligence.
 */
export const AI_SWAP_WINDOW_MS = 2500;

const FUNCTION_URL = `${env.supabaseUrl}/functions/v1/generate-support`;

/**
 * Calls the AI Edge Function in the background. Returns the AI text only if a
 * genuine AI response arrives within the swap window; otherwise null. Never
 * throws — any failure just means the curated response stays.
 */
export async function fetchAiResponse(emotion: Emotion, strength: Strength): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_SWAP_WINDOW_MS);

  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.supabaseAnonKey}`,
        apikey: env.supabaseAnonKey,
      },
      // `strength` is a coarse 1|2|3 derived on-device from recent history — no
      // history, counts, or identity are sent, just the depth level.
      body: JSON.stringify({ emotionId: emotion.id, strength }),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const json = (await res.json()) as { text?: string; source?: string };
    // Only treat it as an upgrade if the function actually produced AI text.
    // (When the function falls back to its own curated text, we already have a
    // curated response on screen — no swap needed.)
    if (json.source !== 'ai') return null;

    const text = json.text?.trim();
    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

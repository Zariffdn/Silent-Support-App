// Client-side crisis-detection placeholder hook.
//
// Mirrors the Edge Function's safety layer (supabase/functions/generate-support
// /index.ts) — keep the two keyword lists and the response in sync.
//
// IMPORTANT: the app has NO free-text input today (only emotion taps), so this
// is wired but dormant. The moment any text input is added (e.g. optional
// journaling, a "say more" field), call screenForCrisis(text) BEFORE sending
// anything to the AI: if it returns a result, show that safety response
// instead of a normal reply, and do not call the AI.
//
// Note: a real 'safety' source would also need a DB constraint update
// (emotion_logs.response_source currently allows only 'ai' | 'curated') and a
// dedicated, resource-linking UI before it goes live.

export const CRISIS_PATTERNS = [
  'kill myself', 'killing myself', 'suicide', 'suicidal', 'end my life',
  'want to die', 'wanna die', "don't want to live", 'don’t want to live',
  'no reason to live', 'better off dead', 'hurt myself', 'harm myself',
  'self harm', 'self-harm', 'cut myself', 'cutting myself', 'take my life',
  'ending it all',
];

// Localize for your region before launch (add a specific crisis line).
export const SAFETY_RESPONSE =
  'What you’re feeling sounds really heavy, and you don’t have to carry it alone. ' +
  'If you might be in danger or thinking of harming yourself, please reach out right now ' +
  'to a crisis line or your local emergency services. People want to help you through this.';

export function detectCrisis(text: string): boolean {
  const t = text.toLowerCase();
  return CRISIS_PATTERNS.some((p) => t.includes(p));
}

export type SafetyResult = { text: string; source: 'safety' };

/** Returns a safety response if the text trips the crisis check, else null. */
export function screenForCrisis(text: string): SafetyResult | null {
  return detectCrisis(text) ? { text: SAFETY_RESPONSE, source: 'safety' } : null;
}

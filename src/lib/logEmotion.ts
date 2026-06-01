import { supabase } from './supabase';
import type { EmotionId } from '../emotions/catalog';

export type ResponseSource = 'ai' | 'curated';

/**
 * Generate the row id on the client so we never have to read it back from the
 * database. This matters because `emotion_logs` has no SELECT policy (emotional
 * data is never publicly readable), so an insert that asks for the row back
 * would be rejected. Not security-sensitive — just a unique id.
 */
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Record the emotion FIRST, before any AI is called, with the curated response
 * that is already on screen. Returns the client-generated row id so a later AI
 * upgrade can update the same row. Never throws — comforting the user must not
 * depend on the database being reachable.
 */
export async function insertEmotionLog(
  emotion: EmotionId,
  text: string,
  source: ResponseSource,
): Promise<string> {
  const id = uuidv4();
  try {
    // No .select() — a plain insert (return=minimal) is all RLS allows.
    const { error } = await supabase
      .from('emotion_logs')
      .insert({ id, emotion, response_text: text, response_source: source });
    if (error) console.warn('[emotion_logs] insert failed:', error.message);
  } catch (err) {
    console.warn('[emotion_logs] insert threw:', err);
  }
  return id;
}

/**
 * Upgrade the logged row to the response the user ended up seeing (e.g. when a
 * fast AI reply replaces the curated one). Fire-and-forget: failure never
 * interrupts the experience.
 */
export async function updateLogResponse(
  logId: string,
  text: string,
  source: ResponseSource,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('emotion_logs')
      .update({ response_text: text, response_source: source })
      .eq('id', logId);
    if (error) console.warn('[emotion_logs] update failed:', error.message);
  } catch (err) {
    console.warn('[emotion_logs] update threw:', err);
  }
}

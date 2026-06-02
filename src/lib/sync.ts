import { supabase } from './supabase';
import {
  getAnonLogs,
  getLocalLogs,
  writeLocalLogs,
  clearAnonLogs,
  type LocalLog,
} from './localHistory';
import type { EmotionId } from '../emotions/catalog';

// Deliberately minimal: no reconciliation engine, no offline queue. Just three
// plain operations — upload on sign-in, pull on sign-in, append-only per check-in.
// Every function is best-effort and never throws; local storage is the source
// of truth the user always sees.

type ServerRow = { id: string; emotion: string; created_at: string };

/**
 * Run once whenever a user becomes (or is restored as) signed in. Uploads any
 * device-local check-ins to the account, then pulls the full account history
 * into the per-user local cache. Idempotent (keyed on the stable check-in id),
 * so it's safe to call again on every app foreground.
 */
export async function syncOnSignIn(userId: string): Promise<void> {
  try {
    // 1. Start from ALL device-local rows (anon pre-account + per-uid cache).
    //    These seed the merge so a local-only row can never be dropped.
    const [anon, cached] = await Promise.all([getAnonLogs(), getLocalLogs(userId)]);
    const merged = new Map<string, LocalLog>();
    for (const l of [...cached, ...anon]) merged.set(l.id, l);
    const local = [...merged.values()];

    // 2. Upload device-local rows (idempotent; ignore rows already present).
    //    Best-effort — if this fails, the rows still survive locally (step 4)
    //    and will be retried on the next sync.
    if (local.length > 0) {
      await supabase.from('emotion_logs').upsert(
        local.map((l) => ({
          id: l.id,
          user_id: userId,
          emotion: l.emotion,
          created_at: l.createdAt,
        })),
        { onConflict: 'id', ignoreDuplicates: true },
      );
    }

    // 3. Pull server rows and UNION them in — never overwrite. Server rows are
    //    layered on top of the local seed, so local-only rows are preserved
    //    even if the pull (or the upload above) failed.
    const { data, error } = await supabase.from('emotion_logs').select('id, emotion, created_at');
    if (!error && data) {
      for (const r of data as ServerRow[]) {
        merged.set(r.id, { id: r.id, emotion: r.emotion as EmotionId, createdAt: r.created_at });
      }
    }

    // 4. Write the union to the per-user cache, in a deterministic order.
    const unioned = [...merged.values()].sort((a, b) => {
      const t = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return t !== 0 ? t : a.id.localeCompare(b.id);
    });
    await writeLocalLogs(userId, unioned);

    // 5. Anon rows are now folded into the per-user cache (step 4) — and uploaded
    //    if online — so it is safe to clear the anon store with no risk of loss.
    await clearAnonLogs();
  } catch {
    // best-effort; the local cache remains intact and usable offline
  }
}

/** Append-only: best-effort single insert for a new signed-in check-in. */
export async function pushCheckIn(userId: string, log: LocalLog): Promise<void> {
  try {
    await supabase.from('emotion_logs').insert({
      id: log.id,
      user_id: userId,
      emotion: log.emotion,
      created_at: log.createdAt,
    });
  } catch {
    // fire-and-forget; it will be re-uploaded on the next sync
  }
}

/** Delete every server row for this user (used by signed-in "Clear history"). */
export async function clearServerHistory(userId: string): Promise<void> {
  try {
    await supabase.from('emotion_logs').delete().eq('user_id', userId);
  } catch {
    // best-effort
  }
}

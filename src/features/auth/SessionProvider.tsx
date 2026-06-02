import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { syncOnSignIn } from '../../lib/sync';

type SessionState = {
  session: Session | null;
  userId: string | null;
  /** True while the one-shot sign-in sync (upload + pull) is running. */
  syncing: boolean;
};

const SessionContext = createContext<SessionState>({
  session: null,
  userId: null,
  syncing: false,
});

export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [syncing, setSyncing] = useState(false);
  const syncedFor = useRef<string | null>(null);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const runSync = async (uid: string) => {
    setSyncing(true);
    try {
      await syncOnSignIn(uid);
    } finally {
      setSyncing(false);
    }
  };

  // Sync once per signed-in user (covers fresh sign-in AND a restored session).
  useEffect(() => {
    if (userId && syncedFor.current !== userId) {
      syncedFor.current = userId;
      void runSync(userId);
    }
    if (!userId) syncedFor.current = null;
  }, [userId]);

  // Re-run the one-shot sync on app foreground while signed in — cheap catch-up
  // for anything created offline. Not a queue, just one call at a lifecycle point.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && userId) void runSync(userId);
    });
    return () => sub.remove();
  }, [userId]);

  return (
    <SessionContext.Provider value={{ session, userId, syncing }}>
      {children}
    </SessionContext.Provider>
  );
}

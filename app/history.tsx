import { useCallback, useEffect, useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { space } from '../src/theme';
import { getEmotion } from '../src/emotions/catalog';
import { getLocalLogs, clearLocalLogs, type LocalLog } from '../src/lib/localHistory';
import { clearServerHistory } from '../src/lib/sync';
import { useSession } from '../src/features/auth/SessionProvider';
import { buildInsights, dayPart } from '../src/features/history/insights';
import { Screen } from '../src/ui/Screen';
import { T } from '../src/ui/T';
import { Action } from '../src/ui/Action';
import { Hairline } from '../src/ui/Hairline';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function relativeDay(iso: string, nowMs: number): string {
  const d = new Date(iso);
  const diff = Math.round((startOfDay(nowMs) - startOfDay(d.getTime())) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return DAYS[d.getDay()];
  const year = d.getFullYear() !== new Date(nowMs).getFullYear() ? ` ${d.getFullYear()}` : '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${year}`;
}

type DayGroup = { key: number; label: string; items: LocalLog[] };

function groupByDay(logs: LocalLog[], nowMs: number): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const log of logs) {
    const key = startOfDay(new Date(log.createdAt).getTime());
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(log);
    else groups.push({ key, label: relativeDay(log.createdAt, nowMs), items: [log] });
  }
  return groups;
}

/**
 * A gentle record, read like a page: the reflections as sentences, then the
 * days. No counts, no filters, no charts. Account controls live in Settings.
 */
export default function HistoryScreen() {
  const router = useRouter();
  const { userId, syncing, loading } = useSession();
  const [logs, setLogs] = useState<LocalLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const ls = await getLocalLogs(userId);
    setLogs(ls);
    setLoaded(true);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // Reload after a sign-in sync completes, or when the signed-in user changes.
  useEffect(() => {
    void load();
  }, [load, syncing]);

  const nowMs = Date.now();
  const sorted = [...logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const insights = buildInsights(logs, nowMs);
  const groups = groupByDay(sorted, nowMs);

  const confirmClear = () => {
    const signedIn = !!userId;
    Alert.alert(
      'Clear your history?',
      signedIn
        ? 'This removes every check-in from your account and this phone. Other phones you’ve signed in on may still hold a copy until you clear them there too. We won’t be able to bring them back.'
        : 'This removes the check-ins saved on this phone. We won’t be able to bring them back.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            if (signedIn && userId) {
              await clearServerHistory(userId);
              await clearLocalLogs(userId);
            } else {
              await clearLocalLogs(null);
            }
            setLogs([]);
          },
        },
      ],
    );
  };

  const restoring = !!userId && syncing && logs.length === 0;
  // While auth is still resolving (or the first load hasn't finished), show a
  // neutral quiet — never the signed-out prompt, and never a footer that then
  // jumps down.
  const showLoading = loading || !loaded || restoring;
  const isEmpty = !showLoading && logs.length === 0;

  return (
    <Screen back title="Looking back">
      {showLoading ? (
        restoring ? (
          <T role="body" tone="ink2">
            Bringing your check-ins back…
          </T>
        ) : null
      ) : isEmpty ? (
        <View style={styles.empty}>
          <T role="voice">Nothing here yet.</T>
          <T role="body" tone="ink2" style={styles.emptyHint}>
            Whenever you tap how you feel, it’ll appear here, just for you.
          </T>
          {!userId ? (
            <>
              <T role="body" tone="ink2" style={styles.emptyHint}>
                If you’ve kept a copy before, sign in to see it here.
              </T>
              <Action label="Sign in" onPress={() => router.push('/sign-in')} style={styles.emptyAction} />
            </>
          ) : null}
        </View>
      ) : (
        <>
          {insights.length > 0 ? (
            <View>
              {insights.map((line, i) => (
                <T key={i} role="voice" style={i > 0 ? styles.reflection : undefined}>
                  {line}
                </T>
              ))}
              <Hairline />
            </View>
          ) : null}

          {groups.map((group) => (
            <View key={group.key} style={styles.group} accessibilityRole="list">
              <T role="label" tone="ink2" accessibilityRole="header" style={styles.day}>
                {group.label}
              </T>
              {group.items.map((log) => {
                const e = getEmotion(log.emotion);
                const when = dayPart(log.createdAt);
                return (
                  <View
                    key={log.id}
                    style={styles.row}
                    accessible
                    accessibilityLabel={`${e?.label ?? log.emotion}, ${when}`}
                  >
                    <T role="label" tone="ink">
                      {e?.label ?? log.emotion}
                    </T>
                    <T role="whisper" tone="ink3">
                      {when}
                    </T>
                  </View>
                );
              })}
            </View>
          ))}

          <Action
            label={userId ? 'Clear history' : 'Clear history on this device'}
            kind="destructive"
            onPress={confirmClear}
            style={styles.clear}
          />
        </>
      )}

      {!showLoading ? (
        <View style={styles.foot}>
          <Hairline />
          <T role="whisper" tone="ink3">
            {userId
              ? 'Backed up to your account. Reflections are worked out on this phone.'
              : 'Kept only on this phone.'}
          </T>
          {!userId && logs.length > 0 ? (
            <Action
              label="Keep a copy"
              onPress={() => router.push('/sign-in')}
              accessibilityLabel="Keep a copy. Sign in with your email"
              style={styles.footAction}
            />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    marginTop: space.xl,
  },
  emptyHint: {
    marginTop: space.s,
  },
  emptyAction: {
    marginTop: space.m,
  },
  reflection: {
    marginTop: space.m,
  },
  group: {
    marginBottom: space.l,
  },
  day: {
    marginBottom: space.hair,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.s,
    paddingVertical: space.s,
  },
  clear: {
    marginTop: space.l,
  },
  foot: {
    marginTop: space.l,
  },
  footAction: {
    marginTop: space.xs,
  },
});

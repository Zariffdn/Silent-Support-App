import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { EMOTIONS, getEmotion, type EmotionId } from '../src/emotions/catalog';
import { getLocalLogs, clearLocalLogs, type LocalLog } from '../src/lib/localHistory';
import { clearServerHistory } from '../src/lib/sync';
import { useSession } from '../src/features/auth/SessionProvider';
import { supabase } from '../src/lib/supabase';
import { buildInsights, countByEmotion, recentLogs } from '../src/features/history/insights';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

type DayGroup = { label: string; items: LocalLog[] };

function groupByDay(logs: LocalLog[], nowMs: number): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const log of logs) {
    const label = relativeDay(log.createdAt, nowMs);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(log);
    else groups.push({ label, items: [log] });
  }
  return groups;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { session, userId, syncing, loading } = useSession();
  const [logs, setLogs] = useState<LocalLog[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<EmotionId | 'all'>('all');

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
  const weekly = countByEmotion(recentLogs(logs, nowMs));
  const filtered = filter === 'all' ? sorted : sorted.filter((l) => l.emotion === filter);
  const groups = groupByDay(filtered, nowMs);

  const signOut = async () => {
    const uid = userId;
    await supabase.auth.signOut();
    if (uid) await clearLocalLogs(uid);
  };

  const confirmClear = () => {
    const signedIn = !!userId;
    Alert.alert(
      'Clear your history?',
      signedIn
        ? 'This removes every check-in from your account, on all your devices. We won’t be able to bring them back.'
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
            setFilter('all');
          },
        },
      ],
    );
  };

  const restoring = !!userId && syncing && logs.length === 0;
  // While auth is still resolving (or the first load hasn't finished), show a
  // neutral loading state — never the signed-out "sign in" prompt.
  const showLoading = loading || !loaded || restoring;
  const isEmpty = !showLoading && logs.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={16} accessibilityLabel="Back">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Looking back</Text>
        <Text style={styles.subtitle}>A gentle record of how you’ve felt.</Text>

        {/* Backup nudge — only signed-out, only when there's something to protect */}
        {!loading && !userId && logs.length > 0 && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Your check-ins are saved only on this phone.</Text>
            <Pressable onPress={() => router.push('/sign-in')} hitSlop={8}>
              <Text style={styles.bannerAction}>Back up</Text>
            </Pressable>
          </View>
        )}

        {showLoading ? (
          <View style={styles.empty}>
            {restoring ? (
              <Text style={styles.emptyHint}>Bringing your check-ins back…</Text>
            ) : null}
          </View>
        ) : isEmpty ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nothing here yet.</Text>
            <Text style={styles.emptyHint}>
              Whenever you tap how you feel, it’ll quietly appear here, just for you.
            </Text>
            {!userId && (
              <Pressable onPress={() => router.push('/sign-in')} hitSlop={10} style={styles.emptySignIn}>
                <Text style={styles.signInLink}>Have an account? Sign in to bring your check-ins back.</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            {insights.length > 0 && (
              <View style={styles.card}>
                {insights.map((line, i) => (
                  <Text key={i} style={styles.insight}>
                    {line}
                  </Text>
                ))}
              </View>
            )}

            {weekly.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Lately</Text>
                <Text style={styles.sectionHint}>Past 7 days</Text>
                <View style={styles.pills}>
                  {weekly.map(({ emotion, count }) => {
                    const e = getEmotion(emotion);
                    return (
                      <View key={emotion} style={styles.pill}>
                        <Text style={styles.pillEmoji}>{e?.emoji ?? '•'}</Text>
                        <Text style={styles.pillCount}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
              {EMOTIONS.map((e) => (
                <Chip
                  key={e.id}
                  label={e.emoji}
                  active={filter === e.id}
                  onPress={() => setFilter(e.id)}
                />
              ))}
            </ScrollView>

            {groups.length === 0 ? (
              <Text style={styles.noneForFilter}>Nothing here for that feeling yet.</Text>
            ) : (
              groups.map((group) => (
                <View key={group.label} style={styles.group}>
                  <Text style={styles.dayLabel}>{group.label}</Text>
                  {group.items.map((log) => {
                    const e = getEmotion(log.emotion);
                    return (
                      <View key={log.id} style={styles.row}>
                        <Text style={styles.rowEmoji}>{e?.emoji ?? '•'}</Text>
                        <Text style={styles.rowLabel}>{e?.label ?? log.emotion}</Text>
                        <Text style={styles.rowTime}>{formatTime(log.createdAt)}</Text>
                      </View>
                    );
                  })}
                </View>
              ))
            )}

            <Pressable onPress={confirmClear} hitSlop={12} style={styles.clear}>
              <Text style={styles.clearText}>
                {userId ? 'Clear history on all devices' : 'Clear history on this device'}
              </Text>
            </Pressable>
          </>
        )}

        {/* Account controls — hidden until auth resolves to avoid a flash */}
        {!loading && (
          <View style={styles.account}>
            {userId ? (
              <>
                <Text style={styles.accountText}>
                  Signed in as {session?.user?.email ?? 'your account'}
                </Text>
                <Pressable onPress={signOut} hitSlop={10}>
                  <Text style={styles.accountAction}>Sign out</Text>
                </Pressable>
              </>
            ) : (
              <Pressable onPress={() => router.push('/sign-in')} hitSlop={10}>
                <Text style={styles.accountAction}>Sign in or back up</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityLabel={`Filter: ${label}`}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.canvas },
  topBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  back: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.ui,
    fontFamily: theme.typography.family.sans,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },
  title: {
    color: theme.colors.inkPrimary,
    fontSize: theme.typography.size.greeting,
    fontFamily: theme.typography.family.serif,
    marginTop: 12,
  },
  subtitle: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
    marginTop: 6,
    marginBottom: 24,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  bannerText: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
  bannerAction: {
    color: theme.colors.accentWhisper,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
  empty: { marginTop: 60, alignItems: 'center', gap: 10 },
  emptyText: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.response,
    fontFamily: theme.typography.family.serif,
  },
  emptyHint: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptySignIn: { marginTop: 14 },
  signInLink: {
    color: theme.colors.accentWhisper,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    marginBottom: 24,
  },
  insight: {
    color: theme.colors.inkPrimary,
    fontSize: theme.typography.size.ui,
    lineHeight: 26,
    fontFamily: theme.typography.family.serif,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.ui,
    fontFamily: theme.typography.family.sans,
  },
  sectionHint: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    fontFamily: theme.typography.family.sans,
    marginTop: 2,
    marginBottom: 12,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  pillEmoji: { fontSize: 18 },
  pillCount: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
  chips: { gap: 8, paddingVertical: 4, marginBottom: 20 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHigh,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 44,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: theme.colors.surfaceHigh,
    borderColor: theme.colors.accentWhisper,
  },
  chipText: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
  chipTextActive: { color: theme.colors.inkPrimary },
  group: { marginBottom: 20 },
  dayLabel: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    fontFamily: theme.typography.family.sans,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.surface,
  },
  rowEmoji: { fontSize: 22, marginRight: 14 },
  rowLabel: {
    flex: 1,
    color: theme.colors.inkPrimary,
    fontSize: theme.typography.size.ui,
    fontFamily: theme.typography.family.sans,
  },
  rowTime: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    fontFamily: theme.typography.family.sans,
  },
  noneForFilter: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  clear: { marginTop: 24, alignItems: 'center', paddingVertical: 12 },
  clearText: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    fontFamily: theme.typography.family.sans,
  },
  account: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.surface,
    alignItems: 'center',
    gap: 8,
  },
  accountText: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    fontFamily: theme.typography.family.sans,
  },
  accountAction: {
    color: theme.colors.accentWhisper,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
});

import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { EMOTIONS, getEmotion, type EmotionId } from '../src/emotions/catalog';
import { getLocalLogs, clearLocalLogs, type LocalLog } from '../src/lib/localHistory';
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
  const [logs, setLogs] = useState<LocalLog[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<EmotionId | 'all'>('all');

  // Reload from device whenever the screen is focused, so new check-ins appear.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getLocalLogs().then((ls) => {
        if (active) {
          setLogs(ls);
          setLoaded(true);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const nowMs = Date.now();
  const sorted = [...logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const insights = buildInsights(logs, nowMs);
  const weekly = countByEmotion(recentLogs(logs, nowMs));
  const filtered = filter === 'all' ? sorted : sorted.filter((l) => l.emotion === filter);
  const groups = groupByDay(filtered, nowMs);

  const confirmClear = () => {
    Alert.alert(
      'Clear history?',
      'This removes your check-ins from this device. It can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearLocalLogs();
            setLogs([]);
            setFilter('all');
          },
        },
      ],
    );
  };

  const isEmpty = loaded && logs.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={16} accessibilityLabel="Back">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Looking back</Text>
        <Text style={styles.subtitle}>A gentle record of how you’ve felt.</Text>

        {isEmpty ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No check-ins yet.</Text>
            <Text style={styles.emptyHint}>
              When you tap how you feel, it will quietly appear here.
            </Text>
          </View>
        ) : (
          <>
            {/* Soft insights */}
            {insights.length > 0 && (
              <View style={styles.card}>
                {insights.map((line, i) => (
                  <Text key={i} style={styles.insight}>
                    {line}
                  </Text>
                ))}
              </View>
            )}

            {/* Minimal "Lately" summary — past 7 days */}
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

            {/* Filter chips */}
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

            {/* Timeline */}
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
              <Text style={styles.clearText}>Clear history on this device</Text>
            </Pressable>
          </>
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
  safe: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  back: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.ui,
    fontFamily: theme.typography.family.sans,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
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
  empty: {
    marginTop: 60,
    alignItems: 'center',
    gap: 10,
  },
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
  section: {
    marginBottom: 24,
  },
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
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  pillEmoji: {
    fontSize: 18,
  },
  pillCount: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
  chips: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 20,
  },
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
  chipTextActive: {
    color: theme.colors.inkPrimary,
  },
  group: {
    marginBottom: 20,
  },
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
  rowEmoji: {
    fontSize: 22,
    marginRight: 14,
  },
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
  clear: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 12,
  },
  clearText: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    fontFamily: theme.typography.family.sans,
  },
});

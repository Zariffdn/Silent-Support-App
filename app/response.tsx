import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { getEmotion, pickCurated, type Strength } from '../src/emotions/catalog';
import { appendLocalLog, getCachedLogsSync } from '../src/lib/localHistory';
import { computeStrength } from '../src/features/history/strength';
import { pushCheckIn } from '../src/lib/sync';
import { useSession } from '../src/features/auth/SessionProvider';
import { fetchAiResponse } from '../src/lib/getSupportResponse';

export default function ResponseScreen() {
  const router = useRouter();
  const { userId } = useSession();
  const { emotion: emotionId } = useLocalSearchParams<{ emotion: string }>();
  const emotion = getEmotion(emotionId);

  // Response strength, computed once synchronously from recent on-device history
  // (the current check-in counted as +1). Never shown to the user — it only
  // shapes how much depth the response carries.
  const strengthRef = useRef<Strength | null>(null);
  if (emotion && strengthRef.current === null) {
    const recent = getCachedLogsSync(userId);
    const withCurrent = [
      ...recent,
      { id: '_current', emotion: emotion.id, createdAt: new Date().toISOString() },
    ];
    strengthRef.current = computeStrength(withCurrent, emotion.id, Date.now());
  }

  // Presence first: pick the curated response (at the chosen strength) once,
  // synchronously, so it is on screen from the very first frame (0ms).
  const curatedRef = useRef<string | null>(null);
  if (emotion && curatedRef.current === null) {
    curatedRef.current = pickCurated(emotion, strengthRef.current ?? 1);
  }

  const [text, setText] = useState<string | null>(curatedRef.current);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!emotion) return;
    let mounted = true;

    // Gentle fade-in of the curated response.
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start();

    (async () => {
      // Record the check-in privately on-device — the local store is always the
      // source of truth the user sees.
      const log = await appendLocalLog(userId, emotion.id);
      // If signed in, also back it up to the account (append-only, best-effort).
      if (userId) void pushCheckIn(userId, log);

      // Ask the AI in the background, at the same strength; swap in if it's quick.
      const ai = await fetchAiResponse(emotion, strengthRef.current ?? 1);
      if (ai && mounted) {
        // Soft crossfade swap — the AI quietly deepens the response, no jolt.
        Animated.timing(fade, { toValue: 0, duration: 400, useNativeDriver: true }).start(
          ({ finished }) => {
            if (finished && mounted) {
              setText(ai);
              Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
            }
          },
        );
      }
    })();

    return () => {
      mounted = false;
    };
  }, [emotion, fade]);

  const close = () => router.replace('/');

  // Guard against a malformed/unknown emotion param.
  if (!emotion) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable style={styles.center} onPress={close}>
          <Text style={styles.response}>Take a breath. Tap to return.</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable style={styles.center} onPress={close} accessibilityLabel="Close">
        <Animated.View style={[styles.content, { opacity: fade }]}>
          <Text style={styles.echo}>
            {emotion.emoji}  {emotion.label}
          </Text>
          <View style={styles.layers}>
            {(text ?? '').split(/\n{2,}/).map((layer, i) => (
              <Text key={i} style={styles.layer}>
                {layer.trim()}
              </Text>
            ))}
          </View>

          <Pressable
            onPress={() => router.push('/comfort')}
            accessibilityLabel="Enter comfort mode"
            hitSlop={12}
            style={({ pressed }) => [styles.breathe, pressed && styles.breathePressed]}
          >
            <Text style={styles.breatheText}>Breathe with me</Text>
          </Pressable>

          <Text style={styles.hint}>Or tap anywhere when you’re ready</Text>
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    gap: 22,
  },
  echo: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
  // The four layers, spaced so reading downward feels like the response deepening.
  layers: {
    alignItems: 'center',
    gap: 16,
  },
  layer: {
    color: theme.colors.inkPrimary,
    fontSize: theme.typography.size.ui,
    lineHeight: 26,
    fontFamily: theme.typography.family.serif,
    textAlign: 'center',
  },
  // Used by the malformed-emotion fallback only.
  response: {
    color: theme.colors.inkPrimary,
    fontSize: theme.typography.size.response,
    lineHeight: theme.typography.lineHeight.response,
    fontFamily: theme.typography.family.serif,
    textAlign: 'center',
  },
  breathe: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHigh,
  },
  breathePressed: {
    backgroundColor: theme.colors.surface,
  },
  breatheText: {
    color: theme.colors.accentWhisper,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
  hint: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    fontFamily: theme.typography.family.sans,
    marginTop: 12,
  },
});

import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { getEmotion, pickCurated, type Strength } from '../src/emotions/catalog';
import { appendLocalLog, getCachedLogsSync } from '../src/lib/localHistory';
import { computeStrength } from '../src/features/history/strength';
import { deriveMemory, type MemorySignal } from '../src/features/history/memory';
import { computeStrain } from '../src/features/safety/strain';
import {
  canShowSupport,
  markSupportShown,
  markSupportDismissed,
} from '../src/features/safety/supportPrompt';
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
  // A single soft memory aside (or none) is derived from the same recent history,
  // acknowledging an abstract PATTERN — never what the feeling was about. It is
  // shown on-device only and never sent to the AI or server.
  const strengthRef = useRef<Strength | null>(null);
  const memoryRef = useRef<MemorySignal | null>(null);
  // Soft crisis layer: whether persistent strain makes the support-resources
  // nudge eligible. Computed locally and ephemerally; the frequency cap (async)
  // decides whether it actually shows. Never alarming, never blocking.
  const strainEligibleRef = useRef(false);
  if (emotion && strengthRef.current === null) {
    const now = Date.now();
    const recent = getCachedLogsSync(userId);
    const withCurrent = [
      ...recent,
      { id: '_current', emotion: emotion.id, createdAt: new Date(now).toISOString() },
    ];
    strengthRef.current = computeStrength(withCurrent, emotion.id, now);
    memoryRef.current = deriveMemory(withCurrent, emotion.id, strengthRef.current, now);
    strainEligibleRef.current = computeStrain(withCurrent, now).eligible;
  }

  // Presence first: pick the curated response (at the chosen strength) once,
  // synchronously, so it is on screen from the very first frame (0ms).
  const curatedRef = useRef<string | null>(null);
  if (emotion && curatedRef.current === null) {
    curatedRef.current = pickCurated(emotion, strengthRef.current ?? 1);
  }

  const [text, setText] = useState<string | null>(curatedRef.current);
  const [showSupport, setShowSupport] = useState(false);
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

      // Soft support nudge: if strain looks persistent AND the frequency cap
      // allows it, quietly offer resources below the response. Non-core, so it
      // may appear a beat after the response — never blocks, always dismissible.
      if (strainEligibleRef.current && (await canShowSupport(Date.now()))) {
        if (mounted) {
          setShowSupport(true);
          void markSupportShown(Date.now());
        }
      }

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
  const dismissSupport = () => {
    setShowSupport(false);
    void markSupportDismissed(Date.now());
  };

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
          {memoryRef.current && (
            <Text style={styles.memory}>{memoryRef.current.phrase}</Text>
          )}
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

          {showSupport && (
            <View style={styles.support}>
              <Text style={styles.supportText}>
                If things have been feeling especially heavy lately, support resources are always
                available.
              </Text>
              <View style={styles.supportActions}>
                <Pressable
                  onPress={() => router.push('/help')}
                  accessibilityLabel="View support resources"
                  hitSlop={8}
                  style={({ pressed }) => [styles.supportBtn, pressed && styles.supportBtnPressed]}
                >
                  <Text style={styles.supportBtnText}>View support resources</Text>
                </Pressable>
                <Pressable onPress={dismissSupport} accessibilityLabel="Dismiss" hitSlop={8}>
                  <Text style={styles.supportDismiss}>Not now</Text>
                </Pressable>
              </View>
            </View>
          )}
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
  // The memory whisper — the app's quiet aside, dimmer than the curated layers
  // and visually distinct from them, so it reads as noticing, not as the message.
  memory: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    fontFamily: theme.typography.family.sans,
    fontStyle: 'italic',
    textAlign: 'center',
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
  // Soft support nudge — subordinate to the response, set off by a quiet divider.
  // Warm, calm, dismissible; never alarming, never blocking.
  support: {
    marginTop: 24,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceHigh,
    alignItems: 'center',
    gap: 16,
    maxWidth: 300,
  },
  supportText: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.caption,
    lineHeight: 20,
    fontFamily: theme.typography.family.sans,
    textAlign: 'center',
  },
  supportActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  supportBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHigh,
  },
  supportBtnPressed: {
    backgroundColor: theme.colors.surface,
  },
  supportBtnText: {
    color: theme.colors.accentWarm,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
  supportDismiss: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    fontFamily: theme.typography.family.sans,
  },
});

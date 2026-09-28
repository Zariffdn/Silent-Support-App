import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  ScrollView,
  View,
  StyleSheet,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, easing, layout, light, motion, space } from '../src/theme';
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
import { POOL } from '../src/features/support/EmotionButton';
import { T } from '../src/ui/T';
import { Pool } from '../src/ui/Pool';
import { Action } from '../src/ui/Action';

// A tap that spills over from the field (a nervous double-tap) must never
// close the words or open the next screen. Every touch on this screen is
// ignored for this long after arrival.
const ARM_DELAY_MS = 600;
// The curated words stand for at least this long before the AI may deepen
// them, so the first thing read is never the thing that changes.
const MIN_STAND_MS = 1000;
// The nudge counts as "shown" only once at least this much of it is on screen.
const SEEN_PX = 40;

const claim = () => true;

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
  const [supportGone, setSupportGone] = useState(!strainEligibleRef.current);
  const [armed, setArmed] = useState(false);

  const mountedAt = useRef(Date.now());
  // The session at the moment of the check-in. Read through a ref so a session
  // resolving while the words are on screen never re-runs the arrival.
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const screenReaderRef = useRef(false);

  // Only the words crossfade when the AI deepens them. The echo, the action
  // and the hint never move; the block keeps its measured height so it never
  // shrinks (a longer AI reply still extends the page downward).
  const words = useRef(new Animated.Value(1)).current;
  const [wordsMinHeight, setWordsMinHeight] = useState(0);
  // The chosen word carries its light in from the field, then settles; the
  // room warms behind the words.
  const echoGlow = useRef(new Animated.Value(light.chosen)).current;
  const warmth = useRef(new Animated.Value(0)).current;
  const support = useRef(new Animated.Value(0)).current;
  const [echoWidth, setEchoWidth] = useState(0);

  // Nudge visibility: the weekly cap is spent only once the nudge has actually
  // been on screen, not the moment it mounts below the fold.
  const supportYRef = useRef<number | null>(null);
  const scrollYRef = useRef(0);
  const viewportRef = useRef(0);
  const supportSeenRef = useRef(false);
  const noteSupportSeen = () => {
    if (supportSeenRef.current || supportYRef.current === null || !viewportRef.current) return;
    const top = supportYRef.current - scrollYRef.current;
    if (top + SEEN_PX <= viewportRef.current) {
      supportSeenRef.current = true;
      void markSupportShown(Date.now());
    }
  };

  useEffect(() => {
    if (!emotion) return;
    let mounted = true;
    let swapTimer: ReturnType<typeof setTimeout> | null = null;
    const armTimer = setTimeout(() => setArmed(true), ARM_DELAY_MS);

    AccessibilityInfo.isScreenReaderEnabled()
      .then((on) => {
        screenReaderRef.current = on;
      })
      .catch(() => {});

    Animated.parallel([
      Animated.timing(echoGlow, {
        toValue: light.action,
        duration: motion.settle,
        easing: easing.out,
        useNativeDriver: true,
      }),
      Animated.timing(warmth, {
        toValue: light.read,
        duration: motion.settle,
        easing: easing.out,
        useNativeDriver: true,
      }),
    ]).start();

    (async () => {
      const uid = userIdRef.current;
      // Record the check-in privately on-device — the local store is always the
      // source of truth the user sees.
      const log = await appendLocalLog(uid, emotion.id);
      // If signed in, also back it up to the account (append-only, best-effort).
      if (uid) void pushCheckIn(uid, log);

      // Soft support nudge: if strain looks persistent AND the frequency cap
      // allows it, quietly offer resources below the words. Its space is held
      // from frame 0 whenever it is eligible, so it never shoves the words, and
      // released the moment the cap says no.
      if (strainEligibleRef.current) {
        const allowed = await canShowSupport(Date.now());
        if (!mounted) return;
        if (allowed) {
          setShowSupport(true);
          Animated.timing(support, {
            toValue: 1,
            duration: motion.arrive,
            easing: easing.out,
            useNativeDriver: true,
          }).start();
        } else {
          setSupportGone(true);
        }
      }

      // Ask the AI in the background, at the same strength; swap in if it's quick.
      // A screen-reader user keeps the curated words: replacing text mid-read
      // with no announcement is worse than a shallower response.
      const ai = await fetchAiResponse(emotion, strengthRef.current ?? 1);
      if (!ai || !mounted || screenReaderRef.current) return;
      const wait = Math.max(0, MIN_STAND_MS - (Date.now() - mountedAt.current));
      swapTimer = setTimeout(() => {
        if (!mounted) return;
        Animated.timing(words, {
          toValue: 0,
          duration: motion.leave,
          easing: easing.out,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished || !mounted) return;
          setText(ai);
          Animated.timing(words, {
            toValue: 1,
            duration: motion.arrive,
            easing: easing.out,
            useNativeDriver: true,
          }).start();
        });
      }, wait);
    })();

    return () => {
      mounted = false;
      clearTimeout(armTimer);
      if (swapTimer) clearTimeout(swapTimer);
    };
    // One mount is exactly one check-in and one AI call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion]);

  // Leaving pops back to the home already beneath us (no stacked duplicate).
  const close = () => {
    if (!armed) return;
    router.dismissTo('/');
  };

  const dismissSupport = () => {
    void markSupportDismissed(Date.now());
    Animated.timing(support, {
      toValue: 0,
      duration: motion.leave,
      easing: easing.out,
      useNativeDriver: true,
    }).start(() => {
      setShowSupport(false);
      setSupportGone(true);
    });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
    noteSupportSeen();
  };
  const onViewport = (e: LayoutChangeEvent) => {
    viewportRef.current = e.nativeEvent.layout.height;
    noteSupportSeen();
  };
  const onSupportLayout = (e: LayoutChangeEvent) => {
    // y is relative to the column, which starts at the scroll content's top padding.
    supportYRef.current = e.nativeEvent.layout.y + space.m;
    noteSupportSeen();
  };

  // Guard against a malformed/unknown emotion param.
  if (!emotion) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable style={styles.fallback} onPress={() => router.dismissTo('/')} accessibilityRole="button">
          <T role="voice">Take a breath. Tap to return.</T>
        </Pressable>
      </SafeAreaView>
    );
  }

  const layers = (text ?? '').split(/\n{2,}/);

  return (
    <SafeAreaView style={styles.safe}>
      {/* The dark around the words is the exit. The words themselves never are. */}
      <Pressable style={styles.room} onPress={close} accessible={false}>
        {/* Warmth behind the column, outside the scroll so it is never clipped. */}
        <Pool tint="lamp" size={layout.column} opacity={warmth} style={styles.lamp} />

        {/* The chosen feeling, carrying its light in from the field. Fixed
            above the words so its light is never cut by the scroll edge. */}
        <View style={styles.header} pointerEvents="box-none">
          <View
            style={styles.echo}
            onLayout={(e) => setEchoWidth(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={claim}
          >
            {echoWidth > 0 ? (
              <Pool tint="moon" size={POOL} opacity={echoGlow} style={{ left: echoWidth / 2, top: '50%' }} />
            ) : null}
            <T role="field" accessibilityRole="header">
              {emotion.label}
            </T>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={false}
          onLayout={onViewport}
          onScroll={onScroll}
          scrollEventThrottle={100}
        >
          <View style={styles.column} pointerEvents={armed ? 'auto' : 'none'}>
            <Animated.View
              style={[styles.words, { opacity: words, minHeight: wordsMinHeight }]}
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                if (h > wordsMinHeight) setWordsMinHeight(h);
              }}
              onStartShouldSetResponder={claim}
              accessibilityRole="text"
            >
              {layers.map((layer, i) => (
                <T key={i} role="voice" style={i > 0 ? styles.layer : undefined}>
                  {layer.trim()}
                </T>
              ))}
            </Animated.View>

            {/* The memory whisper — an afterthought, never a preamble. */}
            {memoryRef.current ? (
              <View style={styles.memory} onStartShouldSetResponder={claim}>
                <T role="whisper" tone="ink2">
                  {memoryRef.current.phrase}
                </T>
              </View>
            ) : null}

            <Action
              label="Breathe with me"
              kind="primary"
              onPress={() => router.push('/comfort')}
              accessibilityLabel="Breathe with me. Opens the breathing space"
              style={styles.breathe}
            />

            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Or tap anywhere when you’re ready. Closes the words"
              style={styles.hint}
            >
              <T role="whisper" tone="ink2">
                Or tap anywhere when you’re ready
              </T>
            </Pressable>

            {!supportGone ? (
              <Animated.View style={[styles.support, { opacity: support }]} onLayout={onSupportLayout}>
                {showSupport ? (
                  <>
                    <View onStartShouldSetResponder={claim}>
                      <T role="body" tone="ink2">
                        If things have felt heavy for a while, you don’t have to carry that alone.
                      </T>
                    </View>
                    <View style={styles.supportActions}>
                      <Action
                        label="Support resources"
                        onPress={() => router.push('/help')}
                        accessibilityLabel="Support resources. Opens help"
                      />
                      <Action label="Not now" onPress={dismissSupport} />
                    </View>
                  </>
                ) : null}
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  room: {
    flex: 1,
  },
  lamp: {
    top: '40%',
  },
  header: {
    width: '100%',
    maxWidth: layout.column,
    alignSelf: 'center',
    paddingHorizontal: layout.edge,
    paddingTop: space.xl,
  },
  echo: {
    alignSelf: 'flex-start',
    minHeight: layout.touch,
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.column,
    alignSelf: 'center',
    paddingHorizontal: layout.edge,
    paddingTop: space.m,
    paddingBottom: space.xxl,
  },
  column: {
    alignItems: 'flex-start',
  },
  words: {
    alignSelf: 'stretch',
  },
  layer: {
    marginTop: space.m,
  },
  memory: {
    marginTop: space.m,
  },
  breathe: {
    marginTop: space.l,
  },
  hint: {
    marginTop: space.s,
    minHeight: layout.touch,
    justifyContent: 'center',
  },
  // Reserved from frame 0 while eligible: the nudge extends the page downward
  // and never moves the words. Subordinate by construction: prose, not a card.
  support: {
    alignSelf: 'stretch',
    minHeight: 132,
    marginTop: space.xl,
  },
  supportActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.xs,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.edge,
  },
});

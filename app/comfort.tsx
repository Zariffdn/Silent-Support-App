import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, View, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, easing, layout, motion, space, type, useReducedMotion } from '../src/theme';
import { useBreathing } from '../src/features/comfort/useBreathing';
import { BreathLight } from '../src/features/comfort/BreathLight';
import { GroundingLine } from '../src/features/comfort/GroundingLine';
import {
  getComfortAudio,
  getComfortVolume,
  isAmbientSound,
  type ComfortAudio,
} from '../src/lib/preferences';
import { startAmbient, stopAmbient } from '../src/features/comfort/audio';
import { T } from '../src/ui/T';
import { Action } from '../src/ui/Action';

// How long the discoverability hint stays before it fades itself away.
const HINT_HOLD_MS = 2600;

export default function ComfortScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  // A settle beat: the room arrives still, then begins to breathe.
  const { scale, phase } = useBreathing(motion.settle);

  // "Stay in silence": one tap strips all words away, leaving only the breath.
  const [silent, setSilent] = useState(false);

  // Comfort Mode audio preference (local-only). Silent is the default. On focus
  // we load the choice, start the chosen ambient sound, and stop + release it
  // the moment Comfort Mode loses focus (back, navigate away, app close).
  const [comfortAudio, setComfortAudio] = useState<ComfortAudio>('silent');
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [audio, volume] = await Promise.all([getComfortAudio(), getComfortVolume()]);
        if (cancelled) return;
        setComfortAudio(audio);
        if (isAmbientSound(audio)) void startAmbient(audio, volume);
      })();
      return () => {
        cancelled = true;
        void stopAmbient();
      };
    }, []),
  );

  // Gentle Haptics: a single soft pulse at the start of inhale and exhale (never
  // on hold, never continuous, never before the breath has begun). If the
  // device has no haptics, this no-ops silently.
  const prevPhaseRef = useRef(phase.key);
  useEffect(() => {
    const changed = prevPhaseRef.current !== phase.key;
    prevPhaseRef.current = phase.key;
    if (!changed || comfortAudio !== 'haptics') return;
    if (phase.key === 'inhale' || phase.key === 'exhale') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    }
  }, [phase.key, comfortAudio]);

  // Screen readers hear each phase as it begins, on both platforms.
  const screenReaderRef = useRef(false);
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then((on) => {
        screenReaderRef.current = on;
      })
      .catch(() => {});
  }, []);

  // Phase cue: hidden until the first breath begins, then the word fades out,
  // changes, and fades back in — never a blink. A 200ms lag behind the breath
  // is imperceptible against 4–6s phases.
  const [cueLabel, setCueLabel] = useState(phase.label);
  const cue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(cue, {
        toValue: 1,
        duration: motion.arrive,
        easing: easing.out,
        useNativeDriver: true,
      }).start();
    }, motion.settle);
    return () => clearTimeout(t);
  }, [cue]);
  useEffect(() => {
    if (phase.label === cueLabel) return;
    if (screenReaderRef.current) AccessibilityInfo.announceForAccessibility(phase.label);
    Animated.timing(cue, {
      toValue: 0,
      duration: motion.touch,
      easing: easing.out,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setCueLabel(phase.label);
      Animated.timing(cue, {
        toValue: 1,
        duration: motion.arrive,
        easing: easing.out,
        useNativeDriver: true,
      }).start();
    });
  }, [phase.label, cueLabel, cue]);

  // Silence dissolves the words rather than cutting them. The exit recedes but
  // stays readable so there is always a way out.
  const wordsOpacity = useRef(new Animated.Value(1)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(wordsOpacity, {
        toValue: silent ? 0 : 1,
        duration: motion.settle,
        easing: easing.out,
        useNativeDriver: true,
      }),
      Animated.timing(exitOpacity, {
        toValue: silent ? 0.75 : 1,
        duration: motion.settle,
        easing: easing.out,
        useNativeDriver: true,
      }),
    ]).start();
  }, [silent, wordsOpacity, exitOpacity]);

  // A soft hint that arrives, holds, and fades away — only while the words are
  // showing. Entering silence is silent; any tap brings the words back.
  const hint = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (silent) {
      Animated.timing(hint, { toValue: 0, duration: motion.leave, easing: easing.out, useNativeDriver: true }).start();
      return;
    }
    hint.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(hint, { toValue: 1, duration: motion.arrive, easing: easing.out, useNativeDriver: true }),
      Animated.delay(HINT_HOLD_MS),
      Animated.timing(hint, { toValue: 0, duration: motion.settle, easing: easing.out, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [silent, hint]);

  const leave = () => router.dismissTo('/');
  const cueOpacity = Animated.multiply(wordsOpacity, cue);

  return (
    <SafeAreaView style={styles.safe}>
      <BreathLight scale={scale} dim={silent} reducedMotion={reducedMotion} />

      {/* Two quiet words on the shared edge: the way to the sound, the way out. */}
      <View style={styles.top}>
        <Animated.View
          style={{ opacity: wordsOpacity }}
          pointerEvents={silent ? 'none' : 'auto'}
          accessibilityElementsHidden={silent}
          importantForAccessibility={silent ? 'no-hide-descendants' : 'auto'}
        >
          <Action label="Sound" onPress={() => router.push('/settings')} accessibilityLabel="Sound. Opens settings" />
        </Animated.View>
        <Animated.View style={{ opacity: exitOpacity }}>
          <Action label="Done" onPress={leave} accessibilityLabel="Done. Leaves the breathing space" style={styles.done} />
        </Animated.View>
      </View>

      {/* The room: a tap anywhere toggles silence; the words sit above the
          touch layer so screen readers can reach them. */}
      <View style={styles.middle}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setSilent((s) => !s)}
          accessibilityRole="button"
          accessibilityLabel={silent ? 'Bring the words back' : 'Stay in silence'}
        />
        <View style={styles.centre} pointerEvents="none">
          <Animated.View style={[styles.words, { opacity: cueOpacity }]}>
            <T role="field" center>
              {cueLabel}
            </T>
          </Animated.View>

          {/* The breath lives here: empty space at the centre of the room. */}
          <View style={{ height: height * 0.34 }} />

          <Animated.View style={[styles.words, styles.grounding, { opacity: wordsOpacity }]}>
            <GroundingLine />
          </Animated.View>
        </View>
      </View>

      <Animated.View
        style={[styles.hintWrap, { opacity: hint }]}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <T role="whisper" tone="ink3" center>
          Tap anywhere for silence
        </T>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  top: {
    width: '100%',
    maxWidth: layout.column,
    alignSelf: 'center',
    paddingHorizontal: layout.edge,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  done: {
    marginLeft: 0,
    marginRight: -space.m,
  },
  middle: {
    flex: 1,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: {
    alignItems: 'center',
    paddingHorizontal: layout.edge,
  },
  grounding: {
    minHeight: type.body.lineHeight,
  },
  hintWrap: {
    paddingHorizontal: layout.edge,
    paddingBottom: space.xl,
    minHeight: type.whisper.lineHeight + space.xl,
  },
});

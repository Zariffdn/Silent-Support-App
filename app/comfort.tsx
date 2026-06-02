import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { useBreathing } from '../src/features/comfort/useBreathing';
import { BreathingCircle } from '../src/features/comfort/BreathingCircle';
import { GroundingLine } from '../src/features/comfort/GroundingLine';

export default function ComfortScreen() {
  const router = useRouter();
  const { scale, phase } = useBreathing();

  // "Stay in silence": one tap strips all words away, leaving only the breath.
  const [silent, setSilent] = useState(false);

  // Gently crossfade the phase cue whenever the phase changes.
  const cue = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    cue.setValue(0.3);
    Animated.timing(cue, { toValue: 1, duration: 900, useNativeDriver: true }).start();
  }, [phase.key, cue]);

  // A soft hint that fades away after a couple of seconds. It reappears briefly
  // each time silence is toggled, so the gesture stays discoverable without
  // ever cluttering the space.
  const hint = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    hint.setValue(1);
    const anim = Animated.sequence([
      Animated.delay(2600),
      Animated.timing(hint, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [silent, hint]);

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable
        style={styles.body}
        onPress={() => setSilent((s) => !s)}
        accessibilityLabel={silent ? 'Show guidance' : 'Stay in silence'}
      >
        {/* Phase cue: fades out in silence but keeps its space, so the circle stays put. */}
        <Animated.Text style={[styles.cue, { opacity: silent ? 0 : cue }]}>{phase.label}</Animated.Text>

        <BreathingCircle scale={scale} dim={silent} />

        {/* Grounding line: the container always holds its space; only the line fades away. */}
        <View style={styles.grounding}>{!silent && <GroundingLine />}</View>
      </Pressable>

      {/* Always-available, barely-there exit. Fades further in silence but stays tappable. */}
      <Pressable
        style={[styles.done, silent && styles.doneSilent]}
        onPress={() => router.replace('/')}
        accessibilityLabel="Leave comfort mode"
        hitSlop={16}
      >
        <Text style={styles.doneText}>Done</Text>
      </Pressable>

      {/* Self-fading discoverability hint. pointerEvents none so taps still toggle silence. */}
      <Animated.View style={[styles.hintWrap, { opacity: hint }]} pointerEvents="none">
        <Text style={styles.hint}>{silent ? 'Tap to return' : 'Tap anywhere for silence'}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.comfortBase,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 56,
  },
  cue: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.ui,
    fontFamily: theme.typography.family.serif,
    letterSpacing: 1,
  },
  grounding: {
    minHeight: 24,
    paddingHorizontal: 40,
  },
  done: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  doneSilent: {
    opacity: 0.25,
  },
  doneText: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    fontFamily: theme.typography.family.sans,
  },
  hintWrap: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hint: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    fontFamily: theme.typography.family.sans,
    letterSpacing: 0.5,
  },
});

import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { GROUNDING_MESSAGES } from './grounding';

// One full breath cycle (4 + 4 + 6). The line changes once per cycle so it
// never competes with the breathing for attention.
const ROTATE_MS = 14000;

/** A single grounding line that fades out, swaps, and fades back in — slowly. */
export function GroundingLine() {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle fade-in on first mount.
    Animated.timing(opacity, { toValue: 1, duration: 1200, useNativeDriver: true }).start();

    const interval = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: 1000, useNativeDriver: true }).start(
        ({ finished }) => {
          if (!finished) return;
          setIndex((i) => (i + 1) % GROUNDING_MESSAGES.length);
          Animated.timing(opacity, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
        },
      );
    }, ROTATE_MS);

    return () => clearInterval(interval);
  }, [opacity]);

  return (
    <Animated.Text style={[styles.text, { opacity }]}>
      {GROUNDING_MESSAGES[index]}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.serif,
    textAlign: 'center',
  },
});

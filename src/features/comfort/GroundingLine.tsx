import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { easing, motion } from '../../theme';
import { T } from '../../ui/T';
import { GROUNDING_MESSAGES } from './grounding';

// One full breath cycle (4 + 4 + 6). The line changes once per cycle so it
// never competes with the breathing for attention.
const ROTATE_MS = 14000;

/** A single grounding line that drifts out, changes, and drifts back — slowly. */
export function GroundingLine() {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fade = (to: number) =>
      Animated.timing(opacity, {
        toValue: to,
        duration: motion.drift,
        easing: easing.out,
        useNativeDriver: true,
      });

    fade(1).start();
    const interval = setInterval(() => {
      fade(0).start(({ finished }) => {
        if (!finished) return;
        setIndex((i) => (i + 1) % GROUNDING_MESSAGES.length);
        fade(1).start();
      });
    }, ROTATE_MS);

    return () => clearInterval(interval);
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <T role="body" tone="ink2" center>
        {GROUNDING_MESSAGES[index]}
      </T>
    </Animated.View>
  );
}

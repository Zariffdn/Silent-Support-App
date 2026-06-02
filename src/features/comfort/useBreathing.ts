import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

export type BreathPhase = {
  key: 'inhale' | 'hold' | 'exhale';
  label: string;
  duration: number;
  /** Target for the shared scale value (0 = fully exhaled, 1 = fully inhaled). */
  to: number;
};

// Default pattern: inhale 4s, hold 4s, exhale 6s.
export const BREATH_PATTERN: BreathPhase[] = [
  { key: 'inhale', label: 'Breathe in', duration: 4000, to: 1 },
  { key: 'hold', label: 'Hold', duration: 4000, to: 1 },
  { key: 'exhale', label: 'Breathe out', duration: 6000, to: 0 },
];

/**
 * Drives the breathing cycle. The phase label and the circle's scale are
 * advanced by the SAME step runner, so the word the user reads always matches
 * the movement they see. The animation runs on the native thread.
 */
export function useBreathing() {
  const scale = useRef(new Animated.Value(0)).current; // begin fully exhaled
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    let animation: Animated.CompositeAnimation | null = null;
    let i = 0;

    const run = () => {
      if (!mounted) return;
      const step = BREATH_PATTERN[i];
      setIndex(i);

      animation = Animated.timing(scale, {
        toValue: step.to,
        duration: step.duration,
        // Hold is a still pause; inhale/exhale follow a sine ease-in-out, which
        // matches the natural rhythm of breath and reaches each end at zero
        // velocity, so phase changes never feel abrupt.
        easing: step.key === 'hold' ? Easing.linear : Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });

      animation.start(({ finished }) => {
        if (finished && mounted) {
          i = (i + 1) % BREATH_PATTERN.length;
          run();
        }
      });
    };

    run();
    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [scale]);

  return { scale, phase: BREATH_PATTERN[index] };
}

import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';

// Light moves; nothing else moves. Five durations cover every animation in the
// app, and screens dissolve rather than slide (see app/_layout.tsx).
export const motion = {
  /** Touch feedback: light gathering under a finger. */
  touch: 200,
  /** Something arriving: a line, the warmth behind words. */
  arrive: 400,
  /** Something leaving; also the screen dissolve (iOS honours the number,
   *  Android uses the native stack's own fade, which is close). */
  leave: 300,
  /** A slow settle: silence in Comfort Mode, the still beat before the first
   *  breath, the light carrying in behind the chosen word. */
  settle: 600,
  /** The grounding line's slow drift between lines, once per breath cycle. */
  drift: 1200,
} as const;

export const easing = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.sin),
} as const;

/**
 * The OS "reduce motion" preference. Opacity fades are allowed either way;
 * anything that scales or travels (the breath, the bloom) becomes brightness
 * only when this is true.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (mounted) setReduced(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

import { useEffect, useMemo, useRef } from 'react';
import { Animated, View, StyleSheet, useWindowDimensions } from 'react-native';
import { easing, light, motion } from '../../theme';
import { Pool } from '../../ui/Pool';

type Props = {
  /** Shared breath value: 0 = fully exhaled, 1 = fully inhaled. */
  scale: Animated.Value;
  /** Silence mode: the light softens further (dissolving, never snapping). */
  dim?: boolean;
  /** OS reduce-motion: the light changes brightness only, never size. */
  reducedMotion?: boolean;
};

/**
 * The breath, as light. There is no disc and no ring: a soft glow larger than
 * the screen at full inhale, so there is nothing to look at — the room itself
 * breathes. Brightness rises with the breath so it reads as alive, not
 * mechanical. Everything runs on the native driver.
 */
export function BreathLight({ scale, dim, reducedMotion }: Props) {
  const { width, height } = useWindowDimensions();
  const size = Math.max(width, height) * 1.15;

  const dimValue = useRef(new Animated.Value(dim ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(dimValue, {
      toValue: dim ? 1 : 0,
      duration: motion.settle,
      easing: easing.out,
      useNativeDriver: true,
    }).start();
  }, [dim, dimValue]);

  const grow = useMemo(
    () => scale.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
    [scale],
  );
  const still = useMemo(
    () => scale.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.8] }),
    [scale],
  );
  const glow = useMemo(
    () => scale.interpolate({ inputRange: [0, 1], outputRange: [light.breathOut, light.breathIn] }),
    [scale],
  );
  const hush = useMemo(
    () => dimValue.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }),
    [dimValue],
  );
  const opacity = useMemo(() => Animated.multiply(glow, hush), [glow, hush]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false}>
      <Pool tint="moon" size={size} opacity={opacity} scale={reducedMotion ? still : grow} />
    </View>
  );
}

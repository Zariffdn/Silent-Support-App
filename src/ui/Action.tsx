import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { easing, layout, light, motion, space } from '../theme';
import { Pool } from './Pool';
import { T } from './T';

type Kind = 'primary' | 'secondary' | 'destructive';

type Props = {
  label: string;
  onPress: () => void;
  /** primary = the one next thing (rests on light); secondary = a quiet word;
   *  destructive = alert ink, no light. */
  kind?: Kind;
  disabled?: boolean;
  /** Something is in flight ("Sending…"): disabled, and announced as busy. */
  busy?: boolean;
  accessibilityLabel?: string;
  /** Extra layout style (e.g. alignSelf: 'center'). */
  style?: StyleProp<ViewStyle>;
};

/**
 * The app's only button: a word, and light under it. No borders, no fills.
 * Touch is acknowledged by light gathering (200ms) and released the same way.
 * The touch area extends 16pt past the word so the word itself can sit on the
 * screen's left edge while the target still clears 44pt. In a row, give the
 * row `gap: space.xs` so the words sit 24pt apart.
 */
export function Action({ label, onPress, kind = 'secondary', disabled, busy, accessibilityLabel, style }: Props) {
  const rest = kind === 'primary' ? light.action : 0;
  const pressed = kind === 'primary' ? light.actionPressed : light.action;
  const glow = useRef(new Animated.Value(rest)).current;
  const [extent, setExtent] = useState(0);
  const off = !!disabled || !!busy;

  const to = (value: number) =>
    Animated.timing(glow, {
      toValue: value,
      duration: motion.touch,
      easing: easing.out,
      useNativeDriver: true,
    }).start();

  const tone = kind === 'primary' ? 'ink' : kind === 'destructive' ? 'alert' : 'ink2';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => to(pressed)}
      onPressOut={() => to(rest)}
      disabled={off}
      hitSlop={space.xs}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: off, busy: !!busy }}
      onLayout={(e) => setExtent(Math.max(e.nativeEvent.layout.width, e.nativeEvent.layout.height))}
      style={[styles.base, off && styles.off, style]}
    >
      {kind !== 'destructive' && extent > 0 ? (
        <Pool tint="moon" size={extent * 1.6} opacity={glow} />
      ) : null}
      <T role="label" tone={tone}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    minHeight: layout.touch,
    justifyContent: 'center',
    paddingVertical: space.s,
    paddingHorizontal: space.m,
    marginLeft: -space.m,
  },
  off: {
    opacity: 0.45,
  },
});

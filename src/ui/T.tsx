import { useSyncExternalStore } from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';
import { colors, type, maxScale, type TypeRole } from '../theme';

type Tone = 'ink' | 'ink2' | 'ink3' | 'alert';

// RN Text has its own ARIA `role` prop; ours is the type role, so omit theirs.
type Props = Omit<TextProps, 'role'> & {
  /** Type role from the theme scale. Defaults to body. */
  role?: TypeRole;
  /** Ink tone. Defaults to ink (the brightest). */
  tone?: Tone;
  center?: boolean;
};

// A tiny store so every T re-renders once the typeface registers. Mounted
// screens live behind react-navigation's static containers and would not
// otherwise pick up the family if the splash cap lifted before it loaded.
let fontsReady = false;
const listeners = new Set<() => void>();
export function markFontsReady() {
  if (fontsReady) return;
  fontsReady = true;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
const snapshot = () => fontsReady;

/**
 * The only way text is set in the app: one role from the scale, one tone from
 * the ink ramp, and a per-role ceiling on OS text scaling so layouts hold.
 */
export function T({ role = 'body', tone = 'ink', center, style, ...rest }: Props) {
  useSyncExternalStore(subscribe, snapshot, snapshot);
  return (
    <Text
      maxFontSizeMultiplier={maxScale[role]}
      {...rest}
      style={[type[role], { color: colors[tone] }, center && styles.center, style]}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});

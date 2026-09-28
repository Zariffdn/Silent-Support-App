import { Animated, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, LIGHT_SOURCE } from '../theme';

/** Anything Animated can drive an opacity: a value, an interpolation, a product. */
export type AnimatedOpacity =
  | number
  | Animated.Value
  | Animated.AnimatedInterpolation<number>
  | Animated.AnimatedMultiplication<number>;

type Props = {
  /** moon = the app's presence; lamp = warmth behind words. */
  tint?: 'moon' | 'lamp';
  /** Diameter of the light in points. */
  size: number;
  /** Intensity on the canvas - one of the values in theme.light. */
  opacity: AnimatedOpacity;
  /** Optional breath / bloom. */
  scale?: Animated.Value | Animated.AnimatedInterpolation<number>;
  /** Position of the light's centre. Defaults to the centre of the parent. */
  style?: StyleProp<ViewStyle>;
};

/**
 * The app's single light source. A soft, edge-less radial glow that is never a
 * shape: it is dimmed and tinted, and animated only on the native driver. Render
 * it before its siblings so it sits behind them; it never intercepts touches.
 */
export function Pool({ tint = 'moon', size, opacity, scale, style }: Props) {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.anchor,
        { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 },
        style,
      ]}
    >
      <Animated.Image
        source={LIGHT_SOURCE}
        style={[
          styles.glow,
          { tintColor: colors[tint], opacity, transform: scale ? [{ scale }] : undefined },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  glow: {
    width: '100%',
    height: '100%',
  },
});

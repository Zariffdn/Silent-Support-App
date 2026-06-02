import { Animated, View, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const MAX = 280;

type Props = {
  scale: Animated.Value;
  /** Dim the core slightly in silence mode for an even calmer feel. */
  dim?: boolean;
};

/** A faint static ring with a soft core that expands and contracts with the breath. */
export function BreathingCircle({ scale, dim }: Props) {
  const coreScale = scale.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  // The core also brightens a touch as it expands, so the breath feels alive
  // rather than mechanical. Native-driver friendly (opacity only).
  const coreOpacity = scale.interpolate({
    inputRange: [0, 1],
    outputRange: dim ? [0.28, 0.42] : [0.62, 0.85],
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.ring} />
      <Animated.View
        style={[styles.core, { transform: [{ scale: coreScale }], opacity: coreOpacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: MAX,
    height: MAX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: MAX,
    height: MAX,
    borderRadius: MAX / 2,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHigh,
  },
  core: {
    width: MAX,
    height: MAX,
    borderRadius: MAX / 2,
    backgroundColor: theme.colors.accentWhisper,
  },
});

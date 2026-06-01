import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { theme } from '../../theme';

/**
 * A slow breathing dot used as the "holding space" while we log the emotion
 * and wait on the response. Deliberately not a spinner — it should feel like a
 * calm presence, not a loading indicator.
 */
export function BreathingDot() {
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const opacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.95] });

  return <Animated.View style={[styles.dot, { transform: [{ scale }], opacity }]} />;
}

const styles = StyleSheet.create({
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.accentWhisper,
  },
});

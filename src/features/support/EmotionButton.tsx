import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { easing, light, motion } from '../../theme';
import { Pool } from '../../ui/Pool';
import { T } from '../../ui/T';
import type { Emotion } from '../../emotions/catalog';

export type EmotionCellState = 'rest' | 'chosen' | 'dimmed';

type Props = {
  emotion: Emotion;
  onPress: (emotion: Emotion) => void;
  /** rest = touchable; chosen = the one just tapped; dimmed = the others as the
   *  room dissolves into the words. */
  state: EmotionCellState;
};

export const CELL_HEIGHT = 92;
export const POOL = 200;

/**
 * One feeling in the field: a word resting in a pool of light. No box, no
 * icon. Light gathers under a finger, blooms when chosen, and the other seven
 * words sink — the feeling is received, not submitted. The word sits on the
 * cell's left edge (the screen edge for the left column, the midline for the
 * right) and the light is centred on the word itself.
 */
export function EmotionButton({ emotion, onPress, state }: Props) {
  const glow = useRef(new Animated.Value(light.rest)).current;
  const word = useRef(new Animated.Value(1)).current;
  const [wordWidth, setWordWidth] = useState(0);

  useEffect(() => {
    const target = state === 'chosen' ? light.chosen : state === 'dimmed' ? 0 : light.rest;
    Animated.timing(glow, {
      toValue: target,
      duration: motion.leave,
      easing: easing.out,
      useNativeDriver: true,
    }).start();
    Animated.timing(word, {
      toValue: state === 'dimmed' ? 0.45 : 1,
      duration: motion.leave,
      easing: easing.out,
      useNativeDriver: true,
    }).start();
  }, [state, glow, word]);

  const touch = (value: number) => {
    if (state !== 'rest') return;
    Animated.timing(glow, {
      toValue: value,
      duration: motion.touch,
      easing: easing.out,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={emotion.label}
      accessibilityState={{ disabled: state !== 'rest', selected: state === 'chosen' }}
      disabled={state !== 'rest'}
      onPress={() => onPress(emotion)}
      onPressIn={() => touch(light.press)}
      onPressOut={() => touch(light.rest)}
      style={styles.cell}
    >
      {wordWidth > 0 ? (
        <Pool tint="moon" size={POOL} opacity={glow} style={{ left: wordWidth / 2, top: '50%' }} />
      ) : null}
      <Animated.View
        style={{ opacity: word }}
        onLayout={(e) => setWordWidth(e.nativeEvent.layout.width)}
      >
        <T role="field">{emotion.label}</T>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    minHeight: CELL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});

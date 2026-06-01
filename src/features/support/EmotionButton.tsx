import { Pressable, Text, View, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import type { Emotion } from '../../emotions/catalog';

type Props = {
  emotion: Emotion;
  onPress: (emotion: Emotion) => void;
  disabled?: boolean;
};

/** A large, soft, calm tile. Big touch target, gentle press feedback. */
export function EmotionButton({ emotion, onPress, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={emotion.label}
      disabled={disabled}
      onPress={() => onPress(emotion)}
      style={({ pressed }) => [
        styles.tile,
        pressed && styles.tilePressed,
        disabled && styles.tileDisabled,
      ]}
    >
      <View style={styles.inner}>
        <Text style={styles.emoji}>{emotion.emoji}</Text>
        <Text style={styles.label}>{emotion.label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 132,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    paddingVertical: 22,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  tilePressed: {
    backgroundColor: theme.colors.surfaceHigh,
    opacity: 0.92,
  },
  tileDisabled: {
    opacity: 0.4,
  },
  inner: {
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 38,
  },
  label: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.ui,
    fontFamily: theme.typography.family.sans,
    textAlign: 'center',
  },
});

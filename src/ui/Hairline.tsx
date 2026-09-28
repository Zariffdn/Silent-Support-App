import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, space } from '../theme';

/**
 * The one rule between things. One colour, one weight, and one rhythm around
 * it (32 above, 24 below) everywhere it appears.
 */
export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.line, style]} accessible={false} />;
}

const styles = StyleSheet.create({
  line: {
    height: 1,
    backgroundColor: colors.hairline,
    marginTop: space.xl,
    marginBottom: space.l,
  },
});

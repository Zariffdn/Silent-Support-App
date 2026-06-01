import { View, Text } from 'react-native';
import { theme } from '../src/theme';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.canvas,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: theme.colors.inkPrimary,
          fontSize: theme.typography.size.greeting,
          fontFamily: theme.typography.family.serif,
        }}
      >
        Silent Support
      </Text>
    </View>
  );
}

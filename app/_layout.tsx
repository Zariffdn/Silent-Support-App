import { Stack } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { theme } from '../src/theme';
import { SessionProvider } from '../src/features/auth/SessionProvider';

// Expo Router renders this automatically if any screen throws during render,
// so an unexpected error becomes a calm fallback instead of a white screen.
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went quiet.</Text>
      <Text style={styles.body}>The app hit a snag. Take a breath, and we can try again.</Text>
      <Pressable onPress={retry} style={styles.button} hitSlop={12} accessibilityRole="button">
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  title: {
    color: theme.colors.inkPrimary,
    fontSize: theme.typography.size.response,
    fontFamily: theme.typography.family.serif,
    textAlign: 'center',
  },
  body: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHigh,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: theme.colors.accentWhisper,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
});

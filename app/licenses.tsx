import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';

const LIBRARIES = [
  'Expo',
  'React Native',
  'React',
  'Expo Router',
  'Supabase JS',
  'Async Storage',
  'React Native Safe Area Context',
  'React Native Screens',
  'React Native URL Polyfill',
];

function P({ children }: { children: ReactNode }) {
  return <Text style={styles.p}>{children}</Text>;
}

export default function LicensesScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={16} accessibilityLabel="Back">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Licenses</Text>
        <P>
          Silent Support is built on wonderful open-source software. Thank you to the people behind
          these projects:
        </P>

        {LIBRARIES.map((lib) => (
          <View key={lib} style={styles.point}>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.pointText}>{lib}</Text>
          </View>
        ))}

        <P>
          Each is used under its own open-source license, mostly MIT. The full license text for any
          of them is available from its project page.
        </P>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.canvas },
  topBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  back: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.ui,
    fontFamily: theme.typography.family.sans,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 56 },
  title: {
    color: theme.colors.inkPrimary,
    fontSize: theme.typography.size.greeting,
    fontFamily: theme.typography.family.serif,
    marginTop: 12,
    marginBottom: 16,
  },
  p: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.body,
    lineHeight: theme.typography.lineHeight.body,
    fontFamily: theme.typography.family.sans,
    marginBottom: 12,
    marginTop: 8,
  },
  point: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  dot: {
    color: theme.colors.accentWhisper,
    fontSize: theme.typography.size.body,
    lineHeight: theme.typography.lineHeight.body,
  },
  pointText: {
    flex: 1,
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.body,
    lineHeight: theme.typography.lineHeight.body,
    fontFamily: theme.typography.family.sans,
  },
});

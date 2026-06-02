import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';

const POINTS = [
  'Your check-ins — the emotions you tap — are stored only on this device. They never leave your phone for us to read.',
  'When you tap an emotion, only the emotion’s name (like “Lonely”) is sent to our AI provider to generate a gentle response. No names, no messages, nothing that identifies you.',
  'There are no accounts, no sign-in, and no tracking.',
  'You can clear your history at any time from the “Look back” screen.',
];

export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={16} accessibilityLabel="Back">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your privacy</Text>
        <Text style={styles.intro}>Silent Support is built to stay private and quiet.</Text>

        {POINTS.map((p, i) => (
          <View key={i} style={styles.point}>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.pointText}>{p}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Silent Support offers comfort, not medical care. If you need urgent help, see the Help
          screen.
        </Text>
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
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },
  title: {
    color: theme.colors.inkPrimary,
    fontSize: theme.typography.size.greeting,
    fontFamily: theme.typography.family.serif,
    marginTop: 12,
  },
  intro: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
    marginTop: 12,
    marginBottom: 24,
  },
  point: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
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
  footer: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    lineHeight: 20,
    fontFamily: theme.typography.family.sans,
    marginTop: 12,
  },
});

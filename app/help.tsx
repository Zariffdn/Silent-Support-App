import { Linking, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';
import {
  CRISIS_RESOURCES,
  INTERNATIONAL_DIRECTORY,
  type CrisisResource,
} from '../src/features/safety/resources';

export default function HelpScreen() {
  const router = useRouter();

  const open = (resource: CrisisResource) => {
    const { action } = resource;
    const url = action.type === 'call' ? `tel:${action.number}` : action.url;
    Linking.openURL(url).catch(() => {
      // If the device can't open it (e.g. no dialer), fail quietly.
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={16} accessibilityLabel="Back">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>You’re not alone</Text>
        <Text style={styles.intro}>
          If you’re carrying something heavy — or thinking about hurting yourself — you don’t have to
          face it alone. These lines are free, confidential, and there for you, any time.
        </Text>

        {CRISIS_RESOURCES.map((r) => (
          <Card key={r.name} resource={r} onPress={() => open(r)} />
        ))}

        <Text style={styles.sectionGap}>Anywhere in the world</Text>
        <Card resource={INTERNATIONAL_DIRECTORY} onPress={() => open(INTERNATIONAL_DIRECTORY)} />

        <Text style={styles.footer}>
          Silent Support is here for comfort, not medical care. In an emergency, please contact your
          local emergency services.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ resource, onPress }: { resource: CrisisResource; onPress: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardName}>{resource.name}</Text>
      <Text style={styles.cardDesc}>{resource.description}</Text>
      <Pressable onPress={onPress} style={styles.action} hitSlop={8} accessibilityRole="button">
        <Text style={styles.actionText}>{resource.actionLabel}</Text>
      </Pressable>
    </View>
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
    lineHeight: theme.typography.lineHeight.body,
    fontFamily: theme.typography.family.sans,
    marginTop: 12,
    marginBottom: 24,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    gap: 8,
  },
  cardName: {
    color: theme.colors.inkPrimary,
    fontSize: theme.typography.size.ui,
    fontFamily: theme.typography.family.sans,
  },
  cardDesc: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
  action: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.accentWhisper,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  actionText: {
    color: theme.colors.accentWhisper,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
  sectionGap: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    fontFamily: theme.typography.family.sans,
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 10,
  },
  footer: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    lineHeight: 20,
    fontFamily: theme.typography.family.sans,
    marginTop: 20,
  },
});

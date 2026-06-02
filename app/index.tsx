import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { EMOTIONS, type Emotion } from '../src/emotions/catalog';
import { EmotionButton } from '../src/features/support/EmotionButton';

export default function SelectionScreen() {
  const router = useRouter();
  // Lock the grid the instant a tile is tapped so a double-tap can't open two
  // responses. Kept minimal — no spinner, the next screen handles the wait.
  const [chosen, setChosen] = useState<Emotion | null>(null);

  // Release the tap-lock whenever this screen regains focus (e.g. after
  // swiping back from a response), so the emotions become tappable again.
  useFocusEffect(
    useCallback(() => {
      setChosen(null);
    }, []),
  );

  const handlePress = (emotion: Emotion) => {
    if (chosen) return;
    setChosen(emotion);
    router.push({ pathname: '/response', params: { emotion: emotion.id } });
  };

  // Pair the emotions into rows of two for a calm, even grid.
  const rows: Emotion[][] = [];
  for (let i = 0; i < EMOTIONS.length; i += 2) {
    rows.push(EMOTIONS.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>What are you feeling?</Text>
          <Text style={styles.sub}>No need to explain. Just choose.</Text>
        </View>

        <View style={styles.grid}>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((emotion) => (
                <EmotionButton
                  key={emotion.id}
                  emotion={emotion}
                  onPress={handlePress}
                  disabled={chosen !== null && chosen.id !== emotion.id}
                />
              ))}
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => router.push('/history')}
          disabled={chosen !== null}
          hitSlop={12}
          style={styles.lookBack}
          accessibilityLabel="Look back at your history"
        >
          <Text style={styles.lookBackText}>Look back</Text>
        </Pressable>

        <View style={styles.footer}>
          <Pressable onPress={() => router.push('/help')} hitSlop={10} accessibilityLabel="Find help">
            <Text style={styles.footerLink}>Help</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable onPress={() => router.push('/privacy')} hitSlop={10} accessibilityLabel="Privacy">
            <Text style={styles.footerLink}>Privacy</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable onPress={() => router.push('/terms')} hitSlop={10} accessibilityLabel="Terms">
            <Text style={styles.footerLink}>Terms</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 36,
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    color: theme.colors.inkPrimary,
    fontSize: theme.typography.size.greeting,
    fontFamily: theme.typography.family.serif,
    textAlign: 'center',
  },
  sub: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
    textAlign: 'center',
  },
  grid: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  lookBack: {
    marginTop: 28,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  lookBackText: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  footerLink: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    fontFamily: theme.typography.family.sans,
  },
  footerDot: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
  },
});

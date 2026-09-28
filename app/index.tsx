import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PixelRatio, ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors, easing, layout, motion, space, type } from '../src/theme';
import { EMOTIONS, type Emotion } from '../src/emotions/catalog';
import { EmotionButton, type EmotionCellState } from '../src/features/support/EmotionButton';
import { getWelcomeSeen, setWelcomeSeen } from '../src/lib/preferences';
import { getLocalLogs } from '../src/lib/localHistory';
import { useSession } from '../src/features/auth/SessionProvider';
import { T } from '../src/ui/T';
import { Action } from '../src/ui/Action';

// Above this OS text scale the two-column field would break words; the
// feelings take one column each instead.
const SINGLE_COLUMN_SCALE = 1.2;

export default function SelectionScreen() {
  const router = useRouter();
  const { userId } = useSession();
  // Lock the field the instant a feeling is tapped so a double-tap can't open
  // two responses. The other seven words sink while the room dissolves.
  const [chosen, setChosen] = useState<Emotion | null>(null);

  // First-launch trust line. Starts hidden; an async flag read (after mount)
  // reveals it only if unseen — it NEVER gates or delays the field's first
  // paint, and it lives in a fixed-height slot so nothing ever shifts.
  const [showTrust, setShowTrust] = useState(false);
  const trustFade = useRef(new Animated.Value(0)).current;

  // Release the tap-lock whenever this screen regains focus (e.g. after
  // swiping back from a response), so the feelings become tappable again.
  useFocusEffect(
    useCallback(() => {
      setChosen(null);
    }, []),
  );

  // Warm the in-memory history mirror so the response can score strength,
  // memory and strain synchronously at frame 0 of the first tap. A single
  // AsyncStorage read, never awaited before paint.
  useEffect(() => {
    void getLocalLogs(userId);
  }, [userId]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const seen = await getWelcomeSeen();
      if (!mounted || seen) return;
      setShowTrust(true);
      Animated.timing(trustFade, {
        toValue: 1,
        duration: motion.settle,
        easing: easing.out,
        useNativeDriver: true,
      }).start();
    })();
    return () => {
      mounted = false;
    };
  }, [trustFade]);

  // The trust line goes with the first tap. No dismiss control: one tap is the
  // whole design of this screen.
  const markWelcomeSeen = () => {
    Animated.timing(trustFade, {
      toValue: 0,
      duration: motion.leave,
      easing: easing.out,
      useNativeDriver: true,
    }).start(() => setShowTrust(false));
    void setWelcomeSeen();
  };

  const handlePress = (emotion: Emotion) => {
    if (chosen) return;
    if (showTrust) markWelcomeSeen();
    setChosen(emotion);
    router.push({ pathname: '/response', params: { emotion: emotion.id } });
  };

  // The three quiet actions stay visually still during the dissolve; they
  // simply ignore presses while a feeling is chosen.
  const go = (href: '/history' | '/help' | '/settings') => {
    if (chosen) return;
    router.push(href);
  };

  const cellState = (emotion: Emotion): EmotionCellState =>
    chosen === null ? 'rest' : chosen.id === emotion.id ? 'chosen' : 'dimmed';

  // Pair the feelings into rows of two: a field, not a list. One per row at
  // large accessibility text sizes.
  const perRow = PixelRatio.getFontScale() > SINGLE_COLUMN_SCALE ? 1 : 2;
  const rows: Emotion[][] = [];
  for (let i = 0; i < EMOTIONS.length; i += perRow) {
    rows.push(EMOTIONS.slice(i, i + perRow));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <T role="question" accessibilityRole="header">
            What are you feeling?
          </T>
          <T role="body" tone="ink2" style={styles.sub}>
            No need to explain. Just choose.
          </T>
          <View style={styles.trustSlot}>
            {showTrust ? (
              <Animated.View style={{ opacity: trustFade }}>
                <T role="whisper" tone="ink3" numberOfLines={1}>
                  No account needed. Nothing tracked.
                </T>
              </Animated.View>
            ) : null}
          </View>
        </View>

        <View style={styles.field} accessibilityRole="list">
          {rows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((emotion) => (
                <EmotionButton
                  key={emotion.id}
                  emotion={emotion}
                  onPress={handlePress}
                  state={cellState(emotion)}
                />
              ))}
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Action
            label="Look back"
            onPress={() => go('/history')}
            accessibilityLabel="Look back at your history"
          />
          <Action label="Help" onPress={() => go('/help')} accessibilityLabel="Help. Support resources" />
          <Action label="Settings" onPress={() => go('/settings')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  // Sized to fit a 375x667 phone without scrolling; taller phones centre the
  // field in the room's remaining height.
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.column,
    alignSelf: 'center',
    paddingHorizontal: layout.edge,
    paddingTop: space.l,
    paddingBottom: space.l,
  },
  header: {
    marginBottom: space.m,
  },
  sub: {
    marginTop: space.xs,
  },
  // Reserved so the trust line can appear and go without moving the field.
  trustSlot: {
    minHeight: type.whisper.lineHeight + space.xs,
    marginTop: space.xs,
  },
  // flexGrow (not flex) so it can never shrink below its rows on a short phone.
  field: {
    flexGrow: 1,
    justifyContent: 'center',
    marginVertical: space.xs,
  },
  row: {
    flexDirection: 'row',
  },
  // Actions carry a -16 left margin so their words sit on the edge; an 8pt gap
  // puts the words 24pt apart.
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.l,
  },
});

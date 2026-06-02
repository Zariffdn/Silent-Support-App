import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useFocusEffect, useRouter } from 'expo-router';
import { theme } from '../src/theme';
import {
  getComfortAudio,
  setComfortAudio,
  getComfortVolume,
  setComfortVolume,
  isAmbientSound,
  DEFAULT_VOLUME,
  type ComfortAudio,
} from '../src/lib/preferences';

const OPTIONS: { value: ComfortAudio; label: string; sub: string }[] = [
  { value: 'silent', label: 'Silent', sub: 'Just the breath, in stillness.' },
  { value: 'haptics', label: 'Gentle haptics', sub: 'A soft pulse as you breathe in and out.' },
  { value: 'ocean', label: 'Ocean waves', sub: 'Slow rolling waves.' },
  { value: 'rain', label: 'Rain', sub: 'Soft rainfall.' },
  { value: 'forest', label: 'Forest', sub: 'Distant wind and trees.' },
  { value: 'brown', label: 'Brown noise', sub: 'Deep consistent background noise.' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const [audio, setAudio] = useState<ComfortAudio>('silent');
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getComfortAudio(), getComfortVolume()]).then(([a, v]) => {
        if (!active) return;
        setAudio(a);
        setVolume(v);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const choose = (value: ComfortAudio) => {
    setAudio(value);
    void setComfortAudio(value);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={16} accessibilityLabel="Back">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionTitle}>Comfort Mode Audio</Text>
        <Text style={styles.sectionDesc}>Choose how Comfort Mode keeps you company.</Text>

        <View style={styles.options}>
          {OPTIONS.map((o) => {
            const selected = audio === o.value;
            return (
              <Pressable
                key={o.value}
                onPress={() => choose(o.value)}
                style={styles.option}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={o.label}
              >
                <View style={[styles.radio, selected && styles.radioOn]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{o.label}</Text>
                  <Text style={styles.optionSub}>{o.sub}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {isAmbientSound(audio) && (
          <View style={styles.volumeSection}>
            <View style={styles.volumeHeader}>
              <Text style={styles.sectionTitle}>Ambient volume</Text>
              <Text style={styles.volumeValue}>{Math.round(volume * 100)}%</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={volume}
              onValueChange={setVolume}
              onSlidingComplete={(v) => void setComfortVolume(v)}
              minimumTrackTintColor={theme.colors.accentWhisper}
              maximumTrackTintColor={theme.colors.surfaceHigh}
              thumbTintColor={theme.colors.inkPrimary}
            />
          </View>
        )}
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
    marginBottom: 28,
  },
  sectionTitle: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.ui,
    fontFamily: theme.typography.family.sans,
  },
  sectionDesc: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
    marginTop: 6,
    marginBottom: 18,
  },
  options: { gap: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.inkTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: theme.colors.accentWhisper },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.accentWhisper,
  },
  optionText: { flex: 1, gap: 3 },
  optionLabel: {
    color: theme.colors.inkPrimary,
    fontSize: theme.typography.size.ui,
    fontFamily: theme.typography.family.sans,
  },
  optionSub: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
  volumeSection: { marginTop: 28 },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  volumeValue: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
  slider: { width: '100%', height: 40, marginTop: 8 },
});

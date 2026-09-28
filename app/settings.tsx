import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, View, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors, easing, light, motion, space, type } from '../src/theme';
import { supabase } from '../src/lib/supabase';
import { clearLocalLogs, clearAnonLogs } from '../src/lib/localHistory';
import { useSession } from '../src/features/auth/SessionProvider';
import { setAmbientVolume, startAmbient, stopAmbient } from '../src/features/comfort/audio';
import {
  getComfortAudio,
  setComfortAudio,
  getComfortVolume,
  setComfortVolume,
  isAmbientSound,
  DEFAULT_VOLUME,
  type ComfortAudio,
} from '../src/lib/preferences';
import { Screen } from '../src/ui/Screen';
import { T } from '../src/ui/T';
import { Action } from '../src/ui/Action';
import { Hairline } from '../src/ui/Hairline';
import { Pool } from '../src/ui/Pool';

const OPTIONS: { value: ComfortAudio; label: string; sub: string }[] = [
  { value: 'silent', label: 'Silent', sub: 'Just the breath, in stillness.' },
  { value: 'haptics', label: 'Haptics', sub: 'A pulse as you breathe in and out.' },
  { value: 'ocean', label: 'Ocean', sub: 'Slow rolling waves.' },
  { value: 'rain', label: 'Rain', sub: 'Rainfall.' },
  { value: 'forest', label: 'Forest', sub: 'Distant wind and trees.' },
  { value: 'brown', label: 'Brown noise', sub: 'A deep, steady hush.' },
];

const OPTION_POOL = 200;

/** One choice in a list: the chosen word rests on light; the rest are quiet. */
function Option({
  label,
  sub,
  selected,
  onPress,
}: {
  label: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
}) {
  const glow = useRef(new Animated.Value(selected ? light.selected : 0)).current;
  const [labelWidth, setLabelWidth] = useState(0);

  useEffect(() => {
    Animated.timing(glow, {
      toValue: selected ? light.selected : 0,
      duration: motion.touch,
      easing: easing.out,
      useNativeDriver: true,
    }).start();
  }, [selected, glow]);

  const touch = (value: number) =>
    Animated.timing(glow, {
      toValue: value,
      duration: motion.touch,
      easing: easing.out,
      useNativeDriver: true,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => touch(light.press)}
      onPressOut={() => touch(selected ? light.selected : 0)}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label}. ${sub}`}
      style={styles.option}
    >
      {labelWidth > 0 ? (
        <Pool
          tint="moon"
          size={OPTION_POOL}
          opacity={glow}
          style={{ left: labelWidth / 2, top: space.s + type.label.lineHeight / 2 }}
        />
      ) : null}
      <View style={styles.optionLabel} onLayout={(e) => setLabelWidth(e.nativeEvent.layout.width)}>
        <T role="label" tone={selected ? 'ink' : 'ink2'}>
          {label}
        </T>
      </View>
      <T role="whisper" tone={selected ? 'ink2' : 'ink3'}>
        {sub}
      </T>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { userId, session, loading } = useSession();
  const [audio, setAudio] = useState<ComfortAudio | null>(null);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [deleting, setDeleting] = useState(false);

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
        // Any preview stops the moment Settings loses focus.
        void stopAmbient();
      };
    }, []),
  );

  // Choosing a sound plays it, so the choice can be heard where it is made.
  const choose = (value: ComfortAudio) => {
    setAudio(value);
    void setComfortAudio(value);
    if (isAmbientSound(value)) void startAmbient(value, volume);
    else void stopAmbient();
  };

  const ambient = audio !== null && isAmbientSound(audio);

  const confirmSignOut = () => {
    Alert.alert(
      'Sign out?',
      'This clears the check-ins saved on this phone. They stay safe in your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          onPress: async () => {
            const uid = userId;
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Couldn’t sign out', 'We couldn’t sign you out just now. Try again in a moment.');
              return;
            }
            if (uid) await clearLocalLogs(uid);
          },
        },
      ],
    );
  };

  const runDelete = async () => {
    setDeleting(true);
    const uid = userId;
    const { error } = await supabase.functions.invoke('delete-account', { body: {} });
    if (error) {
      setDeleting(false);
      Alert.alert('Couldn’t delete', 'We couldn’t delete your account just now. Try again in a moment.');
      return;
    }
    // Account is gone on the server. Clear this device and sign out.
    try {
      if (uid) await clearLocalLogs(uid);
      await clearAnonLogs();
      await supabase.auth.signOut();
    } catch {
      // best-effort local cleanup
    }
    setDeleting(false);
    Alert.alert('Account deleted', 'Your account and backed-up check-ins are gone.', [
      { text: 'OK', onPress: () => router.dismissTo('/') },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete account?',
      'This removes your account and every backed-up check-in. We won’t be able to bring them back.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: runDelete },
      ],
    );
  };

  return (
    <Screen back title="Settings">
      <T role="heading" accessibilityRole="header">
        Sound while you breathe
      </T>
      <T role="body" tone="ink2" style={styles.hint}>
        Plays while you breathe. Silent by default.
      </T>
      {/* The list is on screen from the first frame; the stored choice lights
          up a moment later, and nothing below it ever moves. */}
      <View accessibilityRole="radiogroup" style={styles.options}>
        {OPTIONS.map((o) => (
          <Option
            key={o.value}
            label={o.label}
            sub={o.sub}
            selected={audio === o.value}
            onPress={() => choose(o.value)}
          />
        ))}
      </View>
      <View style={styles.volume}>
        {ambient ? (
          <>
            <T role="label" tone="ink2">
              Volume
            </T>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={volume}
              onValueChange={(v) => {
                setVolume(v);
                setAmbientVolume(v);
              }}
              onSlidingComplete={(v) => void setComfortVolume(v)}
              minimumTrackTintColor={colors.ink2}
              maximumTrackTintColor={colors.hairline}
              thumbTintColor={colors.ink}
              accessibilityLabel="Volume"
            />
          </>
        ) : null}
      </View>

      <Hairline />
      <T role="heading" accessibilityRole="header">
        Account
      </T>
      {loading ? null : userId ? (
        <>
          <T role="body" tone="ink2" style={styles.hint}>
            Signed in as {session?.user?.email ?? 'your account'}. Your check-ins are backed up to
            this account.
          </T>
          <Action label="Sign out" onPress={confirmSignOut} style={styles.first} />
          <Action
            label={deleting ? 'Deleting…' : 'Delete account'}
            kind="destructive"
            onPress={confirmDelete}
            busy={deleting}
          />
        </>
      ) : (
        <>
          <T role="body" tone="ink2" style={styles.hint}>
            Your check-ins are kept only on this phone. Sign in with your email to keep a copy.
          </T>
          <Action label="Keep a copy" onPress={() => router.push('/sign-in')} style={styles.first} />
        </>
      )}

      <Hairline />
      <T role="heading" accessibilityRole="header">
        About
      </T>
      <Action label="Privacy" onPress={() => router.push('/privacy')} style={styles.first} />
      <Action label="Terms" onPress={() => router.push('/terms')} />
      <Action label="Licenses" onPress={() => router.push('/licenses')} />
      <T role="whisper" tone="ink3" style={styles.copyright}>
        © 2026 Silent Support
      </T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginTop: space.hair,
  },
  options: {
    marginTop: space.s,
  },
  option: {
    paddingVertical: space.s,
  },
  optionLabel: {
    alignSelf: 'flex-start',
  },
  // Reserved whether or not a sound is chosen, so the groups below never move.
  volume: {
    marginTop: space.m,
    minHeight: type.label.lineHeight + space.hair + 40,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: space.hair,
  },
  first: {
    marginTop: space.s,
  },
  copyright: {
    marginTop: space.l,
  },
});

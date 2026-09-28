import { useEffect } from 'react';
import { Stack } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { colors, fontSources, layout, motion, space } from '../src/theme';
import { SessionProvider } from '../src/features/auth/SessionProvider';
import { T, markFontsReady } from '../src/ui/T';
import { Action } from '../src/ui/Action';

// The bundled typeface is a local asset and registers in well under 100ms on
// most devices. The native splash (already showing) stays up only until that
// finishes, and never past SPLASH_CAP_MS — the emotion field must never wait
// on anything. If the font is late, text simply re-renders in it when ready.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: motion.leave });
const SPLASH_CAP_MS = 250;

// Expo Router renders this automatically if any screen throws during render,
// so an unexpected error becomes a calm fallback instead of a white screen.
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorRoom}>
      <View style={styles.errorColumn}>
        <T role="voice" accessibilityRole="header">
          Something went quiet.
        </T>
        <T role="body" tone="ink2" style={styles.errorBody}>
          The app ran into a problem. Take a breath, and we can try again.
        </T>
        <Action label="Try again" kind="primary" onPress={retry} style={styles.errorAction} />
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [fontsReady, fontError] = useFonts(fontSources);

  useEffect(() => {
    if (fontsReady) markFontsReady();
    if (fontsReady || fontError) {
      SplashScreen.hideAsync().catch(() => {});
      return;
    }
    const cap = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), SPLASH_CAP_MS);
    return () => clearTimeout(cap);
  }, [fontsReady, fontError]);

  return (
    <SessionProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          // Screens dissolve rather than slide: one room dimming and
          // brightening, not pages.
          animation: 'fade',
          animationDuration: motion.leave,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      />
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  errorRoom: {
    flex: 1,
    backgroundColor: colors.canvas,
    justifyContent: 'center',
  },
  errorColumn: {
    width: '100%',
    maxWidth: layout.column,
    alignSelf: 'center',
    paddingHorizontal: layout.edge,
  },
  errorBody: {
    marginTop: space.s,
  },
  errorAction: {
    marginTop: space.l,
  },
});

import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';

const SUPPORT_EMAIL = 'zariffdanial1@gmail.com';

function H({ children }: { children: ReactNode }) {
  return <Text style={styles.h2}>{children}</Text>;
}
function P({ children }: { children: ReactNode }) {
  return <Text style={styles.p}>{children}</Text>;
}
function Bullet({ children }: { children: ReactNode }) {
  return (
    <View style={styles.point}>
      <Text style={styles.dot}>•</Text>
      <Text style={styles.pointText}>{children}</Text>
    </View>
  );
}

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={16} accessibilityLabel="Back">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Terms of Use</Text>
        <Text style={styles.updated}>Last updated: 2 June 2026</Text>

        <P>A few simple things about using Silent Support. No fine print — just what’s fair.</P>

        <H>What it’s for</H>
        <P>
          Silent Support is a quiet space to check in with how you feel and receive a calm, supportive
          response. It’s here to offer a moment of comfort — nothing more complicated than that.
        </P>

        <H>Using it kindly</H>
        <P>Please use Silent Support the way it’s meant to be used:</P>
        <Bullet>
          Don’t misuse the <Text style={styles.strong}>Help / crisis section</Text> — those helplines
          exist for people in real distress.
        </Bullet>
        <Bullet>Don’t try to break, overload, or spam the app or its sign-in system.</Bullet>
        <Bullet>Don’t use it to harm yourself or others, or for anything illegal.</Bullet>
        <P>That’s really all we ask.</P>

        <H>Your account</H>
        <P>
          If you create an account, you’re responsible for the email you sign in with. Keep access to
          that inbox safe — anyone who can read your sign-in codes can reach your account. There are no
          passwords to manage; the code in your email is the key.
        </P>

        <H>Your check-ins are yours</H>
        <P>
          The emotions you log belong to you. We don’t claim them, sell them, or use them for anything
          beyond showing them back to you. You can delete them anytime — see the Privacy page.
        </P>

        <H>The app is offered “as is”</H>
        <P>
          We build Silent Support with care, but it’s a small app and we can’t promise it’ll be perfect
          or always available. Please treat it as a companion, not a guarantee.
        </P>
        <P>
          And importantly: Silent Support is not medical advice, therapy, or a crisis service. It can’t
          diagnose anything or replace a professional. If you’re in danger or thinking about harming
          yourself, please contact your local emergency services or a helpline in the Help screen.
        </P>

        <H>Changes</H>
        <P>
          Silent Support will grow and change over time, so these terms may be updated now and then. If
          something meaningful changes, we’ll do our best to make it clear.
        </P>

        <H>If things go wrong</H>
        <P>
          If an account is used to abuse the app, spam the system, or harm others, we may have to remove
          it. We’d much rather not — this is a space meant to be gentle — but we’ll act when we need to,
          to keep it safe for everyone.
        </P>

        <H>Questions</H>
        <P>Anything unclear? Email {SUPPORT_EMAIL} — we’re happy to help.</P>
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
  },
  updated: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    fontFamily: theme.typography.family.sans,
    marginTop: 6,
    marginBottom: 20,
  },
  h2: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.ui,
    fontFamily: theme.typography.family.sans,
    marginTop: 26,
    marginBottom: 8,
  },
  p: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.body,
    lineHeight: theme.typography.lineHeight.body,
    fontFamily: theme.typography.family.sans,
    marginBottom: 8,
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
  strong: { color: theme.colors.inkPrimary },
});

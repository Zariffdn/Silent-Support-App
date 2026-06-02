import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';

// Where account-deletion requests are sent. Change this to your support inbox.
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

export default function PrivacyScreen() {
  const router = useRouter();

  const requestDeletion = () => {
    const subject = encodeURIComponent('Silent Support — account deletion request');
    const body = encodeURIComponent(
      'I would like to delete my Silent Support account and all of my check-ins.\n\nAccount email: ',
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={16} accessibilityLabel="Back">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Privacy</Text>
        <Text style={styles.updated}>Last updated: 2 June 2026</Text>

        <P>
          Silent Support is a quiet place to check in with how you feel. This page explains, plainly,
          what we do and don’t do with your information — no legal maze, just the truth.
        </P>

        <H>What Silent Support is</H>
        <P>
          Silent Support lets you tap how you’re feeling and receive a calm, supportive response —
          sometimes a gentle line, sometimes a breathing space. It’s built to be private and
          low-pressure. No feeds, no followers, nothing public.
        </P>

        <H>What we store</H>
        <P>We keep this as small as possible.</P>
        <Bullet>
          <Text style={styles.strong}>Your check-ins</Text> — the emotion you tap and when you tapped
          it. If you’re signed out, these live only on your device and never leave your phone.
        </Bullet>
        <Bullet>
          <Text style={styles.strong}>Your email</Text> — only if you choose to create an account. We
          use it to send your sign-in code and to back up your check-ins. There are no passwords.
        </Bullet>
        <P>We don’t ask for your name, age, location, contacts, or anything else.</P>

        <H>How we use it</H>
        <Bullet>To show your history, so you can look back gently.</Bullet>
        <Bullet>To keep it safe across your devices — only when you’re signed in.</Bullet>
        <P>We never use it to profile you or build a picture of who you are.</P>

        <H>Signed out vs signed in</H>
        <Bullet>
          <Text style={styles.strong}>Signed out:</Text> everything stays on your device. We hold
          nothing about you.
        </Bullet>
        <Bullet>
          <Text style={styles.strong}>Signed in:</Text> your check-ins are backed up to your private
          account, so they’re safe if you lose or change your phone.
        </Bullet>

        <H>The services we rely on</H>
        <P>We’re a small app and use a few trusted services to run:</P>
        <Bullet>
          <Text style={styles.strong}>Supabase</Text> — handles sign-in and stores signed-in users’
          check-ins in a secure database. Each person’s data is locked to their own account.
        </Bullet>
        <Bullet>
          <Text style={styles.strong}>SendGrid</Text> — sends your sign-in code by email. It processes
          your email address to deliver that one message, nothing more.
        </Bullet>
        <Bullet>
          <Text style={styles.strong}>Groq</Text> — generates some supportive responses using AI. It
          only ever receives the single emotion you tapped (like “Lonely”) — never your history, your
          email, or anything that identifies you. Many responses are pre-written and don’t use AI at
          all.
        </Bullet>

        <H>Your data is yours — and locked to you</H>
        <P>
          For signed-in users, every check-in is tied to your account, and only you can read it. No
          other user — and no unauthenticated request — can reach your data. We don’t read your
          check-ins to “review” them; they’re simply stored for you.
        </P>

        <H>Deleting your data</H>
        <Bullet>
          <Text style={styles.strong}>Signed out:</Text> clearing your history in the app removes those
          check-ins from your device.
        </Bullet>
        <Bullet>
          <Text style={styles.strong}>Signed in:</Text> tap below and we’ll remove your account and
          every check-in for good. We do this by hand, usually within a few days. (Signing out just
          clears this device — your check-ins stay safe in your account.)
        </Bullet>
        <Pressable onPress={requestDeletion} hitSlop={8} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Request deletion</Text>
        </Pressable>

        <H>What we don’t do</H>
        <Bullet>We don’t sell or share your data with anyone.</Bullet>
        <Bullet>We don’t run ads.</Bullet>
        <Bullet>We don’t use tracking or analytics tools.</Bullet>
        <Bullet>We don’t have social features or anything public.</Bullet>
        <Bullet>We don’t read your check-ins for any purpose other than showing them back to you.</Bullet>
        <P>Your emotional data isn’t a product. It’s just yours.</P>

        <H>Comfort, not medicine</H>
        <P>
          Silent Support is here for comfort — not medical care or therapy, and it can’t replace a
          real person.
        </P>
        <P>
          If you’re in danger or thinking about hurting yourself, please reach out to your local
          emergency services or a helpline in the Help screen. You shouldn’t have to carry that alone.
        </P>

        <H>Questions</H>
        <P>
          If anything here is unclear, or you’d like your data deleted, email {SUPPORT_EMAIL} — we’ll
          help.
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
  deleteButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHigh,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  deleteButtonText: {
    color: theme.colors.accentWhisper,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
  },
});

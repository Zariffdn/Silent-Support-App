import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { theme } from '../src/theme';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function SignInScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Resend cooldown: after a code is sent, count down 30s before allowing another.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async () => {
    if (cooldown > 0) return;
    const e = email.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) {
      setError('That doesn’t look like an email yet.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: e,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (err) {
      setError('We couldn’t send it just now. Try again in a moment.');
      return;
    }
    setPhase('code');
    setCooldown(30);
  };

  const verify = async () => {
    const token = code.trim();
    if (token.length < 6) {
      setError('Enter the code from your email.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: 'email',
    });
    setBusy(false);
    if (err) {
      setError('That code didn’t match. Check your email and try again.');
      return;
    }
    // The session listener handles syncing/restoring; just return.
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={16} accessibilityLabel="Back">
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        {phase === 'email' ? (
          <>
            <Text style={styles.title}>Save your check-ins</Text>
            <Text style={styles.intro}>
              Add your email and we’ll send a code to sign in — no password needed. Use the same
              email each time, so your check-ins stay together.
            </Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.inkTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!busy}
            />
            <Pressable
              style={[styles.button, (busy || cooldown > 0) && styles.buttonBusy]}
              onPress={sendCode}
              disabled={busy || cooldown > 0}
            >
              <Text style={styles.buttonText}>
                {cooldown > 0 ? `Send again in ${cooldown}s` : busy ? 'Sending…' : 'Send code'}
              </Text>
            </Pressable>
            <Text style={styles.note}>
              Your email is only used to sign you in. Your check-ins stay private to you.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.intro}>
              Enter the code we just sent to {email.trim().toLowerCase()}.
            </Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={setCode}
              placeholder="········"
              placeholderTextColor={theme.colors.inkTertiary}
              keyboardType="number-pad"
              autoFocus
              maxLength={8}
              editable={!busy}
            />
            <Pressable style={[styles.button, busy && styles.buttonBusy]} onPress={verify} disabled={busy}>
              <Text style={styles.buttonText}>{busy ? 'Signing in…' : 'Continue'}</Text>
            </Pressable>
            <Pressable onPress={() => { setPhase('email'); setCode(''); setError(null); }} hitSlop={10}>
              <Text style={styles.secondary}>Use a different email</Text>
            </Pressable>
          </>
        )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
  flex: { flex: 1 },
  body: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 16 },
  title: {
    color: theme.colors.inkPrimary,
    fontSize: theme.typography.size.greeting,
    fontFamily: theme.typography.family.serif,
  },
  intro: {
    color: theme.colors.inkSecondary,
    fontSize: theme.typography.size.body,
    lineHeight: theme.typography.lineHeight.body,
    fontFamily: theme.typography.family.sans,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    color: theme.colors.inkPrimary,
    fontSize: theme.typography.size.ui,
    fontFamily: theme.typography.family.sans,
    marginTop: 8,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: theme.typography.size.greeting,
  },
  button: {
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonBusy: { opacity: 0.6 },
  buttonText: {
    color: theme.colors.inkPrimary,
    fontSize: theme.typography.size.ui,
    fontFamily: theme.typography.family.sans,
  },
  secondary: {
    color: theme.colors.accentWhisper,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
    textAlign: 'center',
    marginTop: 4,
  },
  note: {
    color: theme.colors.inkTertiary,
    fontSize: theme.typography.size.caption,
    lineHeight: 19,
    fontFamily: theme.typography.family.sans,
    marginTop: 4,
  },
  error: {
    color: theme.colors.accentAlert,
    fontSize: theme.typography.size.body,
    fontFamily: theme.typography.family.sans,
    textAlign: 'center',
  },
});

import { useEffect, useState } from 'react';
import { AccessibilityInfo, TextInput, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { colors, fonts, maxScale, space, type } from '../src/theme';
import { Screen } from '../src/ui/Screen';
import { T } from '../src/ui/T';
import { Action } from '../src/ui/Action';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Optional, and it should feel that way: one field, one action, one honest
 * line about the email. Passwordless — a code arrives by email.
 */
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

  // Errors are spoken as well as shown.
  useEffect(() => {
    if (error) AccessibilityInfo.announceForAccessibility(error);
  }, [error]);

  const sendCode = async () => {
    if (cooldown > 0 || busy) return;
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
    if (router.canGoBack()) router.back();
    else router.dismissTo('/');
  };

  const changeEmail = () => {
    setPhase('email');
    setCode('');
    setError(null);
    // A new address starts fresh: no leftover cooldown for a code that was
    // never sent to it.
    setCooldown(0);
  };

  return (
    <Screen back keyboard title={phase === 'email' ? 'Keep a copy' : 'Check your email'}>
      {phase === 'email' ? (
        <>
          <T role="body" tone="ink2">
            Sign in with your email and we’ll send you a code. No password. Your check-ins stay
            yours.
          </T>
          <TextInput
            style={styles.input}
            maxFontSizeMultiplier={maxScale.body}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.ink3}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={sendCode}
            editable={!busy}
            accessibilityLabel="Email address"
          />
          {error ? (
            <T role="body" tone="alert" style={styles.error}>
              {error}
            </T>
          ) : null}
          <Action
            label={busy ? 'Sending…' : cooldown > 0 ? `Send again in ${cooldown}s` : 'Send code'}
            kind="primary"
            onPress={sendCode}
            disabled={cooldown > 0}
            busy={busy}
            style={styles.action}
          />
          <T role="whisper" tone="ink3" style={styles.note}>
            Your email is used only to send the code and keep your check-ins together.
          </T>
        </>
      ) : (
        <>
          <T role="body" tone="ink2">
            Enter the code we sent to {email.trim().toLowerCase()}. If it hasn’t arrived, check
            your spam folder.
          </T>
          <TextInput
            style={[styles.input, styles.codeInput]}
            maxFontSizeMultiplier={maxScale.field}
            value={code}
            onChangeText={setCode}
            placeholder="········"
            placeholderTextColor={colors.ink3}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            returnKeyType="done"
            onSubmitEditing={verify}
            autoFocus
            maxLength={8}
            editable={!busy}
            accessibilityLabel="Sign-in code"
          />
          {error ? (
            <T role="body" tone="alert" style={styles.error}>
              {error}
            </T>
          ) : null}
          <Action
            label={busy ? 'Signing in…' : 'Continue'}
            kind="primary"
            onPress={verify}
            busy={busy}
            style={styles.action}
          />
          <View style={styles.secondary}>
            <Action
              label={cooldown > 0 ? `Send again in ${cooldown}s` : 'Send again'}
              onPress={sendCode}
              disabled={busy || cooldown > 0}
            />
            <Action label="Use a different email" onPress={changeEmail} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // The one container in the app: a line to write on, not a box. No lineHeight
  // (iOS would sit the text low) and no horizontal padding (Android would
  // indent it off the edge).
  input: {
    fontFamily: fonts.regular,
    fontSize: type.body.fontSize,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.edge,
    paddingVertical: space.s,
    paddingHorizontal: 0,
    marginTop: space.l,
  },
  codeInput: {
    fontSize: type.field.fontSize,
    letterSpacing: 4,
  },
  error: {
    marginTop: space.s,
  },
  action: {
    marginTop: space.l,
  },
  note: {
    marginTop: space.l,
  },
  secondary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.xs,
  },
});

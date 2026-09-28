import { StyleSheet } from 'react-native';
import { space } from '../src/theme';
import { Screen } from '../src/ui/Screen';
import { T } from '../src/ui/T';
import { H, P, Bullet, Strong, MailLink } from '../src/ui/Prose';

const SUPPORT_EMAIL = 'zariffdanial1@gmail.com';

export default function TermsScreen() {
  return (
    <Screen back title="Terms">
      <P lead>A few simple things about using Silent Support. Plainly, and without fine print.</P>
      <T role="whisper" tone="ink3" style={styles.updated}>
        Last updated: 29 September 2026
      </T>

      <H>What it’s for</H>
      <P>
        Silent Support is a quiet space to check in with how you feel and receive a calm,
        supportive response. It’s here to offer a moment of comfort, nothing more complicated than
        that.
      </P>

      <H>Using it kindly</H>
      <P>Please use Silent Support the way it’s meant to be used:</P>
      <Bullet>
        The helplines in <Strong>Help</Strong> are real services, answered by real people. Please
        treat them with care.
      </Bullet>
      <Bullet>Don’t try to break, overload, or spam the app or its sign-in system.</Bullet>
      <Bullet>Don’t use it to harm yourself or others, or for anything illegal.</Bullet>

      <H>Your account</H>
      <P>
        If you sign in, you’re responsible for the email you use. Keep access to that inbox safe,
        since anyone who can read your sign-in codes can reach your account. There are no passwords
        to manage; the code in your email is the key.
      </P>

      <H>Your check-ins are yours</H>
      <P>
        The feelings you log belong to you. We don’t claim them, sell them, or use them for anything
        beyond showing them back to you. You can delete your account and check-ins anytime in
        Settings, under Account.
      </P>

      <H>The app is offered as it is</H>
      <P>
        We build Silent Support with care, but it’s a small app and we can’t promise it’ll be
        perfect or always available. Please treat it as a companion, not a guarantee.
      </P>
      <P>
        Silent Support is not medical advice, therapy, or a crisis service. It can’t diagnose
        anything or replace a professional. If you’re in danger or thinking about harming yourself,
        please contact your local emergency services or a helpline in the Help screen.
      </P>

      <H>Changes</H>
      <P>
        Silent Support will grow and change over time, so these terms may be updated now and then.
        If something meaningful changes, we’ll do our best to make it clear.
      </P>

      <H>If things go wrong</H>
      <P>
        If an account is used to abuse the app, spam the system, or harm others, we may have to
        remove it. We’d much rather not, since this is a space meant to be gentle, but we’ll act
        when we need to, to keep it safe for everyone.
      </P>

      <H>Questions</H>
      <P>If anything is unclear, write to us and we’ll help.</P>
      <MailLink address={SUPPORT_EMAIL} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  updated: {
    marginTop: space.xs,
  },
});

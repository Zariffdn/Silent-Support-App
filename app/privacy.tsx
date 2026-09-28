import { StyleSheet } from 'react-native';
import { space } from '../src/theme';
import { Screen } from '../src/ui/Screen';
import { T } from '../src/ui/T';
import { H, P, Bullet, Strong, MailLink } from '../src/ui/Prose';

// Support / questions inbox.
const SUPPORT_EMAIL = 'zariffdanial1@gmail.com';

export default function PrivacyScreen() {
  return (
    <Screen back title="Privacy">
      <P lead>
        Silent Support is a quiet place to check in with how you feel. This is what happens with
        your information, plainly.
      </P>
      <Bullet>
        <Strong>Nothing is tracked.</Strong> No analytics, no ads, no profiling. Ever.
      </Bullet>
      <Bullet>
        <Strong>Signed out, your check-ins stay on this phone.</Strong> Nothing about you is stored
        on our servers.
      </Bullet>
      <Bullet>
        <Strong>Only the feeling you tap reaches our AI service,</Strong> along with a rough 1-to-3
        sense of how much support to offer. Never your history, your email, or who you are.
      </Bullet>
      <T role="whisper" tone="ink3" style={styles.updated}>
        Last updated: 29 September 2026
      </T>

      <H>What Silent Support is</H>
      <P>
        Silent Support lets you tap how you’re feeling and receive a calm, supportive response.
        Sometimes a gentle line, sometimes a breathing space. It’s built to be private and
        low-pressure. No feeds, no followers, nothing public.
      </P>

      <H>What we store</H>
      <P>We keep this as small as possible.</P>
      <Bullet>
        <Strong>Your check-ins.</Strong> The feeling you tap, and when. When you’re signed out,
        these are stored only on your device.
      </Bullet>
      <Bullet>
        <Strong>Your email.</Strong> Only if you choose to sign in. We use it to send your sign-in
        code and to back up your check-ins. There are no passwords.
      </Bullet>
      <P>We don’t ask for your name, age, location, contacts, or anything else.</P>

      <H>How we use it</H>
      <Bullet>To show your history, so you can look back gently.</Bullet>
      <Bullet>To keep it safe across your devices, only when you’re signed in.</Bullet>
      <P>We never use it to profile you or build a picture of who you are.</P>
      <P>
        Silent Support never knows why you chose a feeling. Only the feeling itself is processed.
      </P>

      <H>Gentle patterns, only on your phone</H>
      <P>
        Sometimes the app quietly notices a pattern. It might show a soft line such as “no one
        feeling has taken over lately”, or, if difficult feelings seem to be lasting, a gentle
        reminder that support resources are always there.
      </P>
      <P>
        Both are worked out only on your device, from check-ins already on your phone. They are
        never sent anywhere, never stored separately, and are not a diagnosis, an assessment, or
        any kind of monitoring.
      </P>

      <H>Signed out and signed in</H>
      <Bullet>
        <Strong>Signed out:</Strong> your history stays on your device and nothing about you is
        stored on our servers. To write a response, the single feeling you tap is sent to our AI
        service in the moment and never saved.
      </Bullet>
      <Bullet>
        <Strong>Signed in:</Strong> your check-ins are backed up to your private account, so
        they’re safe if you lose or change your phone.
      </Bullet>

      <H>The services we rely on</H>
      <P>We’re a small app and use a few trusted services to run:</P>
      <Bullet>
        <Strong>Supabase.</Strong> Handles sign-in and stores signed-in users’ check-ins in a
        secure database. Each person’s data is locked to their own account.
      </Bullet>
      <Bullet>
        <Strong>SendGrid.</Strong> Sends your sign-in code by email. It only handles your email
        address to deliver that one message.
      </Bullet>
      <Bullet>
        <Strong>Groq.</Strong> Generates some supportive responses using AI. It receives only two
        things: the single feeling you tapped (like “Lonely”), and a rough support number from 1 to
        3 that hints how much support to offer. That number is worked out on your device. Your
        history, counts, dates, and patterns never leave your phone, Groq never receives your email
        or anything that identifies you, and many responses are pre-written and don’t use AI at
        all.
      </Bullet>

      <H>Technical basics</H>
      <P>
        Like any app that connects to the internet, the services we rely on briefly see your
        device’s IP address and the time of each request, in order to deliver a response. Silent
        Support does not use this to track, profile, or build a picture of you.
      </P>
      <P>
        Your phone’s app store may send anonymous crash reports, handled by Apple or Google and
        never by an analytics tool inside the app, to help us fix problems. You can turn this off
        in your device settings.
      </P>

      <H>Your data is yours, and locked to you</H>
      <P>
        For signed-in users, every check-in is tied to your account, and only you can read it. No
        other person, and no request without your sign-in, can reach it. We don’t read your
        check-ins ourselves; they’re simply kept for you. This is enforced at the database level,
        not just in the app.
      </P>

      <H>Deleting your data</H>
      <Bullet>
        <Strong>Signed out:</Strong> on the Looking back page, tap Clear history on this device
        to remove those check-ins from your phone.
      </Bullet>
      <Bullet>
        <Strong>Signed in:</Strong> go to Settings, then Account, and tap Delete account. This
        permanently removes your account and every backed-up check-in right away, and clears them
        from this device. It can’t be undone. Signing out instead just clears this device and keeps
        your check-ins safe in your account.
      </Bullet>

      <H>How long we keep things</H>
      <Bullet>
        Your check-ins stay until you delete them. We don’t auto-expire them or archive them
        elsewhere.
      </Bullet>
      <Bullet>Deleting your account removes your account and every backed-up check-in.</Bullet>
      <Bullet>
        The services we rely on may keep their own short-lived logs, for example of sign-in emails,
        for a time, according to their own policies.
      </Bullet>

      <H>What we don’t do</H>
      <Bullet>We don’t sell or share your data with anyone.</Bullet>
      <Bullet>We don’t run ads.</Bullet>
      <Bullet>We don’t use tracking or analytics tools.</Bullet>
      <Bullet>We don’t have social features or anything public.</Bullet>
      <Bullet>We don’t read your check-ins for any purpose other than showing them back to you.</Bullet>
      <P>Your emotional data isn’t a product. It’s just yours.</P>

      <H>Comfort, not medicine</H>
      <P>
        Silent Support is here for comfort, not medical care or therapy, and it can’t replace a
        real person.
      </P>
      <P>
        If you’re in danger or thinking about hurting yourself, please reach out to your local
        emergency services or a helpline in the Help screen. You shouldn’t have to carry that alone.
      </P>

      <H>Questions</H>
      <P>If anything here is unclear, write to us and we’ll help.</P>
      <MailLink address={SUPPORT_EMAIL} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  updated: {
    marginTop: space.xs,
  },
});

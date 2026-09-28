import type { ReactNode } from 'react';
import { Linking, Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, fonts, space, type } from '../theme';
import { T } from './T';

/**
 * Long-form pages (Privacy, Terms, Licenses) share these four pieces so they
 * read as one document set: a heading that is clearly a heading, a paragraph,
 * a bullet, and inline emphasis.
 */
export function H({ children }: { children: ReactNode }) {
  return (
    <T role="heading" accessibilityRole="header" style={styles.h}>
      {children}
    </T>
  );
}

export function P({ children, lead }: { children: ReactNode; lead?: boolean }) {
  return (
    <T role="body" tone={lead ? 'ink' : 'ink2'} style={styles.p}>
      {children}
    </T>
  );
}

export function Bullet({ children }: { children: ReactNode }) {
  return (
    <View style={styles.bullet}>
      <T role="body" tone="ink3" style={styles.dot} accessible={false}>
        •
      </T>
      <T role="body" tone="ink2" style={styles.bulletText}>
        {children}
      </T>
    </View>
  );
}

export function Strong({ children }: { children: ReactNode }) {
  return <Text style={styles.strong}>{children}</Text>;
}

/** An email address that opens the mail app. */
export function MailLink({ address }: { address: string }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(`mailto:${address}`).catch(() => {})}
      accessibilityRole="link"
      accessibilityLabel={`Email ${address}`}
      hitSlop={space.xs}
      style={styles.mail}
    >
      <T role="label" tone="ink">
        {address}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h: {
    marginTop: space.l,
    marginBottom: space.xs,
  },
  p: {
    marginBottom: space.s,
  },
  bullet: {
    flexDirection: 'row',
    gap: space.s,
    marginBottom: space.s,
  },
  dot: {
    width: space.s,
  },
  bulletText: {
    flex: 1,
  },
  strong: {
    ...type.body,
    fontFamily: fonts.medium,
    color: colors.ink,
  },
  mail: {
    alignSelf: 'flex-start',
    paddingVertical: space.xs,
  },
});

import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, layout, space } from '../theme';
import { T } from './T';
import { Action } from './Action';

type Props = {
  children: ReactNode;
  /** Title in the title role, marked as a header for screen readers. */
  title?: string;
  /** Show the Back word, which pops one level (or goes home from a deep link). */
  back?: boolean;
  /** Scroll the content (default). false gives a fixed flex column. */
  scroll?: boolean;
  /** Keyboard avoidance for forms. */
  keyboard?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Every screen's skeleton: the canvas, safe areas, the shared 24pt left edge, a
 * reading column capped for tablets, and (on secondary screens) a Back word that
 * sits on the same edge as the title it introduces.
 */
export function Screen({ children, title, back, scroll = true, keyboard, contentStyle }: Props) {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.dismissTo('/'));

  const body = (
    <>
      {title ? (
        <T role="title" accessibilityRole="header" style={styles.title}>
          {title}
        </T>
      ) : null}
      {children}
    </>
  );

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, back ? styles.afterBar : styles.noBar, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {body}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fixed, back ? styles.afterBar : styles.noBar, contentStyle]}>
      {body}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {back ? (
        <View style={styles.bar}>
          <Action label="Back" onPress={goBack} />
        </View>
      ) : null}
      {keyboard ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  flex: {
    flex: 1,
  },
  bar: {
    width: '100%',
    maxWidth: layout.column,
    alignSelf: 'center',
    paddingHorizontal: layout.edge,
  },
  content: {
    width: '100%',
    maxWidth: layout.column,
    alignSelf: 'center',
    paddingHorizontal: layout.edge,
    paddingBottom: space.xxl,
  },
  fixed: {
    flex: 1,
  },
  afterBar: {
    paddingTop: space.xs,
  },
  noBar: {
    paddingTop: space.xl,
  },
  title: {
    marginBottom: space.l,
  },
});

import { Linking, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { space } from '../src/theme';
import {
  CRISIS_REGION,
  CRISIS_RESOURCES,
  INTERNATIONAL_DIRECTORY,
  type CrisisResource,
} from '../src/features/safety/resources';
import { Screen } from '../src/ui/Screen';
import { T } from '../src/ui/T';
import { Action } from '../src/ui/Action';
import { Hairline } from '../src/ui/Hairline';

function open(resource: CrisisResource) {
  const { action } = resource;
  const url = action.type === 'call' ? `tel:${action.number}` : action.url;
  Linking.openURL(url).catch(() => {
    // If the device can't open it (e.g. no dialer), fail quietly — the number
    // itself is on screen and selectable.
  });
}

/** One line of help: who it is, when it's there, and a way to reach it. */
function Resource({ resource, primary }: { resource: CrisisResource; primary?: boolean }) {
  const verb = resource.action.type === 'call' ? 'Call' : 'Open';
  const target = resource.actionLabel.replace(/^(Call|Open) /, '');
  return (
    <View style={styles.resource}>
      <T role="heading" accessibilityRole="header">
        {resource.name}
      </T>
      <T role="body" tone="ink2" style={styles.desc}>
        {resource.description}
      </T>
      <View style={styles.reach}>
        <Action
          label={verb}
          kind={primary ? 'primary' : 'secondary'}
          onPress={() => open(resource)}
          accessibilityLabel={resource.actionLabel}
        />
        <T role="label" tone="ink" selectable>
          {target}
        </T>
      </View>
    </View>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const [emergency, ...lines] = CRISIS_RESOURCES;

  return (
    <Screen back title="You’re not alone">
      <T role="body" tone="ink2">
        If you’re carrying something heavy, or thinking about hurting yourself, you don’t have to
        face it alone. These lines are free, confidential, and there for you, any time.
      </T>
      <Action
        label="Breathe with me for a moment"
        onPress={() => router.push('/comfort')}
        accessibilityLabel="Breathe with me for a moment. Opens the breathing space"
        style={styles.breathe}
      />

      <Hairline />
      <T role="label" tone="ink2">
        In {CRISIS_REGION}
      </T>
      {emergency ? <Resource resource={emergency} primary /> : null}
      {lines.map((r) => (
        <Resource key={r.name} resource={r} />
      ))}

      <Hairline />
      <T role="label" tone="ink2">
        Anywhere in the world
      </T>
      <Resource resource={INTERNATIONAL_DIRECTORY} />

      <T role="whisper" tone="ink3" style={styles.footer}>
        Silent Support is here for comfort, not medical care. In an emergency, please contact your
        local emergency services.
      </T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  breathe: {
    marginTop: space.l,
  },
  resource: {
    marginTop: space.m,
  },
  desc: {
    marginTop: space.hair,
  },
  // The Call word carries a -16 left margin; an 8pt gap puts the number 24pt after it.
  reach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.hair,
  },
  footer: {
    marginTop: space.xl,
  },
});

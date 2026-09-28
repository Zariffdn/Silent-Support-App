import { Screen } from '../src/ui/Screen';
import { H, P, Bullet } from '../src/ui/Prose';

const LIBRARIES = [
  'Expo',
  'React Native',
  'React',
  'Expo Router',
  'Supabase JS',
  'Async Storage',
  'React Native Community Slider',
  'React Native Safe Area Context',
  'React Native Screens',
  'React Native URL Polyfill',
];

export default function LicensesScreen() {
  return (
    <Screen back title="Licenses">
      <P lead>
        Silent Support is built on open-source software. Thank you to the people behind these
        projects.
      </P>

      <H>Software</H>
      {LIBRARIES.map((lib) => (
        <Bullet key={lib}>{lib}</Bullet>
      ))}
      <P>
        Each is used under its own open-source license, mostly MIT. The full license text for any
        of them is available from its project page.
      </P>

      <H>Typeface</H>
      <P>
        The words in this app are set in Literata, by TypeTogether for Google Fonts, used under the
        SIL Open Font License 1.1.
      </P>
    </Screen>
  );
}

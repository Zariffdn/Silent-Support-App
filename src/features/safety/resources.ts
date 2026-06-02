// Crisis / urgent-help resources surfaced in app/help.tsx.
//
// Region: Malaysia (+ an international fallback that works anywhere).
// Verified June 2026 against befrienders.org.my, findahelpline.com, and Malaysia
// government sources:
//   999 emergency (112 from a mobile); Befrienders KL 03-7627 2929 (24 hours);
//   Talian HEAL 15555 (MOH mental health, 8am to midnight daily);
//   Talian Kasih 15999 (KPWKM abuse / family / welfare line, 24 hours).
// Re-verify periodically; the international directory is the safe fallback.

export type ResourceAction =
  | { type: 'call'; number: string } // digits only, used for tel:
  | { type: 'link'; url: string };

export type CrisisResource = {
  name: string;
  description: string;
  actionLabel: string;
  action: ResourceAction;
};

export const CRISIS_REGION = 'Malaysia';

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: 'Emergency services',
    description: 'If you or someone else is in immediate danger. Call 999, or 112 from a mobile.',
    actionLabel: 'Call 999',
    action: { type: 'call', number: '999' },
  },
  {
    name: 'Befrienders KL',
    description: '24-hour, free and confidential emotional support and suicide prevention.',
    actionLabel: 'Call 03-7627 2929',
    action: { type: 'call', number: '0376272929' },
  },
  {
    name: 'Talian HEAL (Ministry of Health)',
    description: 'Mental health support line. Open 8am to midnight, every day.',
    actionLabel: 'Call 15555',
    action: { type: 'call', number: '15555' },
  },
  {
    name: 'Talian Kasih',
    description:
      'Abuse, family, or welfare emergencies, for women, children, and vulnerable groups. 24 hours.',
    actionLabel: 'Call 15999',
    action: { type: 'call', number: '15999' },
  },
];

export const INTERNATIONAL_DIRECTORY: CrisisResource = {
  name: 'Outside Malaysia?',
  description: 'Find a crisis helpline in any country.',
  actionLabel: 'Open findahelpline.com',
  action: { type: 'link', url: 'https://findahelpline.com' },
};

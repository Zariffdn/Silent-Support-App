// Crisis / urgent-help resources surfaced in app/help.tsx.
//
// Region: Malaysia (+ an international fallback that works anywhere).
// ⚠️ Verify these numbers are current before any public launch — helplines
// occasionally change. Sources: Befrienders KL, Malaysia MOH (Talian HEAL),
// Talian Kasih, national emergency line.

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
    description: 'If you or someone else is in immediate danger.',
    actionLabel: 'Call 999',
    action: { type: 'call', number: '999' },
  },
  {
    name: 'Befrienders KL',
    description: '24-hour emotional support and suicide prevention.',
    actionLabel: 'Call 03-7627 2929',
    action: { type: 'call', number: '0376272929' },
  },
  {
    name: 'Talian HEAL (Ministry of Health)',
    description: 'Mental health support line.',
    actionLabel: 'Call 15555',
    action: { type: 'call', number: '15555' },
  },
  {
    name: 'Talian Kasih',
    description: 'National 24-hour welfare and crisis helpline.',
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

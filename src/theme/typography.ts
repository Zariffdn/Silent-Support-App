export const typography = {
  family: {
    sans: 'System',
    serif: 'Georgia',
  },
  size: {
    caption: 13,
    body: 15,
    ui: 17,
    response: 22,
    greeting: 28,
  },
  lineHeight: {
    body: 22,
    response: 34,
  },
} as const;

export type FontSize = keyof typeof typography.size;

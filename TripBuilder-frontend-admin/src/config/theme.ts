import { defineTheme } from '@astryxdesign/core';
import { neutralTheme, neutralIconRegistry } from '@astryxdesign/theme-neutral/built';

export const tripBuilderAdminTheme = defineTheme({
  name: 'tripbuilder-admin',
  extends: neutralTheme,
  icons: neutralIconRegistry,
  tokens: {
    '--color-background-body': ['#FAFAFA', '#141415'],
    '--color-background-surface': ['#F4F4F5', '#19191B'],
    '--color-background-card': ['#F4F4F5', '#19191B'],
    '--color-background-popover': ['#F4F4F5', '#19191B'],
    '--color-background-muted': ['#E4E4E7', '#232325'],
    '--color-border': ['rgba(20, 20, 21, 0.08)', 'rgba(237, 237, 237, 0.08)'],
    '--color-border-emphasized': ['rgba(20, 20, 21, 0.16)', 'rgba(237, 237, 237, 0.16)'],
    '--color-text-primary': ['#141415', '#EDEDED'],
    '--color-text-secondary': ['#52525B', '#A1A1A6'],
    '--color-text-disabled': ['#686872', '#85858B'],
    '--color-accent': ['#D9381E', '#E04B32'],
    '--color-accent-muted': ['rgba(217, 56, 30, 0.08)', 'rgba(224, 75, 50, 0.14)'],
    '--color-on-accent': ['#FFFFFF', '#FFFFFF'],
    '--color-text-accent': ['#D9381E', '#E04B32'],
    '--radius-inner': '8px',
    '--radius-element': '12px',
    '--radius-container': '16px',
  },
  typography: {
    body: {
      family: "'Plus Jakarta Sans', 'Be Vietnam Pro'",
      fallbacks: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
      weight: 'medium',
    },
    heading: {
      family: "'Be Vietnam Pro', 'Plus Jakarta Sans'",
      fallbacks: 'ui-sans-serif, system-ui, sans-serif',
      weight: 'semibold',
    },
    code: {
      family: "'IBM Plex Mono'",
      fallbacks: 'ui-monospace, SFMono-Regular, monospace',
    },
  },
});

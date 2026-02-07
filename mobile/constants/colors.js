/**
 * Single source of truth for app color hex values.
 * Used by theme.ts (app) and tailwind.config.js (build).
 */
const tintLight = '#0a7ea4';
const tintDark = '#0a7ea4';

module.exports = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintLight,
    border: '#e5e7eb',
    card: '#f9fafb',
    errorBg: '#fef2f2',
    errorBorder: '#fecaca',
    warningBg: '#fefce8',
    warningBorder: '#fef08a',
    topicBg: '#faf5ff',
    topicBorder: '#d8b4fe',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintDark,
    border: '#374151',
    card: '#1f2937',
    errorBg: '#450a0a',
    errorBorder: '#7f1d1d',
    warningBg: '#422006',
    warningBorder: '#854d0e',
    topicBg: '#3b0764',
    topicBorder: '#7c3aed',
  },
};

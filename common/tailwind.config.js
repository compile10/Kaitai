/**
 * Shared Tailwind theme -- single source of truth for both web and mobile.
 * Web: loaded via @config directive in globals.css (Tailwind v4)
 * Mobile: loaded via presets array in mobile/tailwind.config.js (NativeWind/v3)
 * JS consumers: import { colors } from "@common/tailwind.config"
 */

const colors = {
  light: {
    text: "#1c1917",        // stone-900
    background: "#fff",
    tint: "#dc2626",        // red-600
    icon: "#78716c",        // stone-500
    tabIconDefault: "#78716c",
    tabIconSelected: "#dc2626",
    border: "#e7e5e4",      // stone-200
    card: "#fafaf9",        // stone-50
    errorBg: "#fff7ed",     // orange-50 (distinct from red tint)
    errorBorder: "#fed7aa", // orange-200
    warningBg: "#fefce8",   // yellow-50
    warningBorder: "#fef08a", // yellow-200
    topicBg: "#fff1f2",     // rose-50
    topicBorder: "#fda4af", // rose-300
  },
  dark: {
    text: "#ECEDEE",
    background: "#1c1917",  // stone-900
    tint: "#dc2626",        // red-600
    icon: "#a8a29e",        // stone-400
    tabIconDefault: "#a8a29e",
    tabIconSelected: "#dc2626",
    border: "#44403c",      // stone-700
    card: "#292524",        // stone-800
    errorBg: "#431407",     // orange-950
    errorBorder: "#9a3412", // orange-800
    warningBg: "#422006",   // amber-950
    warningBorder: "#854d0e", // amber-800
    topicBg: "#4c0519",     // rose-950
    topicBorder: "#e11d48", // rose-600
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  colors, // Extra export for JS consumers needing raw hex values
  theme: {
    extend: {
      colors: {
        tint: colors.light.tint,
        tintDark: colors.dark.tint,
        background: colors.light.background,
        backgroundDark: colors.dark.background,
        text: colors.light.text,
        textDark: colors.dark.text,
        muted: colors.light.border,
        mutedDark: colors.dark.border,
        icon: colors.light.icon,
        iconDark: colors.dark.icon,
        card: colors.light.card,
        cardDark: colors.dark.card,
        errorBg: colors.light.errorBg,
        errorBgDark: colors.dark.errorBg,
        errorBorder: colors.light.errorBorder,
        errorBorderDark: colors.dark.errorBorder,
        warningBg: colors.light.warningBg,
        warningBgDark: colors.dark.warningBg,
        warningBorder: colors.light.warningBorder,
        warningBorderDark: colors.dark.warningBorder,
        topicBg: colors.light.topicBg,
        topicBgDark: colors.dark.topicBg,
        topicBorder: colors.light.topicBorder,
        topicBorderDark: colors.dark.topicBorder,
      },
    },
  },
};

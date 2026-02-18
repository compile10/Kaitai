/**
 * Shared Tailwind theme — single source of truth for both web and mobile.
 *
 * Web:    loaded via @config directive in globals.css (Tailwind v4)
 * Mobile: loaded via presets array in mobile/tailwind.config.js (NativeWind/v3)
 * JS:     import { colors } from "@common/tailwind.config"
 *
 * The Tailwind plugin injects :root / .dark CSS custom-properties so the web
 * client gets dynamic dark-mode via next-themes without any hex values in
 * globals.css.  Mobile ignores the injected variables and uses the static
 * theme.extend.colors values with dark: prefix classes instead.
 */

// ---------------------------------------------------------------------------
// Color palette  (all hex values live HERE and nowhere else)
// ---------------------------------------------------------------------------

const colors = {
  light: {
    // -- shadcn semantic tokens ------------------------------------------
    background: "#ffffff",
    foreground: "#1c1917",           // stone-900
    primary: "#dc2626",              // red-600  (brand)
    "primary-foreground": "#ffffff",
    secondary: "#f5f5f4",            // stone-100
    "secondary-foreground": "#1c1917",
    muted: "#f5f5f4",                // stone-100
    "muted-foreground": "#78716c",   // stone-500  (was "icon")
    accent: "#f5f5f4",               // stone-100
    "accent-foreground": "#1c1917",
    destructive: "#ef4444",          // red-500
    "destructive-foreground": "#ffffff",
    card: "#000000",                 // black
    "card-foreground": "#ffffff",
    "card-alt": "#4a0c0c",           // dark red
    "card-alt-foreground": "#fecaca", // red-200
    popover: "#ffffff",
    "popover-foreground": "#1c1917",
    border: "#e7e5e4",               // stone-200
    input: "#e7e5e4",                // stone-200
    ring: "#dc2626",                 // red-600  (brand)

    // -- app-specific custom tokens -------------------------------------
    "error-bg": "#fff7ed",           // orange-50
    "error-border": "#fed7aa",       // orange-200
    "warning-bg": "#fefce8",         // yellow-50
    "warning-border": "#fef08a",     // yellow-200
    "topic-bg": "#fff1f2",           // rose-50
    "topic-border": "#fda4af",       // rose-300

    // -- prose (HTML-formatted LLM content) ------------------------------
    "prose-text": "#4b5563",         // gray-600
    "prose-strong": "#2563eb",       // blue-600
    "prose-strong-bg": "rgba(37, 99, 235, 0.08)",
    "prose-em": "#6366f1",           // indigo-500
    "prose-marker": "#9ca3af",       // gray-400

    // -- React Flow graph ------------------------------------------------
    "rf-edge": "#3b82f6",            // blue-500
    "rf-controls-bg": "#ffffff",
    "rf-controls-border": "#d1d5db", // gray-300
    "rf-controls-text": "#1f2937",   // gray-800
    "rf-controls-hover": "#f3f4f6",  // gray-100
  },

  dark: {
    // -- shadcn semantic tokens ------------------------------------------
    background: "#000000",
    foreground: "#ECEDEE",
    primary: "#dc2626",              // red-600  (brand)
    "primary-foreground": "#ffffff",
    secondary: "#44403c",            // stone-700
    "secondary-foreground": "#ECEDEE",
    muted: "#292524",                // stone-800
    "muted-foreground": "#a8a29e",   // stone-400  (was "icon")
    accent: "#44403c",               // stone-700
    "accent-foreground": "#ECEDEE",
    destructive: "#ef4444",          // red-500
    "destructive-foreground": "#ffffff",
    card: "#ffffff",                 // white
    "card-foreground": "#000000",
    "card-alt": "#4a0c0c",           // dark red
    "card-alt-foreground": "#fecaca", // red-200
    popover: "#1c1917",              // stone-900
    "popover-foreground": "#ECEDEE",
    border: "#44403c",               // stone-700
    input: "#44403c",                // stone-700
    ring: "#dc2626",                 // red-600  (brand)

    // -- app-specific custom tokens -------------------------------------
    "error-bg": "#431407",           // orange-950
    "error-border": "#9a3412",       // orange-800
    "warning-bg": "#422006",         // amber-950
    "warning-border": "#854d0e",     // amber-800
    "topic-bg": "#4c0519",           // rose-950
    "topic-border": "#e11d48",       // rose-600

    // -- prose (HTML-formatted LLM content) ------------------------------
    "prose-text": "#e5e7eb",         // gray-200
    "prose-strong": "#93c5fd",       // blue-300
    "prose-strong-bg": "rgba(147, 197, 253, 0.15)",
    "prose-em": "#c4b5fd",           // violet-300
    "prose-marker": "#9ca3af",       // gray-400

    // -- React Flow graph ------------------------------------------------
    "rf-edge": "#3b82f6",            // blue-500
    "rf-controls-bg": "#374151",     // gray-700
    "rf-controls-border": "#4b5563", // gray-600
    "rf-controls-text": "#e5e7eb",   // gray-200
    "rf-controls-hover": "#4b5563",  // gray-600
  },
};

// ---------------------------------------------------------------------------
// Build the theme.extend.colors map
// Light values are the defaults; "-dark" suffixed keys for mobile dark: prefix
// ---------------------------------------------------------------------------

function buildThemeColors(light, dark) {
  const out = {};
  for (const key of Object.keys(light)) {
    out[key] = light[key];
    out[`${key}-dark`] = dark[key];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tailwind plugin — injects :root / .dark CSS custom-properties
// (consumed by the web client via @theme inline { --color-X: var(--X) })
// ---------------------------------------------------------------------------

function injectCSSVariables({ addBase }) {
  const toVars = (obj) =>
    Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [`--${key}`, value]),
    );
  addBase({
    ":root": toVars(colors.light),
    ".dark": toVars(colors.dark),
  });
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** @type {import('tailwindcss').Config} */
module.exports = {
  colors, // Extra export for JS consumers needing raw hex values
  theme: {
    extend: {
      colors: buildThemeColors(colors.light, colors.dark),
    },
  },
  plugins: [injectCSSVariables],
};

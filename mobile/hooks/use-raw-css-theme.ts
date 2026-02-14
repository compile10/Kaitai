/**
 * Returns a raw hex color string for the current color scheme.
 * Used where React Native APIs require string color values
 * (e.g. React Navigation options, SVG props, animated styles).
 *
 * Colors are sourced from the shared Tailwind config in common/.
 */

import { useColorScheme } from "@/hooks/use-color-scheme";

const { colors } = require("@common/tailwind.config");

export function useRawCSSTheme(
  colorName: keyof typeof colors.light & keyof typeof colors.dark,
) {
  const theme = useColorScheme() ?? "light";
  return colors[theme][colorName];
}

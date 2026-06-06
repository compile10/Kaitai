export const colors: {
  light: Record<string, string>;
  dark: Record<string, string>;
};

declare const config: {
  colors: typeof colors;
  theme: unknown;
  plugins: unknown[];
};

export default config;

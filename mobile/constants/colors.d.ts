export interface ColorScheme {
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  border: string;
  card: string;
  errorBg: string;
  errorBorder: string;
  warningBg: string;
  warningBorder: string;
  topicBg: string;
  topicBorder: string;
}

declare const Colors: { light: ColorScheme; dark: ColorScheme };
export default Colors;

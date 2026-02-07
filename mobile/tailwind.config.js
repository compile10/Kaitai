/** @type {import('tailwindcss').Config} */
const Colors = require("./constants/colors");

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        tint: Colors.light.tint,
        tintDark: Colors.dark.tint,
        background: Colors.light.background,
        backgroundDark: Colors.dark.background,
        text: Colors.light.text,
        textDark: Colors.dark.text,
        muted: Colors.light.border,
        mutedDark: Colors.dark.border,
        icon: Colors.light.icon,
        iconDark: Colors.dark.icon,
        card: Colors.light.card,
        cardDark: Colors.dark.card,
        errorBg: Colors.light.errorBg,
        errorBgDark: Colors.dark.errorBg,
        errorBorder: Colors.light.errorBorder,
        errorBorderDark: Colors.dark.errorBorder,
        warningBg: Colors.light.warningBg,
        warningBgDark: Colors.dark.warningBg,
        warningBorder: Colors.light.warningBorder,
        warningBorderDark: Colors.dark.warningBorder,
        topicBg: Colors.light.topicBg,
        topicBgDark: Colors.dark.topicBg,
        topicBorder: Colors.light.topicBorder,
        topicBorderDark: Colors.dark.topicBorder,
      },
    },
  },
  plugins: [],
};

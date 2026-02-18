const { colors } = require("../common/tailwind.config");

// maps each color key to a var(--key) reference
// since colors.light are already references to the names of the CSS variables used
// inside of the mobile client,
// we just need to say cssRef -> var(--cssRef)
const varColors = {};
for (const key of Object.keys(colors.light)) {
  varColors[key] = `var(--${key})`;
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset"), require("../common/tailwind.config.js")],
  theme: {
    extend: {
      colors: varColors,
    },
  },
  plugins: [],
};

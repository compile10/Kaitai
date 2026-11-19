import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

/** The day-streak flame: red to amber with a yellow core. */
export function StreakFlame({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient
          id="streakFlame"
          x1="0"
          y1="32"
          x2="6"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#991b1b" />
          <Stop offset="0.4" stopColor="#dc2626" />
          <Stop offset="0.75" stopColor="#f97316" />
          <Stop offset="1" stopColor="#fbbf24" />
        </LinearGradient>
      </Defs>
      <Path
        fill="url(#streakFlame)"
        d="M16 1.5 C17.2 6.5 21.5 9 24.5 13.5 C27.5 18 27.5 23.2 24.6 26.8 C22.6 29.4 19.5 30.8 16 30.8 C12.5 30.8 9.4 29.4 7.4 26.8 C4.6 23.2 4.8 18.6 7 15 C7.6 17.6 9 19.2 10.8 19.8 C10 14 12.4 7.4 16 1.5 Z"
      />
      <Path
        fill="#fde68a"
        d="M16 14 C17 17.5 20.6 19.6 20.6 23.6 A4.6 4.6 0 0 1 11.4 23.6 C11.4 21.4 12.4 19.8 13.6 18.6 C13.8 20 14.4 21 15.3 21.4 C14.9 18.8 15.2 16.4 16 14 Z"
      />
    </Svg>
  );
}

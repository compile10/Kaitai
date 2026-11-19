import {
  Image,
  PixelRatio,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useRawCSSTheme } from "@/hooks/use-raw-css-theme";
import { bannerImageUrl, type DeckBanner } from "@/lib/dummy-decks";

/**
 * A deck's banner photo, faded into the row's background. The photo's alpha
 * ramps from almost none on the left, behind the deck name and counts, to
 * nearly full on the right, behind the play button.
 */
export function DeckBannerBackground({
  banner,
  gradientId,
}: {
  banner: DeckBanner;
  /** Unique per row; SVG gradient ids can collide across a list. */
  gradientId: string;
}) {
  const { width } = useWindowDimensions();
  const fadeColor = useRawCSSTheme("secondary");
  const id = `deck-fade-${gradientId.replace(/[^\w-]/g, "-")}`;

  return (
    <>
      <Image
        source={{
          uri: bannerImageUrl(
            banner,
            PixelRatio.getPixelSizeForLayoutSize(width),
          ),
        }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessible={false}
        accessibilityIgnoresInvertColors
      />
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={fadeColor} stopOpacity={1} />
            <Stop offset="0.35" stopColor={fadeColor} stopOpacity={0.9} />
            <Stop offset="1" stopColor={fadeColor} stopOpacity={0.15} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </>
  );
}

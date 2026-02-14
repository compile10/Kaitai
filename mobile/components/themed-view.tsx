import { type ViewProps } from "react-native";
import { SafeAreaView, type Edges } from "react-native-safe-area-context";

/**
 * A View that uses the app's theme for its default background (light/dark).
 * Also uses safe area view to avoid the notch and the status bar.
 * Accepts optional `className` (NativeWind) and `style`; other View props are passed through.
 * Pass `edges` to restrict which edges get safe-area insets (e.g. `['top', 'bottom']`).
 * When omitted, all edges are inset as usual.
 */
export type ThemedViewProps = ViewProps & {
  className?: string;
  edges?: Edges;
};

const defaultBackgroundClass = "bg-background dark:bg-backgroundDark";

export function ThemedView({
  style,
  className,
  edges,
  ...otherProps
}: ThemedViewProps) {
  return (
    <SafeAreaView
      className={[defaultBackgroundClass, className].filter(Boolean).join(" ")}
      style={style}
      edges={edges}
      {...otherProps}
    />
  );
}

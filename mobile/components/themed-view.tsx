import { View, type ViewProps } from "react-native";

/**
 * A View that uses the app's theme for its default background (light/dark).
 * Accepts optional `className` (NativeWind) and `style`; other View props are passed through.
 */
export type ThemedViewProps = ViewProps & {
  className?: string;
};

const defaultBackgroundClass = "bg-background dark:bg-backgroundDark";

export function ThemedView({
  style,
  className,
  ...otherProps
}: ThemedViewProps) {
  return (
    <View
      className={[defaultBackgroundClass, className].filter(Boolean).join(" ")}
      style={style}
      {...otherProps}
    />
  );
}

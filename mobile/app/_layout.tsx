import "../global.css";

import { clientError } from "@common/monitoring";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  Stack,
  ErrorBoundary as RouterErrorBoundary,
  type ErrorBoundaryProps,
} from "expo-router";
import { reportMobileError } from "@/lib/monitoring";
import {
  DarkTheme,
  DefaultTheme,
  type Theme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { vars } from "nativewind";
import { type ReactNode, useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";

import { colors } from "@common/tailwind.config";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemedText } from "@/components/themed-text";
import { useSettingsQuery } from "@/hooks/use-settings-sync";
import { useGeistFonts } from "@/lib/fonts";
import { queryClient } from "@/lib/query-client";

SplashScreen.preventAutoHideAsync();


// Pre-build NativeWind vars() style objects for each color scheme.
// These provide the actual hex values that var(--xxx) references resolve to.
function buildVars(scheme: Record<string, string>) {
  return vars(
    Object.fromEntries(Object.entries(scheme).map(([k, v]) => [`--${k}`, v])),
  );
}
const lightVars = buildVars(colors.light);
const darkVars = buildVars(colors.dark);

function buildNavigationTheme(
  baseTheme: Theme,
  scheme: (typeof colors)["light"],
): Theme {
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: scheme.primary,
      background: scheme.background,
      card: scheme.background,
      text: scheme.foreground,
      border: scheme.border,
      notification: scheme.destructive,
    },
  };
}

const lightNavigationTheme = buildNavigationTheme(DefaultTheme, colors.light);
const darkNavigationTheme = buildNavigationTheme(DarkTheme, colors.dark);

/** Provides CSS variable values for the active color scheme to all descendants. */
function ThemeVars({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  return (
    <View
      style={colorScheme === "dark" ? darkVars : lightVars}
      className="flex-1"
    >
      {children}
    </View>
  );
}

/** Triggers session fetch and syncs server settings to the local store on login/app start. */
function SessionPreloader() {
  useSettingsQuery();
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useGeistFonts();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        value={
          colorScheme === "dark" ? darkNavigationTheme : lightNavigationTheme
        }
      >
        <ThemeVars>
          <SessionPreloader />
          <Stack
            screenOptions={{
              headerTitle: ({ children, tintColor }) => (
                <ThemedText type="defaultSemiBold" style={{ color: tintColor }}>
                  {children}
                </ThemedText>
              ),
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false, title: "Home" }}
            />
            <Stack.Screen name="results" options={{ title: "Analysis" }} />
            <Stack.Screen name="history" options={{ title: "History" }} />
            <Stack.Screen name="settings" options={{ title: "Settings" }} />
            <Stack.Screen name="sign-in" options={{ title: "Sign In" }} />
            <Stack.Screen name="sign-up" options={{ title: "Sign Up" }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeVars>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  useEffect(() => {
    reportMobileError(props.error, clientError.mobile_boundary);
  }, [props.error]);
  return <RouterErrorBoundary {...props} />;
}

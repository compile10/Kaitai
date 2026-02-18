import "../global.css";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { vars } from "nativewind";
import type { ReactNode } from "react";
import { View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { authClient } from "@/lib/auth-client";

const { colors } = require("@common/tailwind.config");

// Pre-build NativeWind vars() style objects for each color scheme.
// These provide the actual hex values that var(--xxx) references resolve to.
function buildVars(scheme: Record<string, string>) {
  return vars(
    Object.fromEntries(
      Object.entries(scheme).map(([k, v]) => [`--${k}`, v]),
    ),
  );
}
const lightVars = buildVars(colors.light);
const darkVars = buildVars(colors.dark);

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

/** Triggers session fetch (SecureStore cache + background revalidation) on app start. */
function SessionPreloader() {
  authClient.useSession();
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <ThemeVars>
        <SessionPreloader />
        <Stack>
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
  );
}

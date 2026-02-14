import "../global.css";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { authClient } from "@/lib/auth-client";

/** Triggers session fetch (SecureStore cache + background revalidation) on app start. */
function SessionPreloader() {
  authClient.useSession();
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SessionPreloader />
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, title: "Home" }}
        />
        <Stack.Screen name="results" options={{ title: "Analysis" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="sign-in" options={{ title: "Sign In" }} />
        <Stack.Screen name="sign-up" options={{ title: "Sign Up" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

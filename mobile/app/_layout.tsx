import '../global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{headerShown: false, title: 'Home'}}/>
        <Stack.Screen name="results" options={{title: 'Results'}}/>
        <Stack.Screen name="settings" options={{title: 'Settings'}}/>
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

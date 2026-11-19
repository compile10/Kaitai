import { Geist_400Regular } from "@expo-google-fonts/geist/400Regular";
import { Geist_700Bold } from "@expo-google-fonts/geist/700Bold";
import { useFonts } from "expo-font";

export const geist = {
  regular: "Geist_400Regular",
  bold: "Geist_700Bold",
} as const;

export function useGeistFonts() {
  return useFonts({
    Geist_400Regular,
    Geist_700Bold,
  });
}

import Constants from "expo-constants";
import { Platform } from "react-native";

const getProdApiUrl = (): string => {
  // The Expo config validates and embeds the EAS environment's API origin.
  const url: unknown = Constants.expoConfig?.extra?.apiUrl;
  if (typeof url !== "string" || !url) {
    throw new Error("EXPO_PUBLIC_API_URL is required for release builds.");
  }
  return url;
};

const DEV_API_PORT = 3000;

const getDevApiUrl = (): string => {
  // In Expo Go / dev client, hostUri is "192.168.x.x:8081" — extract the IP.
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    return `http://${ip}:${DEV_API_PORT}`;
  }

  // Fallbacks for non-Expo-Go environments
  if (Platform.OS === "android") return `http://10.0.2.2:${DEV_API_PORT}`;
  return `http://localhost:${DEV_API_PORT}`;
};

/**
 * The base URL for API requests.
 * Automatically selects the appropriate URL based on environment and platform.
 */
export const API_BASE_URL = __DEV__ ? getDevApiUrl() : getProdApiUrl();

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  analyze: "/api/analyze",
  analyzeImage: "/api/analyze-image",
  history: "/api/history",
} as const;

/**
 * Build a full API URL for the given endpoint
 */
export const buildApiUrl = (endpoint: keyof typeof API_ENDPOINTS): string => {
  return `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
};

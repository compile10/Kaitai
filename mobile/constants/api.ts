import Constants from "expo-constants";
import { Platform } from "react-native";

// Production API URL - update this when you deploy
const PROD_API_URL = "https://test.com";

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
export const API_BASE_URL = __DEV__ ? getDevApiUrl() : PROD_API_URL;

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

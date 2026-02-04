import { Platform } from 'react-native';

/**
 * API Configuration
 * 
 * Handles different environments and platforms for API connectivity:
 * - iOS Simulator: localhost works directly
 * - Android Emulator: requires 10.0.2.2 (Android's alias for host machine)
 * - Physical devices: requires your machine's local IP or a tunnel URL
 * 
 * For physical device testing, either:
 * 1. Replace DEV_API_URL with your machine's local IP (e.g., 'http://192.168.1.x:3000')
 * 2. Use ngrok or similar tunneling service and set the URL here
 */

// Production API URL - update this when you deploy
const PROD_API_URL = 'https://test.com';

// Development API URLs per platform
const getDevApiUrl = (): string => {
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    return 'http://10.0.2.2:3000';
  }
  // iOS simulator and web can use localhost directly
  return 'http://localhost:3000';
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
  analyze: '/api/analyze',
} as const;

/**
 * Build a full API URL for the given endpoint
 */
export const buildApiUrl = (endpoint: keyof typeof API_ENDPOINTS): string => {
  return `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
};

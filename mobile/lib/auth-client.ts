import { expoClient } from "@better-auth/expo/client";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/constants/api";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    adminClient(),
    expoClient({
      scheme: "kaitai",
      storagePrefix: "kaitai",
      storage: SecureStore,
    }),
  ],
});

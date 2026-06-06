import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Client side authentication client for the browser
export const authClient = createAuthClient({
  plugins: [adminClient()],
});

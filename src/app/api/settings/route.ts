import { PROVIDER_MAP } from "@common/providers";
import type { Provider } from "@common/types";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import {
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
  getUserSettings,
  upsertUserSettings,
} from "@/lib/settings";
import { isValidModelId } from "@/lib/validation";

export async function OPTIONS() {
  return corsPreflightResponse();
}

const serverDefaults = { provider: DEFAULT_PROVIDER, model: DEFAULT_MODEL };

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return jsonResponse({ defaults: serverDefaults });
    }

    const settings = await getUserSettings(session.user.id);

    if (settings) {
      return jsonResponse({ ...settings, defaults: serverDefaults });
    }

    const created = await upsertUserSettings(
      session.user.id,
      DEFAULT_PROVIDER,
      DEFAULT_MODEL,
    );
    return jsonResponse({ ...created, defaults: serverDefaults });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return jsonResponse({ error: "Failed to fetch settings" }, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const { provider, model } = await request.json();

    if (
      !provider ||
      typeof provider !== "string" ||
      !(provider in PROVIDER_MAP)
    ) {
      return jsonResponse({ error: "Invalid provider specified" }, 400);
    }

    if (!isValidModelId(model)) {
      return jsonResponse({ error: "Invalid model specified" }, 400);
    }

    const updated = await upsertUserSettings(
      session.user.id,
      provider as Provider,
      model,
    );
    return jsonResponse(updated);
  } catch (error) {
    console.error("Error updating settings:", error);
    return jsonResponse({ error: "Failed to update settings" }, 500);
  }
}

import type { Provider } from "@common/types";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { generateGreeting } from "@/lib/conversation";
import { createConversation, listConversations } from "@/lib/conversations";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { isValidModelId } from "@/lib/validation";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const conversations = await listConversations(session.user.id);
    return jsonResponse(conversations);
  } catch (error) {
    console.error("Error listing conversations:", error);
    return jsonResponse({ error: "Failed to list conversations" }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const { topic, provider, model } = await request.json();

    if (!topic || typeof topic !== "string") {
      return jsonResponse({ error: "Invalid topic" }, 400);
    }
    if (!provider || typeof provider !== "string") {
      return jsonResponse({ error: "Invalid provider" }, 400);
    }
    if (!isValidModelId(model)) {
      return jsonResponse({ error: "Invalid model" }, 400);
    }

    const greeting = await generateGreeting(topic, provider as Provider, model);

    const conversation = await createConversation(
      session.user.id,
      topic,
      provider,
      model,
      {
        role: "assistant",
        content: greeting,
        timestamp: new Date().toISOString(),
      },
    );

    return jsonResponse(conversation, 201);
  } catch (error) {
    console.error("Error creating conversation:", error);
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create conversation",
      },
      500,
    );
  }
}

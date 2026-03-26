import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { generateGreeting } from "@/lib/conversation";
import { createConversation, listConversations } from "@/lib/conversations";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { resolveSettings } from "@/lib/settings";

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

    const { topic } = await request.json();

    if (!topic || typeof topic !== "string" || topic.length > 200) {
      return jsonResponse({ error: "Invalid topic" }, 400);
    }

    const { provider, model } = await resolveSettings(session);

    const greeting = await generateGreeting(topic, provider, model);

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

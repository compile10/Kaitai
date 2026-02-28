import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { deleteConversation, getConversation } from "@/lib/conversations";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const { id } = await params;
    const conversation = await getConversation(id, session.user.id);

    if (!conversation) {
      return jsonResponse({ error: "Conversation not found" }, 404);
    }

    return jsonResponse(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return jsonResponse({ error: "Failed to fetch conversation" }, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const { id } = await params;
    const deleted = await deleteConversation(id, session.user.id);

    if (!deleted) {
      return jsonResponse({ error: "Conversation not found" }, 404);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return jsonResponse({ error: "Failed to delete conversation" }, 500);
  }
}

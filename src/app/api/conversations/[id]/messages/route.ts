import type { ConversationMessage, Provider } from "@common/types";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { conversationReply, scoreConversation } from "@/lib/conversation";
import {
  appendMessages,
  completeConversation,
  getConversation,
} from "@/lib/conversations";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function POST(
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

    if (conversation.isComplete) {
      return jsonResponse({ error: "Conversation is already complete" }, 400);
    }

    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return jsonResponse({ error: "Invalid message" }, 400);
    }

    const userMessage: ConversationMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    const reply = await conversationReply(
      conversation.topic,
      conversation.messages,
      message,
      conversation.provider as Provider,
      conversation.model,
    );

    const assistantMessage: ConversationMessage = {
      role: "assistant",
      content: reply.message,
      timestamp: new Date().toISOString(),
    };


    await appendMessages(id, session.user.id, [userMessage, assistantMessage]);

    if (reply.isConversationComplete) {
      const allMessages = [
        ...conversation.messages,
        userMessage,
        assistantMessage,
      ];

      const score = await scoreConversation(
        conversation.topic,
        allMessages,
        conversation.provider as Provider,
        conversation.model,
      );

      await completeConversation(id, session.user.id, score);

      return jsonResponse({
        message: assistantMessage,
        isComplete: true,
        score,
      });
    }

    return jsonResponse({
      message: assistantMessage,
      isComplete: false,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Failed to send message",
      },
      500,
    );
  }
}

import { ObjectId } from "mongodb";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { historyCollection } from "@/lib/history";

// Handle CORS preflight requests
export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Require authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { id } = await params;

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return jsonResponse({ error: "Invalid history ID" }, 400);
    }

    const doc = await historyCollection.findOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (!doc) {
      return jsonResponse({ error: "History entry not found" }, 404);
    }

    return jsonResponse({ analysis: doc.analysis });
  } catch (error) {
    console.error("Error fetching history entry:", error);
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch history entry",
      },
      500,
    );
  }
}

import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { createInviteCode, serializeInviteCode } from "@/lib/invites";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const { success: canCreateInvite } = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
          invite: ["create"],
        },
      },
    });

    if (!canCreateInvite) {
      return jsonResponse({ error: "Admin access required" }, 403);
    }

    const inviteCode = await createInviteCode(session.user.id);

    return jsonResponse(
      {
        inviteCode: serializeInviteCode(inviteCode),
      },
      201,
    );
  } catch (error) {
    console.error("Error generating invite codes:", error);
    return jsonResponse({ error: "Failed to generate invite codes" }, 500);
  }
}

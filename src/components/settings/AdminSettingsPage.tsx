"use client";

import { createInviteCode } from "@common/api";
import type { InviteCode } from "@common/types";
import { Check, Copy, KeyRound, LoaderCircle, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

function formatExpiration(expiresAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(expiresAt));
}

export default function AdminSettingsPage() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInvite = async () => {
    setIsGenerating(true);
    setError(null);
    setCopiedInviteId(null);

    try {
      const inviteCode = await createInviteCode("/api/admin/invite-codes");
      setInviteCodes((currentCodes) => [inviteCode, ...currentCodes]);
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate an invite code",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyInvite = async (inviteCode: InviteCode) => {
    try {
      await navigator.clipboard.writeText(inviteCode.code);
      setCopiedInviteId(inviteCode.id);
      setError(null);
    } catch {
      setError("Unable to copy the invite code. Please copy it manually.");
    }
  };

  return (
    <div className="min-w-0 flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-card-foreground">Admin</h2>
        <p className="mt-2 text-sm text-card-foreground/70">
          Manage administrative access and account invitations.
        </p>
      </div>

      <section
        className="overflow-hidden rounded-lg border border-card-foreground/20"
        aria-labelledby="invite-codes-heading"
      >
        <div className="flex flex-col gap-4 bg-card-foreground/5 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3
                id="invite-codes-heading"
                className="font-semibold text-card-foreground"
              >
                Invite codes
              </h3>
              <p className="mt-1 max-w-lg text-sm text-card-foreground/70">
                Generate temporary invite codes. Each code expires automatically
                after 24 hours.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGenerateInvite}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Plus aria-hidden="true" />
            )}
            {isGenerating ? "Generating..." : "Generate code"}
          </Button>
        </div>

        {error && (
          <div
            className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="border-t border-card-foreground/20 p-5">
          {inviteCodes.length === 0 ? (
            <div className="py-8 text-center">
              <KeyRound
                className="mx-auto h-8 w-8 text-card-foreground/30"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-medium text-card-foreground">
                No codes generated in this session
              </p>
              <p className="mt-1 text-sm text-card-foreground/60">
                Generate a code to display and copy it here.
              </p>
            </div>
          ) : (
            <div className="space-y-3" aria-live="polite">
              {inviteCodes.map((inviteCode) => {
                const isCopied = copiedInviteId === inviteCode.id;

                return (
                  <div
                    key={inviteCode.id}
                    className="rounded-lg border border-card-foreground/20 bg-card p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <code className="min-w-0 flex-1 break-all rounded-md bg-card-foreground/5 px-3 py-2 font-mono text-sm font-semibold text-card-foreground">
                        {inviteCode.code}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleCopyInvite(inviteCode)}
                        aria-label={`Copy invite code ${inviteCode.code}`}
                      >
                        {isCopied ? (
                          <Check aria-hidden="true" />
                        ) : (
                          <Copy aria-hidden="true" />
                        )}
                        {isCopied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-card-foreground/60">
                      Expires {formatExpiration(inviteCode.expiresAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

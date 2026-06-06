"use client";

export default function AdminSettingsPage() {
  return (
    <div className="min-w-0 flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-card-foreground">Admin</h2>
        <p className="mt-2 text-sm text-card-foreground/70">
          Admin-only settings will go here.
        </p>
      </div>

      <div className="rounded-lg border border-card-foreground/20 bg-card-foreground/5 p-4 text-sm text-card-foreground/70">
        Placeholder admin setting content.
      </div>
    </div>
  );
}

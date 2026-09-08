"use client";

import { Switch } from "radix-ui";
import {
  useSettingsMutation,
  useSettingsQuery,
} from "@/hooks/use-settings-query";

export default function GeneralSettingsPage() {
  const query = useSettingsQuery();
  const mutation = useSettingsMutation();

  return (
    <div className="min-w-0 flex-1 p-6">
      <h2 className="text-xl font-semibold text-card-foreground">General</h2>
      <div className="mt-6 flex items-center justify-between gap-6">
        <span>
          <label
            htmlFor="show-word-translations"
            className="font-medium text-card-foreground cursor-pointer"
          >
            Show word translations
          </label>
          <span
            id="word-translations-description"
            className="mt-1 block text-sm text-card-foreground/70"
          >
            Show English meanings in sentence graph cells. When off, click a
            blurred translation to reveal it.
          </span>
        </span>
        <Switch.Root
          id="show-word-translations"
          aria-describedby="word-translations-description"
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border bg-muted transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50"
          checked={
            mutation.isPending
              ? mutation.variables.showWordTranslations
              : (query.data?.showWordTranslations ?? false)
          }
          disabled={!query.data || mutation.isPending}
          onCheckedChange={(showWordTranslations) =>
            mutation.mutate({ showWordTranslations })
          }
        >
          <Switch.Thumb className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5" />
        </Switch.Root>
      </div>
      {(mutation.error || query.error) && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {mutation.error?.message || query.error?.message}
        </p>
      )}
    </div>
  );
}

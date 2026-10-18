"use client";

import { ExternalLink, Smartphone } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const APPS_EMAIL = "apps@efrain.io";

const SCREENSHOTS = [
  { src: "/mobile/iphone-home.png", alt: "Kaitai iOS app home screen" },
  {
    src: "/mobile/iphone-analysis.png",
    alt: "Kaitai iOS app analyzing 彼女は新しい本を読んでいる。",
  },
];

export default function MobileAppsDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="fixed bottom-4 right-4 z-20 hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          App available on iOS and Android
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-0 sm:max-w-lg bg-card text-card-foreground border-border"
      >
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-primary-foreground" />
            <DialogTitle className="text-xl font-semibold text-primary-foreground">
              Mobile apps
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-primary-foreground hover:bg-white/20 transition-colors text-2xl font-bold leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex justify-center gap-4">
            {SCREENSHOTS.map(({ src, alt }) => (
              <Image
                key={src}
                src={src}
                alt={alt}
                width={603}
                height={1311}
                className="h-auto w-[42%] max-w-40 rounded-[1.5rem] border-4 border-card-foreground/15 shadow-lg"
              />
            ))}
          </div>
          <DialogDescription className="text-base text-card-foreground/70">
            The Kaitai iOS and Android apps are both in beta. To gain access,
            email the developer at{" "}
            <a
              href={`mailto:${APPS_EMAIL}`}
              className="text-primary hover:underline font-medium"
            >
              {APPS_EMAIL}
            </a>
            .
          </DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Smartphone } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export type MobilePlatform = "ios" | "android" | "desktop";

const APPS_EMAIL = "apps@efrain.io";

const IPHONE_SCREENSHOTS = [
  {
    src: "/mobile/iphone-home.png",
    alt: "Kaitai iOS app home screen",
    width: 603,
    height: 1311,
  },
  {
    src: "/mobile/iphone-analysis.png",
    alt: "Kaitai iOS app analyzing 彼女は新しい本を読んでいる。",
    width: 603,
    height: 1311,
  },
];

const ANDROID_SCREENSHOTS = [
  {
    src: "/mobile/android-home.png",
    alt: "Kaitai Android app home screen",
    width: 540,
    height: 960,
  },
  {
    src: "/mobile/android-analysis.png",
    alt: "Kaitai Android app analyzing 私は美しい花を見ました。",
    width: 540,
    height: 960,
  },
];

interface MobileAppsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: MobilePlatform;
}

export default function MobileAppsDialog({
  open,
  onOpenChange,
  platform,
}: MobileAppsDialogProps) {
  const screenshots =
    platform === "android" ? ANDROID_SCREENSHOTS : IPHONE_SCREENSHOTS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-primary-foreground hover:bg-white/20 transition-colors text-2xl font-bold leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex justify-center gap-4">
            {screenshots.map(({ src, alt, width, height }) => (
              <Image
                key={src}
                src={src}
                alt={alt}
                width={width}
                height={height}
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

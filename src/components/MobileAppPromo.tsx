"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AndroidIcon, AppleIcon } from "@/components/BrandIcons";
import MobileAppsDialog, {
  type MobilePlatform,
} from "@/components/MobileAppsDialog";

const BANNER_DISMISSED_KEY = "kaitai-app-banner-dismissed";
const BANNER_DELAY_MS = 2000;

function detectPlatform(): MobilePlatform {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  // iPadOS Safari reports a Mac user agent; touch support tells them apart.
  if (
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }
  return "desktop";
}

function readBannerDismissed() {
  try {
    return localStorage.getItem(BANNER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Mobile app promotion: a dismissible banner on iOS/Android devices and a
 * corner link elsewhere. Both open the beta access dialog. Renders nothing on
 * the server so the platform-specific UI never flashes.
 */
export default function MobileAppPromo() {
  // Two-pass render: match the server's empty HTML during hydration, then read
  // browser-only values. The banner slides in after a short delay unless it
  // was dismissed before.
  const [platform, setPlatform] = useState<MobilePlatform | null>(null);
  const [bannerShown, setBannerShown] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const detected = detectPlatform();
    setPlatform(detected);
    if (detected === "desktop" || readBannerDismissed()) return;
    const timer = setTimeout(() => setBannerShown(true), BANNER_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!platform) return null;

  const dismissBanner = () => {
    setBannerShown(false);
    try {
      localStorage.setItem(BANNER_DISMISSED_KEY, "1");
    } catch {
      // Storage unavailable (e.g. private mode); dismissal lasts this visit.
    }
  };

  const OsIcon = platform === "android" ? AndroidIcon : AppleIcon;
  const osName = platform === "android" ? "Android" : "iOS";

  return (
    <>
      {platform === "desktop" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-20 hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          App available on iOS and Android
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </button>
      ) : (
        // Only the wrapper's height animates, and the banner is pinned to its
        // bottom edge, so the banner slides down in lockstep with the page it
        // pushes. 57px is the 56px row (header height) plus its 1px border.
        <div
          inert={!bannerShown}
          className={`relative z-20 flex flex-col justify-end overflow-hidden transition-[height] duration-500 ease-out motion-reduce:transition-none ${bannerShown ? "h-[57px]" : "h-0"}`}
        >
          <div className="shrink-0 border-b border-border bg-card text-card-foreground">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
              >
                <OsIcon className="w-4 h-4" />
                App available for {osName}
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={dismissBanner}
                className="w-8 h-8 -mr-2 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Dismiss app banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileAppsDialog
        open={open}
        onOpenChange={setOpen}
        platform={platform}
      />
    </>
  );
}

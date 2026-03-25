"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import SettingsModal from "@/components/SettingsModal";

export default function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Settings"
        title="Settings"
      >
        <SettingsIcon className="w-5 h-5" />
      </button>
      {mounted &&
        createPortal(
          <SettingsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />,
          document.body,
        )}
    </>
  );
}

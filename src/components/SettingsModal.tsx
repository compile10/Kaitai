"use client";

import { Bot, type LucideIcon, Settings } from "lucide-react";
import { type ReactNode, useState } from "react";
import ModelsSettingsPage from "@/components/settings/ModelsSettingsPage";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsSection = "models";

const SETTINGS_SECTIONS: Array<{
  id: SettingsSection;
  label: string;
  icon: LucideIcon;
}> = [
  {
    id: "models",
    label: "Models",
    icon: Bot,
  },
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("models");
  const sectionContent: Record<SettingsSection, ReactNode> = {
    models: <ModelsSettingsPage isOpen={isOpen} onClose={onClose} />,
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden p-0 gap-0 rounded-none sm:max-w-4xl bg-card text-card-foreground border-border max-h-[90vh] flex flex-col"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>

        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary-foreground" />
            <div className="text-xl font-semibold text-primary-foreground">
              Settings
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-primary-foreground hover:bg-white/20 transition-colors text-2xl font-bold leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          {/* Settings navigation */}
          <aside className="shrink-0 border-b border-card-foreground/20 bg-card-foreground/5 sm:w-56 sm:border-b-0 sm:border-r">
            <nav
              className="flex gap-2 overflow-x-auto p-3 sm:flex-col sm:overflow-visible"
              aria-label="Settings sections"
            >
              {SETTINGS_SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                const SectionIcon = section.icon;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-w-40 items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors sm:min-w-0 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-card-foreground hover:bg-card-foreground/10"
                    }`}
                  >
                    <SectionIcon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        isActive
                          ? "text-primary-foreground"
                          : "text-card-foreground/70"
                      }`}
                    />
                    <span className="text-sm font-semibold">
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col">
            {sectionContent[activeSection]}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

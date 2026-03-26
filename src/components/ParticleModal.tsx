"use client";

import { useEffect } from "react";

interface ParticleModalProps {
  particle: string | null;
  description: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ParticleModal({
  particle,
  description,
  isOpen,
  onClose,
}: ParticleModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !particle || !description) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-orange-500 dark:bg-orange-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold text-white">{particle}</div>
            <div className="text-sm text-orange-100 font-medium">Particle</div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-orange-100 transition-colors text-2xl font-bold leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Function in this sentence
          </h3>
          <div
            className="prose leading-relaxed text-base"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>

        {/* Footer */}
        <div className="bg-muted px-6 py-3 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

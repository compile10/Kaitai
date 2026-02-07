"use client";

import { PROVIDERS } from "@common/providers";
import type { Provider } from "@common/types";
import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings-store";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { provider, model, setProvider, setModel, isHydrated } =
    useSettingsStore();

  // Local draft state - initialized when modal opens
  const [draftProvider, setDraftProvider] = useState<Provider>(provider);
  const [draftModel, setDraftModel] = useState(model);
  const [useCustomModel, setUseCustomModel] = useState(false);

  // Initialize draft state when modal opens
  useEffect(() => {
    if (isOpen && isHydrated) {
      setDraftProvider(provider);
      setDraftModel(model);

      // Check if current model is custom (not in preset list)
      const providerConfig = PROVIDERS.find((p) => p.id === provider);
      const isPreset = providerConfig?.models.some((m) => m.id === model);
      setUseCustomModel(!isPreset);
    }
  }, [isOpen, isHydrated, provider, model]);

  // Handle keyboard and scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleProviderChange = (newProvider: Provider) => {
    setDraftProvider(newProvider);
    if (!useCustomModel) {
      const config = PROVIDERS.find((p) => p.id === newProvider);
      setDraftModel(config?.defaultModel || "");
    }
  };

  const handleSave = () => {
    setProvider(draftProvider);
    setModel(draftModel);
    onClose();
  };

  if (!isOpen) return null;

  const providerConfig = PROVIDERS.find((p) => p.id === draftProvider);
  const models = providerConfig?.models || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-white" />
            <div className="text-xl font-semibold text-white">Settings</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors text-2xl font-bold leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {!isHydrated ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                <p className="text-gray-600 dark:text-gray-400">
                  Loading settings...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Provider Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  AI Provider
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Choose which AI provider to use for sentence analysis.
                </p>
                <select
                  value={draftProvider}
                  onChange={(e) =>
                    handleProviderChange(e.target.value as Provider)
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-blue-600 focus:outline-none transition-colors"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Model Toggle */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomModel}
                    onChange={(e) => {
                      setUseCustomModel(e.target.checked);
                      if (!e.target.checked) {
                        // Keep current model if it's in presets, otherwise reset to default
                        const isInPresets = models.some(
                          (m) => m.id === draftModel,
                        );
                        if (!isInPresets) {
                          setDraftModel(providerConfig?.defaultModel || "");
                        }
                      }
                    }}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <div>
                    <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Use Custom Model
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enter a specific model name instead of choosing from
                      presets
                    </p>
                  </div>
                </label>
              </div>

              {/* Custom Model Input or Model Selection */}
              {useCustomModel ? (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Custom Model Name
                  </label>
                  <input
                    type="text"
                    value={draftModel}
                    onChange={(e) => setDraftModel(e.target.value)}
                    placeholder="e.g., claude-opus-4-5-20251101"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Select Model
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Choose which model to use. Your preference will be saved
                    locally.
                  </p>

                  <div className="space-y-3">
                    {models.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          draftModel === m.id
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="model"
                          value={m.id}
                          checked={draftModel === m.id}
                          onChange={(e) => setDraftModel(e.target.value)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {m.name}
                            </span>
                            {m.speed && (
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                {m.speed}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {m.description}
                          </p>
                          {m.pricing && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              Pricing: {m.pricing}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

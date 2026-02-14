"use client";

import { ALLOWED_MIME_TYPES, MAX_IMAGE_SIZE } from "@common/image";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDragDrop } from "@/hooks/use-drag-drop";

const ACCEPT_STRING = Array.from(ALLOWED_MIME_TYPES).join(",");

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File) => void;
  isLoading: boolean;
}

export default function ImageUploadModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: ImageUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = useCallback((candidate: File) => {
    setError(null);

    if (!ALLOWED_MIME_TYPES.has(candidate.type)) {
      setError(
        `Unsupported image type: ${candidate.type || "unknown"}. Supported: PNG, JPEG, GIF, WebP.`,
      );
      return;
    }

    if (candidate.size > MAX_IMAGE_SIZE) {
      setError(
        `Image is too large (${formatFileSize(candidate.size)}). Maximum size is 20 MB.`,
      );
      return;
    }

    setFile(candidate);

    // Generate preview URL
    const url = URL.createObjectURL(candidate);
    setPreview(url);
  }, []);

  const { isDragOver, onDragOver, onDragLeave, onDrop } = useDragDrop(
    validateAndSetFile,
    { resetWhen: isOpen },
  );

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setPreview(null);
      setError(null);
    }
  }, [isOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isLoading) {
        onClose();
      }
    },
    [isLoading, onClose],
  );

  // Handle paste events while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.kind === "file" && ALLOWED_MIME_TYPES.has(item.type)) {
          const pastedFile = item.getAsFile();
          if (pastedFile) {
            e.preventDefault();
            validateAndSetFile(pastedFile);
            return;
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [isOpen, validateAndSetFile]);

  // Clean up object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  const handleSubmit = () => {
    if (file && !isLoading) {
      onSubmit(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-0 shadow-2xl bg-white dark:bg-gray-800"
      >
        <DialogHeader className="bg-tint dark:bg-tintDark px-6 py-4 flex flex-row items-center justify-between space-y-0 rounded-t-lg">
          <div className="flex items-center gap-3">
            <ImagePlus className="w-6 h-6 text-white" />
            <DialogTitle className="text-xl font-semibold text-white">
              Analyze Image
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors text-2xl font-bold leading-none disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            ×
          </button>
        </DialogHeader>

        <div className="p-6 overflow-y-auto flex-1">
          <DialogDescription className="text-gray-600 dark:text-gray-400 mb-4">
            Upload an image containing Japanese text. The text will be extracted
            and analyzed automatically.
          </DialogDescription>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {file ? (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 p-3">
                {preview && (
                  // biome-ignore lint/performance/noImgElement: blob URL preview cannot use next/image optimization
                  <img
                    src={preview}
                    alt="Selected file preview"
                    className="w-full max-h-64 object-contain"
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isLoading}
                  className="ml-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed rounded-lg cursor-pointer transition-all w-full ${
                isDragOver
                  ? "border-blue-500 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <Upload
                className={`w-10 h-10 ${isDragOver ? "text-blue-500" : "text-gray-400 dark:text-gray-500"}`}
              />
              <div className="text-center">
                <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                  {isDragOver
                    ? "Drop your image here"
                    : "Drop an image here, or click to browse"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  You can also paste an image from your clipboard
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  PNG, JPEG, GIF, WebP — up to 20 MB
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_STRING}
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Select image file"
              />
            </button>
          )}
        </div>

        <DialogFooter className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-lg">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-600"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!file || isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Analyzing...
              </>
            ) : (
              "Analyze Image"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

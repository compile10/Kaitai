import type { DragEvent } from "react";
import { useCallback, useEffect, useState } from "react";

interface UseDragDropOptions {
  /** When false, isDragOver is reset to false (e.g. when a parent modal closes) */
  resetWhen?: boolean;
}

export function useDragDrop(
  onFileDrop: (file: File) => void,
  options?: UseDragDropOptions,
) {
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (options?.resetWhen === false) {
      setIsDragOver(false);
    }
  }, [options?.resetWhen]);

  const onDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        onFileDrop(file);
      }
    },
    [onFileDrop],
  );

  return { isDragOver, onDragOver, onDragLeave, onDrop };
}

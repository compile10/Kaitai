"use client";

import { formatRelativeTime } from "@common/format";
import type { HistoryEntry, PaginatedHistory } from "@common/types";
import { Clock as ClockIcon, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 20;

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const router = useRouter();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingMoreRef = useRef(false);

  const fetchHistory = useCallback(
    async (pageNum: number, replace: boolean) => {
      try {
        const res = await fetch(
          `/api/history?page=${pageNum}&limit=${PAGE_SIZE}`,
        );
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to fetch history");
        }

        const data: PaginatedHistory = json;

        setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
        setPage(data.page);
        setTotalPages(data.totalPages);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    },
    [],
  );

  // Fetch page 1 when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setItems([]);
    setPage(1);
    setTotalPages(1);
    setError(null);
    fetchHistory(1, true).finally(() => setIsLoading(false));
  }, [isOpen, fetchHistory]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMoreRef.current || page >= totalPages) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    await fetchHistory(page + 1, false);
    setIsLoadingMore(false);
    loadingMoreRef.current = false;
  }, [page, totalPages, fetchHistory]);

  const handleSelect = (entry: HistoryEntry) => {
    onClose();
    sessionStorage.setItem("kaitai-internal-nav", "1");
    router.push(`/analyze/${encodeURIComponent(entry.sentence)}`);
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
        className="overflow-hidden p-0 sm:max-w-lg bg-card text-card-foreground border-border h-[80vh] flex flex-col"
      >
        <DialogTitle className="sr-only">History</DialogTitle>

        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-primary-foreground" />
            <div className="text-xl font-semibold text-primary-foreground">
              History
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-primary-foreground hover:bg-white/20 transition-colors text-2xl font-bold leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                <p className="text-card-foreground/70">Loading history...</p>
              </div>
            </div>
          ) : error && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 gap-3">
              <p className="text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  fetchHistory(1, true).finally(() => setIsLoading(false));
                }}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 gap-3">
              <ClockIcon className="w-12 h-12 text-muted-foreground" />
              <p className="text-lg font-semibold text-card-foreground">
                No History Yet
              </p>
              <p className="text-sm text-card-foreground/70 text-center">
                Sentences you analyze will appear here.
              </p>
            </div>
          ) : (
            <Virtuoso
              style={{ height: "100%" }}
              data={items}
              endReached={handleLoadMore}
              increaseViewportBy={200}
              itemContent={(_index, item) => (
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-6 py-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className="flex-1 text-sm text-card-foreground line-clamp-2"
                      lang="ja"
                    >
                      {item.sentence}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                </button>
              )}
              components={{
                Footer: () =>
                  isLoadingMore ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                    </div>
                  ) : null,
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

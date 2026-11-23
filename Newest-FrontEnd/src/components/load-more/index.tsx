"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

interface LoadMoreProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

/**
 * Fim de uma lista paginada. Carrega a próxima página sozinho quando aparece
 * na tela (rolagem infinita); o botão fica como alternativa.
 */
export function LoadMore({ hasNextPage, isFetchingNextPage, onLoadMore }: LoadMoreProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onLoadMore();
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (!hasNextPage) return null;

  return (
    <div ref={ref} className="flex justify-center py-6">
      {isFetchingNextPage ? (
        <Loader2 aria-label="Carregando mais" className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <button
          onClick={() => onLoadMore()}
          className="text-sm text-muted-foreground hover:text-white transition-colors cursor-pointer"
        >
          Carregar mais
        </button>
      )}
    </div>
  );
}

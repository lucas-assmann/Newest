import type { InfiniteData } from "@tanstack/react-query";
import type { Page } from "@/types/Page.types";

/** Opções comuns do `useInfiniteQuery` para as listas da API. */
export const cursorPagination = {
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (last: Page<unknown>) => last.nextCursor ?? undefined,
};

/** Junta as páginas carregadas numa lista só. */
export function pageItems<T>(data: InfiniteData<Page<T>> | undefined): T[] {
  return data?.pages.flatMap((page) => page.items) ?? [];
}

/** Monta `?cursor=` só quando existe (a primeira página vai sem). */
export function cursorParams(cursor?: string) {
  return cursor ? { params: { cursor } } : undefined;
}

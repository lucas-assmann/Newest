import { useInfiniteQuery } from "@tanstack/react-query";
import { cursorPagination } from "@/lib/pagination";
import { queryKeys } from "@/lib/query-keys";
import { getMyPosts, getPosts, getUserPosts } from "@/services/post.service";

/** Feed paginado: cada página traz 20 posts; `fetchNextPage` busca os próximos. */
export function usePosts() {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.feed,
    queryFn: ({ pageParam }) => getPosts(pageParam),
    ...cursorPagination,
  });
}

export function useMyPosts() {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.mine,
    queryFn: ({ pageParam }) => getMyPosts(pageParam),
    ...cursorPagination,
  });
}

export function useUserPosts(userId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.byUser(userId),
    queryFn: ({ pageParam }) => getUserPosts(userId, pageParam),
    enabled: !!userId,
    ...cursorPagination,
  });
}

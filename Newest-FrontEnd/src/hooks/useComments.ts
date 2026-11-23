import { useInfiniteQuery } from "@tanstack/react-query";
import { cursorPagination } from "@/lib/pagination";
import { queryKeys } from "@/lib/query-keys";
import { getCommentsByPostId } from "@/services/comment.service";

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.comments(postId),
    queryFn: ({ pageParam }) => getCommentsByPostId(postId, pageParam),
    ...cursorPagination,
  });
}

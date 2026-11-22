import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getPosts } from "@/services/post.service";

export function usePosts() {
  return useQuery({
    queryKey: queryKeys.posts.feed,
    queryFn: getPosts,
  });
}

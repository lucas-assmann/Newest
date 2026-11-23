import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { toggleLike } from "@/services/post.service";
import type { Page } from "@/types/Page.types";
import { PostDTO } from "@/types/Post.types";

/** No cache, um post aparece sozinho (detalhe) ou dentro das páginas de uma lista. */
type PostCache = PostDTO | InfiniteData<Page<PostDTO>> | undefined;

function isPaged(data: NonNullable<PostCache>): data is InfiniteData<Page<PostDTO>> {
  return "pages" in data;
}

/** Aplica uma mudança no post `postId` onde quer que ele esteja no cache. */
function updatePost(data: PostCache, postId: string, change: (p: PostDTO) => PostDTO): PostCache {
  if (!data) return data;
  if (isPaged(data)) {
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((p) => (p.id === postId ? change(p) : p)),
      })),
    };
  }
  return data.id === postId ? change(data) : data;
}

/**
 * Curtir/descurtir com atualização otimista: o coração muda na hora em todas
 * as listas (feed, perfil, usuário) e no detalhe; se a API falhar, volta.
 * Antes cada <Post> guardava uma cópia local e o `key` forçava remontar.
 */
export function useLikePost(postId: string) {
  const queryClient = useQueryClient();
  const filter = { queryKey: queryKeys.posts.all };

  return useMutation({
    mutationFn: () => toggleLike(postId),
    onMutate: async () => {
      await queryClient.cancelQueries(filter);
      const snapshot = queryClient.getQueriesData<PostCache>(filter);
      queryClient.setQueriesData<PostCache>(filter, (data) =>
        updatePost(data, postId, (p) => ({
          ...p,
          isLiked: !p.isLiked,
          likes: p.likes + (p.isLiked ? -1 : 1),
        })),
      );
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSuccess: ({ isLiked, likesCount }) => {
      queryClient.setQueriesData<PostCache>(filter, (data) =>
        updatePost(data, postId, (p) => ({ ...p, isLiked, likes: likesCount })),
      );
    },
  });
}

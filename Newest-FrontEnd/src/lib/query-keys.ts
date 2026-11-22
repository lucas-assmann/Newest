/**
 * Todas as chaves do React Query num lugar só.
 * Tudo que é lista ou detalhe de post começa com ["posts"], então
 * invalidar `queryKeys.posts.all` atualiza feed, perfil, usuário e detalhe.
 */
export const queryKeys = {
  me: ["me"] as const,
  user: (id: string) => ["user", id] as const,
  posts: {
    all: ["posts"] as const,
    feed: ["posts", "feed"] as const,
    mine: ["posts", "mine"] as const,
    byUser: (userId: string) => ["posts", "user", userId] as const,
    detail: (postId: string) => ["posts", "detail", postId] as const,
  },
  comments: (postId: string) => ["comments", postId] as const,
  notifications: {
    all: ["notifications"] as const,
    list: ["notifications", "list"] as const,
    unread: ["notifications", "unread"] as const,
  },
  searchUsers: (query: string) => ["search-users", query] as const,
};

import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { act, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/services/api";
import { fakeApi, renderHookWithQuery, createTestQueryClient } from "@/test-utils/render";
import type { Page } from "@/types/Page.types";
import { PostDTO } from "@/types/Post.types";
import { useLikePost } from "./useLikePost";

const post = (over: Partial<PostDTO> = {}): PostDTO => ({
  id: "p1",
  title: "t",
  content: "c",
  images: [],
  createdAt: "2026-11-22T00:00:00Z",
  isLiked: false,
  likes: 2,
  comments: 0,
  author: { id: "a", name: "ana", avatar: null },
  ...over,
});

type Paged = InfiniteData<Page<PostDTO>>;

/** Lista paginada como o useInfiniteQuery guarda no cache. */
const paged = (...pages: PostDTO[][]): Paged => ({
  pages: pages.map((items, i) => ({ items, nextCursor: i < pages.length - 1 ? "c" : null })),
  pageParams: pages.map((_, i) => (i === 0 ? undefined : "c")),
});

const items = (client: QueryClient, key: readonly unknown[]) =>
  client.getQueryData<Paged>(key)!.pages.flatMap((p) => p.items);

function seed() {
  const client = createTestQueryClient();
  // p1 na 1ª página do feed; p2 e p3 são outros posts (p3 numa 2ª página)
  client.setQueryData(queryKeys.posts.feed, paged([post(), post({ id: "p2" })], [post({ id: "p3" })]));
  client.setQueryData(queryKeys.posts.byUser("a"), paged([post()]));
  client.setQueryData(queryKeys.posts.detail("p1"), post());
  return client;
}

describe("useLikePost", () => {
  it("atualiza na hora o post em todas as listas e no detalhe (sem esperar a API)", async () => {
    // API que nunca responde: o que mudar no cache é a atualização otimista.
    api.defaults.adapter = () => new Promise(() => {});
    const client = seed();
    const { result } = renderHookWithQuery(() => useLikePost("p1"), client);

    act(() => result.current.mutate());

    await waitFor(() =>
      expect(client.getQueryData<PostDTO>(queryKeys.posts.detail("p1"))).toMatchObject({
        isLiked: true,
        likes: 3,
      }),
    );
    const feed = items(client, queryKeys.posts.feed);
    expect(feed[0]).toMatchObject({ isLiked: true, likes: 3 });
    expect(items(client, queryKeys.posts.byUser("a"))[0].isLiked).toBe(true);
    // outros posts (inclusive de outra página) não mudam
    expect(feed[1].isLiked).toBe(false);
    expect(feed[2].isLiked).toBe(false);
    // as páginas continuam no mesmo formato
    expect(client.getQueryData<Paged>(queryKeys.posts.feed)!.pages).toHaveLength(2);
  });

  it("usa o número que a API devolveu", async () => {
    fakeApi(() => ({ data: { isLiked: true, likesCount: 10 } }));
    const client = seed();
    const { result } = renderHookWithQuery(() => useLikePost("p1"), client);

    await act(() => result.current.mutateAsync());

    expect(client.getQueryData<PostDTO>(queryKeys.posts.detail("p1"))!.likes).toBe(10);
    expect(items(client, queryKeys.posts.feed)[0].likes).toBe(10);
  });

  it("se a API falhar, desfaz o like em todo lugar", async () => {
    fakeApi(() => ({ status: 500 }));
    const client = seed();
    const { result } = renderHookWithQuery(() => useLikePost("p1"), client);

    await act(async () => {
      await result.current.mutateAsync().catch(() => {});
    });

    expect(client.getQueryData<PostDTO>(queryKeys.posts.detail("p1"))).toMatchObject({
      isLiked: false,
      likes: 2,
    });
    expect(items(client, queryKeys.posts.feed)[0].likes).toBe(2);
  });
});

"use client"

import { CirclePlus, Loader2 } from "lucide-react";
import { useState } from "react";
import ArticlePost from "@/components/article-post";
import { LoadMore } from "@/components/load-more";
import { NewPostDialog } from "@/components/new-post-dialog";
import Post from "@/components/post";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePosts } from "@/hooks/usePost";
import { pageItems } from "@/lib/pagination";

export default function HomeClient() {
  const [openNewPost, setOpenNewPost] = useState(false);
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = usePosts();
  const posts = pageItems(data);

  return (
    <>
      <NewPostDialog open={openNewPost} onClose={() => setOpenNewPost(false)} />

      <ArticlePost>
        <div className="bg-neutral-800/50 border border-neutral-700/50 shadow-lg px-4 py-3 flex justify-between items-center rounded-b-2xl mb-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden p-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/50 rounded-lg transition-colors cursor-pointer" />
            <h1 className="text-2xl font-semibold">Página inicial</h1>
          </div>
          <button aria-label="Novo post" onClick={() => setOpenNewPost(true)}>
            <CirclePlus className="cursor-pointer hover:scale-110 transition-all" />
          </button>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando seus posts...</p>
          </div>
        )}

        {posts.map((post) => <Post key={post.id} post={post} />)}

        <LoadMore
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      </ArticlePost>
    </>
  );
}

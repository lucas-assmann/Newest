"use client"

import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { LoadMore } from "@/components/load-more";
import { NewPostDialog } from "@/components/new-post-dialog";
import Post from "@/components/post";
import ProfileCard from "@/components/profile-card";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMyPosts } from "@/hooks/usePost";
import { pageItems } from "@/lib/pagination";

export default function ProfileClient() {
  const [openNewPost, setOpenNewPost] = useState(false);

  const { data: me } = useCurrentUser();
  const { data, isLoading, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useMyPosts();
  const posts = data ? pageItems(data) : undefined;

  return (
    <>
      <NewPostDialog open={openNewPost} onClose={() => setOpenNewPost(false)} />

      <div className="bg-neutral-900 min-h-dvh overflow-y-auto custom-scrollbar space-y-6">
        <div className="z-10 bg-card/95 backdrop-blur-md border-b border-border rounded-b-2xl">
          <ProfileCard />
        </div>

        <div className="pt-4 space-y-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando seus posts...</p>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Erro ao carregar posts</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {error?.message || "Ocorreu um erro inesperado. Tente novamente."}
                </p>
              </div>
            </div>
          )}

          {posts?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Nenhum post ainda</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Compartilhe seus pensamentos criando seu primeiro post!
                </p>
              </div>
              <button
                className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all cursor-pointer"
                onClick={() => setOpenNewPost(true)}
              >
                Criar primeiro post
              </button>
            </div>
          )}

          {posts && posts.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Seus posts{me ? ` (${me.totalPosts})` : ""}
                </h2>
              </div>
              <div className="space-y-4">
                {posts.map((post) => <Post key={post.id} post={post} />)}
              </div>
              <LoadMore
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onLoadMore={fetchNextPage}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

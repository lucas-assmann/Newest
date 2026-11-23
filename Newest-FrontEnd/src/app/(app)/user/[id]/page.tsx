"use client"

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { LoadMore } from "@/components/load-more";
import Post from "@/components/post";
import UserProfileCard from "@/components/user-profile-card";
import { useUserPosts } from "@/hooks/usePost";
import { pageItems } from "@/lib/pagination";
import { queryKeys } from "@/lib/query-keys";
import { getUserById } from "@/services/user.service";

export default function UserPage() {
  const { id: userId } = useParams<{ id: string }>();

  const { data: user, isLoading: isLoadingUser, isError: isErrorUser } = useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });

  const {
    data,
    isLoading: isLoadingPosts,
    isError: isErrorPosts,
    error: errorPosts,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useUserPosts(userId);
  const posts = data ? pageItems(data) : undefined;

  const isLoading = isLoadingUser || isLoadingPosts;
  const isError = isErrorUser || isErrorPosts;

  return (
    <div className="bg-neutral-900 min-h-dvh overflow-y-auto custom-scrollbar space-y-6">
      <div className="z-10 bg-card/95 backdrop-blur-md border-b border-border rounded-b-2xl">
        <UserProfileCard user={user} isLoading={isLoadingUser} />
      </div>

      <div className="pt-4 space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando posts...</p>
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
                {errorPosts?.message || "Ocorreu um erro inesperado. Tente novamente."}
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && posts?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Nenhum post ainda</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Este usuário ainda não criou nenhum post.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && posts && posts.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold ml-4">
                Posts{user ? ` (${user.totalPosts})` : ""}
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
  );
}

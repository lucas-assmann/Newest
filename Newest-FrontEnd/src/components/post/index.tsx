'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Heart, MessageCircle, MoreVertical, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from 'react';
import { DialogNoCloseButton } from "@/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLikePost } from "@/hooks/useLikePost";
import { getAvatarUrl } from "@/lib/avatar";
import { formatCount, formatDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { renderContentWithMentions } from "@/lib/render-mentions";
import { cn } from "@/lib/utils";
import { deletePost } from '@/services/post.service';
import { PostDTO } from "@/types/Post.types";

interface PostProps {
  post: PostDTO;
  /** Clicar no card abre o post (desligado na própria página do post). */
  clickable?: boolean;
  /** Data por extenso em vez de "Há 2 horas". */
  fullDate?: boolean;
}

const TRENDING_LIKES = 15;

export default function Post({ post, clickable = true, fullDate = false }: PostProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const like = useLikePost(post.id);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { id, author, title, content, images = [], likes, isLiked, comments } = post;
  const isOwner = currentUser?.id === author.id;

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(id),
    onSuccess: () => {
      setShowDeleteModal(false);
      // Atualiza feed, perfil, página do usuário e o total de posts.
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      if (!clickable) router.push("/home");
    },
  });

  const stop = (handler: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    handler();
  };

  return (
    <>
      <DialogNoCloseButton
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Deletar post?"
        description="Esta ação não pode ser desfeita. O post será permanentemente removido."
        icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
        textButton="Deletar"
        onSubmit={() => deleteMutation.mutate()}
        disabled={deleteMutation.isPending}
      />

      <article
        className={cn(
          "group w-full bg-card border border-border rounded-2xl p-6",
          "transition-all duration-300 ease-out",
          "hover:shadow-lg hover:border-primary/30 hover:bg-accent/50",
          clickable && "cursor-pointer hover:-translate-y-1"
        )}
        onClick={() => clickable && router.push(`/post/${id}`)}
      >
        <header className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- avatar do Cloudinary, já otimizado */}
            <img
              src={getAvatarUrl(author.avatar)}
              alt={author.name}
              className="rounded-full object-cover ring-2 ring-background w-10 h-10"
            />
            <div className="flex flex-col gap-1">
              <span className="font-bold text-sm flex items-center gap-2">{author.name}</span>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-xs">
                  {fullDate ? new Date(post.createdAt).toLocaleDateString("pt-BR") : formatDate(post.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {likes > TRENDING_LIKES && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">Em alta</span>
              </div>
            )}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button
                    aria-label="Opções do post"
                    className="p-2 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={stop(() => setShowDeleteModal(true))}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <div className="space-y-3 mb-6">
          {title && <h2 className="text-xl font-bold leading-snug">{title}</h2>}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {renderContentWithMentions(content)}
          </p>

          {images.length > 0 && (
            <div className="mt-4 relative rounded-xl overflow-hidden border border-border h-64">
              {/* eslint-disable-next-line @next/next/no-img-element -- fundo desfocado */}
              <img
                src={images[currentImageIndex]}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-80"
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- imagem do Cloudinary */}
              <img
                src={images[currentImageIndex]}
                alt={`Imagem ${currentImageIndex + 1}`}
                className="relative w-full h-full object-contain"
              />
              {images.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <button
                      aria-label="Imagem anterior"
                      onClick={stop(() => setCurrentImageIndex((i) => i - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                  )}
                  {currentImageIndex < images.length - 1 && (
                    <button
                      aria-label="Próxima imagem"
                      onClick={stop(() => setCurrentImageIndex((i) => i + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  )}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <div
                        key={i}
                        className={cn("w-1.5 h-1.5 rounded-full transition-colors", i === currentImageIndex ? "bg-white" : "bg-white/40")}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center gap-3">
          <button
            onClick={stop(() => like.mutate())}
            disabled={like.isPending}
            aria-label={isLiked ? "Descurtir" : "Curtir"}
            aria-pressed={isLiked}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm",
              "transition-all duration-300 cursor-pointer hover:scale-110 h-full",
              isLiked ? "bg-red-500/15 text-red-500" : "bg-secondary hover:bg-secondary/80"
            )}
          >
            <Heart className={cn("h-4 w-4 transition-all duration-300", isLiked && "fill-red-500 scale-110")} />
            <span>{formatCount(likes)}</span>
          </button>

          <button
            onClick={stop(() => router.push(`/post/${id}`))}
            aria-label="Comentários"
            className="flex items-center hover:scale-110 gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-secondary hover:bg-secondary/80 transition-all duration-300 cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{comments || 0}</span>
          </button>
        </footer>
      </article>
    </>
  );
}

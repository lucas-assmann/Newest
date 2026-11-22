'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getAvatarUrl } from '@/lib/avatar';
import { formatDate } from '@/lib/format';
import { queryKeys } from '@/lib/query-keys';
import { renderContentWithMentions } from "@/lib/render-mentions";
import { deleteComment } from '@/services/comment.service';
import { CommentDTO } from '@/types/Comment.types';
import { DialogNoCloseButton } from "../dialog";

export default function Comment({ comment }: { comment: CommentDTO }) {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { id, content, author, createdAt, postId } = comment;

  const isOwner = currentUser?.id === author.id;

  const deleteMutation = useMutation({
    mutationFn: () => deleteComment(id),
    onSuccess: () => {
      setShowDeleteModal(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }); // contador de comentários
    },
  });

  return (
    <>
      <DialogNoCloseButton
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Deletar comentário?"
        description="Esta ação não pode ser desfeita. O comentário será permanentemente removido."
        icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
        textButton="Deletar"
        onSubmit={() => deleteMutation.mutate()}
        disabled={deleteMutation.isPending}
      />

      <div className="flex gap-3 p-4 bg-card rounded-lg border border-border hover:bg-accent/50 transition-colors">
        {/* eslint-disable-next-line @next/next/no-img-element -- avatar do Cloudinary */}
        <img
          src={getAvatarUrl(author.avatar)}
          alt={author.name}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-background"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{author.name}</p>
              <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
            </div>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Opções do comentário"
                    className="p-1 hover:bg-accent rounded transition-colors cursor-pointer"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setShowDeleteModal(true)}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar comentário
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <p className="text-sm mt-2 wrap-break-words">{renderContentWithMentions(content)}</p>
        </div>
      </div>
    </>
  );
}

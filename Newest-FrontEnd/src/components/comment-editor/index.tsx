"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { MentionTextarea } from "@/components/mention-textarea";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import { CreateCommentSchema } from "@/schemas/comment.schema";
import { updateComment } from "@/services/comment.service";
import { CommentDTO } from "@/types/Comment.types";

interface CommentEditorProps {
  comment: CommentDTO;
  onDone: () => void;
}

/** Edita um comentário no próprio lugar (Salvar / Cancelar). */
export function CommentEditor({ comment, onDone }: CommentEditorProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState(comment.content);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => updateComment(comment.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(comment.postId) });
      onDone();
    },
    onError: (err) => setError(getErrorMessage(err, "Erro ao editar o comentário. Tente novamente.")),
  });

  function save() {
    const result = CreateCommentSchema.safeParse({ content });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setError(null);
    mutation.mutate();
  }

  return (
    <div className="mt-2 space-y-2">
      <MentionTextarea
        placeholder="Edite seu comentário..."
        value={content}
        onChange={setContent}
        className="resize-none bg-background"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button size="sm" onClick={save} disabled={mutation.isPending || content === comment.content}>
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}

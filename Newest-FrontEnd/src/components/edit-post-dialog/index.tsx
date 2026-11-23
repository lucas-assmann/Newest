"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { DialogNoCloseButton } from "@/components/dialog";
import { MentionTextarea } from "@/components/mention-textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import { CreatePostFormData, CreatePostSchema } from "@/schemas/post.schemas";
import { updatePost } from "@/services/post.service";
import { PostDTO } from "@/types/Post.types";

interface EditPostDialogProps {
  post: PostDTO;
  open: boolean;
  onClose: () => void;
}

/** Editar título e texto de um post (as imagens não mudam). */
export function EditPostDialog({ post, open, onClose }: EditPostDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePostFormData>({
    resolver: zodResolver(CreatePostSchema),
    values: { title: post.title, content: post.content },
  });

  const mutation = useMutation({
    mutationFn: (data: CreatePostFormData) => updatePost(post.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      close();
    },
    onError: (err) => setError(getErrorMessage(err, "Erro ao editar o post. Tente novamente.")),
  });

  function close() {
    reset();
    setError(null);
    onClose();
  }

  return (
    <DialogNoCloseButton
      open={open}
      onClose={close}
      title="Editar post"
      description="As imagens continuam as mesmas."
      icon={<Pencil />}
      onSubmit={handleSubmit((data) => {
        setError(null);
        mutation.mutate(data);
      })}
      textButton="Salvar"
      disabled={mutation.isPending}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-title">Título</Label>
          <Input id="edit-title" {...register("title")} />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-content">Conteúdo</Label>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <MentionTextarea
                placeholder="Conteúdo do post"
                value={field.value}
                onChange={field.onChange}
                className="h-36 resize-none w-full wrap-break-word whitespace-pre-wrap break-all"
              />
            )}
          />
          {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </DialogNoCloseButton>
  );
}

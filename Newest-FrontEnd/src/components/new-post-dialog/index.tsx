"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, NewspaperIcon, X } from "lucide-react";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { DialogNoCloseButton } from "@/components/dialog";
import { MentionTextarea } from "@/components/mention-textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImageUpload, validateImageFile } from "@/hooks/useImageUpload";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import { CreatePostFormData, CreatePostSchema } from "@/schemas/post.schemas";
import { createPost } from "@/services/post.service";

const MAX_IMAGES = 3;

interface NewPostDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Formulário de novo post (antes havia uma cópia na home e outra no perfil). */
export function NewPostDialog({ open, onClose }: NewPostDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { uploadImages, uploading } = useImageUpload();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePostFormData>({
    resolver: zodResolver(CreatePostSchema),
    defaultValues: { title: "", content: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreatePostFormData) => {
      const urls = await uploadImages(images.map((i) => i.file));
      return createPost({ ...data, images: urls });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.me }); // total de posts
      close();
    },
    onError: (err) => {
      setError(
        getErrorMessage(err, err instanceof Error ? err.message : "Erro ao criar post. Tente novamente."),
      );
    },
  });

  function close() {
    reset();
    images.forEach((i) => URL.revokeObjectURL(i.preview));
    setImages([]);
    setError(null);
    onClose();
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    if (images.length + files.length > MAX_IMAGES) {
      setError(`Máximo de ${MAX_IMAGES} imagens por post`);
      return;
    }
    const invalid = files.map(validateImageFile).find(Boolean);
    if (invalid) {
      setError(invalid);
      return;
    }

    setError(null);
    setImages((prev) => [...prev, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  const busy = mutation.isPending || uploading;

  return (
    <DialogNoCloseButton
      open={open}
      onClose={close}
      title="O que deseja postar?"
      description="Preencha os campos abaixo para criar um novo post."
      icon={<NewspaperIcon />}
      onSubmit={handleSubmit((data) => {
        setError(null);
        mutation.mutate(data);
      })}
      textButton="Postar"
      disabled={busy}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" placeholder="Título do post" {...register("title")} />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Conteúdo</Label>
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

        <div className="space-y-2">
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {images.map((image, index) => (
                <div key={image.preview} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- preview local (blob:) */}
                  <img
                    src={image.preview}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    aria-label={`Remover imagem ${index + 1}`}
                    onClick={() => removeImage(index)}
                    className="absolute cursor-pointer top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors cursor-pointer"
            >
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {images.length === 0
                  ? "Clique para adicionar uma imagem"
                  : `Adicionar mais (${images.length}/${MAX_IMAGES})`}
              </span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </DialogNoCloseButton>
  );
}

import { Prisma } from '@prisma/client';

/** Campos de post que o front usa (antes repetido em 4 lugares). */
export function postSelect(currentUserId: string) {
  return {
    id: true,
    title: true,
    content: true,
    images: true,
    likesCount: true,
    createdAt: true,
    editedAt: true,
    author: { select: { id: true, name: true, avatar: true } },
    // Só o like do usuário logado, para saber se ele já curtiu.
    likes: { where: { userId: currentUserId }, select: { id: true } },
    _count: { select: { comments: true } },
  } satisfies Prisma.PostSelect;
}

export type PostRow = Prisma.PostGetPayload<{
  select: ReturnType<typeof postSelect>;
}>;

export function toPostDto(post: PostRow) {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    images: post.images,
    likes: post.likesCount,
    comments: post._count.comments,
    createdAt: post.createdAt,
    editedAt: post.editedAt,
    author: post.author,
    isLiked: post.likes.length > 0,
  };
}

export type PostDto = ReturnType<typeof toPostDto>;

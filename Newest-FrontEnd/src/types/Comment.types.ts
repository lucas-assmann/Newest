export interface CommentDTO {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  /** Vem da API como texto ISO. */
  createdAt: string;
  /** Quando o autor editou pela última vez (null = nunca). */
  editedAt?: string | null;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

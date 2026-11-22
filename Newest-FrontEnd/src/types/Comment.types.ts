export interface CommentDTO {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  /** Vem da API como texto ISO. */
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

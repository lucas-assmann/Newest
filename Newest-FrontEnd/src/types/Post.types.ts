export interface PostAuthor {
  id: string;
  name: string;
  avatar: string | null;
}

export interface PostDTO {
  id: string;
  /** Vem da API como texto ISO. */
  createdAt: string;
  title: string;
  images?: string[];
  content: string;
  isLiked: boolean;
  likes: number;
  comments: number;
  author: PostAuthor;
}

export interface ToggleLikeResponse {
  isLiked: boolean;
  likesCount: number;
}

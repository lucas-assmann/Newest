/** Usuário logado (GET /user/me) — inclui o próprio email. */
export interface User {
  id: string;
  name: string;
  avatar?: string | null;
  createdAt: string;
  bio: string | null;
  email: string;
  totalPosts: number;
}

/** Perfil público de outro usuário (GET /user/:id) — sem email. */
export interface PublicUser {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  createdAt: string;
  totalPosts: number;
}

/** Resultado da busca (GET /user/search). */
export interface SearchedUser {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  totalPosts: number;
}

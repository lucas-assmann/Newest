import { PostDTO, ToggleLikeResponse } from "@/types/Post.types";
import { api } from "./api";

export async function getPosts(): Promise<PostDTO[]> {
  const { data } = await api.get<PostDTO[]>("/posts");
  return data;
}

export async function getMyPosts(): Promise<PostDTO[]> {
  const { data } = await api.get<PostDTO[]>("/posts/me");
  return data;
}

export const createPost = async (postData: {
  title: string;
  content: string;
  images: string[];
}): Promise<PostDTO> => {
  const { data } = await api.post<PostDTO>("/posts", postData);
  return data;
};

export const toggleLike = async (postId: string): Promise<ToggleLikeResponse> => {
  const { data } = await api.patch<ToggleLikeResponse>(`/posts/${postId}/like`);
  return data;
};

export const getPostById = async (postId: string): Promise<PostDTO> => {
  const { data } = await api.get<PostDTO>(`/posts/${postId}`);
  return data;
};

export const getUserPosts = async (userId: string): Promise<PostDTO[]> => {
  const { data } = await api.get<PostDTO[]>(`/posts/user/${userId}`);
  return data;
};

export const deletePost = async (postId: string) => {
  const { data } = await api.delete(`/posts/${postId}`);
  return data;
};

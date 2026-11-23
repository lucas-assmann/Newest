import { cursorParams } from "@/lib/pagination";
import type { Page } from "@/types/Page.types";
import { PostDTO, ToggleLikeResponse } from "@/types/Post.types";
import { api } from "./api";

export async function getPosts(cursor?: string): Promise<Page<PostDTO>> {
  const { data } = await api.get<Page<PostDTO>>("/posts", cursorParams(cursor));
  return data;
}

export async function getMyPosts(cursor?: string): Promise<Page<PostDTO>> {
  const { data } = await api.get<Page<PostDTO>>("/posts/me", cursorParams(cursor));
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

export const getUserPosts = async (userId: string, cursor?: string): Promise<Page<PostDTO>> => {
  const { data } = await api.get<Page<PostDTO>>(`/posts/user/${userId}`, cursorParams(cursor));
  return data;
};

export const updatePost = async (
  postId: string,
  changes: { title?: string; content?: string },
): Promise<PostDTO> => {
  const { data } = await api.patch<PostDTO>(`/posts/${postId}`, changes);
  return data;
};

export const deletePost = async (postId: string) => {
  const { data } = await api.delete(`/posts/${postId}`);
  return data;
};

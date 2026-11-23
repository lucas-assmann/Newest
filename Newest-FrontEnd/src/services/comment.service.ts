import { cursorParams } from "@/lib/pagination";
import { CommentDTO } from "@/types/Comment.types";
import type { Page } from "@/types/Page.types";
import { api } from "./api";

export const getCommentsByPostId = async (
  postId: string,
  cursor?: string,
): Promise<Page<CommentDTO>> => {
  const { data } = await api.get<Page<CommentDTO>>(`/comment/post/${postId}`, cursorParams(cursor));
  return data;
};

export const createComment = async (commentData: {
  content: string;
  postId: string;
}) => {
  const { data } = await api.post("/comment", commentData);
  return data;
};

export const deleteComment = async (commentId: string) => {
  const { data } = await api.delete(`/comment/${commentId}`);
  return data;
};

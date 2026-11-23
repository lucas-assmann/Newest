import { cursorParams } from "@/lib/pagination";
import type { Page } from "@/types/Page.types";
import { api } from "./api";

export type NotificationType = "like" | "comment" | "mention";

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    avatar: string | null;
  };
  post: {
    id: string;
    title: string;
  } | null;
}

export async function getNotifications(cursor?: string): Promise<Page<NotificationDTO>> {
  const { data } = await api.get<Page<NotificationDTO>>("/notification", cursorParams(cursor));
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get("/notification/unread-count");
  return data;
}

export async function markAllAsRead(): Promise<void> {
  await api.patch("/notification/mark-all-read");
}
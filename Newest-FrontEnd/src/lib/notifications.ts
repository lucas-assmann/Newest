import type { NotificationType } from "@/services/notification.service";

const TEXTS: Record<NotificationType, string> = {
  like: "curtiu seu post",
  comment: "comentou no seu post",
  mention: "mencionou você",
};

export function notificationText(type: NotificationType): string {
  return TEXTS[type] ?? "interagiu com você";
}

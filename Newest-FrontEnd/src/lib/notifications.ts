import type { NotificationType } from "@/services/notification.service";

const TEXTS: Record<NotificationType, string> = {
  LIKE: "curtiu seu post",
  COMMENT: "comentou no seu post",
  MENTION: "mencionou você",
};

export function notificationText(type: NotificationType): string {
  return TEXTS[type] ?? "interagiu com você";
}

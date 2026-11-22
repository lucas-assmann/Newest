"use client"

import { AtSign, Bell, Heart, MessageCircle } from "lucide-react"
import Image from "next/image"
import { useEffect } from "react"
import ArticlePost from "@/components/article-post"
import { useNotifications } from "@/hooks/useNotification"
import { formatDate } from "@/lib/format"
import { notificationText } from "@/lib/notifications"
import type { NotificationType } from "@/services/notification.service"

const ICONS: Record<NotificationType, { icon: typeof Heart; bg: string }> = {
  like: { icon: Heart, bg: "bg-red-500" },
  comment: { icon: MessageCircle, bg: "bg-blue-500" },
  mention: { icon: AtSign, bg: "bg-purple-500" },
}

export default function NotificationClient() {
  const { notifications, unreadCount, readAll } = useNotifications();

  // Abrir a tela marca tudo como lido.
  useEffect(() => {
    readAll();
  }, [readAll]);

  return (
    <ArticlePost>
      <div className="border-b border-neutral-800 bg-neutral-900 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium">Notificações</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => readAll()}
            className="text-sm text-muted-foreground hover:text-white transition-colors cursor-pointer"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="divide-y divide-neutral-800">
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Bell className="w-10 h-10" />
            <p className="text-sm">Nenhuma notificação ainda</p>
          </div>
        )}

        {notifications.map((notification) => {
          const { icon: Icon, bg } = ICONS[notification.type] ?? ICONS.comment;
          return (
            <div
              key={notification.id}
              className={`flex items-start gap-3 px-4 py-3 transition-colors ${!notification.read ? "bg-neutral-800/50" : ""}`}
            >
              <div className="relative shrink-0">
                {notification.actor.avatar ? (
                  <Image
                    src={notification.actor.avatar}
                    alt={notification.actor.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover w-10 h-10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-sm font-bold">
                    {notification.actor.name[0].toUpperCase()}
                  </div>
                )}
                <div className={`absolute -bottom-1 -right-1 rounded-full p-0.5 ${bg}`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>
              </div>

              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{notification.actor.name}</span>{" "}
                  {notificationText(notification.type)}
                  {notification.post && (
                    <span className="text-muted-foreground"> · {notification.post.title}</span>
                  )}
                </p>
                <span className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </ArticlePost>
  )
}

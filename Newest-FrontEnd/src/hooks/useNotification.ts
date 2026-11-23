import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { notificationText } from "@/lib/notifications";
import { cursorPagination, pageItems } from "@/lib/pagination";
import { queryKeys } from "@/lib/query-keys";
import { getNotifications, getUnreadCount, markAllAsRead } from "@/services/notification.service";

export function useNotifications() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const seenIds = useRef<Set<string> | null>(null);

  const list = useInfiniteQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: ({ pageParam }) => getNotifications(pageParam),
    ...cursorPagination,
    refetchInterval: 15000,
  });
  const notifications = useMemo(() => pageItems(list.data), [list.data]);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: getUnreadCount,
    refetchInterval: 15000,
  });

  const { mutate: readAll } = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });

  // Mostra um aviso para cada notificação nova (menos na própria tela de notificações).
  useEffect(() => {
    if (notifications.length === 0) return;

    if (seenIds.current === null) {
      seenIds.current = new Set(notifications.map((n) => n.id));
      return;
    }

    const fresh = notifications.filter((n) => !seenIds.current!.has(n.id));
    if (pathname !== "/notification") {
      fresh.forEach((n) =>
        toast(`${n.actor.name} ${notificationText(n.type)}`, {
          duration: 5000,
          action: { label: "Ver", onClick: () => (window.location.href = "/notification") },
        }),
      );
    }
    fresh.forEach((n) => seenIds.current!.add(n.id));
  }, [notifications, pathname]);

  return {
    notifications,
    unreadCount,
    readAll,
    hasNextPage: list.hasNextPage,
    isFetchingNextPage: list.isFetchingNextPage,
    fetchNextPage: list.fetchNextPage,
  };
}

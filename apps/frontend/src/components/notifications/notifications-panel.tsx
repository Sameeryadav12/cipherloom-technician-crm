import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { NotificationsList } from "./notifications-list";
import {
  useDismissNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
  useSendTestNotification
} from "@/services/notifications/notifications.hooks";
import { useAuth } from "@/hooks/use-auth";

type NotificationsPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const { toast } = useToast();
  const auth = useAuth();
  const listQuery = useNotificationsList({ page: 1, limit: 20 });
  const readOne = useMarkNotificationRead();
  const readAll = useMarkAllNotificationsRead();
  const dismiss = useDismissNotification();
  const testMutation = useSendTestNotification();

  const unreadCount = useMemo(
    () => (listQuery.data?.items ?? []).filter((n) => !n.readAt && n.status !== "READ").length,
    [listQuery.data?.items]
  );

  if (!open) return null;

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-[420px] max-w-[calc(100vw-1rem)] rounded-xl border border-border/90 bg-card p-3 shadow-surface-lg">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-[11px] text-muted-foreground">{unreadCount} unread</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            className="h-8 text-xs"
            onClick={() => void readAll.mutateAsync()}
            disabled={readAll.isPending}
          >
            Mark all read
          </Button>
          {(auth.user?.role === "ADMIN" || auth.user?.role === "STAFF") && (
            <Button
              variant="outline"
              className="h-8 text-xs"
              disabled={testMutation.isPending}
              onClick={() =>
                void testMutation.mutateAsync(
                  {
                    title: "Dispatch test alert",
                    message: "This is a dev test notification.",
                    type: "DISPATCH_ALERT"
                  },
                  {
                    onSuccess: () =>
                      toast({ title: "Test notification created", variant: "success" }),
                    onError: (error) =>
                      toast({
                        title: "Test notification failed",
                        description: error instanceof Error ? error.message : "Could not create test notification.",
                        variant: "destructive"
                      })
                  }
                )
              }
            >
              Test
            </Button>
          )}
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto pr-1">
        <NotificationsList
          items={listQuery.data?.items ?? []}
          isLoading={listQuery.isLoading}
          onRead={(id) => void readOne.mutateAsync(id)}
          onDismiss={(id) => void dismiss.mutateAsync(id)}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <Button variant="ghost" className="h-8 text-xs" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

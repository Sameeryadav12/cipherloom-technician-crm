import { NotificationEmptyState } from "./notification-empty-state";
import { NotificationItem } from "./notification-item";
import type { AppNotification } from "@/types/notifications";

type NotificationsListProps = {
  items: AppNotification[];
  isLoading?: boolean;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
};

export function NotificationsList({ items, isLoading, onRead, onDismiss }: NotificationsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-16 animate-pulse rounded-lg bg-muted/50" />
        <div className="h-16 animate-pulse rounded-lg bg-muted/50" />
      </div>
    );
  }
  if (items.length === 0) return <NotificationEmptyState />;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <NotificationItem key={item.id} notification={item} onRead={onRead} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

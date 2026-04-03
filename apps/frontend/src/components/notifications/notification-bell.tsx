import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadNotificationCount } from "@/services/notifications/notifications.hooks";
import { NotificationsPanel } from "./notifications-panel";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unread = useUnreadNotificationCount();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Open notifications"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/90 bg-card/50",
          "transition-colors hover:border-primary/30 hover:bg-card/80"
        )}
      >
        <Bell className="h-4 w-4" />
        {(unread.data ?? 0) > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-primary px-1.5 text-center text-[10px] font-semibold text-primary-foreground">
            {(unread.data ?? 0) > 99 ? "99+" : unread.data}
          </span>
        ) : null}
      </button>
      <NotificationsPanel open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

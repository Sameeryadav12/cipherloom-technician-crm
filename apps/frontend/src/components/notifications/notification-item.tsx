import { AlertTriangle, BellRing, CalendarClock, FileText, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notifications";

type NotificationItemProps = {
  notification: AppNotification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
};

function relativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function typeMeta(type: AppNotification["type"]) {
  switch (type) {
    case "JOB_ASSIGNED":
      return { icon: Wrench, tone: "text-sky-300 border-sky-500/35 bg-sky-950/20" };
    case "JOB_RESCHEDULED":
      return { icon: CalendarClock, tone: "text-amber-300 border-amber-500/35 bg-amber-950/20" };
    case "JOB_CONFLICT":
    case "TIME_OFF_CONFLICT":
      return { icon: AlertTriangle, tone: "text-red-300 border-red-500/35 bg-red-950/20" };
    case "READY_TO_INVOICE":
    case "INVOICE_DUE":
    case "INVOICE_OVERDUE":
      return { icon: FileText, tone: "text-violet-300 border-violet-500/35 bg-violet-950/20" };
    default:
      return { icon: BellRing, tone: "text-muted-foreground border-border/70 bg-muted/20" };
  }
}

function resolveLink(notification: AppNotification) {
  const payload = notification.payload ?? {};
  const jobId = typeof payload["jobId"] === "string" ? payload["jobId"] : null;
  const invoiceId = typeof payload["invoiceId"] === "string" ? payload["invoiceId"] : null;
  if (invoiceId) return `/invoices/${invoiceId}`;
  if (jobId) return `/jobs/${jobId}`;
  return null;
}

export function NotificationItem({ notification, onRead, onDismiss }: NotificationItemProps) {
  const unread = !notification.readAt && notification.status !== "READ";
  const meta = typeMeta(notification.type);
  const Icon = meta.icon;
  const href = resolveLink(notification);

  return (
    <div className={cn("rounded-lg border p-3", unread ? "border-primary/35 bg-primary/[0.08]" : "border-border/70 bg-card/50")}>
      <div className="flex items-start gap-2">
        <span className={cn("mt-0.5 rounded-md border p-1", meta.tone)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-tight">{notification.title}</p>
            <span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(notification.createdAt)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {href ? (
              <Link to={href} className="text-[11px] font-medium text-primary hover:underline" onClick={() => onRead(notification.id)}>
                Open related item
              </Link>
            ) : null}
            {unread ? (
              <button type="button" className="text-[11px] text-muted-foreground hover:text-foreground" onClick={() => onRead(notification.id)}>
                Mark read
              </button>
            ) : null}
            <button type="button" className="text-[11px] text-muted-foreground hover:text-foreground" onClick={() => onDismiss(notification.id)}>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

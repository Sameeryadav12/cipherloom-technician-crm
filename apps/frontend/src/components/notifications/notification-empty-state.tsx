export function NotificationEmptyState() {
  return (
    <div className="rounded-lg border border-border/70 bg-card/40 p-4 text-center">
      <p className="text-sm font-medium">No notifications yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Operational alerts and workflow messages will appear here.
      </p>
    </div>
  );
}

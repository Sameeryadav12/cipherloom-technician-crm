import { cn } from "@/lib/utils";
import type { DispatchQueueKey } from "@/types/dispatch";

const QUEUES: Array<{ key: DispatchQueueKey | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "unassigned", label: "Unassigned" },
  { key: "needs_scheduling", label: "Needs Scheduling" },
  { key: "conflicted", label: "Conflicted" },
  { key: "starts_soon", label: "Starts Soon" },
  { key: "ready_to_invoice", label: "Ready to Invoice" },
  { key: "stale", label: "Aging" }
];

type DispatchQueueFiltersProps = {
  activeQueue: DispatchQueueKey | "all";
  onChangeQueue: (next: DispatchQueueKey | "all") => void;
};

export function DispatchQueueFilters({ activeQueue, onChangeQueue }: DispatchQueueFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUEUES.map((queue) => (
        <button
          key={queue.key}
          type="button"
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium",
            activeQueue === queue.key
              ? "border-primary/50 bg-primary/15 text-primary"
              : "border-border/70 bg-card/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
          onClick={() => onChangeQueue(queue.key)}
        >
          {queue.label}
        </button>
      ))}
    </div>
  );
}

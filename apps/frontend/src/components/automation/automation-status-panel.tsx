import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { AutomationRunLog } from "@/types/automation";

type AutomationStatusPanelProps = {
  logs: AutomationRunLog[];
};

export function AutomationStatusPanel({ logs }: AutomationStatusPanelProps) {
  return (
    <Card>
      <CardTitle className="text-base">Recent automation runs</CardTitle>
      <CardDescription className="mt-2">Latest runner executions and outcomes.</CardDescription>
      <div className="mt-3 space-y-2">
        {logs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No runs yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-md border border-border/70 bg-card/40 p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{log.taskKey}</span>
                <span>{log.status}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{new Date(log.startedAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

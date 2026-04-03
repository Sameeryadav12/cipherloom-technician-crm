import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type RunAutomationDialogProps = {
  open: boolean;
  isRunning?: boolean;
  onClose: () => void;
  onRunAll: () => void;
};

export function RunAutomationDialog({ open, isRunning, onClose, onRunAll }: RunAutomationDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md">
        <h3 className="text-base font-semibold">Run automations now</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This executes recurring jobs, invoice reminders, stale-job alerts, dispatch checks, and assignment suggestions.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isRunning}>
            Cancel
          </Button>
          <Button onClick={onRunAll} disabled={isRunning}>
            {isRunning ? "Running..." : "Run now"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RecurringJobTemplate } from "@/types/automation";

type RecurringJobListProps = {
  items: RecurringJobTemplate[];
  onEdit: (item: RecurringJobTemplate) => void;
  onDelete: (item: RecurringJobTemplate) => void;
};

export function RecurringJobList({ items, onEdit, onDelete }: RecurringJobListProps) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed bg-muted/10">
        <p className="text-sm text-muted-foreground">No recurring templates yet.</p>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Card key={item.id} className="border-border/70 bg-card/40 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.customer?.name ?? "Customer"} • {item.recurrencePattern} • {item.durationMinutes}m
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Next run: {item.nextRunAt ? new Date(item.nextRunAt).toLocaleString() : "Not scheduled"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-8 text-xs" onClick={() => onEdit(item)}>
                Edit
              </Button>
              <Button variant="outline" className="h-8 text-xs" onClick={() => onDelete(item)}>
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

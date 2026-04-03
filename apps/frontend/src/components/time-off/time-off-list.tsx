import { Button } from "@/components/ui/button";
import type { TimeOffEntry } from "@/types/time-off";

type TimeOffListProps = {
  items: TimeOffEntry[];
  onEdit: (entry: TimeOffEntry) => void;
  onDelete: (entry: TimeOffEntry) => void;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function TimeOffList({ items, onEdit, onDelete }: TimeOffListProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Start</th>
            <th className="px-4 py-3">End</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((entry) => (
            <tr key={entry.id} className="border-t border-border">
              <td className="px-4 py-3">{formatDateTime(entry.start)}</td>
              <td className="px-4 py-3">{formatDateTime(entry.end)}</td>
              <td className="px-4 py-3 text-muted-foreground">{entry.reason?.trim() || "-"}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => onEdit(entry)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs text-red-300 hover:bg-red-950/20"
                    onClick={() => onDelete(entry)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


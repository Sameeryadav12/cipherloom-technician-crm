import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InvoiceListItem } from "@/types/invoices";

type InvoiceRowActionsProps = {
  invoice: InvoiceListItem;
  onUpdate: (invoice: InvoiceListItem) => void;
  onDelete: (invoice: InvoiceListItem) => void;
};

export function InvoiceRowActions({ invoice, onUpdate, onDelete }: InvoiceRowActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link to={`/invoices/${invoice.id}`}>
        <Button type="button" variant="default" className="h-8 px-3 text-xs font-medium">
          Open
        </Button>
      </Link>

      <div className="relative" ref={ref}>
        <Button
          type="button"
          variant="outline"
          className="h-8 w-8 p-0"
          aria-label="More actions"
          onClick={() => setOpen((v) => !v)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        {open ? (
          <div
            className={cn(
              "absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-lg border border-border/90",
              "bg-card py-1 shadow-surface-lg"
            )}
          >
            <Link
              to={`/invoices/${invoice.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/80"
              onClick={() => setOpen(false)}
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              Detail
            </Link>
            {invoice.jobId ? (
              <Link
                to={`/jobs/${invoice.jobId}`}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/80"
                onClick={() => setOpen(false)}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Linked job
              </Link>
            ) : null}
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/80"
              onClick={() => {
                setOpen(false);
                onUpdate(invoice);
              }}
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
              Update status…
            </button>
            <div className="my-1 h-px bg-border/80" />
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
              onClick={() => {
                setOpen(false);
                onDelete(invoice);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete invoice
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

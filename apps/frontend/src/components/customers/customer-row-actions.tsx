import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, MoreHorizontal, Pencil, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CustomerListItem } from "@/types/customers";

type CustomerRowActionsProps = {
  customer: CustomerListItem;
  onEdit: (customer: CustomerListItem) => void;
  onDelete: (customer: CustomerListItem) => void;
};

export function CustomerRowActions({ customer, onEdit, onDelete }: CustomerRowActionsProps) {
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
      <Link to={`/customers/${customer.id}`}>
        <Button type="button" variant="default" className="h-8 px-3 text-xs font-medium">
          Profile
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
              "absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-lg border border-border/90",
              "bg-card py-1 shadow-surface-lg"
            )}
          >
            <Link
              to={`/jobs?new=1&customerId=${customer.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/80"
              onClick={() => setOpen(false)}
            >
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              New job…
            </Link>
            <Link
              to={`/customers/${customer.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/80"
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4 text-muted-foreground" />
              Open detail
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/80"
              onClick={() => {
                setOpen(false);
                onEdit(customer);
              }}
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
              Edit customer
            </button>
            <div className="my-1 h-px bg-border/80" />
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
              onClick={() => {
                setOpen(false);
                onDelete(customer);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete customer
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, FileText, Search, User, Users } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useCustomersList } from "@/services/customers/customers.hooks";
import { useInvoicesList } from "@/services/invoices/invoices.hooks";
import { useJobsList } from "@/services/jobs/jobs.hooks";
import { useTechniciansList } from "@/services/technicians/technicians.hooks";

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  to: string;
};

const COMMANDS: CommandItem[] = [
  { id: "dash", label: "Dashboard", hint: "Overview", to: "/dashboard" },
  { id: "jobs", label: "Jobs", hint: "Work orders", to: "/jobs" },
  { id: "dispatch", label: "Dispatch Queue", hint: "Operational work queue", to: "/dispatch" },
  { id: "new-job", label: "Create job", hint: "New work order", to: "/jobs?new=1" },
  { id: "sched", label: "Smart Scheduling", hint: "Suggest slots", to: "/scheduling" },
  { id: "cal", label: "Calendar", hint: "Dispatch board", to: "/calendar" },
  { id: "cust", label: "Customers", hint: "Accounts", to: "/customers" },
  { id: "new-cust", label: "Customers — add", hint: "Open list + create", to: "/customers" },
  { id: "tech", label: "Technicians", hint: "Field team", to: "/technicians" },
  { id: "inv", label: "Invoices", hint: "Billing", to: "/invoices" },
  { id: "gen-inv", label: "Generate invoice", hint: "From job", to: "/invoices" },
  { id: "set", label: "Settings", hint: "Pricing rules", to: "/settings" }
];

const TECHNICIAN_COMMANDS: CommandItem[] = [
  { id: "tech-dash", label: "My Dashboard", hint: "Today view", to: "/technician" },
  { id: "tech-jobs", label: "My Jobs", hint: "Assigned jobs", to: "/technician/jobs" },
  { id: "tech-schedule", label: "My Schedule", hint: "Today / week", to: "/technician/schedule" }
];

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

function useDebouncedValue(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

type EntityRow = {
  id: string;
  icon: typeof User;
  title: string;
  subtitle?: string;
  to: string;
};

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const debounced = useDebouncedValue(q.trim(), 280);
  const searchActive = open && debounced.length >= 2;

  const customersQ = useCustomersList(
    { page: 1, limit: 8, search: debounced },
    { enabled: searchActive }
  );
  const techniciansQ = useTechniciansList(
    { page: 1, limit: 8, search: debounced },
    { enabled: searchActive }
  );
  const jobsQ = useJobsList({ page: 1, limit: 40 }, { enabled: searchActive });
  const invoicesQ = useInvoicesList({ page: 1, limit: 40 }, { enabled: searchActive });
  const technicianMode = auth.user?.role === "TECHNICIAN";

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const needle = debounced.toLowerCase();

  const entityRows = useMemo(() => {
    if (!searchActive) return [] as EntityRow[];
    const rows: EntityRow[] = [];
    if (technicianMode) {
      for (const j of jobsQ.data?.items ?? []) {
        const hay = `${j.title} ${j.customer?.name ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) continue;
        rows.push({
          id: `j-${j.id}`,
          icon: Briefcase,
          title: j.title,
          subtitle: j.customer?.name ?? "Job",
          to: `/technician/jobs/${j.id}`
        });
      }
      return rows.slice(0, 14);
    }
    for (const c of customersQ.data?.items ?? []) {
      rows.push({
        id: `c-${c.id}`,
        icon: Users,
        title: c.name,
        subtitle: c.email ?? c.phone ?? "Customer",
        to: `/customers/${c.id}`
      });
    }
    for (const t of techniciansQ.data?.items ?? []) {
      rows.push({
        id: `t-${t.id}`,
        icon: User,
        title: t.name,
        subtitle: (t.skills ?? []).slice(0, 2).join(", ") || "Technician",
        to: `/technicians/${t.id}`
      });
    }
    for (const j of jobsQ.data?.items ?? []) {
      const hay = `${j.title} ${j.customer?.name ?? ""}`.toLowerCase();
      if (!hay.includes(needle)) continue;
      rows.push({
        id: `j-${j.id}`,
        icon: Briefcase,
        title: j.title,
        subtitle: j.customer?.name ?? "Job",
        to: `/jobs/${j.id}`
      });
    }
    for (const inv of invoicesQ.data?.items ?? []) {
      const hay = `${inv.id} ${inv.job?.title ?? ""} ${inv.job?.customer?.name ?? ""}`.toLowerCase();
      if (!hay.includes(needle)) continue;
      rows.push({
        id: `i-${inv.id}`,
        icon: FileText,
        title: `Invoice ${inv.id.slice(0, 8)}…`,
        subtitle: inv.job?.customer?.name ?? inv.job?.title ?? "Invoice",
        to: `/invoices/${inv.id}`
      });
    }
    return rows.slice(0, 14);
  }, [
    customersQ.data?.items,
    invoicesQ.data?.items,
    jobsQ.data?.items,
    needle,
    searchActive,
    technicianMode,
    techniciansQ.data?.items
  ]);

  const filteredCommands = useMemo(() => {
    const n = q.trim().toLowerCase();
    const base = technicianMode ? TECHNICIAN_COMMANDS : COMMANDS;
    if (!n) return base;
    return base.filter(
      (c) =>
        c.label.toLowerCase().includes(n) ||
        (c.hint?.toLowerCase().includes(n) ?? false) ||
        c.to.toLowerCase().includes(n)
    );
  }, [q, technicianMode]);

  const run = useCallback(
    (to: string) => {
      navigate(to);
      onClose();
    },
    [navigate, onClose]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const loadingEntities =
    searchActive &&
    (jobsQ.isFetching || (!technicianMode && (customersQ.isFetching || techniciansQ.isFetching || invoicesQ.isFetching)));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/55 p-4 pt-[10vh] backdrop-blur-sm">
      <Card className="w-full max-w-lg overflow-hidden p-0 shadow-surface-lg ring-1 ring-primary/15">
        <div className="border-b border-border/80 px-4 py-3">
          <CardTitle className="text-base">Command center</CardTitle>
          <CardDescription className="mt-0.5">
            {technicianMode
              ? "Jump to your workspace or search your assigned jobs. Esc to close."
              : "Jump to a page or search customers, technicians, jobs, and invoices. Esc to close."}
          </CardDescription>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search pages and records…"
              value={q}
              autoFocus
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <ul className="max-h-[min(52vh,360px)] overflow-auto p-2">
          {filteredCommands.length > 0 ? (
            <>
              <li className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Navigation
              </li>
              {filteredCommands.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm",
                      "hover:bg-primary/15 hover:text-foreground"
                    )}
                    onClick={() => run(item.to)}
                  >
                    <span className="font-medium">{item.label}</span>
                    {item.hint ? (
                      <span className="text-xs text-muted-foreground">{item.hint}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </>
          ) : (
            <li className="px-3 py-4 text-center text-sm text-muted-foreground">No navigation matches.</li>
          )}

          {searchActive ? (
            <>
              <li className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Records
              </li>
              {loadingEntities ? (
                <li className="px-3 py-4 text-center text-sm text-muted-foreground">Searching…</li>
              ) : entityRows.length === 0 ? (
                <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No records match &ldquo;{debounced}&rdquo;.
                </li>
              ) : (
                entityRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm",
                          "hover:bg-primary/15 hover:text-foreground"
                        )}
                        onClick={() => run(row.to)}
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0">
                          <span className="block font-medium leading-tight">{row.title}</span>
                          {row.subtitle ? (
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {row.subtitle}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </>
          ) : (
            <li className="px-3 py-4 text-center text-xs text-muted-foreground">
              Type at least 2 characters to search live records.
            </li>
          )}
        </ul>
        <div className="border-t border-border/80 px-4 py-2 text-xs text-muted-foreground">
          Shortcut: ⌘K / Ctrl+K
        </div>
      </Card>
    </div>
  );
}

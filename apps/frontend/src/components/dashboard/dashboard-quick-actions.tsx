import { Link } from "react-router-dom";
import {
  Briefcase,
  CalendarDays,
  Plus,
  Receipt,
  Sparkles,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    to: "/jobs?new=1",
    label: "Create job",
    hint: "New work order",
    icon: Plus,
    accent: "bg-blue-500/15 text-blue-300"
  },
  {
    to: "/calendar",
    label: "Calendar",
    hint: "Dispatch board",
    icon: CalendarDays,
    accent: "bg-violet-500/15 text-violet-300"
  },
  {
    to: "/scheduling",
    label: "Smart schedule",
    hint: "AI-assisted slots",
    icon: Sparkles,
    accent: "bg-amber-500/15 text-amber-200"
  },
  {
    to: "/invoices",
    label: "Invoices",
    hint: "Generate & track",
    icon: Receipt,
    accent: "bg-emerald-500/15 text-emerald-300"
  },
  {
    to: "/customers",
    label: "Add customer",
    hint: "Accounts",
    icon: Users,
    accent: "bg-slate-500/20 text-slate-200"
  },
  {
    to: "/jobs",
    label: "Job queue",
    hint: "All work",
    icon: Briefcase,
    accent: "bg-primary/15 text-primary"
  }
] as const;

export function DashboardQuickActions() {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
        <p className="text-xs text-muted-foreground">Jump to the work you do every day.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {actions.map(({ to, label, hint, icon: Icon, accent }) => (
          <Link
            key={to + label}
            to={to}
            className={cn(
              "group flex flex-col rounded-xl border border-border/80 bg-card/50 p-3 shadow-surface",
              "transition-all hover:border-primary/35 hover:bg-card/90 hover:shadow-glow"
            )}
          >
            <div className="flex items-start gap-2">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", accent)}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-primary">{label}</p>
                <p className="text-[11px] text-muted-foreground">{hint}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

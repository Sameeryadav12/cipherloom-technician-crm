import { Link } from "react-router-dom";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { DashboardAttentionPanel } from "@/components/dashboard/dashboard-attention-panel";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { RecentListCard } from "@/components/dashboard/recent-list-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import {
  useDashboardSummary,
  useRecentInvoices,
  useRecentJobs
} from "@/services/dashboard/dashboard.hooks";
import { cn } from "@/lib/utils";

function formatDate(value?: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatCurrency(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2
  }).format(numeric);
}

export function DashboardPage() {
  const summary = useDashboardSummary();
  const recentJobs = useRecentJobs(5);
  const recentInvoices = useRecentInvoices(5);

  const showAllEmpty =
    !summary.isLoading &&
    !summary.isError &&
    recentJobs.items.length === 0 &&
    recentInvoices.items.length === 0;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Operations overview
        </p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          What needs attention right now, and the fastest path to dispatch, schedule, and bill — without
          switching context.
        </p>
      </header>

      <DashboardQuickActions />

      <DashboardAttentionPanel />

      {summary.isError ? (
        <Card className="border-red-500/30">
          <CardTitle>Unable to load dashboard summary</CardTitle>
          <CardDescription className="mt-2">
            Please try refreshing. API connectivity may be temporarily unavailable.
          </CardDescription>
        </Card>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.stats.map((stat) => (
            <StatCard key={stat.title} stat={stat} />
          ))}
        </section>
      )}

      {showAllEmpty ? <DashboardEmptyState /> : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <RecentListCard
          title="Recent jobs"
          description="Latest movement on the work order queue."
          isLoading={recentJobs.isLoading}
          isError={recentJobs.isError}
          isEmpty={!recentJobs.isLoading && recentJobs.items.length === 0}
          emptyLabel="No jobs yet — create one from Quick actions."
        >
          {recentJobs.items.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className={cn(
                "block rounded-xl border border-border/70 bg-background/25 p-3",
                "transition-all hover:border-primary/35 hover:bg-primary/5 hover:shadow-surface"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{job.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {job.customerName} · {job.technicianName}
                  </p>
                </div>
                <JobStatusBadge status={job.status} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(job.scheduledStart)}</p>
            </Link>
          ))}
        </RecentListCard>

        <RecentListCard
          title="Recent invoices"
          description="Issuance and billing posture at a glance."
          isLoading={recentInvoices.isLoading}
          isError={recentInvoices.isError}
          isEmpty={!recentInvoices.isLoading && recentInvoices.items.length === 0}
          emptyLabel="No invoices yet — complete a job and generate from the Invoices page."
        >
          {recentInvoices.items.map((invoice) => (
            <Link
              key={invoice.id}
              to={`/invoices/${invoice.id}`}
              className={cn(
                "block rounded-xl border border-border/70 bg-background/25 p-3",
                "transition-all hover:border-primary/35 hover:bg-primary/5 hover:shadow-surface"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{invoice.jobTitle}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{invoice.customerName}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
                    invoice.status === "OVERDUE" && "border-rose-500/40 bg-rose-950/30 text-rose-200",
                    invoice.status === "PAID" && "border-emerald-500/40 bg-emerald-950/25 text-emerald-200",
                    invoice.status !== "OVERDUE" &&
                      invoice.status !== "PAID" &&
                      "border-border bg-muted/30 text-muted-foreground"
                  )}
                >
                  {invoice.status}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{formatCurrency(invoice.total)}</span>
                <span>{formatDate(invoice.issuedAt)}</span>
              </div>
            </Link>
          ))}
        </RecentListCard>
      </section>
    </div>
  );
}

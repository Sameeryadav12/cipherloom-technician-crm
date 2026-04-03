import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, Sparkles, UserX } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { useJobsList } from "@/services/jobs/jobs.hooks";
import { useInvoicesList } from "@/services/invoices/invoices.hooks";
import { useTimeOffList } from "@/services/time-off/time-off.hooks";

function todayRangeIso() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function DashboardAttentionPanel() {
  const today = useMemo(() => todayRangeIso(), []);
  const newJobs = useJobsList({ page: 1, limit: 5, status: "NEW" });
  const scheduledToday = useJobsList({
    page: 1,
    limit: 8,
    status: "SCHEDULED",
    scheduledStartFrom: today.start,
    scheduledStartTo: today.end
  });
  const overdueInvoices = useInvoicesList({ page: 1, limit: 5, status: "OVERDUE" });
  const timeOffToday = useTimeOffList({
    page: 1,
    limit: 10,
    start: today.start,
    end: today.end
  });

  const unassignedCount =
    newJobs.data?.items.filter((j) => !j.technicianId).length ?? 0;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card className="border-amber-500/25 bg-gradient-to-br from-card/95 to-amber-950/10">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-200">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">Needs attention</CardTitle>
            <CardDescription>
              New jobs waiting triage
              {unassignedCount > 0 ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-medium text-amber-200/90">
                    {unassignedCount} unassigned on this slice
                  </span>
                </>
              ) : null}
            </CardDescription>
          </div>
          <Link
            to="/jobs"
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            Open jobs
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {newJobs.isLoading ? (
            <div className="h-16 animate-pulse rounded-lg bg-muted/40" />
          ) : newJobs.isError ? (
            <p className="text-sm text-red-300">Could not load job queue.</p>
          ) : newJobs.data?.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No new jobs — queue is clear.</p>
          ) : (
            newJobs.data?.items.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/30 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{job.title}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {!job.technicianId ? (
                      <UserX className="h-3.5 w-3.5 shrink-0 text-amber-400/90" />
                    ) : null}
                    <span className="truncate">{job.customer?.name ?? "Customer"}</span>
                  </p>
                </div>
                <JobStatusBadge status={job.status} />
              </Link>
            ))
          )}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <CardTitle className="text-sm">Starting today</CardTitle>
          </div>
          <CardDescription className="mt-1">Scheduled jobs in your local today window.</CardDescription>
          <p className="mt-3 text-2xl font-semibold tabular-nums">
            {scheduledToday.isLoading ? "—" : scheduledToday.data?.totalItems ?? 0}
          </p>
          <Link to="/calendar" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
            View calendar
          </Link>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-300" />
            <CardTitle className="text-sm">Overdue invoices</CardTitle>
          </div>
          <CardDescription className="mt-1">Follow up before cash flow slips.</CardDescription>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-rose-200">
            {overdueInvoices.isLoading ? "—" : overdueInvoices.data?.totalItems ?? 0}
          </p>
          <Link to="/invoices" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
            Open invoices
          </Link>
        </Card>
      </div>

      <Card className="lg:col-span-2">
        <CardTitle className="text-sm">Technicians on leave (today)</CardTitle>
        <CardDescription className="mt-1">
          Time-off overlapping today&apos;s calendar day.
        </CardDescription>
        <div className="mt-3 flex flex-wrap gap-2">
          {timeOffToday.isLoading ? (
            <span className="text-sm text-muted-foreground">Loading…</span>
          ) : timeOffToday.isError ? (
            <span className="text-sm text-muted-foreground">Unavailable</span>
          ) : (timeOffToday.data?.items.length ?? 0) === 0 ? (
            <span className="text-sm text-muted-foreground">Full roster coverage today.</span>
          ) : (
            timeOffToday.data?.items.map((e) => (
              <span
                key={e.id}
                className="inline-flex items-center rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs"
              >
                {e.technician?.name ?? "Technician"}
                {e.reason ? ` · ${e.reason}` : ""}
              </span>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}

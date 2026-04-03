import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useJobsList } from "@/services/jobs/jobs.hooks";
import { useInvoicesList } from "@/services/invoices/invoices.hooks";
import type { DashboardStat, RecentInvoiceItem, RecentJobItem } from "@/types/dashboard";
import { getDashboardAggregates } from "./dashboard.api";

export function useRecentJobs(limit = 5) {
  const query = useJobsList({ page: 1, limit });

  const items = useMemo<RecentJobItem[]>(() => {
    const rows = query.data?.items ?? [];
    return rows.map((job) => ({
      id: job.id,
      title: job.title,
      customerName: job.customer?.name ?? "Unknown customer",
      technicianName: job.technician?.name ?? "Unassigned",
      status: job.status,
      scheduledStart: job.scheduledStart
    }));
  }, [query.data?.items]);

  return { ...query, items };
}

export function useRecentInvoices(limit = 5) {
  const query = useInvoicesList({ page: 1, limit });

  const items = useMemo<RecentInvoiceItem[]>(() => {
    const rows = query.data?.items ?? [];
    return rows.map((invoice) => ({
      id: invoice.id,
      jobTitle: invoice.job?.title ?? "Unknown job",
      customerName: invoice.job?.customer?.name ?? "Unknown customer",
      total: invoice.total,
      status: invoice.status,
      issuedAt: invoice.issuedAt
    }));
  }, [query.data?.items]);

  return { ...query, items };
}

export function useDashboardSummary() {
  const aggregates = useQuery({
    queryKey: ["dashboard", "aggregates"],
    queryFn: getDashboardAggregates,
    select: (res) => res.data
  });

  const stats = useMemo<DashboardStat[]>(() => {
    const a = aggregates.data;

    return [
      {
        title: "Total Jobs",
        value: String(a?.totalJobs ?? 0),
        helper: "All work orders in system",
        accent: "blue"
      },
      {
        title: "Jobs Today",
        value: String(a?.jobsToday ?? 0),
        helper: "Scheduled for today",
        accent: "green"
      },
      {
        title: "Unassigned Jobs",
        value: String(a?.unassignedJobs ?? 0),
        helper: "Need dispatch assignment",
        accent: "amber"
      },
      {
        title: "Overdue Invoices",
        value: String(a?.overdueInvoices ?? 0),
        helper: "Require billing follow-up",
        accent: "violet"
      }
    ];
  }, [aggregates.data]);

  return { stats, isLoading: aggregates.isLoading, isError: aggregates.isError };
}


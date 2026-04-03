import type { InvoiceStatus, JobStatus } from "@/types/api";

export type DashboardStat = {
  title: string;
  value: string;
  helper: string;
  accent?: "blue" | "green" | "amber" | "violet";
};

export type RecentJobItem = {
  id: string;
  title: string;
  customerName: string;
  technicianName: string;
  status: JobStatus;
  scheduledStart?: string | null;
};

export type RecentInvoiceItem = {
  id: string;
  jobTitle: string;
  customerName: string;
  total: string;
  status: InvoiceStatus;
  issuedAt?: string | null;
};


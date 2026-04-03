import type { AuthUser } from "@/types/auth";

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type Customer = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Technician = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  skills: string[];
  color?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type JobStatus =
  | "NEW"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "INVOICED"
  | "CANCELLED";

export type Job = {
  id: string;
  title: string;
  description?: string | null;
  customerId: string;
  technicianId?: string | null;
  status: JobStatus;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string };
  technician?: { id: string; name: string } | null;
};

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "VOID";

export type Invoice = {
  id: string;
  jobId: string;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  status: InvoiceStatus;
  issuedAt?: string | null;
  dueAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: string;
    title: string;
    customer?: { id: string; name: string };
  };
};

export type LoginApiResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};


import type { Invoice, InvoiceStatus, PaginatedResponse } from "@/types/api";

export type InvoiceListItem = Invoice & {
  notes?: string | null;
  pricingRuleId?: string | null;
  pricingRule?: {
    id: string;
    name: string;
  } | null;
};

export type InvoiceDetail = InvoiceListItem;

export type InvoiceListParams = {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  customerId?: string;
  issuedAtFrom?: string;
  issuedAtTo?: string;
};

export type UpdateInvoiceValues = {
  status: InvoiceStatus;
  discount: string;
  notes: string;
  dueAt: string;
};

export type UpdateInvoicePayload = {
  status?: InvoiceStatus;
  discount?: string;
  notes?: string;
  dueAt?: string;
};

export type GenerateInvoiceValues = {
  jobId: string;
};

export type InvoiceListResponse = PaginatedResponse<InvoiceListItem>;


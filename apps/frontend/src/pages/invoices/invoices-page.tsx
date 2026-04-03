import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { DeleteInvoiceDialog } from "@/components/invoices/delete-invoice-dialog";
import { GenerateInvoiceDialog } from "@/components/invoices/generate-invoice-dialog";
import { InvoiceEmptyState } from "@/components/invoices/invoice-empty-state";
import { InvoiceFilters } from "@/components/invoices/invoice-filters";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { UpdateInvoiceDialog } from "@/components/invoices/update-invoice-dialog";
import { useCustomersList } from "@/services/customers/customers.hooks";
import {
  useDeleteInvoice,
  useGenerateInvoiceFromJob,
  useInvoicesList,
  useUpdateInvoice
} from "@/services/invoices/invoices.hooks";
import { useJobsList } from "@/services/jobs/jobs.hooks";
import type { InvoiceStatus } from "@/types/api";
import type { InvoiceListItem, UpdateInvoiceValues } from "@/types/invoices";

const PAGE_SIZE = 10;

type FiltersState = {
  status: InvoiceStatus | "";
  customerId: string;
  issuedAtFrom: string;
  issuedAtTo: string;
};

const defaultFilters: FiltersState = {
  status: "",
  customerId: "",
  issuedAtFrom: "",
  issuedAtTo: ""
};

const emptyUpdateValues: UpdateInvoiceValues = {
  status: "DRAFT",
  discount: "0",
  notes: "",
  dueAt: ""
};

function toDateTimeLocal(isoValue?: string | null) {
  if (!isoValue) return "";
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoLocal(value: string) {
  return new Date(value).toISOString();
}

function toUpdateValues(invoice: InvoiceListItem): UpdateInvoiceValues {
  return {
    status: invoice.status,
    discount: invoice.discount,
    notes: invoice.notes ?? "",
    dueAt: toDateTimeLocal(invoice.dueAt)
  };
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [updateTarget, setUpdateTarget] = useState<InvoiceListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceListItem | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const invoicesQuery = useInvoicesList({
    page,
    limit: PAGE_SIZE,
    status: filters.status || undefined,
    customerId: filters.customerId || undefined,
    issuedAtFrom: filters.issuedAtFrom || undefined,
    issuedAtTo: filters.issuedAtTo || undefined
  });
  const invoicesForGenerateQuery = useInvoicesList(
    { page: 1, limit: 250 },
    { enabled: generateOpen }
  );
  const customersQuery = useCustomersList({ page: 1, limit: 100 });
  const jobsQuery = useJobsList({ page: 1, limit: 100, status: "COMPLETED" });

  const jobIdsWithInvoice = useMemo(() => {
    const set = new Set<string>();
    for (const inv of invoicesForGenerateQuery.data?.items ?? []) {
      if (inv.status !== "VOID") set.add(inv.jobId);
    }
    return set;
  }, [invoicesForGenerateQuery.data?.items]);

  const updateMutation = useUpdateInvoice();
  const deleteMutation = useDeleteInvoice();
  const generateMutation = useGenerateInvoiceFromJob();

  const hasItems = (invoicesQuery.data?.items.length ?? 0) > 0;
  const totalPages = invoicesQuery.data?.totalPages ?? 1;
  const hasFilters = Boolean(
    filters.status || filters.customerId || filters.issuedAtFrom || filters.issuedAtTo
  );

  const onUpdateSubmit = async (values: UpdateInvoiceValues) => {
    if (!updateTarget) return;
    setUpdateError(null);
    try {
      await updateMutation.mutateAsync({
        id: updateTarget.id,
        payload: {
          status: values.status,
          discount: values.discount || undefined,
          notes: values.notes || undefined,
          dueAt: values.dueAt ? toIsoLocal(values.dueAt) : undefined
        }
      });
      setUpdateTarget(null);
      toast({ title: "Invoice updated", variant: "success" });
    } catch (error) {
      setUpdateError(error instanceof ApiError ? error.message : "Failed to update invoice.");
    }
  };

  const onDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast({ title: "Invoice deleted", variant: "success" });
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : "Failed to delete invoice.");
    }
  };

  const onGenerate = async (jobId: string) => {
    setGenerateError(null);
    try {
      const response = await generateMutation.mutateAsync(jobId);
      setGenerateOpen(false);
      const newInvoiceId = response.data.invoice.id;
      toast({ title: "Invoice generated", description: "Opening the new invoice…", variant: "success" });
      navigate(`/invoices/${newInvoiceId}`);
    } catch (error) {
      setGenerateError(error instanceof ApiError ? error.message : "Failed to generate invoice.");
    }
  };

  const paginationLabel = useMemo(() => {
    const current = invoicesQuery.data?.page ?? page;
    const pages = invoicesQuery.data?.totalPages ?? 1;
    return `Page ${current} of ${pages}`;
  }, [invoicesQuery.data?.page, invoicesQuery.data?.totalPages, page]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Revenue
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Invoices</h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Turn completed work into billing — prioritize overdue accounts and ready-to-send drafts.
          </p>
        </div>
        <Button className="font-semibold shadow-glow" onClick={() => setGenerateOpen(true)}>
          Generate from job
        </Button>
      </header>

      <InvoiceFilters
        value={filters}
        customers={customersQuery.data?.items ?? []}
        onChange={(next) => {
          setPage(1);
          setFilters(next);
        }}
        onReset={() => {
          setPage(1);
          setFilters(defaultFilters);
        }}
      />

      {invoicesQuery.isLoading ? (
        <Card>
          <CardTitle>Loading invoices...</CardTitle>
          <CardDescription className="mt-2">Fetching latest billing records.</CardDescription>
        </Card>
      ) : invoicesQuery.isError ? (
        <Card>
          <CardTitle>Unable to load invoices</CardTitle>
          <CardDescription className="mt-2">
            Please refresh the page or verify backend connectivity.
          </CardDescription>
        </Card>
      ) : !hasItems ? (
        <InvoiceEmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <InvoiceTable
            items={invoicesQuery.data?.items ?? []}
            onUpdate={(invoice) => {
              setUpdateError(null);
              setUpdateTarget(invoice);
            }}
            onDelete={(invoice) => {
              setDeleteError(null);
              setDeleteTarget(invoice);
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{paginationLabel}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <UpdateInvoiceDialog
        open={Boolean(updateTarget)}
        initialValues={updateTarget ? toUpdateValues(updateTarget) : emptyUpdateValues}
        currentStatus={updateTarget?.status ?? "DRAFT"}
        isSubmitting={updateMutation.isPending}
        error={updateError}
        onClose={() => {
          setUpdateError(null);
          setUpdateTarget(null);
        }}
        onSubmit={onUpdateSubmit}
      />

      <DeleteInvoiceDialog
        open={Boolean(deleteTarget)}
        invoiceId={deleteTarget?.id}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
        onCancel={() => {
          setDeleteError(null);
          setDeleteTarget(null);
        }}
        onConfirm={onDeleteConfirm}
      />

      <GenerateInvoiceDialog
        open={generateOpen}
        jobs={jobsQuery.data?.items ?? []}
        jobIdsWithInvoice={jobIdsWithInvoice}
        isSubmitting={generateMutation.isPending}
        error={generateError}
        onClose={() => {
          setGenerateError(null);
          setGenerateOpen(false);
        }}
        onSubmit={onGenerate}
      />
    </div>
  );
}


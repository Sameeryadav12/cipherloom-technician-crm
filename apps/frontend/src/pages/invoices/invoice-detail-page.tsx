import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { DeleteInvoiceDialog } from "@/components/invoices/delete-invoice-dialog";
import { InvoiceDetailCard } from "@/components/invoices/invoice-detail-card";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { UpdateInvoiceDialog } from "@/components/invoices/update-invoice-dialog";
import {
  useDeleteInvoice,
  useInvoice,
  useUpdateInvoice
} from "@/services/invoices/invoices.hooks";
import type { UpdateInvoiceValues } from "@/types/invoices";

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

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceId = id ?? "";

  const invoiceQuery = useInvoice(invoiceId);
  const updateMutation = useUpdateInvoice();
  const deleteMutation = useDeleteInvoice();

  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!invoiceId) {
    return (
      <Card>
        <CardTitle>Invoice not found</CardTitle>
        <CardDescription className="mt-2">Missing invoice identifier in route.</CardDescription>
      </Card>
    );
  }

  if (invoiceQuery.isLoading) {
    return (
      <Card>
        <CardTitle>Loading invoice...</CardTitle>
        <CardDescription className="mt-2">Fetching invoice details.</CardDescription>
      </Card>
    );
  }

  if (invoiceQuery.isError || !invoiceQuery.data) {
    return (
      <Card>
        <CardTitle>Invoice not available</CardTitle>
        <CardDescription className="mt-2">
          This invoice could not be loaded or may not exist.
        </CardDescription>
      </Card>
    );
  }

  const initialValues: UpdateInvoiceValues = {
    status: invoiceQuery.data.status,
    discount: invoiceQuery.data.discount,
    notes: invoiceQuery.data.notes ?? "",
    dueAt: toDateTimeLocal(invoiceQuery.data.dueAt)
  };

  const onUpdate = async (values: UpdateInvoiceValues) => {
    setUpdateError(null);
    try {
      await updateMutation.mutateAsync({
        id: invoiceId,
        payload: {
          status: values.status,
          discount: values.discount || undefined,
          notes: values.notes || undefined,
          dueAt: values.dueAt ? toIsoLocal(values.dueAt) : undefined
        }
      });
      setUpdateOpen(false);
    } catch (error) {
      setUpdateError(error instanceof ApiError ? error.message : "Failed to update invoice.");
    }
  };

  const onDelete = async () => {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(invoiceId);
      navigate("/invoices", { replace: true });
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : "Failed to delete invoice.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border/60 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Billing
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Invoice</h1>
            <InvoiceStatusBadge status={invoiceQuery.data.status} />
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            {invoiceQuery.data.job?.customer?.name
              ? `${invoiceQuery.data.job.customer.name} · ${invoiceQuery.data.job.title ?? "Job"}`
              : "Review totals, due dates, and status before you follow up or mark paid."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/invoices")}>
            Back
          </Button>
          {invoiceQuery.data.jobId ? (
            <Button variant="outline" onClick={() => navigate(`/jobs/${invoiceQuery.data!.jobId}`)}>
              View job
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => setUpdateOpen(true)}>
            Update
          </Button>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-md border border-red-500/45 bg-red-950/25 px-4 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-950/40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
            )}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </button>
        </div>
      </header>

      <InvoiceDetailCard invoice={invoiceQuery.data} />

      <UpdateInvoiceDialog
        open={updateOpen}
        initialValues={initialValues}
        currentStatus={invoiceQuery.data.status}
        isSubmitting={updateMutation.isPending}
        error={updateError}
        onClose={() => {
          setUpdateError(null);
          setUpdateOpen(false);
        }}
        onSubmit={onUpdate}
      />

      <DeleteInvoiceDialog
        open={deleteOpen}
        invoiceId={invoiceQuery.data.id}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
        onCancel={() => {
          setDeleteError(null);
          setDeleteOpen(false);
        }}
        onConfirm={onDelete}
      />
    </div>
  );
}


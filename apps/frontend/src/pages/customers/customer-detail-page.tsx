import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Briefcase, FileText, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { buildCustomerOpsMap } from "@/lib/customer-ops-summary";
import { formatShortDate, formatShortDateTime } from "@/lib/format-datetime";
import { cn } from "@/lib/utils";
import { CustomerDeleteDialog } from "@/components/customers/customer-delete-dialog";
import { CustomerDetailCard } from "@/components/customers/customer-detail-card";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import {
  useCustomer,
  useCustomersList,
  useDeleteCustomer,
  useUpdateCustomer
} from "@/services/customers/customers.hooks";
import { useInvoicesList } from "@/services/invoices/invoices.hooks";
import { useJobsList } from "@/services/jobs/jobs.hooks";
import type { CustomerFormValues } from "@/types/customers";

const emptyFormValues: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  suburb: "",
  state: "",
  postcode: "",
  country: "",
  notes: ""
};

function toPayload(values: CustomerFormValues) {
  return {
    name: values.name,
    email: values.email || undefined,
    phone: values.phone || undefined,
    addressLine1: values.addressLine1 || undefined,
    addressLine2: values.addressLine2 || undefined,
    suburb: values.suburb || undefined,
    state: values.state || undefined,
    postcode: values.postcode || undefined,
    country: values.country || undefined,
    notes: values.notes || undefined
  };
}

function StatCard({
  label,
  value,
  hint,
  tone
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm",
        tone === "warn" && "border-amber-500/35 bg-amber-950/15",
        tone === "accent" && "border-primary/35 bg-primary/10",
        (!tone || tone === "default") && "border-border/80 bg-card/40"
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const customerId = id ?? "";

  const query = useCustomer(customerId);
  const jobsQuery = useJobsList({ customerId, page: 1, limit: 50 }, { enabled: Boolean(customerId) });
  const invoicesQuery = useInvoicesList({ customerId, page: 1, limit: 50 }, { enabled: Boolean(customerId) });
  const peersQuery = useCustomersList({ page: 1, limit: 250 }, { enabled: Boolean(query.data) });

  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const jobs = jobsQuery.data?.items ?? [];
  const invoices = invoicesQuery.data?.items ?? [];

  const kpis = useMemo(() => {
    const m = buildCustomerOpsMap(jobs, invoices);
    return m.get(customerId) ?? {
      openJobs: 0,
      unpaidInvoices: 0,
      overdueInvoices: 0,
      completedJobs: 0,
      latestJobAt: null,
      lastActivityAt: null
    };
  }, [customerId, jobs, invoices]);

  const invoiceReadyJobs = useMemo(
    () => jobs.filter((j) => j.status === "COMPLETED"),
    [jobs]
  );

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [jobs]
  );
  const sortedInvoices = useMemo(
    () =>
      [...invoices].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [invoices]
  );

  const initialValues: CustomerFormValues = query.data
    ? {
        name: query.data.name ?? "",
        email: query.data.email ?? "",
        phone: query.data.phone ?? "",
        addressLine1: query.data.addressLine1 ?? "",
        addressLine2: query.data.addressLine2 ?? "",
        suburb: query.data.suburb ?? "",
        state: query.data.state ?? "",
        postcode: query.data.postcode ?? "",
        country: query.data.country ?? "",
        notes: query.data.notes ?? ""
      }
    : emptyFormValues;

  const onSubmitEdit = async (values: CustomerFormValues) => {
    if (!customerId) return;
    setFormError(null);
    try {
      await updateMutation.mutateAsync({
        id: customerId,
        payload: toPayload(values)
      });
      setEditOpen(false);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Failed to update customer.");
    }
  };

  const onConfirmDelete = async () => {
    if (!customerId) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(customerId);
      navigate("/customers", { replace: true });
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : "Failed to delete customer.");
    }
  };

  if (!customerId) {
    return (
      <Card>
        <CardTitle>Customer not found</CardTitle>
        <CardDescription className="mt-2">Missing customer identifier in route.</CardDescription>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <Card>
        <CardTitle>Loading customer...</CardTitle>
        <CardDescription className="mt-2">Fetching customer details.</CardDescription>
      </Card>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Card>
        <CardTitle>Customer not available</CardTitle>
        <CardDescription className="mt-2">
          This customer could not be loaded or may not exist.
        </CardDescription>
      </Card>
    );
  }

  const c = query.data;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Customer
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{c.name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {c.email ? <span>{c.email}</span> : null}
            {c.phone ? <span>{c.phone}</span> : null}
            <span>Updated {formatShortDateTime(c.updatedAt)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/customers")}>
            Back
          </Button>
          <Link
            to={`/jobs?new=1&customerId=${customerId}`}
            className={cn(
              "inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <Briefcase className="mr-2 h-4 w-4" />
            New job
          </Link>
          <Link
            to="/invoices"
            className={cn(
              "inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <FileText className="mr-2 h-4 w-4" />
            Invoices
          </Link>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
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

      {(kpis.openJobs > 0 || kpis.unpaidInvoices > 0 || invoiceReadyJobs.length > 0) && (
        <Card className="border-primary/25 bg-gradient-to-r from-primary/10 via-card to-card">
          <CardTitle className="text-base">Next best actions</CardTitle>
          <CardDescription className="mt-1">
            Operational suggestions based on this account&apos;s current jobs and billing.
          </CardDescription>
          <ul className="mt-3 space-y-2 text-sm">
            {kpis.openJobs > 0 ? (
              <li className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-sky-300" />
                <Link className="font-medium text-primary hover:underline" to={`/jobs?customerId=${customerId}`}>
                  Review {kpis.openJobs} open job{kpis.openJobs === 1 ? "" : "s"}
                </Link>
              </li>
            ) : null}
            {kpis.unpaidInvoices > 0 ? (
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                <span>
                  {kpis.unpaidInvoices} unpaid invoice{kpis.unpaidInvoices === 1 ? "" : "s"}
                  {kpis.overdueInvoices > 0
                    ? ` (${kpis.overdueInvoices} overdue) — follow up in Invoices.`
                    : " — review in Invoices."}
                </span>
              </li>
            ) : null}
            {invoiceReadyJobs.length > 0 ? (
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-300" />
                <Link className="font-medium text-primary hover:underline" to="/invoices">
                  Generate billing for {invoiceReadyJobs.length} completed job
                  {invoiceReadyJobs.length === 1 ? "" : "s"}
                </Link>
              </li>
            ) : null}
          </ul>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open jobs"
          value={kpis.openJobs}
          tone={kpis.openJobs > 0 ? "accent" : "default"}
        />
        <StatCard label="Completed / invoiced jobs" value={kpis.completedJobs} />
        <StatCard
          label="Unpaid invoices"
          value={kpis.unpaidInvoices}
          tone={kpis.unpaidInvoices > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Lifetime invoices"
          value={invoices.length}
          hint={kpis.latestJobAt ? `Latest job activity ${formatShortDate(kpis.latestJobAt)}` : undefined}
        />
      </div>

      <CustomerDetailCard customer={c} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Jobs</h2>
          <Link
            to={`/jobs?customerId=${customerId}`}
            className={cn(
              "inline-flex h-8 items-center justify-center rounded-md border border-border bg-transparent px-3 text-xs font-medium transition-colors hover:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            View in Jobs
          </Link>
        </div>
        {jobsQuery.isLoading ? (
          <Card>
            <CardDescription>Loading jobs…</CardDescription>
          </Card>
        ) : sortedJobs.length === 0 ? (
          <Card>
            <CardTitle className="text-base">No jobs yet</CardTitle>
            <CardDescription className="mt-2">
              Create a work order to start the service history for this customer.
            </CardDescription>
            <Link
              to={`/jobs?new=1&customerId=${customerId}`}
              className={cn(
                "mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:brightness-110",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              Create first job
            </Link>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Job</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Technician</th>
                  <th className="px-4 py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {sortedJobs.map((job) => (
                  <tr key={job.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <Link to={`/jobs/${job.id}`} className="font-medium hover:text-primary hover:underline">
                        {job.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <JobStatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {job.technician?.name ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {formatShortDate(job.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Invoices</h2>
          <Link
            to="/invoices"
            className={cn(
              "inline-flex h-8 items-center justify-center rounded-md border border-border bg-transparent px-3 text-xs font-medium transition-colors hover:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            Open Invoices
          </Link>
        </div>
        {invoicesQuery.isLoading ? (
          <Card>
            <CardDescription>Loading invoices…</CardDescription>
          </Card>
        ) : sortedInvoices.length === 0 ? (
          <Card>
            <CardTitle className="text-base">No invoices yet</CardTitle>
            <CardDescription className="mt-2">
              Completed jobs can be billed from the Invoices module.
            </CardDescription>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Invoice</th>
                  <th className="px-4 py-2">Job</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Due</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {inv.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{inv.job?.title ?? "—"}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
                        Number(inv.total)
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{formatShortDate(inv.dueAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Activity</h2>
        <Card>
          <CardDescription>
            Combined job and invoice timestamps for this customer (from loaded records).
          </CardDescription>
          <ul className="mt-3 space-y-2 text-sm">
            {sortedJobs.slice(0, 5).map((job) => (
              <li key={job.id} className="flex justify-between gap-4 border-b border-border/40 pb-2 last:border-0">
                <span>
                  Job <span className="font-medium">{job.title}</span> ·{" "}
                  <JobStatusBadge status={job.status} />
                </span>
                <span className="shrink-0 text-muted-foreground">{formatShortDateTime(job.updatedAt)}</span>
              </li>
            ))}
            {sortedJobs.length === 0 ? (
              <li className="text-muted-foreground">No job updates to show.</li>
            ) : null}
          </ul>
        </Card>
      </section>

      <CustomerFormDialog
        open={editOpen}
        title="Edit customer"
        description="Keep contact and address current for technicians and billing."
        initialValues={initialValues}
        submitLabel="Save changes"
        isSubmitting={updateMutation.isPending}
        serverError={formError}
        peerCustomers={peersQuery.data?.items ?? []}
        excludeCustomerId={customerId}
        onClose={() => {
          setFormError(null);
          setEditOpen(false);
        }}
        onSubmit={onSubmitEdit}
      />

      <CustomerDeleteDialog
        open={deleteOpen}
        customerName={c.name}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
        onCancel={() => {
          setDeleteError(null);
          setDeleteOpen(false);
        }}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

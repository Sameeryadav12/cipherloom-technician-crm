import { useEffect, useMemo, useState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { buildCustomerOpsMap } from "@/lib/customer-ops-summary";
import { cn } from "@/lib/utils";
import { CustomerDeleteDialog } from "@/components/customers/customer-delete-dialog";
import { CustomerEmptyState } from "@/components/customers/customer-empty-state";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { CustomerSearchBar } from "@/components/customers/customer-search-bar";
import { CustomerTable } from "@/components/customers/customer-table";
import {
  useCreateCustomer,
  useCustomersList,
  useDeleteCustomer,
  useUpdateCustomer
} from "@/services/customers/customers.hooks";
import { useInvoicesList } from "@/services/invoices/invoices.hooks";
import { useJobsList } from "@/services/jobs/jobs.hooks";
import type { CustomerFormValues, CustomerListItem } from "@/types/customers";

const PAGE_SIZE = 10;
const OPS_FETCH = 300;

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

type OpsFilter = "all" | "openWork" | "billingRisk";

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

function toFormValues(item: CustomerListItem): CustomerFormValues {
  return {
    name: item.name ?? "",
    email: item.email ?? "",
    phone: item.phone ?? "",
    addressLine1: item.addressLine1 ?? "",
    addressLine2: item.addressLine2 ?? "",
    suburb: item.suburb ?? "",
    state: item.state ?? "",
    postcode: item.postcode ?? "",
    country: item.country ?? "",
    notes: item.notes ?? ""
  };
}

export function CustomersPage() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [opsFilter, setOpsFilter] = useState<OpsFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomerListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerListItem | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const query = useCustomersList({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined
  });

  const jobsOpsQuery = useJobsList({ page: 1, limit: OPS_FETCH });
  const invoicesOpsQuery = useInvoicesList({ page: 1, limit: OPS_FETCH });

  const modalPeersQuery = useCustomersList(
    { page: 1, limit: 250 },
    { enabled: createOpen || Boolean(editTarget) }
  );

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const opsMap = useMemo(
    () =>
      buildCustomerOpsMap(
        jobsOpsQuery.data?.items ?? [],
        invoicesOpsQuery.data?.items ?? []
      ),
    [jobsOpsQuery.data?.items, invoicesOpsQuery.data?.items]
  );

  const rawItems = query.data?.items ?? [];
  const displayedItems = useMemo(() => {
    if (opsFilter === "all") return rawItems;
    return rawItems.filter((c) => {
      const o = opsMap.get(c.id);
      const open = o?.openJobs ?? 0;
      const risk = (o?.unpaidInvoices ?? 0) > 0 || (o?.overdueInvoices ?? 0) > 0;
      if (opsFilter === "openWork") return open > 0;
      if (opsFilter === "billingRisk") return risk;
      return true;
    });
  }, [opsFilter, opsMap, rawItems]);

  const hasItems = rawItems.length > 0;
  const totalPages = query.data?.totalPages ?? 0;

  const onCreateSubmit = async (values: CustomerFormValues) => {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync(toPayload(values));
      setCreateOpen(false);
      toast({ title: "Customer created", variant: "success" });
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Failed to create customer.");
    }
  };

  const onEditSubmit = async (values: CustomerFormValues) => {
    if (!editTarget) return;
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({
        id: editTarget.id,
        payload: toPayload(values)
      });
      setEditTarget(null);
      toast({ title: "Customer updated", variant: "success" });
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Failed to update customer.");
    }
  };

  const onDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast({ title: "Customer deleted", variant: "success" });
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : "Failed to delete customer.");
    }
  };

  const paginationLabel = useMemo(() => {
    const current = query.data?.page ?? page;
    const pages = query.data?.totalPages ?? 1;
    return `Page ${current} of ${pages}`;
  }, [page, query.data?.page, query.data?.totalPages]);

  const peerCustomers = modalPeersQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Accounts
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Customers</h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            CRM-style account hub — see open work and billing pressure at a glance, then drill into jobs
            and invoices.
          </p>
        </div>
        <Button className="font-semibold shadow-glow" onClick={() => setCreateOpen(true)}>
          Create customer
        </Button>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CustomerSearchBar value={searchInput} onChange={setSearchInput} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">This page</span>
          {(
            [
              ["all", "All"],
              ["openWork", "Open work"],
              ["billingRisk", "Billing risk"]
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              variant={opsFilter === key ? "default" : "outline"}
              className={cn("h-8 px-3 text-xs", opsFilter === key && "shadow-glow")}
              onClick={() => setOpsFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Work and billing columns use the latest {OPS_FETCH} jobs and invoices — refine with search for
        full accuracy on large datasets.
      </p>

      {query.isLoading ? (
        <Card>
          <CardTitle>Loading customers...</CardTitle>
          <CardDescription className="mt-2">Fetching latest customer records.</CardDescription>
          <div className="mt-4 space-y-2">
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
          </div>
        </Card>
      ) : query.isError ? (
        <Card>
          <CardTitle>Unable to load customers</CardTitle>
          <CardDescription className="mt-2">
            Please refresh the page or verify backend connectivity.
          </CardDescription>
        </Card>
      ) : !hasItems ? (
        <CustomerEmptyState hasSearch={Boolean(debouncedSearch)} />
      ) : displayedItems.length === 0 ? (
        <Card>
          <CardTitle>No matches on this page</CardTitle>
          <CardDescription className="mt-2">
            Try another filter, move to another page, or clear the operational filter to see everyone
            listed here.
          </CardDescription>
          <Button variant="outline" className="mt-4" onClick={() => setOpsFilter("all")}>
            Clear operational filter
          </Button>
        </Card>
      ) : (
        <>
          <CustomerTable
            items={displayedItems}
            opsByCustomerId={opsMap}
            onEdit={(item) => {
              setSubmitError(null);
              setEditTarget(item);
            }}
            onDelete={(item) => {
              setDeleteError(null);
              setDeleteTarget(item);
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{paginationLabel}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <CustomerFormDialog
        open={createOpen}
        title="Create customer"
        description="Structured profile so dispatch and billing stay aligned on every job."
        initialValues={emptyFormValues}
        submitLabel="Create customer"
        isSubmitting={createMutation.isPending}
        serverError={submitError}
        peerCustomers={peerCustomers}
        onClose={() => {
          setSubmitError(null);
          setCreateOpen(false);
        }}
        onSubmit={onCreateSubmit}
      />

      <CustomerFormDialog
        open={Boolean(editTarget)}
        title="Edit customer"
        description="Update contact and address — changes flow through to open jobs where linked."
        initialValues={editTarget ? toFormValues(editTarget) : emptyFormValues}
        submitLabel="Save changes"
        isSubmitting={updateMutation.isPending}
        serverError={submitError}
        peerCustomers={peerCustomers}
        excludeCustomerId={editTarget?.id}
        onClose={() => {
          setSubmitError(null);
          setEditTarget(null);
        }}
        onSubmit={onEditSubmit}
      />

      <CustomerDeleteDialog
        open={Boolean(deleteTarget)}
        customerName={deleteTarget?.name}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
        onCancel={() => {
          setDeleteError(null);
          setDeleteTarget(null);
        }}
        onConfirm={onDeleteConfirm}
      />
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { AssignTechnicianDialog } from "@/components/jobs/assign-technician-dialog";
import { RescheduleJobDialog } from "@/components/dispatch/reschedule-job-dialog";
import { JobDeleteDialog } from "@/components/jobs/job-delete-dialog";
import { JobEmptyState } from "@/components/jobs/job-empty-state";
import { JobFilters, type JobQuickPreset } from "@/components/jobs/job-filters";
import { JobFormDialog } from "@/components/jobs/job-form-dialog";
import { JobTable } from "@/components/jobs/job-table";
import { UpdateJobStatusDialog } from "@/components/jobs/update-job-status-dialog";
import { useCustomersList } from "@/services/customers/customers.hooks";
import {
  useAssignTechnician,
  useCreateJob,
  useDeleteJob,
  useJobsList,
  usePricingRulesList,
  useUpdateJob,
  useUpdateJobStatus
} from "@/services/jobs/jobs.hooks";
import { useTechniciansList } from "@/services/technicians/technicians.hooks";
import type { JobStatus } from "@/types/api";
import type { RescheduleJobContext } from "@/types/dispatch";
import type { JobFormValues, JobListItem, JobPayload } from "@/types/jobs";

const PAGE_SIZE = 10;
const FETCH_WINDOW = 100;

const emptyFormValues: JobFormValues = {
  title: "",
  customerId: "",
  technicianId: "",
  description: "",
  scheduledStart: "",
  scheduledEnd: "",
  pricingRuleId: ""
};

type FiltersState = {
  status: JobStatus | "";
  customerId: string;
  technicianId: string;
  scheduledStartFrom: string;
  scheduledStartTo: string;
};

const defaultFilters: FiltersState = {
  status: "",
  customerId: "",
  technicianId: "",
  scheduledStartFrom: "",
  scheduledStartTo: ""
};

function toYyyyMmDd(d: Date) {
  return d.toISOString().slice(0, 10);
}

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

function toPayload(values: JobFormValues): JobPayload {
  return {
    title: values.title,
    customerId: values.customerId,
    technicianId: values.technicianId || undefined,
    description: values.description || undefined,
    scheduledStart: values.scheduledStart ? toIsoLocal(values.scheduledStart) : undefined,
    scheduledEnd: values.scheduledEnd ? toIsoLocal(values.scheduledEnd) : undefined,
    pricingRuleId: values.pricingRuleId || undefined
  };
}

function toFormValues(item: JobListItem): JobFormValues {
  return {
    title: item.title,
    customerId: item.customerId,
    technicianId: item.technicianId ?? "",
    description: item.description ?? "",
    scheduledStart: toDateTimeLocal(item.scheduledStart),
    scheduledEnd: toDateTimeLocal(item.scheduledEnd),
    pricingRuleId: item.pricingRuleId ?? ""
  };
}

type SchedulingJobPrefill = {
  customerId?: string;
  title?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  technicianId?: string;
};

export function JobsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [quickPreset, setQuickPreset] = useState<JobQuickPreset>("all");
  const [titleSearch, setTitleSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<JobListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobListItem | null>(null);
  const [assignTarget, setAssignTarget] = useState<JobListItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<JobListItem | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<RescheduleJobContext | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [createPrefillCustomerId, setCreatePrefillCustomerId] = useState("");
  const [createSchedulingPrefill, setCreateSchedulingPrefill] = useState<Partial<JobFormValues>>({});
  const syncedCustomerFromUrl = useRef(false);
  const handledSchedulingNavKey = useRef<string | null>(null);

  const clientFilter =
    quickPreset === "unassigned" || Boolean(titleSearch.trim());

  useEffect(() => {
    if (syncedCustomerFromUrl.current) return;
    const cid = searchParams.get("customerId")?.trim() ?? "";
    if (cid) {
      syncedCustomerFromUrl.current = true;
      setFilters((f) => ({ ...f, customerId: cid }));
      setQuickPreset("all");
      setPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      const cid = searchParams.get("customerId")?.trim() ?? "";
      if (cid) setCreatePrefillCustomerId(cid);
      setCreateOpen(true);
      searchParams.delete("new");
      searchParams.delete("customerId");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const prefill = (location.state as { schedulingJobPrefill?: SchedulingJobPrefill } | null)?.schedulingJobPrefill;
    if (!prefill) return;
    if (handledSchedulingNavKey.current === location.key) return;
    handledSchedulingNavKey.current = location.key;
    setCreateSchedulingPrefill({
      customerId: prefill.customerId ?? "",
      title: prefill.title ?? "",
      scheduledStart: prefill.scheduledStart ? toDateTimeLocal(prefill.scheduledStart) : "",
      scheduledEnd: prefill.scheduledEnd ? toDateTimeLocal(prefill.scheduledEnd) : "",
      technicianId: prefill.technicianId ?? ""
    });
    setCreateOpen(true);
    navigate(`${location.pathname}${location.search ? location.search : ""}`, { replace: true, state: {} });
  }, [location.key, location.pathname, location.search, location.state, navigate]);

  const createInitialValues = useMemo(
    () => ({
      ...emptyFormValues,
      ...createSchedulingPrefill,
      customerId: createSchedulingPrefill.customerId || createPrefillCustomerId || ""
    }),
    [createPrefillCustomerId, createSchedulingPrefill]
  );

  const jobsQuery = useJobsList({
    page: clientFilter ? 1 : page,
    limit: clientFilter ? FETCH_WINDOW : PAGE_SIZE,
    status: filters.status || undefined,
    technicianId: filters.technicianId || undefined,
    customerId: filters.customerId || undefined,
    scheduledStartFrom: filters.scheduledStartFrom || undefined,
    scheduledStartTo: filters.scheduledStartTo || undefined
  });
  const customersQuery = useCustomersList({ page: 1, limit: 100 });
  const techniciansQuery = useTechniciansList({ page: 1, limit: 100 });
  const pricingRulesQuery = usePricingRulesList();

  const createMutation = useCreateJob();
  const updateMutation = useUpdateJob();
  const deleteMutation = useDeleteJob();
  const assignMutation = useAssignTechnician();
  const statusMutation = useUpdateJobStatus();

  const displayedItems = useMemo(() => {
    let rows = jobsQuery.data?.items ?? [];
    if (quickPreset === "unassigned") {
      rows = rows.filter((j) => !j.technicianId);
    }
    const q = titleSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter((j) => j.title.toLowerCase().includes(q));
    }
    return rows;
  }, [jobsQuery.data?.items, quickPreset, titleSearch]);

  const hasItems = displayedItems.length > 0;
  const totalPages = jobsQuery.data?.totalPages ?? 1;
  const hasFilters = Boolean(
    filters.status ||
      filters.customerId ||
      filters.technicianId ||
      filters.scheduledStartFrom ||
      filters.scheduledStartTo ||
      titleSearch.trim() ||
      quickPreset !== "all"
  );

  const applyQuickPreset = (preset: JobQuickPreset) => {
    setQuickPreset(preset);
    setPage(1);
    const today = toYyyyMmDd(new Date());
    switch (preset) {
      case "all":
        setFilters(defaultFilters);
        break;
      case "today":
        setFilters({ ...defaultFilters, scheduledStartFrom: today, scheduledStartTo: today });
        break;
      case "unassigned":
        setFilters(defaultFilters);
        break;
      case "needs_scheduling":
        setFilters({ ...defaultFilters, status: "NEW" });
        break;
      case "invoice_ready":
        setFilters({ ...defaultFilters, status: "COMPLETED" });
        break;
      case "cancelled":
        setFilters({ ...defaultFilters, status: "CANCELLED" });
        break;
      default:
        break;
    }
  };

  const resetAll = () => {
    setFilters(defaultFilters);
    setQuickPreset("all");
    setTitleSearch("");
    setPage(1);
  };

  const onCreateSubmit = async (values: JobFormValues) => {
    setFormError(null);
    try {
      await createMutation.mutateAsync(toPayload(values));
      setCreateOpen(false);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Failed to create job.");
    }
  };

  const onEditSubmit = async (values: JobFormValues) => {
    if (!editTarget) return;
    setFormError(null);
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, payload: toPayload(values) });
      setEditTarget(null);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Failed to update job.");
    }
  };

  const onDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : "Failed to delete job.");
    }
  };

  const onAssignSubmit = async (technicianId: string) => {
    if (!assignTarget) return;
    setAssignError(null);
    try {
      await assignMutation.mutateAsync({ id: assignTarget.id, technicianId });
      setAssignTarget(null);
    } catch (error) {
      setAssignError(error instanceof ApiError ? error.message : "Failed to assign technician.");
    }
  };

  const onStatusSubmit = async (status: JobStatus) => {
    if (!statusTarget) return;
    setStatusError(null);
    try {
      await statusMutation.mutateAsync({ id: statusTarget.id, status });
      setStatusTarget(null);
    } catch (error) {
      setStatusError(error instanceof ApiError ? error.message : "Failed to update status.");
    }
  };

  const paginationLabel = useMemo(() => {
    if (clientFilter) {
      return `Showing ${displayedItems.length} filtered (fetched up to ${FETCH_WINDOW})`;
    }
    const current = jobsQuery.data?.page ?? page;
    const pages = jobsQuery.data?.totalPages ?? 1;
    return `Page ${current} of ${pages}`;
  }, [
    clientFilter,
    displayedItems.length,
    jobsQuery.data?.page,
    jobsQuery.data?.totalPages,
    page
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Dispatch
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Jobs</h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Triage, assign, and schedule work orders — prioritize unassigned and invoice-ready jobs
            before they slip.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-primary/35 bg-primary/10 font-medium text-primary hover:bg-primary/20"
            onClick={() => navigate("/scheduling")}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Smart Scheduling
          </Button>
          <Button
            className="font-semibold shadow-glow"
            onClick={() => {
              setCreateSchedulingPrefill({});
              handledSchedulingNavKey.current = null;
              setCreateOpen(true);
            }}
          >
            Create job
          </Button>
        </div>
      </header>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-card/80 to-card/95">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Conflict-free scheduling, faster
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              Let Smart Scheduling rank technicians, time windows, and skills so dispatchers spend less
              time guessing. Open the assistant anytime — or jump from the job menu.
            </CardDescription>
          </div>
          <Button variant="default" className="shrink-0" onClick={() => navigate("/scheduling")}>
            Open assistant
          </Button>
        </div>
      </Card>

      <JobFilters
        value={filters}
        customers={customersQuery.data?.items ?? []}
        technicians={techniciansQuery.data?.items ?? []}
        quickPreset={quickPreset}
        onQuickPreset={applyQuickPreset}
        search={titleSearch}
        onSearchChange={setTitleSearch}
        onChange={(next) => {
          setPage(1);
          setFilters(next);
          setQuickPreset("all");
        }}
        onReset={resetAll}
      />

      {jobsQuery.isLoading ? (
        <Card>
          <CardTitle>Loading jobs…</CardTitle>
          <CardDescription className="mt-2">Syncing work orders from the server.</CardDescription>
          <div className="mt-4 space-y-2">
            <div className="h-10 animate-pulse rounded-lg bg-muted/60" />
            <div className="h-10 animate-pulse rounded-lg bg-muted/60" />
          </div>
        </Card>
      ) : jobsQuery.isError ? (
        <Card className="border-red-500/30">
          <CardTitle>Unable to load jobs</CardTitle>
          <CardDescription className="mt-2">
            Please refresh the page or verify backend connectivity.
          </CardDescription>
        </Card>
      ) : !hasItems ? (
        <JobEmptyState hasFilters={hasFilters} />
      ) : (
        <>
          {(clientFilter || quickPreset !== "all") && (
            <p className="text-xs text-muted-foreground">
              {quickPreset === "unassigned"
                ? "Showing jobs without a technician (from the latest fetch)."
                : null}
              {titleSearch.trim() ? ` Title search matches ${displayedItems.length} row(s).` : null}
            </p>
          )}
          <JobTable
            items={displayedItems}
            onEdit={(job) => {
              setFormError(null);
              setEditTarget(job);
            }}
            onDelete={(job) => {
              setDeleteError(null);
              setDeleteTarget(job);
            }}
            onAssignTechnician={(job) => {
              setAssignError(null);
              setAssignTarget(job);
            }}
            onUpdateStatus={(job) => {
              setStatusError(null);
              setStatusTarget(job);
            }}
            onReschedule={(job) =>
              setRescheduleTarget({
                jobId: job.id,
                title: job.title,
                customerId: job.customerId,
                customerName: job.customer?.name,
                technicianId: job.technicianId,
                technicianName: job.technician?.name,
                scheduledStart: job.scheduledStart,
                scheduledEnd: job.scheduledEnd,
                status: job.status
              })
            }
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{paginationLabel}</p>
            {!clientFilter ? (
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
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  resetAll();
                }}
              >
                Clear local filters
              </Button>
            )}
          </div>
        </>
      )}

      <JobFormDialog
        open={createOpen}
        title="Create job"
        description="Capture the essentials. Use Smart Scheduling when you want ranked slot suggestions."
        initialValues={createInitialValues}
        customers={customersQuery.data?.items ?? []}
        technicians={techniciansQuery.data?.items ?? []}
        pricingRules={pricingRulesQuery.data ?? []}
        submitLabel="Create job"
        isSubmitting={createMutation.isPending}
        serverError={formError}
        onClose={() => {
          setFormError(null);
          setCreatePrefillCustomerId("");
          setCreateSchedulingPrefill({});
          handledSchedulingNavKey.current = null;
          setCreateOpen(false);
        }}
        onSubmit={onCreateSubmit}
      />

      <JobFormDialog
        open={Boolean(editTarget)}
        title="Edit job"
        description="Adjust assignment, window, or billing rule. Smart Scheduling can propose alternatives."
        initialValues={editTarget ? toFormValues(editTarget) : emptyFormValues}
        customers={customersQuery.data?.items ?? []}
        technicians={techniciansQuery.data?.items ?? []}
        pricingRules={pricingRulesQuery.data ?? []}
        submitLabel="Save changes"
        isSubmitting={updateMutation.isPending}
        serverError={formError}
        onClose={() => {
          setFormError(null);
          setEditTarget(null);
        }}
        onSubmit={onEditSubmit}
      />

      <JobDeleteDialog
        open={Boolean(deleteTarget)}
        jobTitle={deleteTarget?.title}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
        onCancel={() => {
          setDeleteError(null);
          setDeleteTarget(null);
        }}
        onConfirm={onDeleteConfirm}
      />

      <AssignTechnicianDialog
        open={Boolean(assignTarget)}
        technicians={techniciansQuery.data?.items ?? []}
        currentTechnicianName={assignTarget?.technician?.name}
        isSubmitting={assignMutation.isPending}
        error={assignError}
        onClose={() => {
          setAssignError(null);
          setAssignTarget(null);
        }}
        onSubmit={onAssignSubmit}
      />

      <UpdateJobStatusDialog
        open={Boolean(statusTarget)}
        currentStatus={statusTarget?.status ?? "NEW"}
        isSubmitting={statusMutation.isPending}
        error={statusError}
        onClose={() => {
          setStatusError(null);
          setStatusTarget(null);
        }}
        onSubmit={onStatusSubmit}
      />
      <RescheduleJobDialog
        open={Boolean(rescheduleTarget)}
        context={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
      />
    </div>
  );
}

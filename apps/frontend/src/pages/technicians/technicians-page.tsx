import { useEffect, useMemo, useState } from "react";
import { localDayRangeIso } from "@/lib/date-ranges";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { TechnicianDeleteDialog } from "@/components/technicians/technician-delete-dialog";
import { TechnicianEmptyState } from "@/components/technicians/technician-empty-state";
import { TechnicianFormDialog } from "@/components/technicians/technician-form-dialog";
import { TechnicianSearchBar } from "@/components/technicians/technician-search-bar";
import { TechnicianTable } from "@/components/technicians/technician-table";
import { useJobsList } from "@/services/jobs/jobs.hooks";
import {
  useCreateTechnician,
  useDeleteTechnician,
  useTechniciansList,
  useUpdateTechnician
} from "@/services/technicians/technicians.hooks";
import { useTimeOffList } from "@/services/time-off/time-off.hooks";
import type { TechnicianFormValues, TechnicianListItem, TechnicianPayload } from "@/types/technicians";

const PAGE_SIZE = 10;

const emptyFormValues: TechnicianFormValues = {
  name: "",
  email: "",
  phone: "",
  skills: [],
  color: "",
  isActive: true,
  linkedUserId: ""
};

function toPayload(values: TechnicianFormValues): TechnicianPayload {
  return {
    name: values.name,
    email: values.email || undefined,
    phone: values.phone || undefined,
    skills: values.skills.length ? values.skills : undefined,
    color: values.color || undefined,
    isActive: values.isActive,
    linkedUserId: values.linkedUserId || undefined
  };
}

function toFormValues(item: TechnicianListItem): TechnicianFormValues {
  return {
    name: item.name ?? "",
    email: item.email ?? "",
    phone: item.phone ?? "",
    skills: item.skills ?? [],
    color: item.color ?? "",
    isActive: item.isActive,
    linkedUserId: item.linkedUser?.id ?? ""
  };
}

type ActiveFilter = "all" | "active" | "inactive";

export function TechniciansPage() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TechnicianListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TechnicianListItem | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const query = useTechniciansList({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    isActive: activeFilter === "all" ? undefined : activeFilter === "active"
  });

  const dayRange = useMemo(() => localDayRangeIso(), []);
  const jobsTodayQuery = useJobsList({
    page: 1,
    limit: 120,
    scheduledStartFrom: dayRange.from,
    scheduledStartTo: dayRange.to
  });
  const timeOffWindowQuery = useTimeOffList({ page: 1, limit: 200 });

  const opsByTechnicianId = useMemo(() => {
    const map = new Map<string, { jobsToday: number; onLeaveNow: boolean }>();
    const now = Date.now();
    for (const job of jobsTodayQuery.data?.items ?? []) {
      if (!job.technicianId) continue;
      const cur = map.get(job.technicianId) ?? { jobsToday: 0, onLeaveNow: false };
      cur.jobsToday += 1;
      map.set(job.technicianId, cur);
    }
    for (const entry of timeOffWindowQuery.data?.items ?? []) {
      const start = new Date(entry.start).getTime();
      const end = new Date(entry.end).getTime();
      if (Number.isNaN(start) || Number.isNaN(end)) continue;
      if (start <= now && end >= now) {
        const cur = map.get(entry.technicianId) ?? { jobsToday: 0, onLeaveNow: false };
        cur.onLeaveNow = true;
        map.set(entry.technicianId, cur);
      }
    }
    return map;
  }, [jobsTodayQuery.data?.items, timeOffWindowQuery.data?.items]);

  const createMutation = useCreateTechnician();
  const updateMutation = useUpdateTechnician();
  const deleteMutation = useDeleteTechnician();

  const hasItems = (query.data?.items.length ?? 0) > 0;
  const totalPages = query.data?.totalPages ?? 0;

  const onCreateSubmit = async (values: TechnicianFormValues) => {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync(toPayload(values));
      setCreateOpen(false);
      toast({ title: "Technician created", variant: "success" });
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Failed to create technician.");
    }
  };

  const onEditSubmit = async (values: TechnicianFormValues) => {
    if (!editTarget) return;
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({
        id: editTarget.id,
        payload: toPayload(values)
      });
      setEditTarget(null);
      toast({ title: "Technician updated", variant: "success" });
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Failed to update technician.");
    }
  };

  const onDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast({ title: "Technician deleted", variant: "success" });
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : "Failed to delete technician.");
    }
  };

  const paginationLabel = useMemo(() => {
    const current = query.data?.page ?? page;
    const pages = query.data?.totalPages ?? 1;
    return `Page ${current} of ${pages}`;
  }, [page, query.data?.page, query.data?.totalPages]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Technicians</h1>
          <p className="text-sm text-muted-foreground">
            Manage field technicians, skill sets, account links, and status.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create Technician</Button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <TechnicianSearchBar value={searchInput} onChange={setSearchInput} />
        <div className="flex items-center gap-2">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            onClick={() => {
              setActiveFilter("all");
              setPage(1);
            }}
          >
            All
          </Button>
          <Button
            variant={activeFilter === "active" ? "default" : "outline"}
            onClick={() => {
              setActiveFilter("active");
              setPage(1);
            }}
          >
            Active
          </Button>
          <Button
            variant={activeFilter === "inactive" ? "default" : "outline"}
            onClick={() => {
              setActiveFilter("inactive");
              setPage(1);
            }}
          >
            Inactive
          </Button>
        </div>
      </div>

      {query.isLoading ? (
        <Card>
          <CardTitle>Loading technicians...</CardTitle>
          <CardDescription className="mt-2">Fetching latest technician records.</CardDescription>
          <div className="mt-4 space-y-2">
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
          </div>
        </Card>
      ) : query.isError ? (
        <Card>
          <CardTitle>Unable to load technicians</CardTitle>
          <CardDescription className="mt-2">
            Please refresh the page or verify backend connectivity.
          </CardDescription>
        </Card>
      ) : !hasItems ? (
        <TechnicianEmptyState hasSearch={Boolean(debouncedSearch)} />
      ) : (
        <>
          <TechnicianTable
            items={query.data?.items ?? []}
            opsByTechnicianId={opsByTechnicianId}
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

      <TechnicianFormDialog
        open={createOpen}
        title="Create Technician"
        description="Add a new technician profile available for assignment."
        initialValues={emptyFormValues}
        submitLabel="Create Technician"
        isSubmitting={createMutation.isPending}
        serverError={submitError}
        onClose={() => {
          setSubmitError(null);
          setCreateOpen(false);
        }}
        onSubmit={onCreateSubmit}
      />

      <TechnicianFormDialog
        open={Boolean(editTarget)}
        title="Edit Technician"
        description="Update technician details and assignment settings."
        initialValues={editTarget ? toFormValues(editTarget) : emptyFormValues}
        submitLabel="Save Changes"
        isSubmitting={updateMutation.isPending}
        serverError={submitError}
        onClose={() => {
          setSubmitError(null);
          setEditTarget(null);
        }}
        onSubmit={onEditSubmit}
      />

      <TechnicianDeleteDialog
        open={Boolean(deleteTarget)}
        technicianName={deleteTarget?.name}
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


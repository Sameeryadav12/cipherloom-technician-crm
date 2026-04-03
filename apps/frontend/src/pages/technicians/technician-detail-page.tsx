import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { formatShortDate } from "@/lib/format-datetime";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { TechnicianDeleteDialog } from "@/components/technicians/technician-delete-dialog";
import { TechnicianDetailCard } from "@/components/technicians/technician-detail-card";
import { TechnicianFormDialog } from "@/components/technicians/technician-form-dialog";
import { TimeOffDeleteDialog } from "@/components/time-off/time-off-delete-dialog";
import { TimeOffEmptyState } from "@/components/time-off/time-off-empty-state";
import { TimeOffFormDialog } from "@/components/time-off/time-off-form-dialog";
import { TimeOffList } from "@/components/time-off/time-off-list";
import { useJobsList } from "@/services/jobs/jobs.hooks";
import {
  useDeleteTechnician,
  useTechnician,
  useUpdateTechnician
} from "@/services/technicians/technicians.hooks";
import {
  useCreateTimeOff,
  useDeleteTimeOff,
  useTimeOffList,
  useUpdateTimeOff
} from "@/services/time-off/time-off.hooks";
import type { TimeOffEntry, TimeOffFormValues } from "@/types/time-off";
import type { TechnicianFormValues, TechnicianPayload } from "@/types/technicians";

const emptyTimeOffForm: TimeOffFormValues = {
  start: "",
  end: "",
  reason: ""
};

function toTechnicianPayload(values: TechnicianFormValues): TechnicianPayload {
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

function toTechnicianFormValues(technician: {
  name: string;
  email?: string | null;
  phone?: string | null;
  skills: string[];
  color?: string | null;
  isActive: boolean;
  linkedUser?: { id: string; email: string; role: string } | null;
}): TechnicianFormValues {
  return {
    name: technician.name,
    email: technician.email ?? "",
    phone: technician.phone ?? "",
    skills: technician.skills ?? [],
    color: technician.color ?? "",
    isActive: technician.isActive,
    linkedUserId: technician.linkedUser?.id ?? ""
  };
}

function toDateTimeLocal(isoValue: string) {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoLocal(value: string) {
  return new Date(value).toISOString();
}

export function TechnicianDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const technicianId = id ?? "";

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [techSubmitError, setTechSubmitError] = useState<string | null>(null);
  const [techDeleteError, setTechDeleteError] = useState<string | null>(null);

  const [isTimeOffCreateOpen, setIsTimeOffCreateOpen] = useState(false);
  const [timeOffEditTarget, setTimeOffEditTarget] = useState<TimeOffEntry | null>(null);
  const [timeOffDeleteTarget, setTimeOffDeleteTarget] = useState<TimeOffEntry | null>(null);
  const [timeOffSubmitError, setTimeOffSubmitError] = useState<string | null>(null);
  const [timeOffDeleteError, setTimeOffDeleteError] = useState<string | null>(null);

  const technicianQuery = useTechnician(technicianId);
  const assignedJobsQuery = useJobsList(
    { technicianId, page: 1, limit: 40 },
    { enabled: Boolean(technicianId) }
  );
  const timeOffQuery = useTimeOffList({ technicianId, limit: 100, page: 1 });

  const updateTechnicianMutation = useUpdateTechnician();
  const deleteTechnicianMutation = useDeleteTechnician();
  const createTimeOffMutation = useCreateTimeOff();
  const updateTimeOffMutation = useUpdateTimeOff();
  const deleteTimeOffMutation = useDeleteTimeOff();

  const sortedTimeOff = useMemo(
    () =>
      [...(timeOffQuery.data?.items ?? [])].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      ),
    [timeOffQuery.data?.items]
  );

  const sortedAssignedJobs = useMemo(
    () =>
      [...(assignedJobsQuery.data?.items ?? [])].sort(
        (a, b) =>
          new Date(b.scheduledStart ?? b.updatedAt).getTime() -
          new Date(a.scheduledStart ?? a.updatedAt).getTime()
      ),
    [assignedJobsQuery.data?.items]
  );

  if (!technicianId) {
    return (
      <Card>
        <CardTitle>Invalid technician</CardTitle>
        <CardDescription className="mt-2">Technician id is missing from route.</CardDescription>
      </Card>
    );
  }

  const onUpdateTechnician = async (values: TechnicianFormValues) => {
    setTechSubmitError(null);
    try {
      await updateTechnicianMutation.mutateAsync({
        id: technicianId,
        payload: toTechnicianPayload(values)
      });
      setIsEditOpen(false);
    } catch (error) {
      setTechSubmitError(error instanceof ApiError ? error.message : "Failed to update technician.");
    }
  };

  const onDeleteTechnician = async () => {
    setTechDeleteError(null);
    try {
      await deleteTechnicianMutation.mutateAsync(technicianId);
      navigate("/technicians");
    } catch (error) {
      setTechDeleteError(error instanceof ApiError ? error.message : "Failed to delete technician.");
    }
  };

  const onCreateTimeOff = async (values: TimeOffFormValues) => {
    setTimeOffSubmitError(null);
    try {
      await createTimeOffMutation.mutateAsync({
        technicianId,
        start: toIsoLocal(values.start),
        end: toIsoLocal(values.end),
        reason: values.reason || undefined
      });
      setIsTimeOffCreateOpen(false);
    } catch (error) {
      setTimeOffSubmitError(
        error instanceof ApiError ? error.message : "Failed to create time-off entry."
      );
    }
  };

  const onUpdateTimeOff = async (values: TimeOffFormValues) => {
    if (!timeOffEditTarget) return;
    setTimeOffSubmitError(null);
    try {
      await updateTimeOffMutation.mutateAsync({
        id: timeOffEditTarget.id,
        payload: {
          start: toIsoLocal(values.start),
          end: toIsoLocal(values.end),
          reason: values.reason || undefined
        }
      });
      setTimeOffEditTarget(null);
    } catch (error) {
      setTimeOffSubmitError(
        error instanceof ApiError ? error.message : "Failed to update time-off entry."
      );
    }
  };

  const onDeleteTimeOff = async () => {
    if (!timeOffDeleteTarget) return;
    setTimeOffDeleteError(null);
    try {
      await deleteTimeOffMutation.mutateAsync(timeOffDeleteTarget.id);
      setTimeOffDeleteTarget(null);
    } catch (error) {
      setTimeOffDeleteError(
        error instanceof ApiError ? error.message : "Failed to delete time-off entry."
      );
    }
  };

  return (
    <div className="space-y-6">
      {technicianQuery.isLoading ? (
        <Card>
          <CardTitle>Loading technician...</CardTitle>
          <CardDescription className="mt-2">Fetching profile details.</CardDescription>
        </Card>
      ) : technicianQuery.isError ? (
        <Card>
          <CardTitle>Unable to load technician</CardTitle>
          <CardDescription className="mt-2">
            Please refresh the page or verify backend connectivity.
          </CardDescription>
          <Link
            to="/technicians"
            className={cn(
              "mt-4 inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            Back to technicians
          </Link>
        </Card>
      ) : !technicianQuery.data ? (
        <Card>
          <CardTitle>Technician not found</CardTitle>
          <CardDescription className="mt-2">This technician may have been removed.</CardDescription>
          <Link
            to="/technicians"
            className={cn(
              "mt-4 inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            Back to technicians
          </Link>
        </Card>
      ) : (
        <>
          <header className="flex flex-col gap-4 border-b border-border/60 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Field technician
              </p>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {technicianQuery.data.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Operations profile · assignments and availability in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/technicians"
                className={cn(
                  "inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-muted",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                Back
              </Link>
              <Link
                to="/jobs"
                className={cn(
                  "inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-muted",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Jobs board
              </Link>
              <Button
                onClick={() => {
                  setTechSubmitError(null);
                  setIsEditOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTechDeleteError(null);
                  setIsDeleteOpen(true);
                }}
              >
                Delete
              </Button>
            </div>
          </header>

          <TechnicianDetailCard technician={technicianQuery.data} />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Assigned jobs</h2>
              <Link
                to="/jobs"
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-md border border-border bg-transparent px-3 text-xs font-medium transition-colors hover:bg-muted",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                Open Jobs
              </Link>
            </div>
            {assignedJobsQuery.isLoading ? (
              <Card>
                <CardDescription>Loading assignments…</CardDescription>
              </Card>
            ) : sortedAssignedJobs.length === 0 ? (
              <Card>
                <CardTitle className="text-base">No assignments in this window</CardTitle>
                <CardDescription className="mt-2">
                  This list shows the latest jobs linked to this technician. New work can be assigned from
                  the Jobs board.
                </CardDescription>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/80">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Job</th>
                      <th className="px-4 py-2">Customer</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Scheduled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAssignedJobs.map((job) => (
                      <tr key={job.id} className="border-t border-border/60 hover:bg-muted/30">
                        <td className="px-4 py-2">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {job.title}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {job.customer?.name ?? "—"}
                        </td>
                        <td className="px-4 py-2">
                          <JobStatusBadge status={job.status} />
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {job.scheduledStart ? formatShortDate(job.scheduledStart) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-3" id="time-off">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Time-Off</h2>
              <Button
                onClick={() => {
                  setTimeOffSubmitError(null);
                  setIsTimeOffCreateOpen(true);
                }}
              >
                Add Time-Off
              </Button>
            </div>
            {timeOffQuery.isLoading ? (
              <Card>
                <CardTitle>Loading time-off...</CardTitle>
              </Card>
            ) : timeOffQuery.isError ? (
              <Card>
                <CardTitle>Unable to load time-off entries</CardTitle>
              </Card>
            ) : sortedTimeOff.length === 0 ? (
              <TimeOffEmptyState />
            ) : (
              <TimeOffList
                items={sortedTimeOff}
                onEdit={(entry) => {
                  setTimeOffSubmitError(null);
                  setTimeOffEditTarget(entry);
                }}
                onDelete={(entry) => {
                  setTimeOffDeleteError(null);
                  setTimeOffDeleteTarget(entry);
                }}
              />
            )}
          </section>

          <TechnicianFormDialog
            open={isEditOpen}
            title="Edit Technician"
            description="Update profile, skills, and status."
            initialValues={toTechnicianFormValues(technicianQuery.data)}
            submitLabel="Save Changes"
            isSubmitting={updateTechnicianMutation.isPending}
            serverError={techSubmitError}
            linkedUserSummary={
              technicianQuery.data.linkedUser
                ? `${technicianQuery.data.linkedUser.email} (${technicianQuery.data.linkedUser.role})`
                : null
            }
            onClose={() => {
              setTechSubmitError(null);
              setIsEditOpen(false);
            }}
            onSubmit={onUpdateTechnician}
          />

          <TechnicianDeleteDialog
            open={isDeleteOpen}
            technicianName={technicianQuery.data.name}
            isDeleting={deleteTechnicianMutation.isPending}
            error={techDeleteError}
            onCancel={() => {
              setTechDeleteError(null);
              setIsDeleteOpen(false);
            }}
            onConfirm={onDeleteTechnician}
          />

          <TimeOffFormDialog
            open={isTimeOffCreateOpen}
            title="Add Time-Off"
            description="Create a new time-off period for this technician."
            initialValues={emptyTimeOffForm}
            submitLabel="Create Time-Off"
            isSubmitting={createTimeOffMutation.isPending}
            serverError={timeOffSubmitError}
            onClose={() => {
              setTimeOffSubmitError(null);
              setIsTimeOffCreateOpen(false);
            }}
            onSubmit={onCreateTimeOff}
          />

          <TimeOffFormDialog
            open={Boolean(timeOffEditTarget)}
            title="Edit Time-Off"
            description="Update the selected time-off entry."
            initialValues={
              timeOffEditTarget
                ? {
                    start: toDateTimeLocal(timeOffEditTarget.start),
                    end: toDateTimeLocal(timeOffEditTarget.end),
                    reason: timeOffEditTarget.reason ?? ""
                  }
                : emptyTimeOffForm
            }
            submitLabel="Save Time-Off"
            isSubmitting={updateTimeOffMutation.isPending}
            serverError={timeOffSubmitError}
            onClose={() => {
              setTimeOffSubmitError(null);
              setTimeOffEditTarget(null);
            }}
            onSubmit={onUpdateTimeOff}
          />

          <TimeOffDeleteDialog
            open={Boolean(timeOffDeleteTarget)}
            isDeleting={deleteTimeOffMutation.isPending}
            error={timeOffDeleteError}
            onCancel={() => {
              setTimeOffDeleteError(null);
              setTimeOffDeleteTarget(null);
            }}
            onConfirm={onDeleteTimeOff}
          />
        </>
      )}
    </div>
  );
}


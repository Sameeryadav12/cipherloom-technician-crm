import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { AssignTechnicianDialog } from "@/components/jobs/assign-technician-dialog";
import { RescheduleJobDialog } from "@/components/dispatch/reschedule-job-dialog";
import { JobDeleteDialog } from "@/components/jobs/job-delete-dialog";
import { JobDetailCard } from "@/components/jobs/job-detail-card";
import { JobFormDialog } from "@/components/jobs/job-form-dialog";
import { UpdateJobStatusDialog } from "@/components/jobs/update-job-status-dialog";
import { useCustomersList } from "@/services/customers/customers.hooks";
import {
  useAssignTechnician,
  useDeleteJob,
  useJob,
  usePricingRulesList,
  useUpdateJob,
  useUpdateJobStatus
} from "@/services/jobs/jobs.hooks";
import { useTechniciansList } from "@/services/technicians/technicians.hooks";
import type { JobStatus } from "@/types/api";
import type { RescheduleJobContext } from "@/types/dispatch";
import type { JobFormValues, JobPayload } from "@/types/jobs";

const emptyFormValues: JobFormValues = {
  title: "",
  customerId: "",
  technicianId: "",
  description: "",
  scheduledStart: "",
  scheduledEnd: "",
  pricingRuleId: ""
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

export function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobId = id ?? "";

  const jobQuery = useJob(jobId);
  const customersQuery = useCustomersList({ page: 1, limit: 100 });
  const techniciansQuery = useTechniciansList({ page: 1, limit: 100 });
  const pricingRulesQuery = usePricingRulesList();

  const updateMutation = useUpdateJob();
  const deleteMutation = useDeleteJob();
  const assignMutation = useAssignTechnician();
  const statusMutation = useUpdateJobStatus();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [rescheduleContext, setRescheduleContext] = useState<RescheduleJobContext | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  if (!jobId) {
    return (
      <Card>
        <CardTitle>Job not found</CardTitle>
        <CardDescription className="mt-2">Missing job identifier in route.</CardDescription>
      </Card>
    );
  }

  if (jobQuery.isLoading) {
    return (
      <Card>
        <CardTitle>Loading job...</CardTitle>
        <CardDescription className="mt-2">Fetching job details.</CardDescription>
      </Card>
    );
  }

  if (jobQuery.isError || !jobQuery.data) {
    return (
      <Card>
        <CardTitle>Job not available</CardTitle>
        <CardDescription className="mt-2">
          This job could not be loaded or may not exist.
        </CardDescription>
      </Card>
    );
  }

  const initialValues: JobFormValues = {
    title: jobQuery.data.title,
    customerId: jobQuery.data.customerId,
    technicianId: jobQuery.data.technicianId ?? "",
    description: jobQuery.data.description ?? "",
    scheduledStart: toDateTimeLocal(jobQuery.data.scheduledStart),
    scheduledEnd: toDateTimeLocal(jobQuery.data.scheduledEnd),
    pricingRuleId: jobQuery.data.pricingRuleId ?? ""
  };

  const onSubmitEdit = async (values: JobFormValues) => {
    setFormError(null);
    try {
      await updateMutation.mutateAsync({
        id: jobId,
        payload: toPayload(values)
      });
      setEditOpen(false);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Failed to update job.");
    }
  };

  const onConfirmDelete = async () => {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(jobId);
      navigate("/jobs", { replace: true });
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : "Failed to delete job.");
    }
  };

  const onAssign = async (technicianId: string) => {
    setAssignError(null);
    try {
      await assignMutation.mutateAsync({ id: jobId, technicianId });
      setAssignOpen(false);
    } catch (error) {
      setAssignError(error instanceof ApiError ? error.message : "Failed to assign technician.");
    }
  };

  const onStatus = async (status: JobStatus) => {
    setStatusError(null);
    try {
      await statusMutation.mutateAsync({ id: jobId, status });
      setStatusOpen(false);
    } catch (error) {
      setStatusError(error instanceof ApiError ? error.message : "Failed to update status.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Job Detail</h1>
          <p className="text-sm text-muted-foreground">
            Review this work order and run operational actions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/jobs")}>
            Back to jobs
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button variant="outline" onClick={() => setAssignOpen(true)}>
            Assign technician
          </Button>
          <Button variant="outline" onClick={() => setStatusOpen(true)}>
            Update status
          </Button>
          <Button variant="outline" onClick={() => setRescheduleContext({
            jobId: jobQuery.data.id,
            title: jobQuery.data.title,
            customerId: jobQuery.data.customerId,
            customerName: jobQuery.data.customer?.name,
            technicianId: jobQuery.data.technicianId,
            technicianName: jobQuery.data.technician?.name,
            scheduledStart: jobQuery.data.scheduledStart,
            scheduledEnd: jobQuery.data.scheduledEnd,
            status: jobQuery.data.status
          })}>
            Reschedule
          </Button>
          <Button onClick={() => setDeleteOpen(true)}>Delete</Button>
        </div>
      </header>

      <JobDetailCard job={jobQuery.data} />

      <Card>
        <CardTitle>Invoice Integration (Next Step)</CardTitle>
        <CardDescription className="mt-2">
          Invoice details and generation workflow will connect here next.
        </CardDescription>
      </Card>

      <JobFormDialog
        open={editOpen}
        title="Edit Job"
        description="Update job details except status transitions."
        initialValues={initialValues}
        customers={customersQuery.data?.items ?? []}
        technicians={techniciansQuery.data?.items ?? []}
        pricingRules={pricingRulesQuery.data ?? []}
        submitLabel="Save Changes"
        isSubmitting={updateMutation.isPending}
        serverError={formError}
        onClose={() => {
          setFormError(null);
          setEditOpen(false);
        }}
        onSubmit={onSubmitEdit}
      />

      <JobDeleteDialog
        open={deleteOpen}
        jobTitle={jobQuery.data.title}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
        onCancel={() => {
          setDeleteError(null);
          setDeleteOpen(false);
        }}
        onConfirm={onConfirmDelete}
      />

      <AssignTechnicianDialog
        open={assignOpen}
        technicians={techniciansQuery.data?.items ?? []}
        currentTechnicianName={jobQuery.data.technician?.name}
        isSubmitting={assignMutation.isPending}
        error={assignError}
        onClose={() => {
          setAssignError(null);
          setAssignOpen(false);
        }}
        onSubmit={onAssign}
      />

      <UpdateJobStatusDialog
        open={statusOpen}
        currentStatus={jobQuery.data.status}
        isSubmitting={statusMutation.isPending}
        error={statusError}
        onClose={() => {
          setStatusError(null);
          setStatusOpen(false);
        }}
        onSubmit={onStatus}
      />
      <RescheduleJobDialog
        open={Boolean(rescheduleContext)}
        context={rescheduleContext}
        onClose={() => setRescheduleContext(null)}
      />
    </div>
  );
}

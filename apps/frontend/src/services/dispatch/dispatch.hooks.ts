import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  DispatchQueueEntry,
  DispatchQueueItem,
  DispatchQueueKey,
  DispatchReasonCode
} from "@/types/dispatch";
import { getDispatchQueue } from "./dispatch.api";

export const dispatchKeys = {
  all: ["dispatch"] as const,
  queue: ["dispatch", "queue"] as const
};

function queueReasonCode(queueKey: DispatchQueueKey): DispatchReasonCode {
  switch (queueKey) {
    case "unassigned":
      return "UNASSIGNED";
    case "needs_scheduling":
      return "MISSING_SCHEDULE";
    case "conflicted":
      return "SCHEDULING_CONFLICT";
    case "starts_soon":
      return "STARTS_SOON";
    case "ready_to_invoice":
      return "READY_TO_INVOICE";
    case "stale":
      return "AGING_JOB";
    default:
      return "MISSING_SCHEDULE";
  }
}

function mapEntryToItem(entry: DispatchQueueEntry, queueKey: DispatchQueueKey): DispatchQueueItem {
  const createdAt = entry.createdAt ?? new Date().toISOString();
  const ageHours = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 3_600_000);
  return {
    job: {
      id: entry.jobId,
      title: entry.title,
      status: entry.status,
      customerId: entry.customerId,
      customer: { id: entry.customerId, name: entry.customerName },
      technicianId: entry.technicianId,
      technician: entry.technicianId ? { id: entry.technicianId, name: entry.technicianName } : null,
      scheduledStart: entry.scheduledStart,
      scheduledEnd: entry.scheduledEnd,
      createdAt,
      updatedAt: createdAt
    },
    assignmentState: !entry.technicianId ? "UNASSIGNED" : "ASSIGNED",
    reasons: [{ code: queueReasonCode(queueKey), label: entry.reason, urgency: "medium" }],
    queueKeys: [queueKey],
    recommendedAction: queueKey === "ready_to_invoice" ? "generate_invoice" : "reschedule",
    ageHours
  };
}

export function useDispatchQueue(activeQueue: DispatchQueueKey | "all") {
  const queueQuery = useQuery({
    queryKey: dispatchKeys.queue,
    queryFn: getDispatchQueue,
    select: (res) => res.data
  });

  const items = useMemo(() => {
    if (!queueQuery.data) return [];
    const grouped: Record<DispatchQueueKey, DispatchQueueEntry[]> = {
      unassigned: queueQuery.data.unassigned,
      needs_scheduling: queueQuery.data.needsScheduling,
      conflicted: queueQuery.data.conflicted,
      starts_soon: queueQuery.data.startsSoon,
      ready_to_invoice: queueQuery.data.readyToInvoice,
      stale: queueQuery.data.stale
    };
    if (activeQueue === "all") {
      const merged = new Map<string, DispatchQueueItem>();
      for (const [queueKey, entries] of Object.entries(grouped) as Array<[DispatchQueueKey, DispatchQueueEntry[]]>) {
        for (const entry of entries) {
          const mapped = mapEntryToItem(entry, queueKey);
          const existing = merged.get(entry.jobId);
          if (!existing) {
            merged.set(entry.jobId, mapped);
            continue;
          }
          merged.set(entry.jobId, {
            ...existing,
            reasons: [...existing.reasons, ...mapped.reasons],
            queueKeys: Array.from(new Set([...existing.queueKeys, ...mapped.queueKeys]))
          });
        }
      }
      return Array.from(merged.values());
    }
    return grouped[activeQueue].map((entry) => mapEntryToItem(entry, activeQueue));
  }, [activeQueue, queueQuery.data]);

  const summary = useMemo(() => {
    const data = queueQuery.data;
    const uniqueTotal = new Set([
      ...(data?.unassigned ?? []).map((i) => i.jobId),
      ...(data?.needsScheduling ?? []).map((i) => i.jobId),
      ...(data?.conflicted ?? []).map((i) => i.jobId),
      ...(data?.startsSoon ?? []).map((i) => i.jobId),
      ...(data?.readyToInvoice ?? []).map((i) => i.jobId),
      ...(data?.stale ?? []).map((i) => i.jobId)
    ]).size;
    return {
      total: uniqueTotal,
      unassigned: data?.unassigned.length ?? 0,
      needsScheduling: data?.needsScheduling.length ?? 0,
      conflicted: data?.conflicted.length ?? 0,
      startsSoon: data?.startsSoon.length ?? 0,
      readyToInvoice: data?.readyToInvoice.length ?? 0,
      stale: data?.stale.length ?? 0
    };
  }, [queueQuery.data]);

  return {
    items,
    summary,
    isLoading: queueQuery.isLoading,
    isError: queueQuery.isError,
    isFetching: queueQuery.isFetching,
    refetch: () => {
      void queueQuery.refetch();
    }
  };
}

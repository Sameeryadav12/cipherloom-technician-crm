import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import {
  ApplySuggestionDialog,
  type SchedulingCommittedPayload
} from "@/components/scheduling/apply-suggestion-dialog";
import { SchedulingEmptyState } from "@/components/scheduling/scheduling-empty-state";
import { SchedulingRequestForm } from "@/components/scheduling/scheduling-request-form";
import { SchedulingSearchWindowSummary } from "@/components/scheduling/scheduling-search-window-summary";
import { SchedulingSuccessState, type SchedulingSuccessSummary } from "@/components/scheduling/scheduling-success-state";
import { SchedulingSuggestionsList } from "@/components/scheduling/scheduling-suggestions-list";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { useCustomersList } from "@/services/customers/customers.hooks";
import { usePricingRulesList } from "@/services/jobs/jobs.hooks";
import { useScheduleSuggestions, useSchedulingExecution } from "@/services/scheduling/scheduling.hooks";
import { useTechniciansList } from "@/services/technicians/technicians.hooks";
import type {
  SchedulingExecutionDraft,
  SchedulingRequest,
  SchedulingRequestFormValues,
  SchedulingResponse,
  SchedulingSuggestion
} from "@/types/scheduling";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function SchedulingPage() {
  const { toast } = useToast();
  const location = useLocation();

  const customersQuery = useCustomersList({ page: 1, limit: 100 });
  const techniciansQuery = useTechniciansList({ page: 1, limit: 100, isActive: true });
  const pricingRulesQuery = usePricingRulesList();
  const schedulingExecution = useSchedulingExecution();

  const defaultPricingRuleId = useMemo(
    () => pricingRulesQuery.data?.find((r) => r.isDefault)?.id,
    [pricingRulesQuery.data]
  );

  const suggestMutation = useScheduleSuggestions();
  const [response, setResponse] = useState<SchedulingResponse | null>(null);
  const [lastRequest, setLastRequest] = useState<SchedulingRequest | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SchedulingSuggestion | null>(null);
  const [applyDraft, setApplyDraft] = useState<SchedulingExecutionDraft | null>(null);
  const [successSummary, setSuccessSummary] = useState<SchedulingSuccessSummary | null>(null);

  const suggestions = response?.suggestions ?? [];
  const effectiveWindow = response?.effectiveSearchWindow ?? response?.searchWindow ?? null;

  const isBootstrapLoading = customersQuery.isLoading || techniciansQuery.isLoading;
  const canSubmit = !customersQuery.isError && !techniciansQuery.isError;

  const formPrefill = useMemo((): Partial<SchedulingRequestFormValues> | undefined => {
    const s = location.state as {
      prefillCustomerId?: string;
      prefillTitle?: string;
      prefillIgnoreJobId?: string;
    } | null;
    if (!s?.prefillCustomerId && !s?.prefillTitle && !s?.prefillIgnoreJobId) return undefined;
    return {
      ...(s.prefillCustomerId ? { customerId: s.prefillCustomerId } : {}),
      ...(s.prefillTitle ? { title: s.prefillTitle } : {}),
      ...(s.prefillIgnoreJobId ? { ignoreJobId: s.prefillIgnoreJobId } : {})
    };
  }, [location.state]);

  const onSubmit = async (payload: SchedulingRequest) => {
    setServerError(null);
    setSelected(null);
    try {
      const result = await suggestMutation.mutateAsync(payload);
      setLastRequest(payload);
      setResponse(result.data);
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : "Failed to generate scheduling suggestions.";
      setServerError(message);
      toast({
        title: "Scheduling request failed",
        description: message,
        variant: "destructive"
      });
    }
  };

  const handleOpenApply = useCallback(
    (suggestion: SchedulingSuggestion) => {
      if (!lastRequest) {
        toast({
          title: "Missing request context",
          description: "Run suggestions first so customer, title, and duration are set.",
          variant: "destructive"
        });
        return;
      }
      setApplyDraft({ suggestion, request: lastRequest });
    },
    [lastRequest, toast]
  );

  const handleCommitted = useCallback((p: SchedulingCommittedPayload) => {
    setSuccessSummary({
      job: p.job,
      mode: p.mode,
      technicianLabel: p.suggestion.technician.name ?? "Technician",
      slotLabel: `${formatDateTime(p.suggestion.slot.start)} → ${formatDateTime(p.suggestion.slot.end)}`,
      customerLabel: p.customerName
    });
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/90">Cipherloom Intelligence</p>
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Smart Scheduling</h1>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Ranked options with a real <strong className="font-medium text-foreground">execution workflow</strong>: preview,
          conflict validation, then create or reschedule — built for dispatch automation and future approvals.
        </p>
        {formPrefill?.customerId || formPrefill?.title ? (
          <p className="text-xs text-emerald-200/90">
            Prefilled from your workflow — review fields and run suggestions when ready.
          </p>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card className="border-primary/15 lg:sticky lg:top-6 lg:self-start">
          <CardTitle>Request</CardTitle>
          <CardDescription className="mt-2 leading-relaxed">
            Customer + duration are required. Everything else sharpens ranking: preferred window, skills, area, optional
            technician hint.
          </CardDescription>

          <div className="mt-4 space-y-4">
            {customersQuery.isError || techniciansQuery.isError ? (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                Unable to load supporting data (customers/technicians). Please refresh and try again.
              </div>
            ) : null}

            <SchedulingRequestForm
              customers={customersQuery.data?.items ?? []}
              technicians={techniciansQuery.data?.items ?? []}
              isSubmitting={suggestMutation.isPending || isBootstrapLoading}
              serverError={serverError}
              initialValues={formPrefill}
              onSubmit={canSubmit ? onSubmit : async () => undefined}
            />
          </div>
        </Card>

        <div className="space-y-4">
          {successSummary ? (
            <SchedulingSuccessState summary={successSummary} onDismiss={() => setSuccessSummary(null)} />
          ) : null}

          <Card className="border-border/80 bg-card/50">
            <CardTitle className="text-base">Execution layer</CardTitle>
            <CardDescription className="mt-2 leading-relaxed">
              Apply opens a <strong className="text-foreground">dispatch confirmation</strong> — conflict check, then{" "}
              <code className="rounded bg-muted px-1 text-[11px]">createJob</code> or{" "}
              <code className="rounded bg-muted px-1 text-[11px]">updateJob</code> with shared cache invalidation (jobs,
              calendar, dashboard).
            </CardDescription>
          </Card>

          {suggestMutation.isPending ? (
            <div className="space-y-3">
              <Card className="border-primary/20">
                <CardTitle>Generating suggestions…</CardTitle>
                <CardDescription className="mt-2">
                  Evaluating calendars, skills, and your optional preferred window.
                </CardDescription>
              </Card>
              <Card className="bg-card/40">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="mt-3 h-3 w-1/2 rounded bg-muted/70" />
                <div className="mt-6 h-14 rounded bg-muted/40" />
              </Card>
              <Card className="bg-card/40">
                <div className="h-4 w-3/5 rounded bg-muted" />
                <div className="mt-3 h-3 w-2/5 rounded bg-muted/70" />
                <div className="mt-6 h-14 rounded bg-muted/40" />
              </Card>
            </div>
          ) : serverError ? (
            <Card className="border-red-500/30 bg-red-500/10">
              <CardTitle>Unable to generate suggestions</CardTitle>
              <CardDescription className="mt-2">{serverError}</CardDescription>
            </Card>
          ) : response && suggestions.length === 0 ? (
            <SchedulingEmptyState
              title="No suggestions found"
              description="Try widening the preferred window, removing the technician filter, or simplifying required skills. The assistant may still be strict about overlapping jobs and leave."
            />
          ) : suggestions.length ? (
            <>
              <SchedulingSearchWindowSummary window={effectiveWindow} />

              {selected ? (
                <Card className="border-primary/30 bg-card/60">
                  <CardTitle className="text-base">Highlighted suggestion</CardTitle>
                  <CardDescription className="mt-2">
                    {selected.technician.name ?? "Technician"} • {formatDateTime(selected.slot.start)} →{" "}
                    {formatDateTime(selected.slot.end)}
                  </CardDescription>
                  <div className="mt-3 text-sm text-muted-foreground">
                    Click <strong className="text-foreground">Apply suggestion</strong> to open the confirmation step,
                    or use <strong className="text-foreground">Open in job form</strong> for a manual composer.
                  </div>
                </Card>
              ) : null}

              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Ranked options</h2>
                  <p className="text-sm text-muted-foreground">Best match is emphasized — act from the top down.</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Showing {Math.min(5, suggestions.length)} of {suggestions.length}
                </p>
              </div>

              <SchedulingSuggestionsList
                suggestions={suggestions.slice(0, 5)}
                lastRequest={lastRequest}
                executionBusy={schedulingExecution.isBusy}
                onOpenApply={handleOpenApply}
                onSelectSuggestion={(s) => setSelected(s)}
              />
            </>
          ) : (
            <SchedulingEmptyState />
          )}
        </div>
      </div>

      <ApplySuggestionDialog
        open={Boolean(applyDraft)}
        draft={applyDraft}
        defaultPricingRuleId={defaultPricingRuleId}
        customers={customersQuery.data?.items ?? []}
        commit={schedulingExecution.commit}
        onClose={() => setApplyDraft(null)}
        onCommitted={handleCommitted}
      />
    </div>
  );
}

import { useMemo, useState } from "react";
import { Layers, ListOrdered, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { AddonDeleteDialog } from "@/components/settings/addon-delete-dialog";
import { AddonFormDialog } from "@/components/settings/addon-form-dialog";
import { AddonsList } from "@/components/settings/addons-list";
import { PricingRuleDeleteDialog } from "@/components/settings/pricing-rule-delete-dialog";
import { PricingRuleDetailCard } from "@/components/settings/pricing-rule-detail-card";
import { PricingRuleFormDialog } from "@/components/settings/pricing-rule-form-dialog";
import { PricingRulesTable } from "@/components/settings/pricing-rules-table";
import { SettingsEmptyState } from "@/components/settings/settings-empty-state";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { useCustomersList } from "@/services/customers/customers.hooks";
import { useTechniciansList } from "@/services/technicians/technicians.hooks";
import { AutomationRuleCard } from "@/components/automation/automation-rule-card";
import { AutomationStatusPanel } from "@/components/automation/automation-status-panel";
import { RecurringJobFormDialog } from "@/components/automation/recurring-job-form-dialog";
import { RecurringJobList } from "@/components/automation/recurring-job-list";
import { RunAutomationDialog } from "@/components/automation/run-automation-dialog";
import {
  useAutomationStatus,
  useCreateRecurringJob,
  useDeleteRecurringJob,
  useRecurringJobs,
  useRunAutomation,
  useUpdateAutomationRule,
  useUpdateRecurringJob
} from "@/services/automation/automation.hooks";
import {
  useCreateAddon,
  useDeleteAddon,
  usePricingRuleAddons,
  useUpdateAddon
} from "@/services/settings/addons.hooks";
import {
  useCreatePricingRule,
  useDeletePricingRule,
  usePricingRulesList,
  useUpdatePricingRule
} from "@/services/settings/pricing-rules.hooks";
import type {
  PricingRuleFormValues,
  PricingRuleListItem,
  PricingRulePayload,
  ServiceAddon,
  ServiceAddonFormValues,
  ServiceAddonPayload
} from "@/types/settings";
import type { RecurringJobTemplate } from "@/types/automation";

const PAGE_SIZE = 20;

const emptyRuleForm: PricingRuleFormValues = {
  name: "",
  description: "",
  baseCalloutFee: "0",
  blockMinutes: "30",
  blockRate: "0",
  isDefault: false,
  isActive: true
};

const emptyAddonForm: ServiceAddonFormValues = {
  name: "",
  description: "",
  price: "0",
  isActive: true
};

function toRuleFormValues(rule: PricingRuleListItem): PricingRuleFormValues {
  return {
    name: rule.name,
    description: rule.description ?? "",
    baseCalloutFee: String(rule.baseCalloutFee),
    blockMinutes: String(rule.blockMinutes),
    blockRate: String(rule.blockRate),
    isDefault: rule.isDefault,
    isActive: rule.isActive
  };
}

function toAddonFormValues(addon: ServiceAddon): ServiceAddonFormValues {
  return {
    name: addon.name,
    description: addon.description ?? "",
    price: String(addon.price),
    isActive: addon.isActive
  };
}

export function SettingsPage() {
  const { user } = useAuth();
  const canMutate = user?.role === "ADMIN";
  const canOperateAutomation = user?.role === "ADMIN" || user?.role === "STAFF";
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PricingRuleListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PricingRuleListItem | null>(null);
  const [ruleFormError, setRuleFormError] = useState<string | null>(null);
  const [deleteRuleError, setDeleteRuleError] = useState<string | null>(null);

  const [addonFormOpen, setAddonFormOpen] = useState(false);
  const [addonEditTarget, setAddonEditTarget] = useState<ServiceAddon | null>(null);
  const [addonDeleteTarget, setAddonDeleteTarget] = useState<ServiceAddon | null>(null);
  const [addonFormError, setAddonFormError] = useState<string | null>(null);
  const [addonDeleteError, setAddonDeleteError] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [settingsTab, setSettingsTab] = useState<"rules" | "addons" | "automation">("rules");
  const [automationRunOpen, setAutomationRunOpen] = useState(false);
  const [recurringFormOpen, setRecurringFormOpen] = useState(false);
  const [recurringEditTarget, setRecurringEditTarget] = useState<RecurringJobTemplate | null>(null);

  const listQuery = usePricingRulesList({ page, limit: PAGE_SIZE });
  const addonsQuery = usePricingRuleAddons(selectedId ?? "", Boolean(selectedId));
  const automationStatus = useAutomationStatus();
  const recurringJobs = useRecurringJobs();
  const runAutomation = useRunAutomation();
  const updateAutomationRule = useUpdateAutomationRule();
  const createRecurring = useCreateRecurringJob();
  const updateRecurring = useUpdateRecurringJob();
  const deleteRecurring = useDeleteRecurringJob();
  const customersQuery = useCustomersList({ page: 1, limit: 200 });
  const techniciansQuery = useTechniciansList({ page: 1, limit: 200, isActive: true });

  const createRule = useCreatePricingRule();
  const updateRule = useUpdatePricingRule();
  const deleteRule = useDeletePricingRule();
  const createAddon = useCreateAddon();
  const updateAddon = useUpdateAddon();
  const deleteAddon = useDeleteAddon();

  const selectedRule = useMemo(() => {
    if (!selectedId || !listQuery.data?.items) return null;
    return listQuery.data.items.find((r) => r.id === selectedId) ?? null;
  }, [listQuery.data?.items, selectedId]);

  const totalPages = listQuery.data?.totalPages ?? 1;
  const hasRows = (listQuery.data?.items.length ?? 0) > 0;

  const onCreateRule = async (payload: PricingRulePayload) => {
    setRuleFormError(null);
    try {
      await createRule.mutateAsync(payload);
      setCreateOpen(false);
      toast({ title: "Pricing rule created", variant: "success" });
    } catch (e) {
      setRuleFormError(e instanceof ApiError ? e.message : "Failed to create pricing rule.");
    }
  };

  const onUpdateRule = async (payload: PricingRulePayload) => {
    if (!editTarget) return;
    setRuleFormError(null);
    try {
      await updateRule.mutateAsync({ id: editTarget.id, payload });
      setEditTarget(null);
      toast({ title: "Pricing rule updated", variant: "success" });
    } catch (e) {
      setRuleFormError(e instanceof ApiError ? e.message : "Failed to update pricing rule.");
    }
  };

  const onDeleteRule = async () => {
    if (!deleteTarget) return;
    setDeleteRuleError(null);
    try {
      await deleteRule.mutateAsync(deleteTarget.id);
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
      toast({ title: "Pricing rule deleted", variant: "success" });
    } catch (e) {
      setDeleteRuleError(e instanceof ApiError ? e.message : "Failed to delete pricing rule.");
    }
  };

  const onSetDefault = async (rule: PricingRuleListItem) => {
    setInlineError(null);
    try {
      await updateRule.mutateAsync({ id: rule.id, payload: { isDefault: true } });
      toast({
        title: "Default pricing rule updated",
        description: `"${rule.name}" is now default for new jobs. Existing invoices and closed jobs keep their original rule.`,
        variant: "success"
      });
    } catch (e) {
      setInlineError(e instanceof ApiError ? e.message : "Failed to set default rule.");
      toast({
        title: "Unable to set default",
        description: e instanceof ApiError ? e.message : "Please try again.",
        variant: "destructive"
      });
    }
  };

  const onAddonSubmit = async (payload: ServiceAddonPayload) => {
    if (!selectedId) return;
    setAddonFormError(null);
    try {
      if (addonEditTarget) {
        await updateAddon.mutateAsync({
          addonId: addonEditTarget.id,
          pricingRuleId: selectedId,
          payload
        });
      } else {
        await createAddon.mutateAsync({ pricingRuleId: selectedId, payload });
      }
      setAddonFormOpen(false);
      setAddonEditTarget(null);
      toast({
        title: addonEditTarget ? "Add-on updated" : "Add-on created",
        variant: "success"
      });
    } catch (e) {
      setAddonFormError(e instanceof ApiError ? e.message : "Failed to save add-on.");
    }
  };

  const onDeleteAddon = async () => {
    if (!addonDeleteTarget || !selectedId) return;
    setAddonDeleteError(null);
    try {
      await deleteAddon.mutateAsync({
        addonId: addonDeleteTarget.id,
        pricingRuleId: selectedId
      });
      setAddonDeleteTarget(null);
      toast({ title: "Add-on deleted", variant: "success" });
    } catch (e) {
      setAddonDeleteError(e instanceof ApiError ? e.message : "Failed to delete add-on.");
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Configuration
        </p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Control how jobs convert to revenue: pricing rules set call-out and labor blocks; add-ons layer optional
          charges. Changes affect future quotes and invoices — not historical documents.
        </p>
        {!canMutate ? (
          <p className="text-xs text-amber-200/90">
            You have read-only access. Only administrators can create, edit, or delete configuration.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 rounded-xl border border-border/80 bg-muted/20 p-1">
          <button
            type="button"
            onClick={() => setSettingsTab("rules")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none",
              settingsTab === "rules"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ListOrdered className="h-4 w-4 opacity-80" />
            Pricing rules
          </button>
          <button
            type="button"
            onClick={() => setSettingsTab("addons")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none",
              settingsTab === "addons"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-4 w-4 opacity-80" />
            Service add-ons
          </button>
          <button
            type="button"
            onClick={() => setSettingsTab("automation")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none",
              settingsTab === "automation"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bot className="h-4 w-4 opacity-80" />
            Automation
          </button>
        </div>
      </header>

      {settingsTab === "rules" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Pricing rules</h2>
            {canMutate ? (
              <Button
                onClick={() => {
                  setRuleFormError(null);
                  setCreateOpen(true);
                }}
              >
                Create pricing rule
              </Button>
            ) : null}
          </div>
          {inlineError ? (
            <p className="rounded-md border border-red-500/40 bg-red-950/20 px-3 py-2 text-xs text-red-300">
              {inlineError}
            </p>
          ) : null}

          {listQuery.isLoading ? (
            <Card>
              <CardTitle className="text-base">Loading…</CardTitle>
              <CardDescription className="mt-2">Fetching pricing configuration.</CardDescription>
            </Card>
          ) : listQuery.isError ? (
            <Card>
              <CardTitle className="text-base">Unable to load settings</CardTitle>
              <CardDescription className="mt-2">Check connectivity or try refreshing.</CardDescription>
            </Card>
          ) : !hasRows ? (
            <SettingsEmptyState
              title="No pricing rules"
              description="Create a pricing rule to define call-out fees, time blocks, and optional defaults for new jobs."
            />
          ) : (
            <>
              <PricingRulesTable
                items={listQuery.data?.items ?? []}
                selectedId={selectedId}
                canMutate={canMutate}
                onSelectManage={(rule) => {
                  setSelectedId(rule.id);
                  setSettingsTab("addons");
                }}
                onEdit={(rule) => {
                  setRuleFormError(null);
                  setEditTarget(rule);
                }}
                onDelete={(rule) => {
                  setDeleteRuleError(null);
                  setDeleteTarget(rule);
                }}
                onSetDefault={(rule) => void onSetDefault(rule)}
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Page {listQuery.data?.page ?? page} of {totalPages || 1}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
              {selectedId && selectedRule ? (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedRule.name}</span> is selected — open the{" "}
                  <button
                    type="button"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                    onClick={() => setSettingsTab("addons")}
                  >
                    Service add-ons
                  </button>{" "}
                  tab to edit extras.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Choose <strong>Manage</strong> on a row to attach add-ons and review the billing summary for that rule.
                </p>
              )}
            </>
          )}
        </section>
      ) : settingsTab === "addons" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Service add-ons</h2>
            {selectedRule ? (
              <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => setSettingsTab("rules")}>
                Change rule
              </Button>
            ) : null}
          </div>
          {!selectedRule ? (
            <Card className="border-dashed bg-muted/10">
              <CardTitle className="text-base">Select a pricing rule first</CardTitle>
              <CardDescription className="mt-2">
                Add-ons belong to a specific rule. Go to <strong>Pricing rules</strong> and click{" "}
                <strong>Manage</strong> on the row you want to extend.
              </CardDescription>
              <Button className="mt-4" variant="outline" onClick={() => setSettingsTab("rules")}>
                Open pricing rules
              </Button>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Editing extras for{" "}
                <span className="font-medium text-foreground">{selectedRule.name}</span>.
              </p>
              <PricingRuleDetailCard rule={selectedRule} />
              <AddonsList
                addons={addonsQuery.data ?? []}
                canMutate={canMutate}
                isLoading={addonsQuery.isLoading}
                onAdd={() => {
                  setAddonFormError(null);
                  setAddonEditTarget(null);
                  setAddonFormOpen(true);
                }}
                onEdit={(addon) => {
                  setAddonFormError(null);
                  setAddonEditTarget(addon);
                  setAddonFormOpen(true);
                }}
                onDelete={(addon) => {
                  setAddonDeleteError(null);
                  setAddonDeleteTarget(addon);
                }}
              />
            </>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Operations automation</h2>
            <div className="flex gap-2">
              {canOperateAutomation ? (
                <Button variant="outline" onClick={() => setRecurringFormOpen(true)}>
                  New recurring template
                </Button>
              ) : null}
              {canOperateAutomation ? (
                <Button onClick={() => setAutomationRunOpen(true)}>Run now</Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {(automationStatus.data?.rules ?? []).map((rule) => (
              <AutomationRuleCard
                key={rule.id}
                rule={rule}
                onToggle={(current) =>
                  void updateAutomationRule.mutateAsync({
                    id: current.id,
                    payload: { isEnabled: !current.isEnabled }
                  })
                }
              />
            ))}
          </div>

          <AutomationStatusPanel logs={automationStatus.data?.recentRuns ?? []} />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Recurring jobs</h3>
            <RecurringJobList
              items={recurringJobs.data ?? []}
              onEdit={(item) => {
                setRecurringEditTarget(item);
                setRecurringFormOpen(true);
              }}
              onDelete={(item) => {
                void deleteRecurring.mutateAsync(item.id);
              }}
            />
          </div>
        </section>
      )}

      <PricingRuleFormDialog
        open={createOpen}
        title="Create pricing rule"
        description="Define fees and block pricing. Mark one rule as default for new work."
        initialValues={emptyRuleForm}
        submitLabel="Create"
        isSubmitting={createRule.isPending}
        serverError={ruleFormError}
        onClose={() => {
          setRuleFormError(null);
          setCreateOpen(false);
        }}
        onSubmit={onCreateRule}
      />

      <PricingRuleFormDialog
        open={Boolean(editTarget)}
        title="Edit pricing rule"
        description="Update rule values. Default and active flags follow backend rules."
        initialValues={editTarget ? toRuleFormValues(editTarget) : emptyRuleForm}
        submitLabel="Save"
        isSubmitting={updateRule.isPending}
        serverError={ruleFormError}
        onClose={() => {
          setRuleFormError(null);
          setEditTarget(null);
        }}
        onSubmit={onUpdateRule}
      />

      <PricingRuleDeleteDialog
        open={Boolean(deleteTarget)}
        ruleName={deleteTarget?.name}
        isDeleting={deleteRule.isPending}
        error={deleteRuleError}
        onCancel={() => {
          setDeleteRuleError(null);
          setDeleteTarget(null);
        }}
        onConfirm={onDeleteRule}
      />

      <AddonFormDialog
        open={addonFormOpen}
        title={addonEditTarget ? "Edit add-on" : "Add service add-on"}
        description="Optional extras billed with this pricing rule."
        initialValues={addonEditTarget ? toAddonFormValues(addonEditTarget) : emptyAddonForm}
        submitLabel={addonEditTarget ? "Save" : "Create"}
        isSubmitting={createAddon.isPending || updateAddon.isPending}
        serverError={addonFormError}
        onClose={() => {
          setAddonFormError(null);
          setAddonFormOpen(false);
          setAddonEditTarget(null);
        }}
        onSubmit={onAddonSubmit}
      />

      <AddonDeleteDialog
        open={Boolean(addonDeleteTarget)}
        addonName={addonDeleteTarget?.name}
        isDeleting={deleteAddon.isPending}
        error={addonDeleteError}
        onCancel={() => {
          setAddonDeleteError(null);
          setAddonDeleteTarget(null);
        }}
        onConfirm={onDeleteAddon}
      />
      <RunAutomationDialog
        open={automationRunOpen}
        isRunning={runAutomation.isPending}
        onClose={() => setAutomationRunOpen(false)}
        onRunAll={() =>
          void runAutomation.mutateAsync(undefined, {
            onSuccess: () => {
              toast({ title: "Automation run completed", variant: "success" });
              setAutomationRunOpen(false);
            },
            onError: (error) => {
              toast({
                title: "Automation run failed",
                description: error instanceof ApiError ? error.message : "Unable to execute automations.",
                variant: "destructive"
              });
            }
          })
        }
      />
      <RecurringJobFormDialog
        open={recurringFormOpen}
        editing={recurringEditTarget}
        customers={customersQuery.data?.items ?? []}
        technicians={techniciansQuery.data?.items ?? []}
        isSubmitting={createRecurring.isPending || updateRecurring.isPending}
        onClose={() => {
          setRecurringFormOpen(false);
          setRecurringEditTarget(null);
        }}
        onSubmit={(payload) => {
          const action = recurringEditTarget
            ? updateRecurring.mutateAsync({ id: recurringEditTarget.id, payload })
            : createRecurring.mutateAsync(payload);
          void action.then(() => {
            toast({
              title: recurringEditTarget ? "Recurring template updated" : "Recurring template created",
              variant: "success"
            });
            setRecurringFormOpen(false);
            setRecurringEditTarget(null);
          });
        }}
      />
    </div>
  );
}

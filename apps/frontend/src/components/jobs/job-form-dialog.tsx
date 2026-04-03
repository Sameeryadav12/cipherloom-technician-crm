import { X } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { JobForm } from "./job-form";
import type { Customer, Technician } from "@/types/api";
import type { JobFormValues, PricingRuleListItem } from "@/types/jobs";

type JobFormDialogProps = {
  open: boolean;
  title: string;
  description: string;
  initialValues: JobFormValues;
  customers: Customer[];
  technicians: Technician[];
  pricingRules: PricingRuleListItem[];
  submitLabel: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (values: JobFormValues) => Promise<void> | void;
};

export function JobFormDialog({
  open,
  title,
  description,
  initialValues,
  customers,
  technicians,
  pricingRules,
  submitLabel,
  isSubmitting,
  serverError,
  onClose,
  onSubmit
}: JobFormDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]">
      <Card className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden border-border/80 p-0 shadow-surface-lg">
        <div className="flex items-start justify-between gap-4 border-b border-border/80 bg-gradient-to-r from-primary/8 to-transparent px-6 py-5">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
          </div>
          <button
            type="button"
            className="rounded-lg border border-border/80 bg-background/50 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-5.5rem)] overflow-y-auto px-6 py-5">
          <JobForm
            initialValues={initialValues}
            customers={customers}
            technicians={technicians}
            pricingRules={pricingRules}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting}
            serverError={serverError}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </div>
      </Card>
    </div>
  );
}

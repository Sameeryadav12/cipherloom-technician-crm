import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PricingRuleForm } from "./pricing-rule-form";
import type { PricingRuleFormValues, PricingRulePayload } from "@/types/settings";

type PricingRuleFormDialogProps = {
  open: boolean;
  title: string;
  description: string;
  initialValues: PricingRuleFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (payload: PricingRulePayload) => Promise<void> | void;
};

export function PricingRuleFormDialog({
  open,
  title,
  description,
  initialValues,
  submitLabel,
  isSubmitting,
  serverError,
  onClose,
  onSubmit
}: PricingRuleFormDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-auto">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-2">{description}</CardDescription>
        <div className="mt-4">
          <PricingRuleForm
            initialValues={initialValues}
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

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { TechnicianForm } from "./technician-form";
import type { TechnicianFormValues } from "@/types/technicians";

type TechnicianFormDialogProps = {
  open: boolean;
  title: string;
  description: string;
  initialValues: TechnicianFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  linkedUserSummary?: string | null;
  onClose: () => void;
  onSubmit: (values: TechnicianFormValues) => Promise<void> | void;
};

export function TechnicianFormDialog({
  open,
  title,
  description,
  initialValues,
  submitLabel,
  isSubmitting,
  serverError,
  linkedUserSummary,
  onClose,
  onSubmit
}: TechnicianFormDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-auto">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-2">{description}</CardDescription>
        <div className="mt-4">
          <TechnicianForm
            initialValues={initialValues}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting}
            serverError={serverError}
            linkedUserSummary={linkedUserSummary}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </div>
      </Card>
    </div>
  );
}


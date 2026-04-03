import { X } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CustomerForm } from "./customer-form";
import type { CustomerFormValues, CustomerListItem } from "@/types/customers";

type CustomerFormDialogProps = {
  open: boolean;
  title: string;
  description: string;
  initialValues: CustomerFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  peerCustomers?: CustomerListItem[];
  excludeCustomerId?: string;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => Promise<void> | void;
};

export function CustomerFormDialog({
  open,
  title,
  description,
  initialValues,
  submitLabel,
  isSubmitting,
  serverError,
  peerCustomers,
  excludeCustomerId,
  onClose,
  onSubmit
}: CustomerFormDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]">
      <Card className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden border-border/80 p-0 shadow-surface-lg">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/80 bg-gradient-to-r from-primary/8 to-transparent px-6 py-5">
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
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <CustomerForm
            initialValues={initialValues}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting}
            serverError={serverError}
            peerCustomers={peerCustomers}
            excludeCustomerId={excludeCustomerId}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </div>
      </Card>
    </div>
  );
}

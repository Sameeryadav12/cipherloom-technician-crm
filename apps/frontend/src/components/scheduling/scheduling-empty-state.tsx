import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

type SchedulingEmptyStateProps = {
  title?: string;
  description?: string;
};

export function SchedulingEmptyState({
  title = "Ready when you are",
  description = "Run a request to see ranked technician + slot combinations tailored to skills, travel context, and availability."
}: SchedulingEmptyStateProps) {
  return (
    <div className="space-y-4">
      <Card className="border-dashed border-primary/25 bg-gradient-to-br from-primary/10 via-card/60 to-card/40">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-primary/30 bg-primary/15 p-2 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-2 leading-relaxed">{description}</CardDescription>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="bg-card/50">
          <CardTitle className="text-sm">What the assistant weighs</CardTitle>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li>Required skills vs technician profile</li>
            <li>Optional preferred window (or a smart near-future search)</li>
            <li>Optional technician preference — treated as a strong hint, not a hard lock</li>
            <li>Service area hints from suburb / state / postcode</li>
          </ul>
        </Card>
        <Card className="bg-card/50">
          <CardTitle className="text-sm">Example requests</CardTitle>
          <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
            <li className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 font-mono text-[11px] text-foreground/90">
              “HVAC tune-up, 90 min, skills: HVAC, prefers Tue AM”
            </li>
            <li className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 font-mono text-[11px] text-foreground/90">
              “Emergency leak, 60 min, any tech, Surry Hills NSW”
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Best for:</span> dispatchers booking complex jobs, overflow
            coverage, and last-minute reshuffles.
          </p>
        </Card>
      </div>
    </div>
  );
}

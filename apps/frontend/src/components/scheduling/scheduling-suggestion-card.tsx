import { Link, useNavigate } from "react-router-dom";
import { Copy, ExternalLink, Star } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { SchedulingRequest, SchedulingSuggestion } from "@/types/scheduling";

const linkOutlineSm =
  "inline-flex h-8 items-center justify-center gap-1 rounded-md border border-border bg-transparent px-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function formatScore(score?: number) {
  if (score === undefined || score === null || Number.isNaN(score)) return null;
  if (score > 0 && score <= 1) return `${Math.round(score * 100)}% fit`;
  return `Score ${Math.round(score)}`;
}

type SchedulingSuggestionCardProps = {
  suggestion: SchedulingSuggestion;
  rank: number;
  isBest?: boolean;
  lastRequest: SchedulingRequest | null;
  executionBusy: boolean;
  onOpenApply: (suggestion: SchedulingSuggestion) => void;
  onSelect?: (suggestion: SchedulingSuggestion) => void;
};

export function SchedulingSuggestionCard({
  suggestion,
  rank,
  isBest,
  lastRequest,
  executionBusy,
  onOpenApply,
  onSelect
}: SchedulingSuggestionCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const tech = suggestion.technician;
  const slot = suggestion.slot;
  const scoreLabel = formatScore(suggestion.score);

  const canApply = Boolean(lastRequest?.customerId?.trim() && lastRequest?.title?.trim());

  const copyDetails = () => {
    const lines = [
      `Technician: ${tech.name ?? "—"}`,
      `Start: ${formatDateTime(slot.start)}`,
      `End: ${formatDateTime(slot.end)}`,
      suggestion.reason ? `Reason: ${suggestion.reason}` : null,
      lastRequest?.durationMinutes != null ? `Duration: ${lastRequest.durationMinutes} min` : null,
      lastRequest?.requiredSkills?.length ? `Skills: ${lastRequest.requiredSkills.join(", ")}` : null
    ].filter(Boolean);
    void navigator.clipboard.writeText(lines.join("\n"));
    toast({ title: "Copied", description: "Suggestion details copied to clipboard.", variant: "success" });
  };

  const prefillJobForm = () => {
    if (!lastRequest?.customerId) {
      toast({
        title: "Pick a customer first",
        description: "The request form needs a customer to prefill the job composer.",
        variant: "destructive"
      });
      return;
    }
    navigate("/jobs", {
      state: {
        schedulingJobPrefill: {
          customerId: lastRequest.customerId,
          title: lastRequest.title?.trim() || "Scheduled service",
          scheduledStart: slot.start,
          scheduledEnd: slot.end,
          technicianId: tech.id
        }
      }
    });
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-shadow",
        isBest && "border-primary/50 bg-gradient-to-br from-primary/12 via-card/80 to-card/50 shadow-glow"
      )}
    >
      {isBest ? (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-primary/40 bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          <Star className="h-3 w-3 fill-primary text-primary" />
          Best match
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3 pr-2">
        <div className="min-w-[240px]">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md text-xs font-bold",
                isBest ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {rank}
            </span>
            <CardTitle className="text-base">
              {tech.name ?? "Technician"}
              {tech.color ? (
                <span
                  className="ml-2 inline-block h-2.5 w-2.5 rounded-full align-middle ring-2 ring-white/10"
                  style={{ backgroundColor: tech.color }}
                  aria-hidden
                />
              ) : null}
            </CardTitle>
          </div>
          <CardDescription className="mt-2 font-medium text-foreground/90">
            {formatDateTime(slot.start)} → {formatDateTime(slot.end)}
          </CardDescription>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {scoreLabel ? (
            <span className="rounded-full border border-border/80 bg-muted/50 px-3 py-1 text-center text-xs text-foreground">
              {scoreLabel}
            </span>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              className="h-8 min-w-[148px] px-3 text-xs font-semibold shadow-glow"
              disabled={!canApply || executionBusy}
              onClick={() => onOpenApply(suggestion)}
            >
              Apply suggestion
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 px-3 text-xs"
              disabled={executionBusy}
              onClick={prefillJobForm}
            >
              Open in job form
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-1 px-3 text-xs"
              disabled={executionBusy}
              onClick={copyDetails}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
            <Link to={`/technicians/${tech.id}`} className={cn(linkOutlineSm)}>
              <ExternalLink className="h-3.5 w-3.5" />
              Profile
            </Link>
            <Link
              to="/calendar"
              className={cn(linkOutlineSm)}
              title="Compare on calendar"
            >
              Calendar
            </Link>
            {onSelect ? (
              <Button type="button" variant="ghost" className="h-8 px-3 text-xs" onClick={() => onSelect(suggestion)}>
                Highlight
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {suggestion.reason ? (
        <div className="mt-3 rounded-lg border border-border/70 bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground">
          {suggestion.reason}
        </div>
      ) : null}

      {Array.isArray(tech.skills) && tech.skills.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tech.skills.slice(0, 12).map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border/60 bg-background/50 px-2.5 py-0.5 text-[11px] text-foreground/85"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      {!canApply ? (
        <p className="mt-3 text-[11px] text-amber-200/90">
          Select a customer and job title in the request form to run the execution workflow.
        </p>
      ) : null}
    </Card>
  );
}

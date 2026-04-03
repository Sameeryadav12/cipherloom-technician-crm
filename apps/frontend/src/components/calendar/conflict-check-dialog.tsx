import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const linkOutlineBtn =
  "inline-flex h-7 items-center justify-center rounded-md border border-border bg-transparent px-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
import type { TechnicianListItem } from "@/types/technicians";
import type { ConflictCheckResponse } from "@/types/calendar";

type ConflictCheckDialogProps = {
  open: boolean;
  technicians: TechnicianListItem[];
  isTechnicianUser: boolean;
  isSubmitting?: boolean;
  submitError?: string | null;
  result: ConflictCheckResponse | null;
  onClose: () => void;
  onSubmit: (payload: {
    technicianId: string;
    start: string;
    end: string;
    ignoreJobId?: string;
    ignoreTimeOffId?: string;
  }) => void;
};

function formatRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return `${start} – ${end}`;
  return `${s.toLocaleString()} – ${e.toLocaleString()}`;
}

export function ConflictCheckDialog({
  open,
  technicians,
  isTechnicianUser,
  isSubmitting = false,
  submitError,
  result,
  onClose,
  onSubmit
}: ConflictCheckDialogProps) {
  const navigate = useNavigate();
  const [technicianId, setTechnicianId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [ignoreJobId, setIgnoreJobId] = useState("");
  const [ignoreTimeOffId, setIgnoreTimeOffId] = useState("");
  const [touched, setTouched] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setTechnicianId(isTechnicianUser && technicians[0] ? technicians[0].id : "");
      setStart("");
      setEnd("");
      setIgnoreJobId("");
      setIgnoreTimeOffId("");
      setTouched(false);
      setAdvancedOpen(false);
    }
  }, [open, isTechnicianUser, technicians]);

  const validationError = useMemo(() => {
    if (!technicianId) return "Select a technician.";
    if (!start || !end) return "Start and end are required.";
    if (new Date(end).getTime() <= new Date(start).getTime()) {
      return "End must be later than start.";
    }
    return null;
  }, [technicianId, start, end]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (isTechnicianUser && technicians.length === 0) return;
    if (validationError) return;
    onSubmit({
      technicianId,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      ignoreJobId: ignoreJobId.trim() || undefined,
      ignoreTimeOffId: ignoreTimeOffId.trim() || undefined
    });
  };

  if (!open) return null;

  const tech = technicians.find((t) => t.id === technicianId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-auto border-border/80 shadow-2xl">
        <CardTitle className="text-lg">Conflict probe</CardTitle>
        <CardDescription className="mt-2 leading-relaxed">
          Propose a technician and time window. We surface overlapping jobs and approved leave so you can reschedule with
          confidence — before you promise the customer.
        </CardDescription>

        {isTechnicianUser && technicians.length === 0 ? (
          <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-950/15 p-3 text-xs text-amber-100">
            No technician profile is linked to your account. Ask an admin to link your user to a technician record.
          </p>
        ) : null}

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          {!isTechnicianUser ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Technician</label>
              <select
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
              >
                <option value="">Select technician</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Defaults to empty each time you open this dialog — pick who you are planning for.
              </p>
            </div>
          ) : (
            <input type="hidden" value={technicianId} readOnly />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Window start</label>
              <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Window end</label>
              <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-border/80 bg-muted/20 px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-muted/35"
            onClick={() => setAdvancedOpen((v) => !v)}
          >
            <span>Advanced — ignore existing records</span>
            {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {advancedOpen ? (
            <div className="space-y-3 rounded-lg border border-border/60 bg-card/50 p-3">
              <p className="text-[11px] text-muted-foreground">
                When rescheduling, pass the current job or leave entry ID so the check skips that record and focuses on
                true overlaps.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Ignore job ID</label>
                  <Input
                    value={ignoreJobId}
                    onChange={(e) => setIgnoreJobId(e.target.value)}
                    placeholder="Current job UUID"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Ignore time-off ID</label>
                  <Input
                    value={ignoreTimeOffId}
                    onChange={(e) => setIgnoreTimeOffId(e.target.value)}
                    placeholder="Leave entry UUID"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {touched && validationError ? (
            <p className="text-xs font-medium text-red-300">{validationError}</p>
          ) : null}
          {submitError ? (
            <p className="rounded-lg border border-red-500/40 bg-red-950/20 p-2 text-xs text-red-200">{submitError}</p>
          ) : null}

          {result ? (
            <div
              className={cn(
                "rounded-xl border p-4 text-sm",
                result.hasConflict
                  ? "border-amber-500/45 bg-amber-950/20"
                  : "border-emerald-500/45 bg-emerald-950/20"
              )}
            >
              {result.hasConflict ? (
                <>
                  <p className="font-semibold text-amber-100">Overlaps detected</p>
                  <p className="mt-1 text-xs text-amber-100/80">
                    Resolve by moving the job, splitting work, or choosing another technician. Use the links below to jump
                    straight into records.
                  </p>
                  <ul className="mt-3 space-y-3 text-xs">
                    {result.conflicts.map((c) => (
                      <li
                        key={`${c.type}-${c.id}`}
                        className="rounded-lg border border-border/50 bg-background/40 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                            {c.type === "job" ? "Job" : "Time off"}
                          </span>
                          {tech?.id ? (
                            <Link
                              to={`/technicians/${tech.id}`}
                              className="text-[10px] text-primary hover:underline"
                              onClick={onClose}
                            >
                              Technician profile
                            </Link>
                          ) : null}
                        </div>
                        <div className="mt-1 font-medium text-foreground">{c.title}</div>
                        <div className="text-muted-foreground">{formatRange(c.start, c.end)}</div>
                        <div className="mt-1 text-muted-foreground">{c.message}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {c.type === "job" ? (
                            <Link to={`/jobs/${c.id}`} onClick={onClose} className={linkOutlineBtn}>
                              Open job
                            </Link>
                          ) : (
                            <Link
                              to={`/technicians/${technicianId}#time-off`}
                              onClick={onClose}
                              className={linkOutlineBtn}
                            >
                              Manage leave
                            </Link>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              onClose();
                              navigate("/scheduling", {
                                state: {
                                  prefillIgnoreJobId: c.type === "job" ? c.id : undefined
                                }
                              });
                            }}
                          >
                            Smart scheduling
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[11px] text-amber-100/75">
                    Suggested fix: shorten the window, pick another slot, or run Smart Scheduling with skills and travel
                    context.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-emerald-100">Clear window</p>
                  <p className="mt-1 text-sm text-emerald-100/90">
                    No overlapping jobs or approved leave for{" "}
                    <span className="font-medium">{tech?.name ?? "this technician"}</span> in this range.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="gap-1"
                      onClick={() => {
                        onClose();
                        navigate("/jobs?new=1");
                      }}
                    >
                      Create job with this slot
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                        onClose();
                        navigate("/scheduling");
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Open assistant
                    </Button>
                  </div>
                  <p className="mt-3 text-[11px] text-emerald-100/70">
                    Operational note: always confirm travel and parts before locking in with the customer.
                  </p>
                </>
              )}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Close
            </Button>
            <Button type="submit" disabled={isSubmitting || (isTechnicianUser && technicians.length === 0)}>
              {isSubmitting ? "Checking…" : "Run conflict check"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

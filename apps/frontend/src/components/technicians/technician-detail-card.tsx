import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { TechnicianColorSwatch } from "./technician-color-swatch";
import { TechnicianSkillsList } from "./technician-skills-list";
import { TechnicianStatusBadge } from "./technician-status-badge";
import type { TechnicianDetail } from "@/types/technicians";

type TechnicianDetailCardProps = {
  technician: TechnicianDetail;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function TechnicianDetailCard({ technician }: TechnicianDetailCardProps) {
  return (
    <Card>
      <CardTitle>{technician.name}</CardTitle>
      <CardDescription className="mt-2">Technician profile and account linkage.</CardDescription>
      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{technician.email ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Phone</dt>
          <dd>{technician.phone ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="mt-1">
            <TechnicianStatusBadge isActive={technician.isActive} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Color</dt>
          <dd className="mt-1">
            <TechnicianColorSwatch color={technician.color} />
          </dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-muted-foreground">Skills</dt>
          <dd className="mt-1">
            <TechnicianSkillsList skills={technician.skills ?? []} />
          </dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-muted-foreground">Linked User</dt>
          <dd>
            {technician.linkedUser
              ? `${technician.linkedUser.email} (${technician.linkedUser.role})`
              : "No linked user"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{formatDateTime(technician.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Updated</dt>
          <dd>{formatDateTime(technician.updatedAt)}</dd>
        </div>
      </dl>
      {technician._count ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border p-2 text-sm">
            <p className="text-muted-foreground">Jobs</p>
            <p className="text-lg font-semibold">{technician._count.jobs}</p>
          </div>
          <div className="rounded-md border border-border p-2 text-sm">
            <p className="text-muted-foreground">Time-Off</p>
            <p className="text-lg font-semibold">{technician._count.timeOff}</p>
          </div>
        </div>
      ) : null}
    </Card>
  );
}


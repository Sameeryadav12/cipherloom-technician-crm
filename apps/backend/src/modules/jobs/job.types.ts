import type { JobStatus, UserRole } from "@prisma/client";

export type JobAuthContext = {
  userId: string;
  role: UserRole;
};

export type JobListIncludes = {
  customer: { id: string; name: string };
  technician: { id: string; name: string } | null;
};

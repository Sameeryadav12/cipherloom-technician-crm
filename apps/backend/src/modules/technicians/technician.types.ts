import type { Technician, UserRole } from "@prisma/client";

export type LinkedUserSummary = {
  id: string;
  email: string;
  role: UserRole;
};

export type TechnicianPublic = Technician & {
  linkedUser?: LinkedUserSummary | null;
};

export type TechnicianDetail = TechnicianPublic & {
  _count?: {
    jobs: number;
    timeOff: number;
  };
};

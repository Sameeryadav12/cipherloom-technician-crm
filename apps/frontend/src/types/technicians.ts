import type { Technician } from "@/types/api";

export type TechnicianLinkedUser = {
  id: string;
  email: string;
  role: "ADMIN" | "STAFF" | "TECHNICIAN";
};

export type TechnicianCounts = {
  jobs: number;
  timeOff: number;
};

export type TechnicianListItem = Technician & {
  linkedUser?: TechnicianLinkedUser | null;
};

export type TechnicianDetail = TechnicianListItem & {
  _count?: TechnicianCounts;
};

export type TechnicianFormValues = {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  color: string;
  isActive: boolean;
  linkedUserId: string;
};

export type TechnicianPayload = {
  name: string;
  email?: string;
  phone?: string;
  skills?: string[];
  color?: string;
  isActive?: boolean;
  linkedUserId?: string | null;
};

export type TechnicianListParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
};


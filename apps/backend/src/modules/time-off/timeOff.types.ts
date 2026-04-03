import type { Technician, TimeOff } from "@prisma/client";

export type TechnicianSummary = Pick<
  Technician,
  "id" | "name" | "email" | "isActive"
>;

export type TimeOffPublic = TimeOff & {
  technician?: TechnicianSummary;
};

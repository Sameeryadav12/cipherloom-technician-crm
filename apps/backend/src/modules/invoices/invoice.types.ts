import type { InvoiceStatus, UserRole } from "@prisma/client";

export type InvoiceAuthContext = {
  userId: string;
  role: UserRole;
};

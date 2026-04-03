import type { Customer } from "@prisma/client";

/** Customer entity returned by customer endpoints (JSON-serialized dates). */
export type CustomerPublic = Customer;

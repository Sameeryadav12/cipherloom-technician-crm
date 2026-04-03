import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

declare global {
  var __prismaClient: PrismaClient | undefined;
}

const prisma =
  globalThis.__prismaClient ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (env.NODE_ENV !== "production") {
  globalThis.__prismaClient = prisma;
}

export { prisma };

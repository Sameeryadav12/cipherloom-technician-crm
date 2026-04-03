import "dotenv/config";

/**
 * Removes UI-created test rows shown in local demos:
 * - Jobs: "Testing Schedule", "Creating job test"
 * - Technician: "Technician Test"
 * - Customer: "Testing Customer"
 *
 * Does NOT remove seed demo data (e.g. Priya Sparks, Bayside Family Residence).
 *
 * Run: pnpm exec tsx prisma/cleanup-test-entities.ts
 * (from apps/backend, with DATABASE_URL set)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const JOB_TITLES = ["Testing Schedule", "Creating job test"] as const;
const TECH_NAME = "Technician Test";
const CUSTOMER_NAME = "Testing Customer";

async function main() {
  const deletedJobs = await prisma.job.deleteMany({
    where: { title: { in: [...JOB_TITLES] } }
  });

  const deletedTechs = await prisma.technician.deleteMany({
    where: { name: TECH_NAME }
  });

  const deletedCustomers = await prisma.customer.deleteMany({
    where: { name: CUSTOMER_NAME }
  });

  console.log(
    JSON.stringify(
      {
        deletedJobs: deletedJobs.count,
        deletedTechnicians: deletedTechs.count,
        deletedCustomers: deletedCustomers.count
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());

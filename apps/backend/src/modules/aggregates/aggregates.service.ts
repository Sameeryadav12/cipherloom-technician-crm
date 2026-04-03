import { InvoiceStatus, JobStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/app-error.js";

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getDashboardAggregates() {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const [totalJobs, jobsToday, unassignedJobs, completedJobs, overdueInvoices, techniciansOnLeaveToday] =
    await Promise.all([
      prisma.job.count(),
      prisma.job.count({
        where: {
          scheduledStart: { gte: todayStart, lte: todayEnd },
          status: { not: JobStatus.CANCELLED }
        }
      }),
      prisma.job.count({ where: { technicianId: null, status: { not: JobStatus.CANCELLED } } }),
      prisma.job.count({ where: { status: JobStatus.COMPLETED } }),
      prisma.invoice.count({ where: { status: InvoiceStatus.OVERDUE } }),
      prisma.technician.count({
        where: {
          timeOff: {
            some: {
              start: { lte: todayEnd },
              end: { gte: todayStart }
            }
          }
        }
      })
    ]);

  return {
    totalJobs,
    jobsToday,
    unassignedJobs,
    completedJobs,
    overdueInvoices,
    techniciansOnLeaveToday
  };
}

export async function getCustomerAggregates(customerId: string) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } });
  if (!customer) {
    throw new AppError({ statusCode: 404, message: "Customer not found" });
  }
  const [totalJobs, activeJobs, unpaidInvoices, lastJob] = await Promise.all([
    prisma.job.count({ where: { customerId } }),
    prisma.job.count({
      where: { customerId, status: { in: [JobStatus.NEW, JobStatus.SCHEDULED, JobStatus.IN_PROGRESS] } }
    }),
    prisma.invoice.count({
      where: {
        job: { customerId },
        status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.OVERDUE] }
      }
    }),
    prisma.job.findFirst({
      where: { customerId, scheduledStart: { not: null } },
      orderBy: { scheduledStart: "desc" },
      select: { scheduledStart: true, createdAt: true }
    })
  ]);

  return {
    totalJobs,
    activeJobs,
    unpaidInvoices,
    lastJobDate: lastJob?.scheduledStart ?? lastJob?.createdAt ?? null
  };
}

export async function getTechnicianAggregates(technicianId: string) {
  const technician = await prisma.technician.findUnique({ where: { id: technicianId }, select: { id: true } });
  if (!technician) {
    throw new AppError({ statusCode: 404, message: "Technician not found" });
  }
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const [jobsToday, upcomingJobs, timeOffCount] = await Promise.all([
    prisma.job.count({
      where: {
        technicianId,
        scheduledStart: { gte: todayStart, lte: todayEnd },
        status: { not: JobStatus.CANCELLED }
      }
    }),
    prisma.job.count({
      where: {
        technicianId,
        scheduledStart: { gt: now },
        status: { in: [JobStatus.SCHEDULED, JobStatus.NEW, JobStatus.IN_PROGRESS] }
      }
    }),
    prisma.timeOff.count({ where: { technicianId } })
  ]);

  return {
    jobsToday,
    upcomingJobs,
    timeOffCount,
    workloadScore: jobsToday + upcomingJobs
  };
}

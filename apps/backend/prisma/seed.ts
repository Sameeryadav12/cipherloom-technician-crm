import bcrypt from "bcrypt";
import {
  InvoiceStatus,
  JobStatus,
  PrismaClient,
  UserRole
} from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "CipherloomDemo#2026";

function addDays(base: Date, days: number, hour: number, minute = 0) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function clearDemoData() {
  await prisma.invoice.deleteMany();
  await prisma.timeOff.deleteMany();
  await prisma.job.deleteMany();
  await prisma.serviceAddon.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const [admin, staff, techUser1, techUser2, techUser3] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Alicia Admin",
        email: "admin@cipherloom.local",
        role: UserRole.ADMIN,
        passwordHash
      }
    }),
    prisma.user.create({
      data: {
        name: "Sam Staff",
        email: "staff@cipherloom.local",
        role: UserRole.STAFF,
        passwordHash
      }
    }),
    prisma.user.create({
      data: {
        name: "Theo Field",
        email: "tech1@cipherloom.local",
        role: UserRole.TECHNICIAN,
        passwordHash
      }
    }),
    prisma.user.create({
      data: {
        name: "Priya Sparks",
        email: "tech2@cipherloom.local",
        role: UserRole.TECHNICIAN,
        passwordHash
      }
    }),
    prisma.user.create({
      data: {
        name: "Marco Fixit",
        email: "tech3@cipherloom.local",
        role: UserRole.TECHNICIAN,
        passwordHash
      }
    })
  ]);

  return { admin, staff, techUser1, techUser2, techUser3 };
}

async function seedTechnicians(users: {
  techUser1: { id: string };
  techUser2: { id: string };
  techUser3: { id: string };
}) {
  const [tech1, tech2, tech3, tech4] = await Promise.all([
    prisma.technician.create({
      data: {
        name: "Theo Field",
        email: "tech1@cipherloom.local",
        phone: "+61 400 111 001",
        skills: ["it-support", "networking", "hardware-repair"],
        color: "#3b82f6",
        linkedUserId: users.techUser1.id
      }
    }),
    prisma.technician.create({
      data: {
        name: "Priya Sparks",
        email: "tech2@cipherloom.local",
        phone: "+61 400 111 002",
        skills: ["electrical", "safety-checks", "lighting"],
        color: "#f59e0b",
        linkedUserId: users.techUser2.id
      }
    }),
    prisma.technician.create({
      data: {
        name: "Marco Fixit",
        email: "tech3@cipherloom.local",
        phone: "+61 400 111 003",
        skills: ["appliance-repair", "plumbing", "installation"],
        color: "#10b981",
        linkedUserId: users.techUser3.id
      }
    }),
    prisma.technician.create({
      data: {
        name: "Dana Dispatch",
        email: "dana.contractor@cipherloom.local",
        phone: "+61 400 111 004",
        skills: ["it-support", "on-site-diagnostics"],
        color: "#8b5cf6"
      }
    })
  ]);

  return { tech1, tech2, tech3, tech4 };
}

async function seedCustomers() {
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: "Northside Legal Group",
        email: "ops@northsidelegal.demo",
        phone: "+61 2 9000 1001",
        suburb: "Parramatta",
        state: "NSW",
        postcode: "2150",
        country: "Australia"
      }
    }),
    prisma.customer.create({
      data: {
        name: "Harborview Apartments",
        email: "manager@harborview.demo",
        phone: "+61 2 9000 1002",
        suburb: "Chatswood",
        state: "NSW",
        postcode: "2067",
        country: "Australia"
      }
    }),
    prisma.customer.create({
      data: {
        name: "Blue Gum Cafe",
        email: "owner@bluegum.demo",
        phone: "+61 2 9000 1003",
        suburb: "Newtown",
        state: "NSW",
        postcode: "2042",
        country: "Australia"
      }
    }),
    prisma.customer.create({
      data: {
        name: "Westpoint Dental Clinic",
        email: "admin@westpointdental.demo",
        phone: "+61 2 9000 1004",
        suburb: "Blacktown",
        state: "NSW",
        postcode: "2148",
        country: "Australia"
      }
    }),
    prisma.customer.create({
      data: {
        name: "Bayside Family Residence",
        phone: "+61 2 9000 1005",
        suburb: "Maroubra",
        state: "NSW",
        postcode: "2035",
        country: "Australia"
      }
    })
  ]);

  return customers;
}

async function seedPricing() {
  const standard = await prisma.pricingRule.create({
    data: {
      name: "Standard Business Hours",
      description: "Weekday on-site service during standard business hours.",
      baseCalloutFee: 95,
      blockMinutes: 30,
      blockRate: 45,
      isDefault: true,
      isActive: true
    }
  });

  const afterHours = await prisma.pricingRule.create({
    data: {
      name: "After Hours Priority",
      description: "Priority support outside standard hours.",
      baseCalloutFee: 140,
      blockMinutes: 30,
      blockRate: 65,
      isDefault: false,
      isActive: true
    }
  });

  await prisma.serviceAddon.createMany({
    data: [
      {
        pricingRuleId: standard.id,
        name: "Urgent Same-Day Dispatch",
        description: "Prioritized technician dispatch within same day.",
        price: 85,
        isActive: true
      },
      {
        pricingRuleId: standard.id,
        name: "Hardware Supply Fee",
        description: "Procurement and pickup handling for required hardware.",
        price: 35,
        isActive: true
      },
      {
        pricingRuleId: afterHours.id,
        name: "Late Night Surcharge",
        description: "Surcharge for jobs commencing after 8 PM.",
        price: 120,
        isActive: true
      },
      {
        pricingRuleId: afterHours.id,
        name: "Public Holiday Load",
        description: "Additional load applied on public holidays.",
        price: 150,
        isActive: true
      }
    ]
  });

  return { standard, afterHours };
}

async function seedJobsAndInvoices(input: {
  adminId: string;
  staffId: string;
  customers: Array<{ id: string }>;
  technicians: {
    tech1: { id: string };
    tech2: { id: string };
    tech3: { id: string };
    tech4: { id: string };
  };
  pricing: {
    standard: { id: string };
    afterHours: { id: string };
  };
}) {
  const now = new Date();

  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: "Office Wi-Fi dead zones investigation",
        description: "Packet drops on second floor meeting rooms.",
        customerId: input.customers[0].id,
        technicianId: input.technicians.tech1.id,
        pricingRuleId: input.pricing.standard.id,
        createdByUserId: input.staffId,
        status: JobStatus.SCHEDULED,
        scheduledStart: addDays(now, 1, 10, 0),
        scheduledEnd: addDays(now, 1, 11, 30),
        serviceAddressLine1: "18 George St",
        serviceSuburb: "Parramatta",
        serviceState: "NSW",
        servicePostcode: "2150",
        serviceCountry: "Australia"
      }
    }),
    prisma.job.create({
      data: {
        title: "Switchboard safety inspection",
        description: "Quarterly compliance check for tenancy fit-out.",
        customerId: input.customers[1].id,
        technicianId: input.technicians.tech2.id,
        pricingRuleId: input.pricing.standard.id,
        createdByUserId: input.adminId,
        status: JobStatus.IN_PROGRESS,
        scheduledStart: addDays(now, 0, 13, 0),
        scheduledEnd: addDays(now, 0, 15, 0),
        serviceAddressLine1: "22 Pacific Hwy",
        serviceSuburb: "Chatswood",
        serviceState: "NSW",
        servicePostcode: "2067",
        serviceCountry: "Australia"
      }
    }),
    prisma.job.create({
      data: {
        title: "Commercial dishwasher drainage fault",
        description: "Intermittent blockage and overflow alerts.",
        customerId: input.customers[2].id,
        technicianId: input.technicians.tech3.id,
        pricingRuleId: input.pricing.afterHours.id,
        createdByUserId: input.staffId,
        status: JobStatus.COMPLETED,
        scheduledStart: addDays(now, -1, 16, 0),
        scheduledEnd: addDays(now, -1, 18, 0),
        serviceAddressLine1: "7 King St",
        serviceSuburb: "Newtown",
        serviceState: "NSW",
        servicePostcode: "2042",
        serviceCountry: "Australia"
      }
    }),
    prisma.job.create({
      data: {
        title: "Dental chair power instability",
        description: "Chair resets during motor movement.",
        customerId: input.customers[3].id,
        technicianId: input.technicians.tech2.id,
        pricingRuleId: input.pricing.standard.id,
        createdByUserId: input.adminId,
        status: JobStatus.INVOICED,
        scheduledStart: addDays(now, -4, 9, 30),
        scheduledEnd: addDays(now, -4, 11, 0),
        serviceAddressLine1: "11 Main Rd",
        serviceSuburb: "Blacktown",
        serviceState: "NSW",
        servicePostcode: "2148",
        serviceCountry: "Australia"
      }
    }),
    prisma.job.create({
      data: {
        title: "Kitchen sink leak diagnosis",
        description: "Recurring leak under sink after prior patch.",
        customerId: input.customers[4].id,
        technicianId: input.technicians.tech3.id,
        pricingRuleId: input.pricing.standard.id,
        createdByUserId: input.staffId,
        status: JobStatus.NEW
      }
    }),
    prisma.job.create({
      data: {
        title: "Router replacement request",
        description: "Customer cancelled due to internal procurement.",
        customerId: input.customers[0].id,
        technicianId: input.technicians.tech4.id,
        pricingRuleId: input.pricing.standard.id,
        createdByUserId: input.adminId,
        status: JobStatus.CANCELLED,
        scheduledStart: addDays(now, 2, 14, 0),
        scheduledEnd: addDays(now, 2, 15, 0)
      }
    })
  ]);

  await Promise.all([
    prisma.invoice.create({
      data: {
        jobId: jobs[3].id,
        pricingRuleId: input.pricing.standard.id,
        subtotal: 230,
        tax: 23,
        discount: 0,
        total: 253,
        status: InvoiceStatus.DRAFT,
        issuedAt: addDays(now, -3, 12, 0),
        dueAt: addDays(now, 7, 17, 0),
        notes: "Draft invoice awaiting final review."
      }
    }),
    prisma.invoice.create({
      data: {
        jobId: jobs[2].id,
        pricingRuleId: input.pricing.afterHours.id,
        subtotal: 335,
        tax: 33.5,
        discount: 0,
        total: 368.5,
        status: InvoiceStatus.PAID,
        issuedAt: addDays(now, -1, 19, 0),
        dueAt: addDays(now, 13, 17, 0),
        paidAt: addDays(now, 0, 9, 15),
        notes: "Paid via bank transfer."
      }
    })
  ]);

  return jobs;
}

async function seedTimeOff(technicians: {
  tech1: { id: string };
  tech2: { id: string };
  tech3: { id: string };
}) {
  const now = new Date();

  await prisma.timeOff.createMany({
    data: [
      {
        technicianId: technicians.tech1.id,
        start: addDays(now, 2, 9, 0),
        end: addDays(now, 2, 13, 0),
        reason: "Medical appointment block"
      },
      {
        technicianId: technicians.tech2.id,
        start: addDays(now, 3, 12, 0),
        end: addDays(now, 3, 17, 0),
        reason: "Training session"
      },
      {
        technicianId: technicians.tech3.id,
        start: addDays(now, 1, 8, 30),
        end: addDays(now, 1, 11, 30),
        reason: "Vehicle maintenance"
      }
    ]
  });
}

async function main() {
  await clearDemoData();

  const users = await seedUsers();
  const technicians = await seedTechnicians(users);
  const customers = await seedCustomers();
  const pricing = await seedPricing();
  await seedJobsAndInvoices({
    adminId: users.admin.id,
    staffId: users.staff.id,
    customers,
    technicians,
    pricing
  });
  await seedTimeOff(technicians);

  console.log("\nSeed complete.\n");
  console.log("Demo login credentials (development only):");
  console.log(`- admin@cipherloom.local / ${DEMO_PASSWORD}`);
  console.log(`- staff@cipherloom.local / ${DEMO_PASSWORD}`);
  console.log(`- tech1@cipherloom.local / ${DEMO_PASSWORD}`);
  console.log(`- tech2@cipherloom.local / ${DEMO_PASSWORD}`);
  console.log(`- tech3@cipherloom.local / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


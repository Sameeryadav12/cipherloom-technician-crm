import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type {
  CreateTechnicianBody,
  ListTechniciansQuery,
  UpdateTechnicianBody
} from "./technician.schemas.js";
import type { TechnicianDetail, TechnicianPublic } from "./technician.types.js";

const linkedUserSelect = {
  id: true,
  email: true,
  role: true
} satisfies Prisma.UserSelect;

async function requireTechnicianById(id: string) {
  const row = await prisma.technician.findUnique({
    where: { id },
    select: { id: true }
  });
  if (!row) {
    throw new AppError({
      statusCode: 404,
      message: "Technician not found"
    });
  }
}

async function assertLinkedUserValid(linkedUserId: string | undefined) {
  if (linkedUserId === undefined) return;
  const user = await prisma.user.findUnique({
    where: { id: linkedUserId },
    select: { id: true, role: true }
  });
  if (!user) {
    throw new AppError({
      statusCode: 400,
      message: "Linked user not found"
    });
  }
  if (user.role !== UserRole.TECHNICIAN) {
    throw new AppError({
      statusCode: 400,
      message: "Linked user must have the TECHNICIAN role"
    });
  }
}

export async function listTechnicians(query: ListTechniciansQuery): Promise<{
  items: TechnicianPublic[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}> {
  const { search, page, limit, isActive } = query;

  const parts: Prisma.TechnicianWhereInput[] = [];
  if (search && search.trim().length > 0) {
    const q = search.trim();
    parts.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } }
      ]
    });
  }
  if (typeof isActive === "boolean") {
    parts.push({ isActive });
  }

  const whereFinal: Prisma.TechnicianWhereInput =
    parts.length === 0 ? {} : { AND: parts };

  const skip = (page - 1) * limit;

  const [rows, totalItems] = await prisma.$transaction([
    prisma.technician.findMany({
      where: whereFinal,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        linkedUser: { select: linkedUserSelect }
      }
    }),
    prisma.technician.count({ where: whereFinal })
  ]);

  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

  return {
    items: rows,
    page,
    pageSize: limit,
    totalItems,
    totalPages
  };
}

export async function getTechnicianById(id: string): Promise<TechnicianDetail> {
  const technician = await prisma.technician.findUnique({
    where: { id },
    include: {
      linkedUser: { select: linkedUserSelect },
      _count: { select: { jobs: true, timeOff: true } }
    }
  });
  if (!technician) {
    throw new AppError({
      statusCode: 404,
      message: "Technician not found"
    });
  }
  return technician;
}

export async function createTechnician(
  input: CreateTechnicianBody
): Promise<TechnicianPublic> {
  await assertLinkedUserValid(input.linkedUserId);

  try {
    return await prisma.technician.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        skills: input.skills ?? [],
        color: input.color,
        isActive: input.isActive ?? true,
        linkedUserId: input.linkedUserId
      },
      include: {
        linkedUser: { select: linkedUserSelect }
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new AppError({
        statusCode: 409,
        message: "This user is already linked to another technician"
      });
    }
    throw e;
  }
}

export async function updateTechnician(
  id: string,
  input: UpdateTechnicianBody
): Promise<TechnicianPublic> {
  await requireTechnicianById(id);

  if (input.linkedUserId !== undefined && input.linkedUserId !== null) {
    await assertLinkedUserValid(input.linkedUserId);
  }

  const data: Prisma.TechnicianUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.email !== undefined) data.email = input.email;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.skills !== undefined) data.skills = { set: input.skills };
  if (input.color !== undefined) data.color = input.color;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.linkedUserId !== undefined) {
    if (input.linkedUserId === null) {
      data.linkedUser = { disconnect: true };
    } else {
      data.linkedUser = { connect: { id: input.linkedUserId } };
    }
  }

  try {
    return await prisma.technician.update({
      where: { id },
      data,
      include: {
        linkedUser: { select: linkedUserSelect }
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new AppError({
        statusCode: 409,
        message: "This user is already linked to another technician"
      });
    }
    throw e;
  }
}

export async function deleteTechnician(id: string): Promise<void> {
  await requireTechnicianById(id);

  const jobCount = await prisma.job.count({ where: { technicianId: id } });
  if (jobCount > 0) {
    throw new AppError({
      statusCode: 409,
      message: "Technician cannot be deleted because related jobs exist."
    });
  }

  const timeOffCount = await prisma.timeOff.count({
    where: { technicianId: id }
  });
  if (timeOffCount > 0) {
    throw new AppError({
      statusCode: 409,
      message:
        "Technician cannot be deleted because related time-off records exist."
    });
  }

  await prisma.technician.delete({ where: { id } });
}

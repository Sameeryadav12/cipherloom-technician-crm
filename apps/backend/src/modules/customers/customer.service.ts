import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type { CreateCustomerBody, ListCustomersQuery, UpdateCustomerBody } from "./customer.schemas.js";
import type { CustomerPublic } from "./customer.types.js";

export async function listCustomers(query: ListCustomersQuery): Promise<{
  items: CustomerPublic[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}> {
  const { search, page, limit } = query;
  const where: Prisma.CustomerWhereInput =
    search && search.length > 0
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } }
          ]
        }
      : {};

  const skip = (page - 1) * limit;

  const [items, totalItems] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.customer.count({ where })
  ]);

  const totalPages =
    totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

  return {
    items,
    page,
    pageSize: limit,
    totalItems,
    totalPages
  };
}

export async function getCustomerById(id: string): Promise<CustomerPublic> {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    throw new AppError({
      statusCode: 404,
      message: "Customer not found"
    });
  }
  return customer;
}

export async function createCustomer(
  input: CreateCustomerBody
): Promise<CustomerPublic> {
  return prisma.customer.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      suburb: input.suburb,
      state: input.state,
      postcode: input.postcode,
      country: input.country,
      notes: input.notes
    }
  });
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerBody
): Promise<CustomerPublic> {
  await getCustomerById(id);

  const data: Prisma.CustomerUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.email !== undefined) data.email = input.email;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.addressLine1 !== undefined) data.addressLine1 = input.addressLine1;
  if (input.addressLine2 !== undefined) data.addressLine2 = input.addressLine2;
  if (input.suburb !== undefined) data.suburb = input.suburb;
  if (input.state !== undefined) data.state = input.state;
  if (input.postcode !== undefined) data.postcode = input.postcode;
  if (input.country !== undefined) data.country = input.country;
  if (input.notes !== undefined) data.notes = input.notes;

  return prisma.customer.update({
    where: { id },
    data
  });
}

export async function deleteCustomer(id: string) {
  await getCustomerById(id);

  const jobCount = await prisma.job.count({
    where: { customerId: id }
  });
  if (jobCount > 0) {
    throw new AppError({
      statusCode: 409,
      message:
        "Customer cannot be deleted because related jobs exist."
    });
  }

  await prisma.customer.delete({ where: { id } });
}

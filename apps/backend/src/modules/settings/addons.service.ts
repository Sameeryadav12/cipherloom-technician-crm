import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type {
  CreateAddonBody,
  ListAddonsQuery,
  UpdateAddonBody
} from "./addons.schemas.js";
import type { ServiceAddonPublic } from "./addons.types.js";

async function requirePricingRule(id: string) {
  const row = await prisma.pricingRule.findUnique({
    where: { id },
    select: { id: true }
  });
  if (!row) {
    throw new AppError({
      statusCode: 404,
      message: "Pricing rule not found"
    });
  }
}

async function requireAddon(id: string) {
  const row = await prisma.serviceAddon.findUnique({
    where: { id },
    select: { id: true }
  });
  if (!row) {
    throw new AppError({
      statusCode: 404,
      message: "Service addon not found"
    });
  }
}

export async function listAddonsForPricingRule(
  pricingRuleId: string,
  query: ListAddonsQuery
): Promise<ServiceAddonPublic[]> {
  await requirePricingRule(pricingRuleId);

  const where: Prisma.ServiceAddonWhereInput = {
    pricingRuleId,
    ...(typeof query.isActive === "boolean" ? { isActive: query.isActive } : {})
  };

  return prisma.serviceAddon.findMany({
    where,
    orderBy: [{ name: "asc" }]
  });
}

export async function createAddonForPricingRule(
  pricingRuleId: string,
  input: CreateAddonBody
): Promise<ServiceAddonPublic> {
  await requirePricingRule(pricingRuleId);

  return prisma.serviceAddon.create({
    data: {
      pricingRuleId,
      name: input.name,
      description: input.description,
      price: new Prisma.Decimal(input.price),
      isActive: input.isActive ?? true
    }
  });
}

export async function updateAddon(
  addonId: string,
  input: UpdateAddonBody
): Promise<ServiceAddonPublic> {
  await requireAddon(addonId);

  const data: Prisma.ServiceAddonUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.price !== undefined) data.price = new Prisma.Decimal(input.price);
  if (input.isActive !== undefined) data.isActive = input.isActive;

  return prisma.serviceAddon.update({
    where: { id: addonId },
    data
  });
}

export async function deleteAddon(addonId: string): Promise<void> {
  await requireAddon(addonId);
  await prisma.serviceAddon.delete({ where: { id: addonId } });
}


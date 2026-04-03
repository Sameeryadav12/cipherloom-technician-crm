import { NotificationChannel, UserRole } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

export async function getUsersByRoles(roles: UserRole[]) {
  return prisma.user.findMany({
    where: { role: { in: roles }, isActive: true },
    select: { id: true, email: true, name: true, role: true }
  });
}

export async function getLinkedTechnicianUser(technicianId: string) {
  const tech = await prisma.technician.findUnique({
    where: { id: technicianId },
    select: { linkedUserId: true, linkedUser: { select: { id: true, email: true, name: true } } }
  });
  if (!tech?.linkedUserId || !tech.linkedUser) return null;
  return tech.linkedUser;
}

export async function getDispatchRecipients() {
  return getUsersByRoles([UserRole.ADMIN, UserRole.STAFF]);
}

export function normalizeChannels(channels?: NotificationChannel[]) {
  if (!channels || channels.length === 0) return [NotificationChannel.IN_APP];
  return Array.from(new Set(channels));
}

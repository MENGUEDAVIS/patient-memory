import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { randomPublicId } from "@/lib/ids";

export type AuditInput = {
  actorId: string;
  actorName: string;
  actorRole: Role;
  hospitalId: string;
  patientId?: string | null;
  encounterId?: string | null;
  activity: string;
  department?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
};

export async function writeAudit(input: AuditInput) {
  return prisma.auditEvent.create({
    data: {
      publicId: randomPublicId("AUD"),
      activity: input.activity,
      actorId: input.actorId,
      actorName: input.actorName,
      actorRole: input.actorRole,
      hospitalId: input.hospitalId,
      patientId: input.patientId ?? null,
      encounterId: input.encounterId ?? null,
      department: input.department ?? null,
      reason: input.reason ?? null,
      metadata: (input.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

export async function writeAccessLog(input: {
  userId: string;
  hospitalId: string;
  patientId: string;
  activity: string;
  encounterId?: string | null;
  reason?: string | null;
  emergency?: boolean;
}) {
  return prisma.accessLog.create({
    data: {
      userId: input.userId,
      hospitalId: input.hospitalId,
      patientId: input.patientId,
      activity: input.activity,
      encounterId: input.encounterId ?? null,
      reason: input.reason ?? null,
      emergency: input.emergency ?? false,
    },
  });
}

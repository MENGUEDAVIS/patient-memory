import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function recordTimeline(input: {
  encounterId: string;
  patientId: string;
  actorName: string;
  actorRole: Role;
  activity: string;
  department: string;
  summary: string;
  data?: Record<string, unknown>;
}) {
  return prisma.timelineEvent.create({
    data: {
      encounterId: input.encounterId,
      patientId: input.patientId,
      actorName: input.actorName,
      actorRole: input.actorRole,
      activity: input.activity,
      department: input.department,
      summary: input.summary,
      data: (input.data as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  });
}

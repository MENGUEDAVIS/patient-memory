import { prisma } from "@/lib/prisma";

export async function notify(input: {
  userId: string;
  hospitalId?: string | null;
  patientId?: string | null;
  title: string;
  body: string;
  kind: string;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      hospitalId: input.hospitalId ?? null,
      patientId: input.patientId ?? null,
      title: input.title,
      body: input.body,
      kind: input.kind,
      channel: "IN_APP",
    },
  });
}

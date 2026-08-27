import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { requirePerm, requireSession } from "@/lib/api";
import { hospitalScope } from "@/lib/access";

export const GET = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "audit:read");
  const hospitalId = await hospitalScope(user);
  const url = new URL(request.url);
  const actor = url.searchParams.get("actor") ?? "";
  const patient = url.searchParams.get("patient") ?? "";
  const activity = url.searchParams.get("activity") ?? "";
  const department = url.searchParams.get("department") ?? "";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const where: Prisma.AuditEventWhereInput = { hospitalId };
  if (actor) {
    where.OR = [
      { actorName: { contains: actor, mode: "insensitive" } },
      { actorRole: Object.values(Role).includes(actor as Role) ? (actor as Role) : undefined },
    ];
  }
  if (patient) {
    where.patient = {
      OR: [
        { publicId: { contains: patient, mode: "insensitive" } },
        { lastName: { contains: patient, mode: "insensitive" } },
        { firstName: { contains: patient, mode: "insensitive" } },
      ],
    };
  }
  if (activity) where.activity = { contains: activity, mode: "insensitive" };
  if (department) where.department = { contains: department, mode: "insensitive" };
  if (from || to) {
    where.createdAt = {
      gte: from ? new Date(from) : undefined,
      lte: to ? new Date(to) : undefined,
    };
  }
  const events = await prisma.auditEvent.findMany({
    where,
    include: { patient: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ events });
});

import { NextResponse } from "next/server";
import { AffiliationStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { HttpError, requirePerm, requireSession } from "@/lib/api";
import { hospitalScope } from "@/lib/access";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/csrf";
import { z } from "zod";

export const GET = apiHandler(async () => {
  const user = await requireSession();
  await requirePerm(user, "staff:manage");
  const hospitalId = await hospitalScope(user);
  const memberships = await prisma.hospitalStaffMembership.findMany({
    where: { hospitalId },
    include: { professional: true, user: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ memberships });
});

const decision = z.object({
  membershipId: z.string(),
  status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]),
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"]).optional(),
});

export const POST = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "staff:manage");
  const hospitalId = await hospitalScope(user);
  const body = decision.parse(await request.json());
  const membership = await prisma.hospitalStaffMembership.findFirst({
    where: { id: body.membershipId, hospitalId },
  });
  if (!membership) throw new HttpError(404, "Staff membership was not found.");
  const updated = await prisma.hospitalStaffMembership.update({
    where: { id: membership.id },
    data: {
      status: body.status as AffiliationStatus,
      approvedAt: body.status === "APPROVED" ? new Date() : membership.approvedAt,
    },
    include: { professional: true, user: true },
  });
  if (body.verificationStatus) {
    await prisma.healthcareProfessional.update({
      where: { id: membership.professionalId },
      data: { verificationStatus: body.verificationStatus as VerificationStatus },
    });
  }
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId,
    activity: "STAFF_AFFILIATION_UPDATED",
    metadata: { membershipId: membership.id, status: body.status },
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  return NextResponse.json({ membership: updated });
});

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { HttpError, requireRole } from "@/lib/api";
import { writeAccessLog, writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/csrf";
import { z } from "zod";

export const GET = apiHandler(async () => {
  const user = await requireRole(["PATIENT"]);
  const patient = await prisma.patient.findFirst({ where: { userId: user.id } });
  if (!patient) throw new HttpError(403, "No patient profile is linked to this account.");
  const pending = await prisma.consent.findMany({
    where: {
      patientId: patient.id,
      type: "RECORD_ACCESS",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  const requesters = await prisma.user.findMany({
    where: { id: { in: pending.map((item) => item.grantedToId) } },
  });
  return NextResponse.json({
    authorizations: pending.map((item) => {
      const requester = requesters.find((row) => row.id === item.grantedToId);
      return {
        id: item.id,
        requesterName: requester?.fullName ?? "Clinician",
        requesterRole: requester?.role ?? "DOCTOR",
        createdAt: item.createdAt,
        expiresAt: item.expiresAt,
      };
    }),
  });
});

const decisionSchema = z.object({
  consentId: z.string(),
  decision: z.enum(["APPROVE", "DENY"]),
});

export const POST = apiHandler(async (request) => {
  const user = await requireRole(["PATIENT"]);
  const patient = await prisma.patient.findFirst({ where: { userId: user.id } });
  if (!patient) throw new HttpError(403, "No patient profile is linked to this account.");
  const body = decisionSchema.parse(await request.json());
  const consent = await prisma.consent.findFirst({
    where: {
      id: body.consentId,
      patientId: patient.id,
      type: "RECORD_ACCESS",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!consent) throw new HttpError(404, "This authorization request is no longer valid.");
  if (body.decision === "DENY") {
    await prisma.consent.update({
      where: { id: consent.id },
      data: { expiresAt: new Date(), reason: "DENIED_BY_PATIENT" },
    });
    await writeAudit({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      hospitalId: patient.hospitalId,
      patientId: patient.id,
      activity: "PATIENT_DENIED_ACCESS",
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    return NextResponse.json({ ok: true, decision: "DENY" });
  }
  await prisma.consent.update({
    where: { id: consent.id },
    data: { usedAt: new Date(), expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) },
  });
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId: patient.hospitalId,
    patientId: patient.id,
    activity: "PATIENT_AUTHORIZED_ACCESS",
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  await writeAccessLog({
    userId: consent.grantedToId,
    hospitalId: patient.hospitalId,
    patientId: patient.id,
    activity: "PATIENT_AUTHORIZED_ACCESS",
  });
  return NextResponse.json({ ok: true, decision: "APPROVE" });
});

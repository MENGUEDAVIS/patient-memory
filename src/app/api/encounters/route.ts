import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { HttpError, requirePerm, requireSession } from "@/lib/api";
import { clinicallyEligible, hasValidAccess, hospitalScope } from "@/lib/access";
import { nextPublicId } from "@/lib/ids";
import { writeAudit, writeAccessLog } from "@/lib/audit";
import { recordTimeline } from "@/lib/timeline";
import { clientIp } from "@/lib/csrf";
import { z } from "zod";

const startSchema = z.object({
  patientPublicId: z.string(),
  department: z.string().min(2).default("Outpatient"),
});

export const GET = apiHandler(async (request) => {
  const user = await requireSession();
  const hospitalId = await hospitalScope(user);
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const mine = url.searchParams.get("mine") === "1";
  const professional = await prisma.healthcareProfessional.findUnique({ where: { userId: user.id } });
  const encounters = await prisma.encounter.findMany({
    where: {
      hospitalId,
      status: status ? (status as "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED") : undefined,
      clinicianId: mine && professional ? professional.id : undefined,
    },
    include: {
      patient: true,
      clinician: true,
      diagnoses: true,
      clinicalNote: true,
    },
    orderBy: { startedAt: "desc" },
    take: 80,
  });
  return NextResponse.json({ encounters });
});

export const POST = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "clinical:write");
  if (!(await clinicallyEligible(user))) {
    throw new HttpError(403, "Professional verification and hospital approval are required.");
  }
  const hospitalId = await hospitalScope(user);
  const body = startSchema.parse(await request.json());
  const patient = await prisma.patient.findFirst({ where: { publicId: body.patientPublicId, hospitalId } });
  if (!patient) throw new HttpError(404, "No patient record matches that identifier.");
  const access = await hasValidAccess(user, patient.id, hospitalId);
  if (!access.ok) throw new HttpError(403, "Patient authorization required.", "CONSENT_REQUIRED");
  const professional = await prisma.healthcareProfessional.findUnique({ where: { userId: user.id } });
  if (!professional) throw new HttpError(403, "No professional profile is linked to this account.");
  const last = await prisma.encounter.findFirst({ orderBy: { publicId: "desc" }, select: { publicId: true } });
  const encounter = await prisma.encounter.create({
    data: {
      publicId: nextPublicId("ENC", last?.publicId),
      hospitalId,
      patientId: patient.id,
      clinicianId: professional.id,
      department: body.department,
      status: "IN_PROGRESS",
      clinicalNote: { create: {} },
      vitalSigns: { create: {} },
    },
    include: { patient: true, clinicalNote: true, vitalSigns: true },
  });
  await recordTimeline({
    encounterId: encounter.id,
    patientId: patient.id,
    actorName: user.fullName,
    actorRole: user.role,
    activity: "CONSULTATION_STARTED",
    department: body.department,
    summary: "Consultation started",
  });
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId,
    patientId: patient.id,
    encounterId: encounter.id,
    activity: "CONSULTATION_STARTED",
    department: body.department,
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  await writeAccessLog({
    userId: user.id,
    hospitalId,
    patientId: patient.id,
    encounterId: encounter.id,
    activity: "CONSULTATION_STARTED",
  });
  return NextResponse.json({ encounter }, { status: 201 });
});

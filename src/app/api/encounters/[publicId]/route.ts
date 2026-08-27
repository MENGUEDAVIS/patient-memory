import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { HttpError, requirePerm, requireSession } from "@/lib/api";
import { hospitalScope } from "@/lib/access";
import { consultationSchema } from "@/lib/schemas";
import { consultationCompletionErrors } from "@/lib/clinical";
import { writeAudit } from "@/lib/audit";
import { recordTimeline } from "@/lib/timeline";
import { clientIp } from "@/lib/csrf";
import { getPaymentProvider } from "@/lib/payments";
import { z } from "zod";

async function loadEncounter(publicId: string, hospitalId: string) {
  const encounter = await prisma.encounter.findFirst({
    where: { publicId, hospitalId },
    include: {
      patient: { include: { allergies: true } },
      clinician: true,
      clinicalNote: true,
      vitalSigns: true,
      diagnoses: true,
      prescriptions: { include: { items: true } },
      labOrders: { include: { result: true } },
    },
  });
  if (!encounter) throw new HttpError(404, "Encounter was not found.");
  return encounter;
}

export const GET = apiHandler(async (_request, context: { params: Promise<{ publicId: string }> }) => {
  const user = await requireSession();
  const hospitalId = await hospitalScope(user);
  const { publicId } = await context.params;
  const encounter = await loadEncounter(publicId, hospitalId);
  if (user.role === "PATIENT") {
    const self = await prisma.patient.findFirst({ where: { userId: user.id } });
    if (self?.id !== encounter.patientId) throw new HttpError(403, "You can only view your own record.", "IDOR");
  }
  return NextResponse.json({ encounter });
});

export const PATCH = apiHandler(async (request, context: { params: Promise<{ publicId: string }> }) => {
  const user = await requireSession();
  await requirePerm(user, "clinical:write");
  const hospitalId = await hospitalScope(user);
  const { publicId } = await context.params;
  const encounter = await loadEncounter(publicId, hospitalId);
  const body = consultationSchema.parse(await request.json());
  if (encounter.clinicalNote?.isFinal) {
    throw new HttpError(409, "Finalized records cannot be edited silently. Create an amendment.");
  }
  await prisma.clinicalNote.upsert({
    where: { encounterId: encounter.id },
    update: {
      chiefComplaint: body.chiefComplaint,
      historyOfPresentIllness: body.historyOfPresentIllness,
      observations: body.observations,
      assessment: body.assessment,
    },
    create: {
      encounterId: encounter.id,
      chiefComplaint: body.chiefComplaint,
      historyOfPresentIllness: body.historyOfPresentIllness,
      observations: body.observations,
      assessment: body.assessment,
    },
  });
  await prisma.vitalSigns.upsert({
    where: { encounterId: encounter.id },
    update: {
      systolicMmHg: body.systolicMmHg,
      diastolicMmHg: body.diastolicMmHg,
      heartRate: body.heartRate,
      temperatureC: body.temperatureC,
      spo2: body.spo2,
      respiratoryRate: body.respiratoryRate,
      recordedAt: new Date(),
    },
    create: {
      encounterId: encounter.id,
      systolicMmHg: body.systolicMmHg,
      diastolicMmHg: body.diastolicMmHg,
      heartRate: body.heartRate,
      temperatureC: body.temperatureC,
      spo2: body.spo2,
      respiratoryRate: body.respiratoryRate,
    },
  });
  await prisma.encounter.update({
    where: { id: encounter.id },
    data: {
      followUpAt: body.followUpAt ? new Date(body.followUpAt) : null,
      followUpNotes: body.followUpNotes,
      status: "IN_PROGRESS",
    },
  });
  await recordTimeline({
    encounterId: encounter.id,
    patientId: encounter.patientId,
    actorName: user.fullName,
    actorRole: user.role,
    activity: "CONSULTATION_UPDATED",
    department: encounter.department,
    summary: "Consultation draft saved",
  });
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId,
    patientId: encounter.patientId,
    encounterId: encounter.id,
    activity: "CONSULTATION_UPDATED",
    department: encounter.department,
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  return NextResponse.json({ ok: true });
});

const amendSchema = z.object({
  field: z.string(),
  next: z.string().min(1),
  reason: z.string().min(8),
});

export const POST = apiHandler(async (request, context: { params: Promise<{ publicId: string }> }) => {
  const user = await requireSession();
  await requirePerm(user, "clinical:write");
  const hospitalId = await hospitalScope(user);
  const { publicId } = await context.params;
  const encounter = await loadEncounter(publicId, hospitalId);
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");

  if (intent === "amend") {
    if (!encounter.clinicalNote?.isFinal) throw new HttpError(400, "Amendments apply only to finalized records.");
    const body = amendSchema.parse(await request.json());
    const note = encounter.clinicalNote;
    const previous = String((note as unknown as Record<string, unknown>)[body.field] ?? "");
    if (!(body.field in { chiefComplaint: 1, historyOfPresentIllness: 1, observations: 1, assessment: 1 })) {
      throw new HttpError(400, "That field cannot be amended.");
    }
    await prisma.$transaction([
      prisma.clinicalNote.update({
        where: { encounterId: encounter.id },
        data: { [body.field]: body.next, version: { increment: 1 } },
      }),
      prisma.recordAmendment.create({
        data: {
          encounterId: encounter.id,
          field: body.field,
          previous,
          next: body.next,
          reason: body.reason,
          actorId: user.id,
        },
      }),
    ]);
    await writeAudit({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      hospitalId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      activity: "RECORD_AMENDED",
      reason: body.reason,
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    return NextResponse.json({ ok: true });
  }

  if (intent === "finalize") {
    const note = encounter.clinicalNote;
    const vitals = encounter.vitalSigns;
    const errors = consultationCompletionErrors({
      chiefComplaint: note?.chiefComplaint,
      historyOfPresentIllness: note?.historyOfPresentIllness,
      observations: note?.observations,
      assessment: note?.assessment,
      systolicMmHg: vitals?.systolicMmHg,
      diastolicMmHg: vitals?.diastolicMmHg,
      heartRate: vitals?.heartRate,
      diagnosisCount: encounter.diagnoses.length,
    });
    if (errors.length) throw new HttpError(422, errors.join(" "));
    const config = await prisma.hospitalBillingConfig.findUnique({ where: { hospitalId } });
    const payment = await getPaymentProvider().charge({
      amount: Number(config?.encounterFeeUsd ?? 0.3),
      hospitalId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
    });
    await prisma.$transaction([
      prisma.clinicalNote.update({
        where: { encounterId: encounter.id },
        data: { isFinal: true },
      }),
      prisma.encounter.update({
        where: { id: encounter.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      }),
      prisma.billingRecord.upsert({
        where: { encounterId: encounter.id },
        update: {},
        create: {
          publicId: `INV-${Date.now()}`,
          hospitalId,
          patientId: encounter.patientId,
          encounterId: encounter.id,
          amountUsd: config?.encounterFeeUsd ?? 0.3,
          status: "ISSUED",
        },
      }),
      prisma.payment.create({
        data: {
          provider: payment.provider,
          providerRef: payment.transactionId,
          status: payment.status,
          amountUsd: payment.amount,
          hospitalId,
          patientId: encounter.patientId,
          encounterId: encounter.id,
        },
      }),
    ]);
    await recordTimeline({
      encounterId: encounter.id,
      patientId: encounter.patientId,
      actorName: user.fullName,
      actorRole: user.role,
      activity: "CONSULTATION_FINALIZED",
      department: encounter.department,
      summary: "Consultation finalized",
    });
    await writeAudit({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      hospitalId,
      patientId: encounter.patientId,
      encounterId: encounter.id,
      activity: "CONSULTATION_FINALIZED",
      department: encounter.department,
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    return NextResponse.json({ ok: true, payment: { ...payment, simulated: true } });
  }

  throw new HttpError(400, "Unknown encounter action.");
});

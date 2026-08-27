import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { HttpError, requirePerm, requireSession } from "@/lib/api";
import { hospitalScope } from "@/lib/access";
import { labResultSchema } from "@/lib/schemas";
import { recordTimeline } from "@/lib/timeline";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { clientIp } from "@/lib/csrf";

export const POST = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "lab:enter");
  const hospitalId = await hospitalScope(user);
  const body = labResultSchema.parse(await request.json());
  const order = await prisma.laboratoryOrder.findFirst({
    where: { publicId: body.orderPublicId, hospitalId },
    include: { encounter: { include: { clinician: true } }, patient: true, result: true },
  });
  if (!order) throw new HttpError(404, "Laboratory order was not found.");
  if (order.result) throw new HttpError(409, "A result has already been entered for this order.");
  const isCritical = Boolean(body.isCritical);
  const result = await prisma.laboratoryResult.create({
    data: {
      orderId: order.id,
      value: body.value,
      unit: body.unit,
      referenceRange: body.referenceRange,
      interpretation: body.interpretation,
      isCritical,
      fileName: body.fileName,
      enteredById: user.id,
    },
  });
  await prisma.laboratoryOrder.update({
    where: { id: order.id },
    data: {
      status: "RESULT_AVAILABLE",
      isCritical,
      resultAt: new Date(),
      notes: isCritical ? "CRITICAL RESULT — PHYSICIAN REVIEW REQUIRED" : order.notes,
    },
  });
  await recordTimeline({
    encounterId: order.encounterId,
    patientId: order.patientId,
    actorName: user.fullName,
    actorRole: user.role,
    activity: "LAB_RESULT_CREATED",
    department: "Laboratory",
    summary: `Laboratory result uploaded: ${order.testName}`,
    data: { value: body.value, isCritical },
  });
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId,
    patientId: order.patientId,
    encounterId: order.encounterId,
    activity: "LAB_RESULT_CREATED",
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  if (isCritical) {
    const clinicianUser = await prisma.user.findUnique({
      where: { id: order.encounter.clinician.userId },
    });
    if (clinicianUser) {
      await notify({
        userId: clinicianUser.id,
        hospitalId,
        patientId: order.patientId,
        title: "CRITICAL RESULT — PHYSICIAN REVIEW REQUIRED",
        body: `${order.testName} for ${order.patient.firstName} ${order.patient.lastName} (${order.patient.publicId}) requires review.`,
        kind: "CRITICAL_LAB",
      });
    }
  }
  return NextResponse.json({ result, isCritical }, { status: 201 });
});

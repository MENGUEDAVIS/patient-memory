import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { HttpError, requireRole } from "@/lib/api";
import { hospitalScope } from "@/lib/access";
import { emergencySchema, otpSchema } from "@/lib/schemas";
import { sixDigitOtp } from "@/lib/ids";
import { writeAccessLog, writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { clientIp } from "@/lib/csrf";

function hashOtp(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}

export const POST = apiHandler(async (request, context: { params: Promise<{ publicId: string }> }) => {
  const { publicId } = await context.params;
  const user = await requireRole(["DOCTOR"]);
  const hospitalId = await hospitalScope(user);
  const patient = await prisma.patient.findFirst({
    where: { publicId, hospitalId },
    include: { user: true },
  });
  if (!patient) throw new HttpError(404, "No patient record matches that identifier.");
  const body = (await request.json()) as { action?: string; otp?: string; reason?: string };
  const ip = clientIp(request);
  const ua = request.headers.get("user-agent");

  if (body.action === "request") {
    const otp = sixDigitOtp();
    const consent = await prisma.consent.create({
      data: {
        patientId: patient.id,
        grantedToId: user.id,
        hospitalId,
        type: "RECORD_ACCESS",
        otpHash: hashOtp(otp),
        reason: "Clinical record access",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    if (patient.userId) {
      await notify({
        userId: patient.userId,
        hospitalId,
        patientId: patient.id,
        title: "Authorization request",
        body: `Dr. ${user.fullName} requested access to your record. Authorization code: ${otp}`,
        kind: "PATIENT_AUTHORIZATION",
      });
    }
    await writeAudit({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      hospitalId,
      patientId: patient.id,
      activity: "PATIENT_AUTHORIZATION_REQUESTED",
      ip,
      userAgent: ua,
    });
    return NextResponse.json({
      ok: true,
      consentId: consent.id,
      simulated: true,
      label: "SIMULATED FOR MVP",
      otp: process.env.NEXT_PUBLIC_DEMO_MODE === "true" ? otp : undefined,
      message: "Patient authorization required. A simulated OTP was sent to the patient notification panel.",
    });
  }

  if (body.action === "confirm") {
    const { otp } = otpSchema.parse(body);
    const consent = await prisma.consent.findFirst({
      where: {
        patientId: patient.id,
        grantedToId: user.id,
        type: "RECORD_ACCESS",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!consent || consent.otpHash !== hashOtp(otp)) {
      throw new HttpError(401, "The authorization code is invalid or has expired.");
    }
    await prisma.consent.update({
      where: { id: consent.id },
      data: { usedAt: new Date(), expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) },
    });
    await writeAudit({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      hospitalId,
      patientId: patient.id,
      activity: "PATIENT_AUTHORIZED_ACCESS",
      ip,
      userAgent: ua,
    });
    await writeAccessLog({
      userId: user.id,
      hospitalId,
      patientId: patient.id,
      activity: "PATIENT_AUTHORIZED_ACCESS",
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "emergency") {
    const { reason } = emergencySchema.parse(body);
    await prisma.consent.create({
      data: {
        patientId: patient.id,
        grantedToId: user.id,
        hospitalId,
        type: "EMERGENCY_ACCESS",
        reason,
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
    });
    await writeAudit({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      hospitalId,
      patientId: patient.id,
      activity: "EMERGENCY_ACCESS",
      reason,
      ip,
      userAgent: ua,
    });
    await writeAccessLog({
      userId: user.id,
      hospitalId,
      patientId: patient.id,
      activity: "EMERGENCY_ACCESS",
      reason,
      emergency: true,
    });
    if (patient.userId) {
      await notify({
        userId: patient.userId,
        hospitalId,
        patientId: patient.id,
        title: "Emergency access used",
        body: `${user.fullName} opened your record using emergency access.`,
        kind: "EMERGENCY_ACCESS",
      });
    }
    return NextResponse.json({ ok: true, emergency: true });
  }

  throw new HttpError(400, "Unknown access action.");
});

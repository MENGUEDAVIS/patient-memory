import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { requirePerm, requireSession } from "@/lib/api";
import { insuranceSchema } from "@/lib/schemas";
import { verifyInsurance } from "@/lib/insurance";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/csrf";

export const POST = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "insurance:verify");
  const body = insuranceSchema.parse(await request.json());
  const hospital = await prisma.hospital.findUnique({ where: { code: body.hospitalCode } });
  const encounter = await prisma.encounter.findUnique({
    where: { publicId: body.encounterPublicId },
    include: { patient: true, hospital: true },
  });
  const decision = verifyInsurance({
    patientPublicId: body.patientPublicId,
    hospitalCode: body.hospitalCode,
    encounterPublicId: body.encounterPublicId,
    claimId: body.claimId,
    encounterExists: Boolean(encounter && hospital),
    encounterHospitalCode: encounter?.hospital.code ?? null,
    encounterPatientPublicId: encounter?.patient.publicId ?? null,
    encounterStatus: encounter?.status ?? null,
  });
  const reason =
    decision === "VERIFIED"
      ? "Encounter, patient and hospital identifiers match a completed record."
      : decision === "NOT_VERIFIED"
        ? "The submitted identifiers do not match a recorded encounter."
        : "The claim requires human review before a verification decision.";
  if (hospital) {
    await prisma.insuranceVerification.create({
      data: {
        claimId: body.claimId,
        patientPublicId: body.patientPublicId,
        hospitalId: hospital.id,
        encounterId: encounter?.id,
        decision,
        reason,
      },
    });
    await writeAudit({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      hospitalId: hospital.id,
      encounterId: encounter?.id,
      activity: "INSURANCE_VERIFICATION",
      metadata: { decision, claimId: body.claimId },
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
  }
  return NextResponse.json({
    decision,
    reason,
    simulated: true,
    label: "SIMULATED FOR MVP",
    exposed: {
      patientPublicId: body.patientPublicId,
      hospitalCode: body.hospitalCode,
      encounterPublicId: body.encounterPublicId,
      encounterStatus: encounter?.status ?? null,
    },
  });
});

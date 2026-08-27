import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { HttpError, requirePatientAccess, requireSession } from "@/lib/api";
import { hasValidAccess } from "@/lib/access";
import { yearsBetween } from "@/lib/ids";

export const GET = apiHandler(async (request, context: { params: Promise<{ publicId: string }> }) => {
  const { publicId } = await context.params;
  const user = await requireSession();
  const patient = await prisma.patient.findUnique({
    where: { publicId },
    include: {
      allergies: true,
      conditions: true,
      hospital: true,
      procedures: { orderBy: { performedAt: "desc" } },
      diagnoses: { orderBy: { createdAt: "desc" }, take: 12 },
      prescriptions: { include: { items: true }, orderBy: { issuedAt: "desc" }, take: 12 },
    },
  });
  if (!patient) throw new HttpError(404, "No patient record matches that identifier.");
  if (user.role === "PATIENT") {
    const self = await prisma.patient.findFirst({ where: { userId: user.id } });
    if (self?.id !== patient.id) throw new HttpError(403, "You can only view your own record.", "IDOR");
  } else if (user.hospitalId !== patient.hospitalId) {
    throw new HttpError(403, "You are not authorized at this patient's hospital.", "IDOR");
  }

  const access = await hasValidAccess(user, patient.id, patient.hospitalId);
  if (user.role === "DOCTOR" && !access.ok) {
    return NextResponse.json(
      {
        authorizationRequired: true,
        patient: {
          publicId: patient.publicId,
          firstName: patient.firstName,
          lastName: patient.lastName,
          hospitalName: patient.hospital.name,
        },
      },
      { status: 403 },
    );
  }

  await requirePatientAccess(request, publicId, {
    consent: user.role === "DOCTOR",
    activity: "PATIENT_RECORD_VIEWED",
  });

  const currentMeds = patient.prescriptions
    .filter((rx) => rx.status === "ACTIVE" || rx.status === "PARTIALLY_DISPENSED")
    .flatMap((rx) => rx.items);

  return NextResponse.json({
    authorizationRequired: false,
    emergency: access.emergency,
    patient: {
      ...patient,
      age: yearsBetween(patient.dateOfBirth),
      currentMedications: currentMeds,
    },
  });
});

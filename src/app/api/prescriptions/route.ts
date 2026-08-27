import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { HttpError, requirePerm, requireSession } from "@/lib/api";
import { hospitalScope } from "@/lib/access";
import { prescriptionSchema } from "@/lib/schemas";
import { nextPublicId } from "@/lib/ids";
import { recordTimeline } from "@/lib/timeline";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { conflictingMedications } from "@/lib/allergy-conflict";
import { clientIp } from "@/lib/csrf";

export const GET = apiHandler(async (request) => {
  const user = await requireSession();
  const hospitalId = await hospitalScope(user);
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const prescriptions = await prisma.prescription.findMany({
    where: {
      hospitalId,
      status: status ? (status as "ACTIVE" | "DISPENSED" | "PARTIALLY_DISPENSED" | "CANCELLED") : undefined,
    },
    include: { items: true, patient: true, dispensings: true, encounter: true },
    orderBy: { issuedAt: "desc" },
    take: 80,
  });
  return NextResponse.json({ prescriptions });
});

export const POST = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "clinical:write");
  const hospitalId = await hospitalScope(user);
  const body = prescriptionSchema.parse(await request.json());
  const encounter = await prisma.encounter.findFirst({
    where: { publicId: body.encounterPublicId, hospitalId },
    include: { patient: { include: { allergies: true } }, clinicalNote: true },
  });
  if (!encounter) throw new HttpError(404, "Encounter was not found.");
  if (encounter.clinicalNote?.isFinal) {
    throw new HttpError(409, "Finalized records cannot be edited silently. Create an amendment.");
  }
  const conflicts = conflictingMedications(
    encounter.patient.allergies.filter((a) => a.active).map((a) => a.substance),
    body.items.map((i) => i.medication),
  );
  const last = await prisma.prescription.findFirst({ orderBy: { publicId: "desc" }, select: { publicId: true } });
  const prescription = await prisma.prescription.create({
    data: {
      publicId: nextPublicId("RX", last?.publicId),
      encounterId: encounter.id,
      patientId: encounter.patientId,
      hospitalId,
      notes: body.notes,
      items: { create: body.items },
    },
    include: { items: true },
  });
  await recordTimeline({
    encounterId: encounter.id,
    patientId: encounter.patientId,
    actorName: user.fullName,
    actorRole: user.role,
    activity: "PRESCRIPTION_CREATED",
    department: encounter.department,
    summary: `Prescription issued: ${body.items.map((i) => i.medication).join(", ")}`,
    data: { conflicts },
  });
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId,
    patientId: encounter.patientId,
    encounterId: encounter.id,
    activity: "PRESCRIPTION_CREATED",
    metadata: { conflicts },
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  const pharmacists = await prisma.user.findMany({ where: { hospitalId, role: "PHARMACIST", isActive: true } });
  await Promise.all(
    pharmacists.map((pharmacist) =>
      notify({
        userId: pharmacist.id,
        hospitalId,
        patientId: encounter.patientId,
        title: "New prescription",
        body: `${prescription.publicId} is ready for dispensing.`,
        kind: "PRESCRIPTION",
      }),
    ),
  );
  return NextResponse.json({ prescription, conflicts }, { status: 201 });
});

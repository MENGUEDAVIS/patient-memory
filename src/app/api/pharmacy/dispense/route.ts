import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { HttpError, requirePerm, requireSession } from "@/lib/api";
import { hospitalScope } from "@/lib/access";
import { dispenseSchema } from "@/lib/schemas";
import { recordTimeline } from "@/lib/timeline";
import { writeAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { clientIp } from "@/lib/csrf";

export const GET = apiHandler(async () => {
  const user = await requireSession();
  await requirePerm(user, "pharmacy:view");
  const hospitalId = await hospitalScope(user);
  const dispensings = await prisma.pharmacyDispensing.findMany({
    where: { prescription: { hospitalId } },
    include: { prescription: { include: { patient: true, items: true } } },
    orderBy: { dispensedAt: "desc" },
    take: 80,
  });
  return NextResponse.json({ dispensings });
});

export const POST = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "pharmacy:dispense");
  const hospitalId = await hospitalScope(user);
  const body = dispenseSchema.parse(await request.json());
  const prescription = await prisma.prescription.findFirst({
    where: { publicId: body.prescriptionPublicId, hospitalId },
    include: { items: true, patient: true, encounter: true },
  });
  if (!prescription) throw new HttpError(404, "Prescription was not found.");
  if (prescription.status === "CANCELLED" || prescription.status === "DISPENSED") {
    throw new HttpError(409, "This prescription cannot be dispensed.");
  }
  const totalQty = prescription.items.reduce((sum, item) => sum + item.quantity, 0);
  const already = prescription.items.reduce((sum, item) => sum + item.dispensedQty, 0);
  if (already + body.quantity > totalQty) {
    throw new HttpError(400, "Dispensed quantity exceeds the prescribed quantity.");
  }
  let remaining = body.quantity;
  for (const item of prescription.items) {
    const can = item.quantity - item.dispensedQty;
    const add = Math.min(can, remaining);
    if (add > 0) {
      await prisma.prescriptionItem.update({
        where: { id: item.id },
        data: { dispensedQty: item.dispensedQty + add },
      });
      remaining -= add;
    }
  }
  const newDispensed = already + body.quantity;
  const status = newDispensed >= totalQty ? "DISPENSED" : "PARTIALLY_DISPENSED";
  await prisma.prescription.update({ where: { id: prescription.id }, data: { status } });
  const dispensing = await prisma.pharmacyDispensing.create({
    data: {
      prescriptionId: prescription.id,
      pharmacistId: user.id,
      quantity: body.quantity,
      notes: body.notes,
    },
  });
  await recordTimeline({
    encounterId: prescription.encounterId,
    patientId: prescription.patientId,
    actorName: user.fullName,
    actorRole: user.role,
    activity: "MEDICATION_DISPENSED",
    department: "Pharmacy",
    summary: `Medication dispensed (${body.quantity} units)`,
  });
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId,
    patientId: prescription.patientId,
    encounterId: prescription.encounterId,
    activity: "MEDICATION_DISPENSED",
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  if (prescription.patient.userId) {
    await notify({
      userId: prescription.patient.userId,
      hospitalId,
      patientId: prescription.patientId,
      title: "Medication dispensed",
      body: `${prescription.publicId} has been dispensed.`,
      kind: "PRESCRIPTION",
    });
  }
  return NextResponse.json({ dispensing, status }, { status: 201 });
});

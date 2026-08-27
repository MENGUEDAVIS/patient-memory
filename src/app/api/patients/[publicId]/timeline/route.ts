import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { HttpError, requireSession } from "@/lib/api";
import { hasValidAccess, hospitalScope } from "@/lib/access";

export const GET = apiHandler(async (_request, context: { params: Promise<{ publicId: string }> }) => {
  const { publicId } = await context.params;
  const user = await requireSession();
  const patient = await prisma.patient.findUnique({ where: { publicId } });
  if (!patient) throw new HttpError(404, "No patient record matches that identifier.");
  if (user.role === "PATIENT") {
    const self = await prisma.patient.findFirst({ where: { userId: user.id } });
    if (self?.id !== patient.id) throw new HttpError(403, "You can only view your own record.", "IDOR");
  } else {
    await hospitalScope(user);
    if (user.hospitalId !== patient.hospitalId) throw new HttpError(403, "You are not authorized at this patient's hospital.", "IDOR");
    const access = await hasValidAccess(user, patient.id, patient.hospitalId);
    if (user.role === "DOCTOR" && !access.ok) {
      throw new HttpError(403, "Patient authorization required.", "CONSENT_REQUIRED");
    }
  }
  const events = await prisma.timelineEvent.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ events });
});

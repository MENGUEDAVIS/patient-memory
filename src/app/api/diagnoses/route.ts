import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { HttpError, requirePerm, requireSession } from "@/lib/api";
import { hospitalScope } from "@/lib/access";
import { diagnosisSchema } from "@/lib/schemas";
import { recordTimeline } from "@/lib/timeline";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/csrf";

export const POST = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "clinical:write");
  const hospitalId = await hospitalScope(user);
  const body = diagnosisSchema.parse(await request.json());
  const encounter = await prisma.encounter.findFirst({
    where: { publicId: body.encounterPublicId, hospitalId },
    include: { clinicalNote: true },
  });
  if (!encounter) throw new HttpError(404, "Encounter was not found.");
  if (encounter.clinicalNote?.isFinal) {
    throw new HttpError(409, "Finalized records cannot be edited silently. Create an amendment.");
  }
  const diagnosis = await prisma.diagnosis.create({
    data: {
      encounterId: encounter.id,
      patientId: encounter.patientId,
      description: body.description,
      code: body.code,
      isPrimary: body.isPrimary ?? true,
    },
  });
  await recordTimeline({
    encounterId: encounter.id,
    patientId: encounter.patientId,
    actorName: user.fullName,
    actorRole: user.role,
    activity: "DIAGNOSIS_CREATED",
    department: encounter.department,
    summary: `Diagnosis recorded: ${body.description}`,
  });
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId,
    patientId: encounter.patientId,
    encounterId: encounter.id,
    activity: "DIAGNOSIS_CREATED",
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  return NextResponse.json({ diagnosis }, { status: 201 });
});

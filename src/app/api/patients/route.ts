import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { requirePerm, requireSession } from "@/lib/api";
import { hospitalScope } from "@/lib/access";
import { patientSchema } from "@/lib/schemas";
import { nextPublicId } from "@/lib/ids";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/csrf";

export const GET = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "patients:search");
  const hospitalId = await hospitalScope(user);
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const where: Prisma.PatientWhereInput = { hospitalId };
  if (q) {
    where.OR = [
      { publicId: { contains: q } },
      { phone: { contains: q.replace(/\s/g, "") } },
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { email: { contains: q } },
    ];
  }
  const patients = await prisma.patient.findMany({
    where,
    include: { allergies: { where: { active: true } }, conditions: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 80,
  });
  return NextResponse.json({ patients });
});

export const POST = apiHandler(async (request) => {
  const user = await requireSession();
  await requirePerm(user, "patients:write");
  const hospitalId = await hospitalScope(user);
  const body = patientSchema.parse(await request.json());
  const last = await prisma.patient.findFirst({
    where: { publicId: { startsWith: "PAT-" } },
    orderBy: { publicId: "desc" },
    select: { publicId: true },
  });
  let publicId = nextPublicId("PAT", last?.publicId);
  if (publicId === "PAT-00018492") publicId = "PAT-00018493";
  const patient = await prisma.patient.create({
    data: {
      publicId,
      hospitalId,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      dateOfBirth: new Date(body.dateOfBirth),
      sex: body.sex,
      phone: body.phone.trim(),
      email: body.email.trim().toLowerCase(),
      addressLine: body.addressLine.trim(),
      city: body.city.trim(),
      bloodGroup: body.bloodGroup.trim(),
      emergencyName: body.emergencyName.trim(),
      emergencyPhone: body.emergencyPhone.trim(),
      emergencyRelation: body.emergencyRelation.trim(),
      allergies: body.allergies?.length
        ? { create: body.allergies }
        : undefined,
      conditions: body.conditions?.length
        ? { create: body.conditions.map((c) => ({ name: c.name })) }
        : undefined,
    },
  });
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId,
    patientId: patient.id,
    activity: "PATIENT_RECORD_CREATED",
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  return NextResponse.json({ patient }, { status: 201 });
});

import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { HttpError } from "@/lib/api";
import { hospitalRegisterSchema } from "@/lib/schemas";
import { getPlan } from "@/lib/plans";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, rateLimitLogin } from "@/lib/auth/session";
import { nextPublicId, randomPublicId } from "@/lib/ids";
import { clientIp } from "@/lib/csrf";
import { ROLE_HOME } from "@/lib/rbac";

function facilityCode(name: string) {
  const letters = name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  return `${letters}${randomPublicId("X", 3).split("-")[1]?.slice(0, 3) ?? "001"}`;
}

export const runtime = "nodejs";

export const POST = apiHandler(async (request) => {
  const ip = clientIp(request);
  if (!rateLimitLogin(`register:${ip}`, 6, 30 * 60 * 1000).ok) {
    throw new HttpError(429, "Too many registration attempts. Please wait and try again.");
  }
  const body = hospitalRegisterSchema.parse(await request.json());
  const email = body.adminEmail.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, "An account with that email already exists. Sign in instead.");

  const plan = getPlan(body.plan);
  let code = facilityCode(body.name);
  while (await prisma.hospital.findUnique({ where: { code } })) {
    code = facilityCode(body.name + code);
  }
  const lastHospital = await prisma.hospital.findFirst({
    where: { publicId: { startsWith: body.facilityKind === "CLINIC" ? "CLN-" : "HOS-" } },
    orderBy: { publicId: "desc" },
    select: { publicId: true },
  });
  const publicId = nextPublicId(body.facilityKind === "CLINIC" ? "CLN" : "HOS", lastHospital?.publicId);
  const passwordHash = await hashPassword(body.adminPassword);

  const hospital = await prisma.hospital.create({
    data: {
      publicId,
      name: body.name.trim(),
      code,
      kind: body.facilityKind,
      city: body.city.trim(),
      country: body.country.trim(),
      billingConfig: {
        create: {
          planCode: plan.code,
          monthlyFeeUsd: plan.monthlyFeeUsd,
          encounterFeeUsd: plan.encounterFeeUsd,
          onboardingFeeUsd: plan.onboardingFeeUsd,
        },
      },
      users: {
        create: {
          email,
          passwordHash,
          role: Role.HOSPITAL_ADMINISTRATOR,
          fullName: body.adminFullName.trim(),
        },
      },
    },
    include: { users: true },
  });
  const admin = hospital.users[0];
  await prisma.retentionPolicy.create({
    data: { hospitalId: hospital.id, auditRetentionDays: 2555, exportEnabled: true },
  });
  const professional = await prisma.healthcareProfessional.create({
    data: {
      userId: admin.id,
      fullName: admin.fullName,
      professionalRole: Role.HOSPITAL_ADMINISTRATOR,
      professionalId: `ADM-${code}`,
      qualification: "Hospital administrator",
      licenseNumber: `ADM-${code}`,
      licenseIssuer: "Facility registration",
      verificationStatus: "VERIFIED",
    },
  });
  await prisma.hospitalStaffMembership.create({
    data: {
      hospitalId: hospital.id,
      professionalId: professional.id,
      userId: admin.id,
      role: Role.HOSPITAL_ADMINISTRATOR,
      department: "Administration",
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });
  await prisma.user.update({ where: { id: admin.id }, data: { hospitalId: hospital.id } });

  const token = await createSessionToken({
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
    hospitalId: hospital.id,
    isDemo: false,
  });
  const response = NextResponse.json(
    {
      ok: true,
      redirect: ROLE_HOME.HOSPITAL_ADMINISTRATOR,
      hospital: { publicId: hospital.publicId, name: hospital.name, code: hospital.code, plan: plan.code },
    },
    { status: 201 },
  );
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
});

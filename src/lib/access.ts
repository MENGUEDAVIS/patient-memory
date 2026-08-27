import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/rbac";

export async function hospitalScope(user: SessionUser) {
  if (user.role === Role.PATIENT) {
    const patient = await prisma.patient.findFirst({ where: { userId: user.id } });
    if (!patient) {
      const err = new Error("No patient profile is linked to this account.");
      (err as Error & { status: number }).status = 403;
      throw err;
    }
    return patient.hospitalId;
  }
  if (!user.hospitalId) {
    const err = new Error("This account is not affiliated with a hospital.");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  const membership = await prisma.hospitalStaffMembership.findFirst({
    where: {
      userId: user.id,
      hospitalId: user.hospitalId,
      status: "APPROVED",
    },
  });
  if (!membership) {
    const err = new Error("Hospital authorization is not approved for this user.");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return user.hospitalId;
}

export function denyIfMissing(user: SessionUser, permission: Permission) {
  if (!hasPermission(user.role, permission)) {
    const err = new Error("You are not authorized to view this information.");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}

export async function loadPatientInHospital(publicId: string, hospitalId: string) {
  const patient = await prisma.patient.findFirst({
    where: { publicId, hospitalId },
  });
  if (!patient) {
    const err = new Error("Patient record was not found.");
    (err as Error & { status: number }).status = 404;
    throw err;
  }
  return patient;
}

export async function clinicallyEligible(user: SessionUser) {
  if (user.role === Role.HOSPITAL_ADMINISTRATOR || user.role === Role.MEDICAL_DIRECTOR) {
    return true;
  }
  if (user.role === Role.PATIENT) return false;
  const professional = await prisma.healthcareProfessional.findUnique({
    where: { userId: user.id },
  });
  if (!professional || professional.verificationStatus !== "VERIFIED") return false;
  const membership = await prisma.hospitalStaffMembership.findFirst({
    where: { userId: user.id, hospitalId: user.hospitalId ?? undefined, status: "APPROVED" },
  });
  return Boolean(membership);
}

export async function hasValidAccess(user: SessionUser, patientId: string, hospitalId: string) {
  if (user.role === Role.HOSPITAL_ADMINISTRATOR || user.role === Role.MEDICAL_DIRECTOR) {
    return { ok: true, emergency: false };
  }
  if (user.role === Role.LABORATORY_OPERATOR || user.role === Role.PHARMACIST) {
    return { ok: true, emergency: false };
  }
  if (user.role === Role.PATIENT) {
    const self = await prisma.patient.findFirst({ where: { userId: user.id } });
    return { ok: self?.id === patientId, emergency: false };
  }
  const consent = await prisma.consent.findFirst({
    where: {
      patientId,
      grantedToId: user.id,
      hospitalId,
      usedAt: { not: null },
      expiresAt: { gt: new Date() },
      type: { in: ["RECORD_ACCESS", "EMERGENCY_ACCESS"] },
    },
    orderBy: { createdAt: "desc" },
  });
  return { ok: Boolean(consent), emergency: consent?.type === "EMERGENCY_ACCESS" };
}

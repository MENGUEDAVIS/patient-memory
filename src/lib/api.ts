import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { readSession, type SessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, clientIp } from "@/lib/csrf";
import { writeAccessLog, writeAudit } from "@/lib/audit";
import { hasValidAccess, hospitalScope } from "@/lib/access";
import { hasPermission, type Permission } from "@/lib/rbac";

export class HttpError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message, code: error.code ?? "ERROR" },
      { status: error.status },
    );
  }
  if (error instanceof Error && error.message === "CSRF_ORIGIN_MISMATCH") {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const status = (error as { status?: number }).status;
  if (typeof status === "number") {
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
  console.error(error);
  return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
}

export async function requireSession() {
  const user = await readSession();
  if (!user) throw new HttpError(401, "Your session has expired. Please sign in again.", "SESSION");
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireSession();
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "You are not authorized to perform this action.", "RBAC");
  }
  return user;
}

export async function requirePerm(user: SessionUser, permission: Permission) {
  if (!hasPermission(user.role, permission)) {
    throw new HttpError(403, "You are not authorized to perform this action.", "RBAC");
  }
}

export function requireMutationOrigin(request: Request) {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    assertSameOrigin(request);
  }
}

export async function requireHospital(user: SessionUser) {
  return hospitalScope(user);
}

export async function requirePatientAccess(
  request: Request,
  publicId: string,
  options: { consent?: boolean; write?: boolean; activity?: string } = {},
) {
  const user = await requireSession();
  const patient = await prisma.patient.findUnique({
    where: { publicId },
    include: { allergies: true, conditions: true, hospital: true },
  });
  if (!patient) throw new HttpError(404, "No patient record matches that identifier.");

  if (user.role === "PATIENT") {
    const self = await prisma.patient.findFirst({ where: { userId: user.id } });
    if (self?.id !== patient.id) {
      throw new HttpError(403, "You can only view your own record.", "IDOR");
    }
    return { user, patient, hospitalId: patient.hospitalId };
  }

  if (user.hospitalId !== patient.hospitalId) {
    await writeAudit({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      hospitalId: patient.hospitalId,
      patientId: patient.id,
      activity: "UNAUTHORIZED_ACCESS_ATTEMPT",
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    throw new HttpError(403, "You are not authorized at this patient's hospital.", "IDOR");
  }

  await hospitalScope(user);

  if (options.consent) {
    const access = await hasValidAccess(user, patient.id, patient.hospitalId);
    if (!access.ok) {
      throw new HttpError(403, "Patient authorization required.", "CONSENT_REQUIRED");
    }
  }

  const activity = options.activity ?? "PATIENT_RECORD_VIEWED";
  await writeAudit({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    hospitalId: patient.hospitalId,
    patientId: patient.id,
    activity,
    ip: clientIp(request),
    userAgent: request.headers.get("user-agent"),
  });
  await writeAccessLog({
    userId: user.id,
    hospitalId: patient.hospitalId,
    patientId: patient.id,
    activity,
  });

  return { user, patient, hospitalId: patient.hospitalId };
}

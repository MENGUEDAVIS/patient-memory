import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, rateLimitLogin, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { loginSchema } from "@/lib/schemas";
import { ROLE_HOME } from "@/lib/rbac";
import { clientIp } from "@/lib/csrf";
import { apiHandler } from "@/lib/handler";
import { HttpError } from "@/lib/api";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

export const POST = apiHandler(async (request) => {
  if (!process.env.DATABASE_URL) {
    throw new HttpError(503, "Database is not configured. Set DATABASE_URL on Vercel.");
  }
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    throw new HttpError(503, "Authentication is not configured. Set AUTH_SECRET (32+ characters) on Vercel.");
  }
  const ip = clientIp(request);
  if (!rateLimitLogin(`login:${ip}`).ok) {
    throw new HttpError(429, "Too many sign-in attempts. Please wait and try again.");
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw new HttpError(400, "Invalid request body.");
  }
  const body = loginSchema.parse(payload);
  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new HttpError(401, "Incorrect email or password.");
  }
  if (!user.isActive) throw new HttpError(403, "This account is deactivated.");
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = await createSessionToken(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      hospitalId: user.hospitalId,
      isDemo: user.isDemo,
    },
    { ip, userAgent: request.headers.get("user-agent") ?? undefined },
  );
  if (user.hospitalId) {
    await writeAudit({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      hospitalId: user.hospitalId,
      activity: "USER_SIGNED_IN",
      ip,
      userAgent: request.headers.get("user-agent"),
    });
  }
  const response = NextResponse.json({
    ok: true,
    redirect: ROLE_HOME[user.role],
    user: { email: user.email, fullName: user.fullName, role: user.role, isDemo: user.isDemo },
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
});

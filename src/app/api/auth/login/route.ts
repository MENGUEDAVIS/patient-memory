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

export const POST = apiHandler(async (request) => {
  const ip = clientIp(request);
  if (!rateLimitLogin(`login:${ip}`).ok) {
    throw new HttpError(429, "Too many sign-in attempts. Please wait and try again.");
  }
  const body = loginSchema.parse(await request.json());
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

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createHash, randomBytes } from "crypto";

export const SESSION_COOKIE = "pm_session";
const SESSION_HOURS = 12;

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  hospitalId: string | null;
  isDemo: boolean;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters.");
  }
  return new TextEncoder().encode(value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_HOURS * 60 * 60,
};

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSessionToken(user: SessionUser, meta?: { ip?: string; userAgent?: string }) {
  const jti = randomBytes(16).toString("hex");
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    hospitalId: user.hospitalId,
    name: user.fullName,
    demo: user.isDemo,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secret());

  await prisma.authSession.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000),
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    },
  });

  return token;
}

export async function readSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const session = await prisma.authSession.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!session || session.expiresAt < new Date()) return null;
    const user = await prisma.user.findUnique({ where: { id: String(payload.sub) } });
    if (!user || !user.isActive) return null;
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      hospitalId: user.hospitalId,
      isDemo: user.isDemo,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.authSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.delete(SESSION_COOKIE);
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimitLogin(key: string, limit = 8, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const rec = loginAttempts.get(key);
  if (!rec || rec.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  rec.count += 1;
  if (rec.count > limit) return { ok: false };
  return { ok: true };
}

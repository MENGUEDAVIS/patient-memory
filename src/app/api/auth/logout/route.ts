import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { apiHandler } from "@/lib/handler";

export const POST = apiHandler(async (request) => {
  const token = request.headers.get("cookie")?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
  if (token) {
    await prisma.authSession.deleteMany({ where: { tokenHash: hashToken(decodeURIComponent(token)) } });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
});

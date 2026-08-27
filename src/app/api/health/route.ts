import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authConfigured = Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32);
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  let db = false;
  let dbError: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch (error) {
    dbError = error instanceof Error ? error.name : "database_error";
    console.error(error);
  }
  return NextResponse.json({
    ok: authConfigured && hasDatabaseUrl && db,
    authConfigured,
    hasDatabaseUrl,
    db,
    dbError,
  });
}

import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("Please correct the highlighted fields.", 422, {
      issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const status = (error as { status?: number }).status;
  if (typeof status === "number") {
    return fail((error as Error).message, status);
  }
  console.error(error);
  return fail("An unexpected error occurred. Please try again.", 500);
}

export function requireHospital(hospitalId: string | null) {
  if (!hospitalId) {
    const err = new Error("No hospital affiliation is active for this account.");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return hospitalId;
}

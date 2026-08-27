import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/handler";
import { requirePerm, requireSession } from "@/lib/api";
import { hospitalScope } from "@/lib/access";
import { pharmacyForecast, volumeForecast } from "@/lib/intelligence";

export const GET = apiHandler(async () => {
  const user = await requireSession();
  await requirePerm(user, "intelligence:read");
  const hospitalId = await hospitalScope(user);
  const [volume, pharmacy] = await Promise.all([volumeForecast(hospitalId), pharmacyForecast(hospitalId)]);
  return NextResponse.json({ volume, pharmacy });
});

import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/handler";
import { requirePerm, requireSession } from "@/lib/api";
import { hospitalScope } from "@/lib/access";
import {
  activityAnomalies,
  copilotBriefing,
  hospitalRisks,
  operationalRecommendations,
  pharmacyForecast,
  volumeForecast,
} from "@/lib/intelligence";
import { getAiProvider } from "@/lib/ai";

export const GET = apiHandler(async () => {
  const user = await requireSession();
  await requirePerm(user, "intelligence:read");
  const hospitalId = await hospitalScope(user);
  const provider = getAiProvider();
  const [risks, volume, pharmacy, recommendations, anomalies, copilot] = await Promise.all([
    hospitalRisks(hospitalId),
    volumeForecast(hospitalId),
    pharmacyForecast(hospitalId),
    operationalRecommendations(hospitalId),
    activityAnomalies(hospitalId),
    copilotBriefing(hospitalId),
  ]);
  return NextResponse.json({
    positioning: "Clinical and Operational Decision Support",
    provider: provider.name,
    requiresHumanReview: true,
    copilot,
    risks,
    volume,
    pharmacy,
    recommendations,
    anomalies,
  });
});

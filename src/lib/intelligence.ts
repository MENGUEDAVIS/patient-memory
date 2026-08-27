import { prisma } from "@/lib/prisma";
import { conflictingMedications, duplicateActiveMedications } from "@/lib/allergy-conflict";
import { movingAverageForecast } from "@/lib/forecast";
import { startOfDay, addDays } from "@/lib/dates";

export async function hospitalRisks(hospitalId: string) {
  const now = new Date();
  const [
    unreviewedCritical,
    incomplete,
    overdueFollowUps,
    patients,
    activeRx,
  ] = await Promise.all([
    prisma.laboratoryOrder.findMany({
      where: { hospitalId, isCritical: true, reviewedAt: null, result: { isNot: null } },
      include: { patient: true, result: true },
    }),
    prisma.encounter.findMany({
      where: { hospitalId, status: { in: ["DRAFT", "IN_PROGRESS"] } },
      include: { patient: true, clinician: true },
    }),
    prisma.encounter.findMany({
      where: { hospitalId, followUpAt: { lt: now }, status: "COMPLETED" },
      include: { patient: true },
      take: 40,
    }),
    prisma.patient.findMany({
      where: { hospitalId },
      include: {
        allergies: { where: { active: true } },
        prescriptions: { where: { status: { in: ["ACTIVE", "PARTIALLY_DISPENSED"] } }, include: { items: true } },
      },
    }),
    prisma.prescription.findMany({
      where: { hospitalId, status: { in: ["ACTIVE", "PARTIALLY_DISPENSED"] } },
      include: { items: true, patient: true },
    }),
  ]);

  const risks: {
    risk: string;
    severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    patientPublicId: string | null;
    patientName: string | null;
    reason: string;
    recommendedAction: string;
  }[] = [];

  for (const order of unreviewedCritical) {
    risks.push({
      risk: "Unreviewed critical laboratory result",
      severity: "CRITICAL",
      patientPublicId: order.patient.publicId,
      patientName: `${order.patient.firstName} ${order.patient.lastName}`,
      reason: `${order.testName} is marked critical and has not been reviewed by a physician.`,
      recommendedAction: "Physician review of the critical result is required before the next clinical action.",
    });
  }

  for (const encounter of incomplete) {
    risks.push({
      risk: "Incomplete consultation",
      severity: "HIGH",
      patientPublicId: encounter.patient.publicId,
      patientName: `${encounter.patient.firstName} ${encounter.patient.lastName}`,
      reason: `Encounter ${encounter.publicId} remains ${encounter.status.toLowerCase()} under ${encounter.clinician.fullName}.`,
      recommendedAction: "Complete required fields and finalize the encounter, or cancel it with a documented reason.",
    });
  }

  for (const patient of patients) {
    const allergyNames = patient.allergies.map((a) => a.substance);
    const meds = patient.prescriptions.flatMap((rx) => rx.items.map((item) => item.medication));
    for (const hit of conflictingMedications(allergyNames, meds)) {
      risks.push({
        risk: "Documented allergy with potentially conflicting medication",
        severity: "CRITICAL",
        patientPublicId: patient.publicId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        reason: `Allergy to ${hit.allergy} may conflict with ${hit.medication}.`,
        recommendedAction: "Review the prescription with the responsible clinician before dispensing or administering.",
      });
    }
    const dupes = duplicateActiveMedications(meds);
    for (const med of dupes) {
      risks.push({
        risk: "Duplicate active prescriptions",
        severity: "MODERATE",
        patientPublicId: patient.publicId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        reason: `More than one active prescription contains ${med}.`,
        recommendedAction: "Reconcile the medication list and cancel the duplicate if clinically appropriate.",
      });
    }
  }

  for (const encounter of overdueFollowUps) {
    risks.push({
      risk: "Overdue follow-up",
      severity: "MODERATE",
      patientPublicId: encounter.patient.publicId,
      patientName: `${encounter.patient.firstName} ${encounter.patient.lastName}`,
      reason: `Follow-up scheduled for ${encounter.followUpAt?.toISOString().slice(0, 10)} has not been completed.`,
      recommendedAction: "Contact the patient and schedule or complete the follow-up encounter.",
    });
  }

  void activeRx;
  return risks;
}

export async function volumeForecast(hospitalId: string) {
  const rows = await prisma.dailyVolume.findMany({
    where: { hospitalId },
    orderBy: { day: "asc" },
  });
  const history = rows.map((row) => ({
    day: row.day.toISOString().slice(0, 10),
    value: row.encounters,
  }));
  const forecast = movingAverageForecast(history);
  return { history, forecast };
}

export async function pharmacyForecast(hospitalId: string) {
  const since = addDays(startOfDay(), -60);
  const items = await prisma.prescriptionItem.findMany({
    where: { prescription: { hospitalId, issuedAt: { gte: since } } },
    include: { prescription: true },
  });
  const byMed = new Map<string, { recent: number; earlier: number }>();
  const midpoint = addDays(startOfDay(), -30);
  for (const item of items) {
    const key = item.medication;
    const rec = byMed.get(key) ?? { recent: 0, earlier: 0 };
    if (item.prescription.issuedAt >= midpoint) rec.recent += item.quantity;
    else rec.earlier += item.quantity;
    byMed.set(key, rec);
  }
  if (byMed.size < 3) {
    return { insufficient: true as const, message: "Insufficient historical data.", medications: [] as const };
  }
  const medications = [...byMed.entries()]
    .map(([medication, rec]) => {
      const change = rec.earlier === 0 ? null : (rec.recent - rec.earlier) / rec.earlier;
      return {
        medication,
        historical: rec.earlier,
        recent: rec.recent,
        projected: rec.recent,
        change,
        trend: change == null ? "UNKNOWN" : change > 0.05 ? "UP" : change < -0.05 ? "DOWN" : "STABLE",
        confidence: rec.recent + rec.earlier > 20 ? "MEDIUM" : "LOW",
      };
    })
    .sort((a, b) => b.recent - a.recent)
    .slice(0, 8);
  return { insufficient: false as const, message: null, medications };
}

export async function operationalRecommendations(hospitalId: string) {
  const since = addDays(startOfDay(), -60);
  const encounters = await prisma.encounter.findMany({
    where: { hospitalId, startedAt: { gte: since } },
    select: { startedAt: true },
  });
  if (encounters.length < 40) {
    return [
      {
        observation: "Encounter history is still limited.",
        data: `${encounters.length} encounters in the last 60 days.`,
        insight: "Insufficient historical data.",
        recommendation: "Continue capturing completed encounters before acting on staffing recommendations.",
      },
    ];
  }
  const buckets = new Map<string, number>();
  for (const encounter of encounters) {
    const day = encounter.startedAt.getDay();
    const hour = encounter.startedAt.getHours();
    const key = `${day}-${hour}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const ranked = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
  const [topKey, topCount] = ranked[0];
  const [day, hour] = topKey.split("-").map(Number);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const mean = encounters.length / Math.max(buckets.size, 1);
  return [
    {
      observation: `${days[day]} ${String(hour).padStart(2, "0")}:00–${String(hour + 1).padStart(2, "0")}:00 has consistently high patient volume.`,
      data: `${topCount} encounters in this hour slot versus a mean of ${mean.toFixed(1)} across observed slots.`,
      insight: "Demand is concentrated in a small number of weekday hours.",
      recommendation: "Consider increasing consultation capacity during this period.",
    },
  ];
}

export async function activityAnomalies(hospitalId: string) {
  const completed = await prisma.encounter.findMany({
    where: { hospitalId, status: "COMPLETED" },
    include: { billingRecord: true },
    take: 200,
    orderBy: { completedAt: "desc" },
  });
  const unbilled = completed.filter((e) => !e.billingRecord);
  const cancelled = await prisma.encounter.count({
    where: { hospitalId, status: "CANCELLED", startedAt: { gte: addDays(startOfDay(), -30) } },
  });
  const recent = await prisma.encounter.count({
    where: { hospitalId, startedAt: { gte: addDays(startOfDay(), -30) } },
  });
  const items: {
    title: string;
    observation: string;
    dataSummary: string;
    insight: string;
    recommendation: string;
  }[] = [];
  if (unbilled.length > 0) {
    items.push({
      title: "ANOMALY DETECTED — REVIEW REQUIRED",
      observation: "Completed encounters exist without a corresponding billing record.",
      dataSummary: `${unbilled.length} completed encounter(s) in the recent sample have no billing record.`,
      insight: "Clinical activity and recorded transactions are not aligned.",
      recommendation: "Review these encounters with the billing administrator. This is not an accusation of misconduct.",
    });
  }
  if (recent > 0 && cancelled / recent > 0.25) {
    items.push({
      title: "ANOMALY DETECTED — REVIEW REQUIRED",
      observation: "Cancellation volume is unusually high relative to recent activity.",
      dataSummary: `${cancelled} cancellations out of ${recent} encounters in 30 days.`,
      insight: "The cancellation pattern is above a simple 25% review threshold.",
      recommendation: "Review scheduling and documentation practices for the affected period.",
    });
  }
  return items;
}

export async function copilotBriefing(hospitalId: string) {
  const today = startOfDay();
  const [
    critical,
    incomplete,
    volumeToday,
    volumes,
    pharmacy,
  ] = await Promise.all([
    prisma.laboratoryOrder.count({
      where: { hospitalId, isCritical: true, reviewedAt: null, result: { isNot: null } },
    }),
    prisma.encounter.count({ where: { hospitalId, status: { in: ["DRAFT", "IN_PROGRESS"] } } }),
    prisma.encounter.count({ where: { hospitalId, startedAt: { gte: today } } }),
    volumeForecast(hospitalId),
    pharmacyForecast(hospitalId),
  ]);
  const mean = volumes.forecast.mean;
  const volumeDelta =
    mean && mean > 0 ? (volumeToday - mean) / mean : null;
  const highDemand = !pharmacy.insufficient
    ? pharmacy.medications.filter((m) => m.trend === "UP").slice(0, 3)
    : [];
  return {
    clinical: `${critical} critical result${critical === 1 ? "" : "s"} require review.`,
    operations:
      volumeDelta == null
        ? "Insufficient historical data to compare today's volume to a baseline."
        : `Patient volume is ${(Math.abs(volumeDelta) * 100).toFixed(0)}% ${volumeDelta >= 0 ? "above" : "below"} the recent daily mean.`,
    documentation: await documentationLine(hospitalId, incomplete),
    pharmacy:
      highDemand.length === 0
        ? pharmacy.insufficient
          ? "Insufficient historical data for pharmacy demand."
          : "No medications currently show a high-demand trend."
        : `${highDemand.length} medication${highDemand.length === 1 ? "" : "s"} ${highDemand.length === 1 ? "is" : "are"} projected to experience high demand.`,
    recommendation:
      volumes.forecast.insufficient
        ? "Keep capturing completed encounters so forecasts can be produced from hospital data."
        : "Increase laboratory and consultation capacity during the next expected peak period.",
  };
}

async function documentationLine(hospitalId: string, incomplete: number) {
  const total = await prisma.encounter.count({
    where: { hospitalId, startedAt: { gte: addDays(startOfDay(), -7) } },
  });
  if (total === 0) return "No consultations were recorded in the last 7 days.";
  const pct = Math.round((incomplete / Math.max(total, 1)) * 100);
  return `${pct}% of recent consultations remain incomplete (${incomplete} open).`;
}

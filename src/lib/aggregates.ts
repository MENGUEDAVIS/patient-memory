import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, formatDate } from "@/lib/dates";

export type NamedCount = { name: string; value: number };
export type SeriesPoint = { day: string; value: number };

function bucketByDay(dates: Date[]) {
  const map = new Map<string, number>();
  for (const date of dates) {
    const key = formatDate(date);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([day, value]) => ({ day, value }));
}

export async function hospitalAggregates(hospitalId: string) {
  const since = addDays(startOfDay(), -30);
  const [daily, encounters, labs, prescriptions, access, completed, open, cancelled] = await Promise.all([
    prisma.dailyVolume.findMany({
      where: { hospitalId, day: { gte: since } },
      orderBy: { day: "asc" },
    }),
    prisma.encounter.count({ where: { hospitalId, startedAt: { gte: since } } }),
    prisma.laboratoryOrder.count({ where: { hospitalId, orderedAt: { gte: since } } }),
    prisma.prescription.count({ where: { hospitalId, issuedAt: { gte: since } } }),
    prisma.accessLog.count({ where: { hospitalId, createdAt: { gte: since } } }),
    prisma.encounter.count({ where: { hospitalId, status: "COMPLETED", startedAt: { gte: since } } }),
    prisma.encounter.count({ where: { hospitalId, status: { in: ["DRAFT", "IN_PROGRESS"] } } }),
    prisma.encounter.count({ where: { hospitalId, status: "CANCELLED", startedAt: { gte: since } } }),
  ]);
  return {
    volume: daily.map((row) => ({ day: formatDate(row.day), value: row.encounters })),
    mix: [
      { name: "Consultations", value: encounters },
      { name: "Laboratory", value: labs },
      { name: "Prescriptions", value: prescriptions },
      { name: "Record access", value: access },
    ] satisfies NamedCount[],
    status: [
      { name: "Completed", value: completed },
      { name: "Open", value: open },
      { name: "Cancelled", value: cancelled },
    ] satisfies NamedCount[],
  };
}

export async function patientAggregates(patientId: string) {
  const [encounters, diagnoses, prescriptions, labs, access] = await Promise.all([
    prisma.encounter.findMany({
      where: { patientId },
      select: { startedAt: true },
      orderBy: { startedAt: "asc" },
    }),
    prisma.diagnosis.count({ where: { patientId } }),
    prisma.prescription.count({ where: { patientId } }),
    prisma.laboratoryOrder.count({ where: { patientId } }),
    prisma.accessLog.count({ where: { patientId } }),
  ]);
  return {
    visits: bucketByDay(encounters.map((row) => row.startedAt)),
    mix: [
      { name: "Consultations", value: encounters.length },
      { name: "Diagnoses", value: diagnoses },
      { name: "Prescriptions", value: prescriptions },
      { name: "Laboratory", value: labs },
      { name: "Access events", value: access },
    ] satisfies NamedCount[],
  };
}

export async function landingAggregates() {
  const hospital = await prisma.hospital.findFirst({
    where: { code: "SLM" },
    orderBy: { createdAt: "asc" },
  });
  const patient = await prisma.patient.findUnique({ where: { publicId: "PAT-00018492" } });
  if (!hospital || !patient) return null;
  const [hospitalStats, patientStats] = await Promise.all([
    hospitalAggregates(hospital.id),
    patientAggregates(patient.id),
  ]);
  return {
    hospitalName: hospital.name,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientPublicId: patient.publicId,
    hospital: hospitalStats,
    patient: patientStats,
  };
}

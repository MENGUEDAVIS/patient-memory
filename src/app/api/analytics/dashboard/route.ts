import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/handler";
import { requireSession } from "@/lib/api";
import { hospitalScope } from "@/lib/access";
import { startOfDay, addDays } from "@/lib/dates";

export const GET = apiHandler(async () => {
  const user = await requireSession();
  const hospitalId = await hospitalScope(user);
  const today = startOfDay();
  const week = addDays(today, -7);
  const month = addDays(today, -30);
  const [
    patients,
    consultationsToday,
    activeDoctors,
    labToday,
    rxToday,
    completedToday,
    incomplete,
    criticalUnreviewed,
    perDoctor,
    weekly,
    monthly,
    daily,
  ] = await Promise.all([
    prisma.patient.count({ where: { hospitalId } }),
    prisma.encounter.count({ where: { hospitalId, startedAt: { gte: today } } }),
    prisma.hospitalStaffMembership.count({
      where: { hospitalId, role: "DOCTOR", status: "APPROVED" },
    }),
    prisma.laboratoryOrder.count({ where: { hospitalId, orderedAt: { gte: today } } }),
    prisma.prescription.count({ where: { hospitalId, issuedAt: { gte: today } } }),
    prisma.encounter.count({ where: { hospitalId, status: "COMPLETED", completedAt: { gte: today } } }),
    prisma.encounter.count({ where: { hospitalId, status: { in: ["DRAFT", "IN_PROGRESS"] } } }),
    prisma.laboratoryOrder.count({
      where: { hospitalId, isCritical: true, reviewedAt: null, result: { isNot: null } },
    }),
    prisma.encounter.groupBy({
      by: ["clinicianId"],
      where: { hospitalId, startedAt: { gte: week } },
      _count: { _all: true },
    }),
    prisma.encounter.count({ where: { hospitalId, startedAt: { gte: week } } }),
    prisma.encounter.count({ where: { hospitalId, startedAt: { gte: month } } }),
    prisma.dailyVolume.findMany({
      where: { hospitalId, day: { gte: month } },
      orderBy: { day: "asc" },
    }),
  ]);
  const clinicians = await prisma.healthcareProfessional.findMany({
    where: { id: { in: perDoctor.map((row) => row.clinicianId) } },
  });
  const doctorActivity = perDoctor.map((row) => ({
    clinician: clinicians.find((c) => c.id === row.clinicianId)?.fullName ?? "Unknown",
    consultations: row._count._all,
  }));
  return NextResponse.json({
    today: {
      patients,
      consultations: consultationsToday,
      activeDoctors,
      laboratoryTests: labToday,
      prescriptions: rxToday,
      completedEncounters: completedToday,
      incompleteEncounters: incomplete,
      criticalResultsAwaitingReview: criticalUnreviewed,
    },
    accountability: { doctorActivity, incomplete, criticalUnreviewed },
    flow: { daily: daily.map((d) => ({ day: d.day, value: d.encounters })), weekly, monthly },
  });
});

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth/session";

export async function requireSelfPatient(user: SessionUser) {
  if (user.role !== "PATIENT") redirect("/login");
  const patient = await prisma.patient.findFirst({
    where: { userId: user.id },
    include: {
      hospital: true,
      allergies: true,
      conditions: true,
    },
  });
  if (!patient) redirect("/login");
  return patient;
}

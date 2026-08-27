import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { PatientHeader } from "@/components/patient-header";
import { ClinicalTimeline } from "@/components/timeline";
import { Card, PageHeader } from "@/components/ui";
import { redirect } from "next/navigation";

export default async function MeHome() {
  const user = await requirePageRole("/me");
  const patient = await prisma.patient.findFirst({
    where: { userId: user.id },
    include: { allergies: true, conditions: true, prescriptions: { include: { items: true } } },
  });
  if (!patient) redirect("/login");
  const events = await prisma.timelineEvent.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const meds = patient.prescriptions.filter((rx) => rx.status === "ACTIVE" || rx.status === "PARTIALLY_DISPENSED").flatMap((rx) => rx.items);
  return (
    <div className="space-y-6">
      <PageHeader title="My health" description="A longitudinal view of your hospital record." />
      <PatientHeader patient={patient} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="pm-label">Medical history</p>
          <ul className="mt-2 text-sm">{patient.conditions.map((c) => <li key={c.id}>{c.name}</li>)}</ul>
        </Card>
        <Card>
          <p className="pm-label">Current medications</p>
          <ul className="mt-2 text-sm">{meds.map((m) => <li key={m.id}>{m.medication} {m.dose}</li>)}</ul>
        </Card>
      </div>
      <Card>
        <p className="pm-label mb-3">Recent activity</p>
        <ClinicalTimeline events={events} />
      </Card>
    </div>
  );
}

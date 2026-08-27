import { prisma } from "@/lib/prisma";
import { PatientHeader } from "@/components/patient-header";
import { ClinicalTimeline } from "@/components/timeline";
import { Card, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { StartConsultation } from "@/components/actions";
import { formatDateTime } from "@/lib/dates";
import { notFound } from "next/navigation";

export async function PatientRecord({
  publicId,
  hospitalId,
  canStart = false,
  emergency = false,
}: {
  publicId: string;
  hospitalId: string;
  canStart?: boolean;
  emergency?: boolean;
}) {
  const patient = await prisma.patient.findFirst({
    where: { publicId, hospitalId },
    include: {
      allergies: true,
      conditions: true,
      procedures: { orderBy: { performedAt: "desc" } },
      diagnoses: { orderBy: { createdAt: "desc" }, take: 8 },
      prescriptions: { include: { items: true }, orderBy: { issuedAt: "desc" } },
    },
  });
  if (!patient) notFound();
  const events = await prisma.timelineEvent.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const currentMeds = patient.prescriptions
    .filter((rx) => rx.status === "ACTIVE" || rx.status === "PARTIALLY_DISPENSED")
    .flatMap((rx) => rx.items);

  return (
    <div className="space-y-6">
      <PatientHeader patient={patient} emergency={emergency} />
      {canStart ? <StartConsultation publicId={patient.publicId} /> : null}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card>
          <p className="pm-label">Chronic conditions</p>
          <ul className="mt-2 space-y-1 text-sm">
            {patient.conditions.length ? patient.conditions.map((c) => <li key={c.id}>{c.name}</li>) : <li className="text-[var(--muted)]">None recorded.</li>}
          </ul>
        </Card>
        <Card>
          <p className="pm-label">Current medications</p>
          <ul className="mt-2 space-y-1 text-sm">
            {currentMeds.length ? currentMeds.map((m) => <li key={m.id}>{m.medication} {m.dose}</li>) : <li className="text-[var(--muted)]">No active medications.</li>}
          </ul>
        </Card>
        <Card>
          <p className="pm-label">Previous diagnoses</p>
          <ul className="mt-2 space-y-1 text-sm">
            {patient.diagnoses.length ? patient.diagnoses.map((d) => <li key={d.id}>{d.description}</li>) : <li className="text-[var(--muted)]">None recorded.</li>}
          </ul>
        </Card>
        <Card>
          <p className="pm-label">Previous procedures</p>
          <ul className="mt-2 space-y-1 text-sm">
            {patient.procedures.length ? patient.procedures.map((p) => <li key={p.id}>{p.name}</li>) : <li className="text-[var(--muted)]">None recorded.</li>}
          </ul>
        </Card>
      </div>
      <Card>
        <p className="pm-label mb-4">Clinical timeline</p>
        <ClinicalTimeline events={events} />
      </Card>
      <Card>
        <p className="pm-label mb-3">Prescriptions</p>
        {patient.prescriptions.length === 0 ? (
          <EmptyState title="No prescriptions" body="No prescriptions are available for this patient." />
        ) : (
          <table className="pm-table">
            <thead>
              <tr><th>ID</th><th>Medications</th><th>Status</th><th>Issued</th></tr>
            </thead>
            <tbody>
              {patient.prescriptions.map((rx) => (
                <tr key={rx.id}>
                  <td className="tabular">{rx.publicId}</td>
                  <td>{rx.items.map((i) => i.medication).join(", ")}</td>
                  <td><StatusBadge value={rx.status} /></td>
                  <td>{formatDateTime(rx.issuedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

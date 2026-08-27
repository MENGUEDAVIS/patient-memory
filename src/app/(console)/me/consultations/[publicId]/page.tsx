import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { requireSelfPatient } from "@/lib/self-patient";
import { Card, PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { formatDateTime } from "@/lib/dates";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function MeConsultationDetail({ params }: { params: Promise<{ publicId: string }> }) {
  const user = await requirePageRole("/me/consultations");
  const patient = await requireSelfPatient(user);
  const { publicId } = await params;
  const encounter = await prisma.encounter.findFirst({
    where: { publicId, patientId: patient.id },
    include: {
      clinician: true,
      clinicalNote: true,
      vitalSigns: true,
      diagnoses: true,
      prescriptions: { include: { items: true } },
      labOrders: { include: { result: true } },
    },
  });
  if (!encounter) notFound();
  const note = encounter.clinicalNote;
  const vitals = encounter.vitalSigns;
  return (
    <div className="space-y-4">
      <PageHeader
        title={`Consultation ${encounter.publicId}`}
        description={`${encounter.clinician.fullName} · ${encounter.department} · ${formatDateTime(encounter.startedAt)}`}
        actions={
          <Link href="/me/consultations" className="text-sm underline">
            Back to consultations
          </Link>
        }
      />
      <div className="flex gap-2">
        <StatusBadge value={encounter.status} />
        {note?.isFinal ? <StatusBadge value="FINAL" /> : <StatusBadge value="DRAFT" />}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="pm-label">Chief complaint</p>
          <p className="mt-2 text-sm">{note?.chiefComplaint || "Not recorded."}</p>
          <p className="pm-label mt-4">History of present illness</p>
          <p className="mt-2 text-sm">{note?.historyOfPresentIllness || "Not recorded."}</p>
          <p className="pm-label mt-4">Observations</p>
          <p className="mt-2 text-sm">{note?.observations || "Not recorded."}</p>
          <p className="pm-label mt-4">Assessment</p>
          <p className="mt-2 text-sm">{note?.assessment || "Not recorded."}</p>
        </Card>
        <Card>
          <p className="pm-label">Vital signs</p>
          {vitals ? (
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>BP {vitals.systolicMmHg ?? "—"}/{vitals.diastolicMmHg ?? "—"}</div>
              <div>HR {vitals.heartRate ?? "—"}</div>
              <div>Temp {vitals.temperatureC ?? "—"} °C</div>
              <div>SpO2 {vitals.spo2 ?? "—"}%</div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-[var(--muted)]">No vital signs recorded.</p>
          )}
          <p className="pm-label mt-4">Follow-up</p>
          <p className="mt-2 text-sm">
            {encounter.followUpAt ? formatDateTime(encounter.followUpAt) : "None scheduled."}
            {encounter.followUpNotes ? ` — ${encounter.followUpNotes}` : ""}
          </p>
        </Card>
      </div>
      <Card>
        <p className="pm-label mb-2">Diagnoses</p>
        {encounter.diagnoses.length === 0 ? (
          <EmptyState title="No diagnoses" body="No diagnosis was recorded in this consultation." />
        ) : (
          <ul className="text-sm">
            {encounter.diagnoses.map((item) => (
              <li key={item.id}>
                {item.code ? `${item.code} — ` : ""}
                {item.description}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <p className="pm-label mb-2">Prescriptions</p>
        {encounter.prescriptions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No prescriptions in this encounter.</p>
        ) : (
          encounter.prescriptions.map((rx) => (
            <p key={rx.id} className="text-sm">
              {rx.publicId}: {rx.items.map((i) => `${i.medication} ${i.dose}`).join(", ")}
            </p>
          ))
        )}
      </Card>
      <Card>
        <p className="pm-label mb-2">Laboratory</p>
        {encounter.labOrders.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No laboratory tests in this encounter.</p>
        ) : (
          encounter.labOrders.map((order) => (
            <p key={order.id} className="text-sm">
              {order.testName}: {order.result ? `${order.result.value} ${order.result.unit ?? ""}` : order.status.replace(/_/g, " ")}
            </p>
          ))
        )}
      </Card>
    </div>
  );
}

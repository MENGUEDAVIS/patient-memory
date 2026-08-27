import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { requireSelfPatient } from "@/lib/self-patient";
import { PatientHeader } from "@/components/patient-header";
import { ClinicalTimeline } from "@/components/timeline";
import { PatientAuthorize } from "@/components/patient-authorize";
import { Alert, Card, PageHeader } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/dates";
import { roleLabel } from "@/lib/rbac";
import { yearsBetween } from "@/lib/ids";

export default async function MeHome() {
  const user = await requirePageRole("/me");
  const patient = await requireSelfPatient(user);
  const [events, diagnoses, prescriptions, labs, followUps, logs, pending, notifications] = await Promise.all([
    prisma.timelineEvent.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.diagnosis.findMany({ where: { patientId: patient.id }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: { items: true },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.laboratoryOrder.findMany({
      where: { patientId: patient.id },
      include: { result: true },
      orderBy: { orderedAt: "desc" },
      take: 6,
    }),
    prisma.encounter.findMany({
      where: { patientId: patient.id, followUpAt: { not: null } },
      include: { clinician: true },
      orderBy: { followUpAt: "desc" },
      take: 5,
    }),
    prisma.accessLog.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.consent.findMany({
      where: {
        patientId: patient.id,
        type: "RECORD_ACCESS",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);
  const requesters = await prisma.user.findMany({
    where: { id: { in: pending.map((item) => item.grantedToId) } },
  });
  const logUsers = await prisma.user.findMany({
    where: { id: { in: logs.map((item) => item.userId) } },
  });
  const meds = prescriptions
    .filter((rx) => rx.status === "ACTIVE" || rx.status === "PARTIALLY_DISPENSED")
    .flatMap((rx) => rx.items);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Patient portal"
        title={`Hello, ${patient.firstName}`}
        description={`${patient.publicId} · You can open your own record at any time. Clinicians still need your authorization.`}
      />
      <PatientHeader patient={patient} />

      {pending.length > 0 ? (
        <Alert tone="warning" title="A clinician asked to open your record">
          <div className="mt-3 space-y-3">
            {pending.map((item) => {
              const requester = requesters.find((row) => row.id === item.grantedToId);
              return (
                <div key={item.id} className="rounded-md bg-white/70 p-3 text-[var(--ink)]">
                  <p className="font-medium">{requester?.fullName ?? "A clinician"} wants access.</p>
                  <p className="text-sm text-[var(--muted)]">
                    Expires {formatDateTime(item.expiresAt)}. Approving from here authorizes them for 4 hours.
                  </p>
                  <div className="mt-2">
                    <PatientAuthorize consentId={item.id} requesterName={requester?.fullName ?? "clinician"} />
                  </div>
                </div>
              );
            })}
          </div>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/me/consultations", label: "Consultations", hint: "History and follow-up" },
          { href: "/me/prescriptions", label: "Prescriptions", hint: "Current and past medicines" },
          { href: "/me/laboratory", label: "Laboratory", hint: "Results you can open" },
          { href: "/me/access", label: "Who accessed my record?", hint: "Every clinician visit" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="pm-card p-4 hover:border-[var(--teal)]">
            <p className="font-medium">{item.label}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{item.hint}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <p className="pm-label">My profile</p>
          <dl className="mt-3 space-y-1 text-sm">
            <div><dt className="text-[var(--muted)]">Patient ID</dt><dd className="tabular font-medium">{patient.publicId}</dd></div>
            <div><dt className="text-[var(--muted)]">Age / sex</dt><dd>{yearsBetween(patient.dateOfBirth)} yrs · {patient.sex}</dd></div>
            <div><dt className="text-[var(--muted)]">Hospital</dt><dd>{patient.hospital.name}</dd></div>
            <div><dt className="text-[var(--muted)]">Phone</dt><dd>{patient.phone}</dd></div>
            <div><dt className="text-[var(--muted)]">Address</dt><dd>{patient.addressLine}, {patient.city}</dd></div>
            <div><dt className="text-[var(--muted)]">Emergency</dt><dd>{patient.emergencyName} ({patient.emergencyRelation}) · {patient.emergencyPhone}</dd></div>
          </dl>
        </Card>
        <Card>
          <p className="pm-label">Medical history</p>
          <ul className="mt-2 space-y-1 text-sm">
            {patient.conditions.length ? patient.conditions.map((c) => <li key={c.id}>{c.name}</li>) : <li className="text-[var(--muted)]">No chronic conditions recorded.</li>}
          </ul>
          <p className="pm-label mt-4">Previous diagnoses</p>
          <ul className="mt-2 space-y-1 text-sm">
            {diagnoses.length ? diagnoses.map((d) => <li key={d.id}>{d.description}</li>) : <li className="text-[var(--muted)]">No diagnoses recorded.</li>}
          </ul>
        </Card>
        <Card>
          <p className="pm-label">Current medications</p>
          <ul className="mt-2 space-y-1 text-sm">
            {meds.length ? meds.map((m) => <li key={m.id}>{m.medication} {m.dose} · {m.frequency}</li>) : <li className="text-[var(--muted)]">No active medications.</li>}
          </ul>
          <p className="pm-label mt-4">Follow-up</p>
          <ul className="mt-2 space-y-1 text-sm">
            {followUps.length
              ? followUps.map((item) => (
                  <li key={item.id}>
                    {item.followUpAt ? formatDate(item.followUpAt) : "—"} · {item.clinician.fullName}
                    {item.followUpNotes ? ` — ${item.followUpNotes}` : ""}
                  </li>
                ))
              : <li className="text-[var(--muted)]">No follow-up is scheduled.</li>}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="pm-label">Who accessed my record?</p>
            <Link href="/me/access" className="text-sm underline">Full history</Link>
          </div>
          {logs.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No access history is recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {logs.map((log) => {
                const actor = logUsers.find((row) => row.id === log.userId);
                return (
                  <li key={log.id} className="flex justify-between gap-3 border-b border-[var(--line)] pb-2">
                    <span>
                      {actor?.fullName ?? "Unknown"} · {actor ? roleLabel(actor.role) : "—"}
                      <span className="block text-[var(--muted)]">{log.activity.replace(/_/g, " ")}</span>
                    </span>
                    <span className="tabular text-[var(--muted)]">{formatDateTime(log.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          <p className="pm-label mb-3">Messages</p>
          {notifications.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No notifications.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {notifications.map((note) => (
                <li key={note.id}>
                  <p className="font-medium">{note.title}</p>
                  <p className="text-[var(--muted)]">{note.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="pm-label mb-3">Recent laboratory</p>
          {labs.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No laboratory results are available for this patient.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {labs.map((order) => (
                <li key={order.id} className="flex justify-between gap-3">
                  <span>{order.testName}{order.isCritical ? " · critical" : ""}</span>
                  <span className="tabular">{order.result ? `${order.result.value} ${order.result.unit ?? ""}` : "Pending"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <p className="pm-label mb-3">Clinical timeline</p>
          <ClinicalTimeline events={events} />
        </Card>
      </div>
    </div>
  );
}

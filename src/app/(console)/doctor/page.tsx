import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, Stat, Card } from "@/components/ui";
import { PatientSearch } from "@/components/actions";
import { formatDateTime } from "@/lib/dates";

export default async function DoctorHome() {
  const user = await requirePageRole("/doctor");
  const hospitalId = await hospitalScope(user);
  const professional = await prisma.healthcareProfessional.findUnique({ where: { userId: user.id } });
  const [open, critical, followUps, mine] = await Promise.all([
    prisma.encounter.count({ where: { hospitalId, clinicianId: professional?.id, status: { in: ["DRAFT", "IN_PROGRESS"] } } }),
    prisma.laboratoryOrder.findMany({
      where: { hospitalId, isCritical: true, reviewedAt: null, result: { isNot: null } },
      include: { patient: true },
      take: 8,
    }),
    prisma.encounter.findMany({
      where: { hospitalId, clinicianId: professional?.id, followUpAt: { lt: new Date() }, status: "COMPLETED" },
      include: { patient: true },
      take: 8,
    }),
    prisma.encounter.findMany({
      where: { hospitalId, clinicianId: professional?.id },
      include: { patient: true },
      orderBy: { startedAt: "desc" },
      take: 8,
    }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title={`Good day, ${user.fullName}`} description="Search a patient to start the clinical workflow. Try PAT-00018492." />
      <PatientSearch basePath="/doctor/patients" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Open consultations" value={open} />
        <Stat label="Critical results" value={critical.length} />
        <Stat label="Overdue follow-ups" value={followUps.length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="pm-label mb-3">Tasks</p>
          {critical.map((item) => (
            <p key={item.id} className="mb-2 text-sm">
              Critical {item.testName} for <Link className="underline" href={`/doctor/laboratory`}>{item.patient.publicId}</Link>
            </p>
          ))}
          {followUps.map((item) => (
            <p key={item.id} className="mb-2 text-sm">Follow-up: {item.patient.firstName} {item.patient.lastName}</p>
          ))}
          {critical.length + followUps.length === 0 ? <p className="text-sm text-[var(--muted)]">No pending clinical tasks.</p> : null}
        </Card>
        <Card>
          <p className="pm-label mb-3">Recent consultations</p>
          {mine.map((item) => (
            <p key={item.id} className="mb-2 text-sm">
              <Link className="underline" href={`/doctor/consultations/${item.publicId}`}>{item.publicId}</Link> · {item.patient.lastName} · {formatDateTime(item.startedAt)}
            </p>
          ))}
        </Card>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, Card } from "@/components/ui";
import Link from "next/link";

export default async function DoctorTasks() {
  const user = await requirePageRole("/doctor/tasks");
  const hospitalId = await hospitalScope(user);
  const professional = await prisma.healthcareProfessional.findUnique({ where: { userId: user.id } });
  const [incomplete, critical, follow] = await Promise.all([
    prisma.encounter.findMany({
      where: { hospitalId, clinicianId: professional?.id, status: { in: ["DRAFT", "IN_PROGRESS"] } },
      include: { patient: true },
    }),
    prisma.laboratoryOrder.findMany({
      where: { hospitalId, isCritical: true, reviewedAt: null, result: { isNot: null } },
      include: { patient: true },
    }),
    prisma.encounter.findMany({
      where: { hospitalId, clinicianId: professional?.id, followUpAt: { lt: new Date() }, status: "COMPLETED" },
      include: { patient: true },
    }),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader title="Tasks" />
      <Card>
        <p className="pm-label mb-2">Incomplete consultations</p>
        {incomplete.map((item) => (
          <p key={item.id} className="text-sm">
            <Link className="underline" href={`/doctor/consultations/${item.publicId}`}>{item.publicId}</Link> · {item.patient.lastName}
          </p>
        ))}
        {incomplete.length === 0 ? <p className="text-sm text-[var(--muted)]">No incomplete consultations.</p> : null}
      </Card>
      <Card>
        <p className="pm-label mb-2">Unreviewed critical results</p>
        {critical.map((item) => (
          <p key={item.id} className="text-sm">{item.testName} · {item.patient.publicId}</p>
        ))}
        {critical.length === 0 ? <p className="text-sm text-[var(--muted)]">No unreviewed critical results.</p> : null}
      </Card>
      <Card>
        <p className="pm-label mb-2">Overdue follow-ups</p>
        {follow.map((item) => (
          <p key={item.id} className="text-sm">{item.patient.firstName} {item.patient.lastName} · {item.publicId}</p>
        ))}
        {follow.length === 0 ? <p className="text-sm text-[var(--muted)]">No overdue follow-ups.</p> : null}
      </Card>
    </div>
  );
}

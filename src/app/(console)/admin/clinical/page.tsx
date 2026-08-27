import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { formatDateTime } from "@/lib/dates";
import Link from "next/link";

export default async function ClinicalActivityPage() {
  const user = await requirePageRole("/admin/clinical");
  const hospitalId = await hospitalScope(user);
  const encounters = await prisma.encounter.findMany({
    where: { hospitalId },
    include: { patient: true, clinician: true },
    orderBy: { startedAt: "desc" },
    take: 80,
  });
  return (
    <div>
      <PageHeader title="Clinical activity" description="Consultations across the hospital." />
      <div className="pm-card overflow-x-auto">
        {encounters.length === 0 ? (
          <EmptyState title="No consultations" body="No encounters have been recorded yet." />
        ) : (
          <table className="pm-table">
            <thead>
              <tr><th>Encounter</th><th>Patient</th><th>Clinician</th><th>Status</th><th>Started</th></tr>
            </thead>
            <tbody>
              {encounters.map((item) => (
                <tr key={item.id}>
                  <td className="tabular">{item.publicId}</td>
                  <td><Link className="underline" href={`/admin/patients/${item.patient.publicId}`}>{item.patient.firstName} {item.patient.lastName}</Link></td>
                  <td>{item.clinician.fullName}</td>
                  <td><StatusBadge value={item.status} /></td>
                  <td>{formatDateTime(item.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

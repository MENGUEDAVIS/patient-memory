import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { formatDateTime } from "@/lib/dates";

export default async function ConsultationsPage() {
  const user = await requirePageRole("/doctor/consultations");
  const hospitalId = await hospitalScope(user);
  const professional = await prisma.healthcareProfessional.findUnique({ where: { userId: user.id } });
  const encounters = await prisma.encounter.findMany({
    where: { hospitalId, clinicianId: professional?.id },
    include: { patient: true },
    orderBy: { startedAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <PageHeader title="Consultations" />
      <div className="pm-card overflow-x-auto">
        {encounters.length === 0 ? <EmptyState title="No consultations" body="Start a consultation from a patient record." /> : (
          <table className="pm-table">
            <thead><tr><th>Encounter</th><th>Patient</th><th>Status</th><th>Started</th></tr></thead>
            <tbody>
              {encounters.map((item) => (
                <tr key={item.id}>
                  <td className="tabular"><Link className="underline" href={`/doctor/consultations/${item.publicId}`}>{item.publicId}</Link></td>
                  <td>{item.patient.firstName} {item.patient.lastName}</td>
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

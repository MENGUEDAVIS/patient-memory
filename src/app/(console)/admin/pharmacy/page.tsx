import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { formatDateTime } from "@/lib/dates";

export default async function AdminPharmacyPage() {
  const user = await requirePageRole("/admin/pharmacy");
  const hospitalId = await hospitalScope(user);
  const prescriptions = await prisma.prescription.findMany({
    where: { hospitalId },
    include: { patient: true, items: true },
    orderBy: { issuedAt: "desc" },
    take: 80,
  });
  return (
    <div>
      <PageHeader title="Pharmacy" />
      <div className="pm-card overflow-x-auto">
        {prescriptions.length === 0 ? <EmptyState title="No prescriptions" body="No prescriptions have been issued." /> : (
          <table className="pm-table">
            <thead><tr><th>Rx</th><th>Patient</th><th>Medications</th><th>Status</th><th>Issued</th></tr></thead>
            <tbody>
              {prescriptions.map((rx) => (
                <tr key={rx.id}>
                  <td className="tabular">{rx.publicId}</td>
                  <td>{rx.patient.firstName} {rx.patient.lastName}</td>
                  <td>{rx.items.map((i) => i.medication).join(", ")}</td>
                  <td><StatusBadge value={rx.status} /></td>
                  <td>{formatDateTime(rx.issuedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

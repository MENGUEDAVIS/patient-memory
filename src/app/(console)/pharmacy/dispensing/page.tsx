import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/dates";

export default async function DispensingPage() {
  const user = await requirePageRole("/pharmacy/dispensing");
  const hospitalId = await hospitalScope(user);
  const rows = await prisma.pharmacyDispensing.findMany({
    where: { prescription: { hospitalId } },
    include: { prescription: { include: { patient: true } } },
    orderBy: { dispensedAt: "desc" },
    take: 80,
  });
  return (
    <div>
      <PageHeader title="Dispensing" />
      <div className="pm-card overflow-x-auto">
        {rows.length === 0 ? <EmptyState title="No dispensing records" body="No medications have been dispensed yet." /> : (
          <table className="pm-table">
            <thead><tr><th>When</th><th>Rx</th><th>Patient</th><th>Qty</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateTime(row.dispensedAt)}</td>
                  <td className="tabular">{row.prescription.publicId}</td>
                  <td>{row.prescription.patient.publicId}</td>
                  <td>{row.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

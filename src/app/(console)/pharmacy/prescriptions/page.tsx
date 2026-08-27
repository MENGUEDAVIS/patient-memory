import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";

export default async function PharmacyRxPage() {
  const user = await requirePageRole("/pharmacy/prescriptions");
  const hospitalId = await hospitalScope(user);
  const prescriptions = await prisma.prescription.findMany({
    where: { hospitalId, status: { in: ["ACTIVE", "PARTIALLY_DISPENSED"] } },
    include: { patient: true, items: true },
    orderBy: { issuedAt: "asc" },
  });
  return (
    <div>
      <PageHeader title="Prescriptions" />
      <div className="pm-card overflow-x-auto">
        {prescriptions.length === 0 ? <EmptyState title="No open prescriptions" body="There are no prescriptions waiting to be dispensed." /> : (
          <table className="pm-table">
            <thead><tr><th>Rx</th><th>Patient</th><th>Medications</th><th>Status</th></tr></thead>
            <tbody>
              {prescriptions.map((rx) => (
                <tr key={rx.id}>
                  <td className="tabular"><Link className="underline" href={`/pharmacy/prescriptions/${rx.publicId}`}>{rx.publicId}</Link></td>
                  <td>{rx.patient.firstName} {rx.patient.lastName} · {rx.patient.publicId}</td>
                  <td>{rx.items.map((i) => `${i.medication} ${i.dose}`).join(", ")}</td>
                  <td><StatusBadge value={rx.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

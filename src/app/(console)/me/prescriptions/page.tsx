import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { redirect } from "next/navigation";

export default async function MeRx() {
  const user = await requirePageRole("/me/prescriptions");
  const patient = await prisma.patient.findFirst({ where: { userId: user.id } });
  if (!patient) redirect("/login");
  const prescriptions = await prisma.prescription.findMany({
    where: { patientId: patient.id },
    include: { items: true },
    orderBy: { issuedAt: "desc" },
  });
  return (
    <div>
      <PageHeader title="Prescriptions" />
      <div className="pm-card overflow-x-auto">
        {prescriptions.length === 0 ? <EmptyState title="No prescriptions" body="No prescriptions are available." /> : (
          <table className="pm-table">
            <thead><tr><th>Rx</th><th>Medications</th><th>Status</th></tr></thead>
            <tbody>
              {prescriptions.map((rx) => (
                <tr key={rx.id}>
                  <td className="tabular">{rx.publicId}</td>
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

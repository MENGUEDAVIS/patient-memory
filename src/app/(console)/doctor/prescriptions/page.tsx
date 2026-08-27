import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/guards";
import { hospitalScope } from "@/lib/access";
import { PageHeader, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status";

export default async function DoctorRxPage() {
  const user = await requirePageRole("/doctor/prescriptions");
  const hospitalId = await hospitalScope(user);
  const professional = await prisma.healthcareProfessional.findUnique({ where: { userId: user.id } });
  const prescriptions = await prisma.prescription.findMany({
    where: { hospitalId, encounter: { clinicianId: professional?.id } },
    include: { patient: true, items: true },
    orderBy: { issuedAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <PageHeader title="Prescriptions" />
      <div className="pm-card overflow-x-auto">
        {prescriptions.length === 0 ? <EmptyState title="No prescriptions" body="No prescriptions have been issued from your consultations." /> : (
          <table className="pm-table">
            <thead><tr><th>Rx</th><th>Patient</th><th>Medications</th><th>Status</th></tr></thead>
            <tbody>
              {prescriptions.map((rx) => (
                <tr key={rx.id}>
                  <td className="tabular">{rx.publicId}</td>
                  <td>{rx.patient.firstName} {rx.patient.lastName}</td>
                  <td>{rx.items.map((i) => i.medication).join(", ")}</td>
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
